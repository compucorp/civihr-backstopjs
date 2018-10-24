const Page = require('./page');
const LEAVE_TYPE_WIZARD_ROOT_SELECTOR = 'leave-type-wizard';

module.exports = class LeaveTypeWizard extends Page {
  /**
   * Fills Title field in
   */
  async fillTitleFieldIn () {
    await this.openSection(1);
    await this.puppet.focus(insideWizard('input:first-child'));
    await this.puppet.keyboard.type('Title');
  }

  /**
   * Opens section
   *
   * @param {Number} sectionIndex where `1` is the first section
   */
  async openSection (sectionIndex) {
    await this.puppet.click(insideWizard(`.panel-default:nth-child(${sectionIndex})`));
  }

  /**
   * Opens tab inside an active section
   *
   * @param {Number} tabIndex where `1` is the first tab
   */
  async openTab (tabIndex) {
    await this.puppet.click(insideWizard(`.nav-tabs-stacked li:nth-child(${tabIndex})`));
  }

  /**
   * Submits the wizard form
   *
   * @NOTE `this.puppet.click()` does not work on the button
   * and throws `Error: Node is either not visible or not an HTMLElement`
   * @see https://github.com/GoogleChrome/puppeteer/issues/2977
   * @TODO fix this once there is a solution
   */
  async submitForm () {
    await this.puppet.click(insideWizard('.panel-default:last-child'));
    await this.puppet.click(insideWizard('.nav-tabs-stacked li:last-child'));
    await this.puppet.evaluate(() => {
      document.querySelector('.leave-type-wizard__next-section-button').click();
    });
  }

  /**
   * Toggles colour picker
   */
  async toggleColourPicker () {
    await this.puppet.click(insideWizard('[palette]'));
  }

  /**
   * Waits for the wizard to be ready by looking for a horizontal form
   * that must be present in any section in any tab
   */
  async waitForReady () {
    await this.puppet.waitFor(insideWizard('.form-horizontal'), { visible: true });
  }
};

/**
 * Builds a selector inside the leave type wizard
 *
 * @param {String} selector a path to an object inside the wizard
 */
function insideWizard (selector) {
  return `${LEAVE_TYPE_WIZARD_ROOT_SELECTOR} ${selector}`;
}
