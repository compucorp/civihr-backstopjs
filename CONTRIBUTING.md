# CONTRIBUTING

## How to write a new scenario
The are up to 4 components that make up a scenario

### 1. The config file
First of all you need to decide if the scenario is for of a page that is already covered by any of the already existing group files under *scenarios/*.

If that's not the case, then create a new group file for the page (ie: `new-page.json`).

### 2. The scenario details
Add the details of the scenario, which usually consists of the following params (for all the other available params, please refer to [Advances Scenarios](https://github.com/garris/BackstopJS#advanced-scenarios))

1. `label` (mandatory) A name that identifies the scenario
2. `url`  (mandatory) Used by BackstopJS to reach the page
    * Do not enter the full url, but prefix the path with the `{{siteUrl}}` placeholder
    * In case the url contains the `cid` param, do not hardcode the value but use the `{{contactId:xyz}}`, where "xyz" is the name of the user (*civihr_staff*, *civihr_manager*, etc)
* `onReadyScript` (optional) The Puppeteer script that Headless Chrome (the browser used in this setup) will use to interact with the page before taking the screenshot (for example, if you need to open a modal by clicking a button)
* `user` (optional) This parameter exists only in this setup, and it's the name of the user (*civihr_staff*, *admin*, etc) that BackstopJS will log in as before taking the screenshot. If not provided, it will default to *civihr_admin*

Example:
```json
{
  "label": "Job Contract / Modal / Tab / General",
  "url": "{{siteUrl}}/civicrm/contact/view?cid={{contactId:civihr_staff}}",
  "onReadyScript": "contact-summary/job-contract/tab-general.js",
  "user": "civihr_staff"
}
```

### 3. The Puppeteer script
It's very common that you'll need to first interact with the page (click a button, open a modal, select a dropdown value, etc) before taking the screenshot. This is accomplished by writing a [Puppeteer](https://github.com/GoogleChrome/puppeteer) script.

The scripts are located under *engine_scripts/puppet/* and, unless we are talking about some utility scripts like *onBefore.js*, they are usually further sub-divided in folders representing the page that they are supposed to interact with.

The scripts are supposed to be kept simple and, most importantly, should not to expose any specifics of the page themselves (that is, no reference to ids, or classes or anything related to the structure of the page), as those will be encapsulated in the page objects (see next section).

Example:
```js
const Page = require('../../../../page-objects/tabs/job-contract');

module.exports = async engine => {
  const page = new Page(engine);
  await page.init();

  const modal = await page.openNewContractModal();
  await modal.selectTab('General');
};
```

### 4. The page object
Page objects (located under *page-objects/*) are JS classes that offer an API to interact with the page they represent. They are meant to abstract and encapsulate the actual structure of a page, so that the Puppeteer scripts that use them don't have to know how to interact with the page.

For example here in the above script you can see that the script opens the new contract modal and selects the "General" tab, but doesn't need to worry about how that is done, delegating the details implementation to the `JobContractTab` page object class

```js
class JobContractTab extends Tab {
  // ...
  async openContractModal (mode) {
    const param = mode === 'correct' ? 'edit' : (mode === 'revision' ? 'change' : '');

    await this.puppet.click('[ng-click="modalContract(\'' + param + '\')"]');

    return this.waitForModal('job-contract');
  }
  // ...
};
```

For your new scenario then you might end up having to add a method to an already existing page object, or to create a page object from scratch. In the latter case, remember that all of them inherit from a parent Page class.

```js
class ContactSummary extends Page {}
```

There are also sub-types of pages, like modal and tab, which are also inherited from as well (see the above example with `JobContractTab`)

```js
class Modal extends Page {}
class Tab extends Page {}
```
