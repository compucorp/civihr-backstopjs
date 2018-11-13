const Page = require('./page');
const ROOT = '.staff-directory';

module.exports = class LeaveTypeWizard extends Page {
  /**
   * Searches by name
   */
  async inputName (name) {
    await this.puppet.type(`${ROOT} [name=name]`, name);
  }

  /**
   * Submits the search form
   */
  async submitForm () {
    await this.puppet.click(`${ROOT} button`);
  }

  /**
   * Toggles action dropdown
   */
  async toggleActionDropown () {
    const actionsContainerSelector = '.staff-directory__results-list_actions';

    await this.puppet.click(`${actionsContainerSelector} .dropdown-toggle`);
  }
};
