'use strict';

const Page = require('../../../page-objects/leave-type-wizard');

module.exports = async engine => {
  const page = new Page(engine);

  await page.init();
  await page.fillTitleFieldIn();
  await page.openSection(2);
};
