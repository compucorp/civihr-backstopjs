'use strict';

const Page = require('../../../page-objects/staff-directory');

module.exports = async engine => {
  const page = new Page(engine);

  await page.init();
  await page.inputName('civihr_staff');
  await page.submitForm();
  await page.toggleActionDropown();
};
