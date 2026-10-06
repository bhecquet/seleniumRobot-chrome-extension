const assert = require('assert');
const path = require('path');
const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const {startServers, stopServers, clearEvents, waitForEvent} = require('./support/test-server');

describe('SeleniumRobot Recorder extension', function () {
    this.timeout(30000);
    let driver;

    before(async function () {
        await startServers();

        const extensionPath = path.resolve(__dirname, '..');
        const options = new chrome.Options();
        options.addArguments(`--load-extension=${extensionPath}`);
        options.addArguments(`--disable-extensions-except=${extensionPath}`);

        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    });

    after(async function () {
        if (driver) await driver.quit();
        await stopServers();
    });

    beforeEach(function () {
        clearEvents();
    });

    it('sends the stable ID when a button is clicked', async function () {
        await driver.get('http://127.0.0.1:8000/recorder-test-page.html');
        const extensionLoaded = await driver.executeScript('return document.documentElement.getAttribute(\'data-recorder-loaded\');');
        assert.strictEqual(extensionLoaded, 'true', 'L’extension Chrome n’est pas chargée');
        const button = await driver.wait(until.elementLocated(By.id('save-profile-id')), 5000);
        await button.click();

        const event = await waitForEvent('click');

        assert.strictEqual(event.command, 'click');
        assert.strictEqual(event.tagName, 'button');
        assert.ok(hasTarget(event, 'id', 'save-profile-id'));
        assert.ok(hasTarget(event, 'data-testid', 'save-profile-testid'));
        assert.ok(hasTarget(event, 'ariaLabel', 'Enregistrer le profil'));
    });
});

function hasTarget(event, type, value) {
    return event.targets.some(target => target[0] === type && target[1] === value);
}