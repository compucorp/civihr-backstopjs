'use strict';

const Page = require('../../../page-objects/ssp-tasks');

module.exports = async engine => {
  const page = new Page(engine);

  await page.init();
};
