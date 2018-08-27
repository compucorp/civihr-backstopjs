const _ = require('lodash');
const argv = require('yargs').argv;
const backstopjs = require('backstopjs');
const clean = require('gulp-clean');
const colors = require('ansi-colors');
const execSync = require('child_process').execSync;
const file = require('gulp-file');
const fs = require('fs');
const gulp = require('gulp');
const notify = require('gulp-notify');
const path = require('path');
const puppeteer = require('puppeteer');
const PluginError = require('plugin-error');

const DEFAULT_GROUP = '_all_';
const DEFAULT_USER = 'civihr_admin';
const USERS = [
  'admin',
  'civihr_admin',
  'civihr_manager',
  'civihr_staff'
];
const CONFIG_TPL = {
  'url': 'http://%{site-host}',
  'root': '%{path-to-site-root}'
};
const FILES = {
  siteConfig: 'site-config.json',
  temp: 'backstop.temp.json',
  tpl: 'backstop.tpl.json'
};
const CACHE = {
  idsMap: null,
  siteConfig: null
};

['reference', 'test', 'openReport', 'approve'].map(action => {
  gulp.task(`backstopjs:${action}`, async () => {
    await runBackstopJS(action);
  });
});

/**
 * Returns the list of the scenarios from
 *   a. All the different groups if the selected group is == '_all_',
 *   b. Only the selected group
 *
 * @return {Array}
 */
function buildScenariosList () {
  const scenariosPath = 'scenarios';
  const group = selectedGroup();

  return _(fs.readdirSync(scenariosPath))
    .filter(scenario => {
      return group === DEFAULT_GROUP ? true : scenario === `${group}.json`;
    })
    .map(scenario => {
      const content = fs.readFileSync(path.join(scenariosPath, scenario));

      return JSON.parse(content).scenarios;
    })
    .flatten()
    .map((scenario, index, scenarios) => {
      const user = scenario.user || DEFAULT_USER;

      return Object.assign(scenario, {
        cookiePath: path.join('cookies', `${user}.json`),
        count: `(${(index + 1)} of ${scenarios.length})`,
        url: constructScenarioUrl(scenario.url)
      });
    })
    .value();
}

/**
 * Removes the temp config file and sends a notification
 * based on the given outcome from BackstopJS
 *
 * @param {Boolean} success
 */
function cleanUpAndNotify (success) {
  gulp
    .src(FILES.temp, { read: false })
    .pipe(clean())
    .pipe(notify({
      message: success ? 'Success' : 'Error',
      title: 'BackstopJS',
      sound: 'Beep'
    }));
}

/**
 * Constructs URL for BackstopJS scenario based on
 * site URL, scenario config URL and contact "roles" and IDs map
 *
 * @param  {String} scenarioUrl
 * @return {String}
 */
function constructScenarioUrl (scenarioUrl) {
  return scenarioUrl
    .replace('{{siteUrl}}', siteConfig().url)
    .replace(/\{\{contactId:([^}]+)\}\}/g, (__, user) => idsMap()[user].civi);
}

/**
 * Creates the content of the config temporary file that will be fed to BackstopJS
 * The content is the mix of the config template and the list of scenarios
 * under the scenarios/ folder
 *
 * @return {String}
 */
function createTempConfig () {
  const group = selectedGroup();
  const content = JSON.parse(fs.readFileSync(FILES.tpl));

  content.scenarios = buildScenariosList();

  ['bitmaps_reference', 'bitmaps_test', 'html_report', 'ci_report'].forEach(path => {
    content.paths[path] = content.paths[path].replace('{group}', group);
  });

  return JSON.stringify(content);
}

/**
 * Creates, caches, and returns a mapping of users to their drupal and civi ids
 *
 * @return {Promise} resolved with {Object}, ex. { civihr_staff: { drupal: 1, civi: 2 } }
 */
function idsMap () {
  if (CACHE.idsMap) {
    return CACHE.idsMap;
  }

  const map = _.transform(USERS, (result, user) => {
    result[user] = {};
  }, {});

  addDrupalIds();
  addCiviIds();

  CACHE.idsMap = map;

  return map;

  /**
   * Adds the drupal ids to the mapping
   *
   * It uses the `drush user-information` to get the full data of the users and
   * then extracts the id from it
   */
  function addDrupalIds () {
    const cmd = `drush user-information ${_.keys(map).join(',')} --format=json`;
    const usersInfo = JSON.parse(execSync(cmd, { cwd: siteConfig().root }));

    _.each(usersInfo, (userInfo) => {
      const user = _.find(map, (__, name) => name === userInfo.name);

      user.drupal = userInfo.uid;
    });
  }

  /**
   * Adds the civi ids to the mapping
   *
   * It uses the UFMatch.get Civi endpoint to match the drupal ids to the civi ids
   */
  function addCiviIds () {
    let cmd = `echo '{ "uf_id": { "IN":[%{uids}] } }' | cv api UFMatch.get sequential=1`;
    cmd = cmd.replace('%{uids}', _.map(map, 'drupal').join(','));

    const ufMatches = JSON.parse(execSync(cmd, {
      cwd: path.join(siteConfig().root, 'sites/all/modules/civicrm')
    })).values;

    _.each(ufMatches, (ufMatch) => {
      const user = _.find(map, user => user.drupal === ufMatch.uf_id);

      user.civi = ufMatch.contact_id;
    });
  }
}

/**
 * Runs backstopJS with the given command.
 *
 * It fills the template file with the list of scenarios, creates a temp
 * file passed to backstopJS, then removes the temp file once the command is completed
 *
 * @param  {String} command
 * @return {Promise}
 */
async function runBackstopJS (command) {
  if (touchSiteConfigFile()) {
    throwError(
      'No site-config.json file detected!\n' +
      `\tOne has been created for you in the root/\n` +
      '\tPlease insert the real value for each placeholder and try again'
    );
  }

  return new Promise((resolve, reject) => {
    let success = false;

    gulp.src(FILES.tpl)
      .pipe(file(path.basename(FILES.temp), createTempConfig()))
      .pipe(gulp.dest('.'))
      .on('end', async () => {
        try {
          (typeof argv.skipCookies === 'undefined') && await writeCookies();

          await backstopjs(command, {
            config: FILES.temp,
            filter: argv.filter
          });

          success = true;
        } finally {
          cleanUpAndNotify(success);

          success
            ? resolve()
            : reject(new Error('BackstopJS error. It may be a task error, a script error or a comparison error'));
        }
      });
  })
    .catch(err => {
      throwError(err.message);
    });
}

/**
 * Gets the name of the selected group specified in the --group argument
 * If the argument was not passed, uses the name of the default group instead
 *
 * @return {String}
 */
function selectedGroup () {
  return argv.group ? argv.group : DEFAULT_GROUP;
}

/**
 * Caches, and returns the content of site config file
 *
 * @return {Object}
 */
function siteConfig () {
  if (CACHE.siteConfig) {
    return CACHE.siteConfig;
  }

  config = JSON.parse(fs.readFileSync(FILES.siteConfig));
  CACHE.siteConfig = config;

  return config;
}

/**
 * Creates the site config file if it doesn't exists yet
 *
 * @return {Boolean} Whether the file had to be created or not
 */
function touchSiteConfigFile () {
  let created = false;

  try {
    fs.readFileSync(FILES.siteConfig);
  } catch (err) {
    fs.writeFileSync(FILES.siteConfig, JSON.stringify(CONFIG_TPL, null, 2));

    created = true;
  }

  return created;
}

/**
 * A simple wrapper for displaying errors
 * It converts the tab character to the amount of spaces required to correctly
 * align a multi-line block of text horizontally
 *
 * @param {String} msg
 * @throws {Error}
 */
function throwError (msg) {
  throw new PluginError('Error', colors.red(msg.replace(/\t/g, '    ')), {
    showProperties: false
  });
}

/**
 * Writes the session cookie files that will be used to log in as different users
 *
 * It uses the [`drush uli`](https://drushcommands.com/drush-7x/user/user-login/)
 * command to generate a one-time login url, the browser then go to that url
 * which then creates the session cookie
 *
 * The cookie is then stored in a json file which is used by the BackstopJS scenarios
 * to log in
 *
 * @return {Promise}
 */
async function writeCookies () {
  const cookiesDir = 'cookies';
  const config = siteConfig();

  !fs.existsSync(cookiesDir) && fs.mkdirSync(cookiesDir);

  await Promise.all(USERS.map(async user => {
    let cookieFilePath = path.join(cookiesDir, `${user}.json`);
    let loginUrl = execSync(`drush uli --name=${user} --uri=${config.url} --browser=0`, { encoding: 'utf8', cwd: config.root });

    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    await page.goto(loginUrl);
    let cookies = await page.cookies();

    fs.existsSync(cookieFilePath) && fs.unlinkSync(cookieFilePath);
    fs.writeFileSync(cookieFilePath, JSON.stringify(cookies));

    await browser.close();
  }));
}
