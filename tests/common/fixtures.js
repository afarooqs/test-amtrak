const { test: base } = require("@playwright/test");
const { HomePage } = require("../pom/home.page");

const test = base.extend({
  home: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.open();
    await use(home);
  },
});

module.exports = { test };
