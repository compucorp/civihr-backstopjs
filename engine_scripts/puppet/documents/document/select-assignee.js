'use strict';

const Page = require('../../../../page-objects/documents');

module.exports = async engine => {
  const page = new Page(engine);
  await page.init();

  const modal = await page.addDocument();
  await modal.showTab('Assignments');
  await modal.showField('Assignee');
  await modal.selectAssignee();
};
