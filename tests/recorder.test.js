const assert = require('assert');
const path = require('path');
const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const {WebExtension} = require('selenium-webdriver/bidi/generated/webextension');
const {
    startServers,
    stopServers,
    clearEvents,
    getEvents,
    waitForEvent,
    waitForTarget
} = require('./support/test-server');

describe('SeleniumRobot Recorder extension', function () {
    this.timeout(30000);

    let driver;
    let webExtension;
    let installedExtension;

    before(async function () {
        await startServers();

        const options = new chrome.Options();
        options.enableBidi();
        options.addArguments('--enable-unsafe-extension-debugging');
        options.addArguments('--remote-debugging-pipe');
        options.addArguments('--window-size=1440,1000');

        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

        webExtension = await WebExtension.create(driver);
        installedExtension = await webExtension.install({
            extensionData: {type: 'path', path: path.resolve(__dirname, '..')}
        });

        console.log('Extension installée avec BiDi :', installedExtension);
    });

    after(async function () {
        if (webExtension && installedExtension) {
            await webExtension.uninstall({extension: installedExtension.extension})
                .catch(error => console.warn('Désinstallation impossible :', error.message));
        }

        if (driver) await driver.quit();
        await stopServers();
    });

    beforeEach(async function () {
        clearEvents();

        if (driver) {
            await driver.switchTo().defaultContent().catch(() => {
            });
        }

        await openRegressionPage();
    });

    it('envoie l ID stable du bouton', async function () {
        await click(By.id('save-profile-id'));

        const event = await waitForEvent('click');

        assert.strictEqual(event.tagName, 'button');
        assertTarget(event, 'id', 'save-profile-id');
        assertTarget(event, 'data-testid', 'save-profile-testid');
        assertTarget(event, 'ariaLabel', 'Enregistrer le profil');
    });

    it('rejette un ID dynamique et envoie data-qa', async function () {
        await click(By.id('react-1790851234567'));

        const event = await waitForEvent('click');

        assertNoTarget(event, 'id', 'react-1790851234567');
        assertTarget(event, 'data-qa', 'dynamic-id-fallback');
    });

    it('envoie data-selenium-id', async function () {
        await click(By.css('[data-selenium-id="save-customer"]'));

        const event = await waitForEvent('click');

        assertTarget(event, 'data-selenium-id', 'save-customer');
        assertTarget(event, 'data-testid', 'save-customer-button');
    });

    it('envoie le label du champ sans ID', async function () {
        await click(By.xpath('//label[contains(., \'Nom du client sans ID\')]/input'));

        const event = await waitForEvent('click');

        assert.strictEqual(event.tagName, 'input');
        assertTarget(event, 'labelText', 'Nom du client sans ID');
        assertNoTargetType(event, 'id');
    });

    it('envoie le texte exact unique du span', async function () {
        await click(By.xpath('//span[normalize-space(.)=\'ExactTextTarget\']'));

        const event = await waitForEvent('click');

        assertTarget(event, 'elementText', 'ExactTextTarget');
        assertTarget(event, 'uniqueElementText', 'ExactTextTarget');
    });

    it('n envoie pas de texte unique pour des boutons dupliqués', async function () {
        await click(By.css('#actions-container button:nth-of-type(2)'));

        const event = await waitForEvent('click');

        assertTarget(event, 'buttonText', 'Action');
        assertNoTarget(event, 'uniqueButtonText', 'Action');
        assertTarget(event, 'xpath', '//*[@id=\'actions-container\']//button[2]');
    });

    it('envoie uniqueLinkText pour un lien court unique', async function () {
        await click(By.linkText('Contact'));

        const event = await waitForEvent('click');

        assertTarget(event, 'linkText', 'Contact');
        assertTarget(event, 'uniqueLinkText', 'Contact');
        assertNoTarget(event, 'uniqueElementText', 'Contact');
    });

    it('n envoie pas uniqueLinkText pour des liens dupliqués', async function () {
        const link = await driver.wait(until.elementLocated(By.css('a[href="/second"]')), 5000);
        await driver.executeScript('arguments[0].scrollIntoView({block:\'center\',behavior:\'instant\'}); arguments[0].addEventListener(\'click\', event => event.preventDefault(), {once:true});', link);
        await link.click();

        const event = await waitForEvent('click');

        assertTarget(event, 'linkText', 'En savoir plus');
        assertNoTarget(event, 'uniqueLinkText', 'En savoir plus');
        assertTarget(event, 'xpath', '//a[@href=\'/second\']');
    });
    it('envoie une seule saisie consolidée', async function () {
        const input = await driver.wait(until.elementLocated(By.id('usernameInput')), 5000);
        await driver.executeScript('arguments[0].scrollIntoView({block:\'center\',behavior:\'instant\'});', input);
        await input.sendKeys('Sabine', Key.TAB);

        const event = await waitForEvent('keyup');

        assert.strictEqual(event.command, 'keyup');
        assert.strictEqual(event.tagName, 'input');
        assert.strictEqual(event.inputType, 'text');
        assert.strictEqual(event.value, 'Sabine');
        assertTarget(event, 'id', 'usernameInput');

        await driver.sleep(800);

        const inputEvents = getEvents().filter(item => item.command === 'keyup' && hasTarget(item, 'id', 'usernameInput'));
        assert.strictEqual(inputEvents.length, 1, 'La saisie doit produire un seul événement final');
    });
    it('détecte un changement de page', async function () {
        await click(By.css('a[href="#texts"]'));

        const pageEvent = await waitForEvent('pageLoad');

        assert.strictEqual(pageEvent.command, 'pageLoad');
        assert.ok(['hashchange', 'popstate', 'spa'].includes(pageEvent.reason), `Raison inattendue : ${pageEvent.reason}`);
        assert.ok(pageEvent.url.endsWith('#texts'));
        assert.deepStrictEqual(pageEvent.framePath, []);
    });
    it('envoie click avant pageLoad', async function () {
        await click(By.css('a[href="#locators"]'));
        await waitForEvent('pageLoad');

        const events = getEvents();
        const clickIndex = events.findIndex(item => item.command === 'click');
        const pageLoadIndex = events.findIndex(item => item.command === 'pageLoad');

        assert.ok(clickIndex >= 0, 'L événement click est absent');
        assert.ok(pageLoadIndex >= 0, 'L événement pageLoad est absent');
        assert.ok(clickIndex < pageLoadIndex, 'click doit être envoyé avant pageLoad');
        assertTarget(events[clickIndex], 'linkText', 'Locators');
        assert.ok(events[pageLoadIndex].url.endsWith('#locators'));
    });

    it('envoie check puis uncheck pour une checkbox HTML', async function () {
        const checkbox = await findVisible(By.id('assuranceCheckbox'));

        await checkbox.click();
        const checkEvent = await waitForEvent('check');

        assert.strictEqual(checkEvent.tagName, 'input');
        assert.strictEqual(checkEvent.inputType, 'checkbox');
        assert.strictEqual(checkEvent.value, 'true');
        assertTarget(checkEvent, 'id', 'assuranceCheckbox');

        clearEvents();
        await checkbox.click();

        const uncheckEvent = await waitForEvent('uncheck');

        assert.strictEqual(uncheckEvent.value, 'false');
        assertTarget(uncheckEvent, 'id', 'assuranceCheckbox');
    });

    it('envoie check puis uncheck pour une checkbox ARIA', async function () {
        const checkbox = await findVisible(By.id('customCheckbox'));

        await checkbox.click();
        const checkEvent = await waitForEvent('check');

        assert.strictEqual(checkEvent.tagName, 'span');
        assertTarget(checkEvent, 'ariaLabel', 'Accepter les conditions');

        clearEvents();
        await checkbox.click();

        const uncheckEvent = await waitForEvent('uncheck');

        assert.strictEqual(uncheckEvent.tagName, 'span');
        assertTarget(uncheckEvent, 'ariaLabel', 'Accepter les conditions');
    });

    it('envoie la sélection dans une liste HTML', async function () {
        const select = await findVisible(By.id('countrySelect'));
        const option = await select.findElement(By.xpath('./option[normalize-space(.)=\'Japon\']'));

        await option.click();

        const event = await waitForEvent('select');

        assert.strictEqual(event.tagName, 'select');
        assert.strictEqual(event.value, 'label=Japon');
        assertTarget(event, 'id', 'countrySelect');
    });

    it('envoie un double clic', async function () {
        const button = await findVisible(By.id('doubleClickButton'));

        await driver.actions({async: true}).doubleClick(button).perform();

        const event = await waitForEvent('dblclick');

        assert.strictEqual(event.command, 'dblclick');
        assert.strictEqual(event.tagName, 'button');
        assertTarget(event, 'id', 'doubleClickButton');
    });

    it('envoie un clic droit', async function () {
        const button = await findVisible(By.id('contextButton'));

        await driver.actions({async: true}).contextClick(button).perform();

        const event = await waitForEvent('contextmenu');

        assert.strictEqual(event.command, 'contextmenu');
        assert.strictEqual(event.tagName, 'button');
        assertTarget(event, 'id', 'contextButton');
    });

    it('détecte un élément créé dynamiquement', async function () {
        await click(By.id('createDynamic'));
        await waitForEvent('click');

        clearEvents();

        await click(By.css('[data-testid="dynamic-button"]'));
        const event = await waitForEvent('click');

        assert.strictEqual(event.tagName, 'button');
        assertTarget(event, 'data-testid', 'dynamic-button');
        assertNoTarget(event, 'id', 'createDynamic');
    });

    it('détecte le nouvel élément après remplacement du DOM', async function () {
        await click(By.css('[data-testid="replaceable-button"]'));
        const firstEvent = await waitForEvent('click');

        assertTarget(firstEvent, 'data-testid', 'replaceable-button');

        clearEvents();
        await click(By.id('replaceElement'));
        await waitForEvent('click');

        clearEvents();
        await click(By.css('[data-testid="replaceable-button"]'));

        const secondEvent = await waitForEvent('click');

        assertTarget(secondEvent, 'data-testid', 'replaceable-button');
        assert.strictEqual(secondEvent.tagName, 'button');
    });

    it('génère un XPath valide pour un texte avec apostrophe', async function () {
        await click(By.xpath('//span[normalize-space(.)="S\'enregistrer ✓"]'));

        const event = await waitForEvent('click');

        assertTarget(event, 'elementText', 'S\'enregistrer ✓');
        assertTarget(event, 'xpath', '//span[normalize-space(.)="S\'enregistrer ✓"]');
    });

    it('privilégie le href pour un lien avec un texte long', async function () {
        const link = await findVisible(By.css('a[href="/article/nucleaire-iranien"]'));

        await driver.executeScript('arguments[0].addEventListener(\'click\', event => event.preventDefault(), {once:true});', link);
        await link.click();

        const event = await waitForEvent('click');

        assertNoTargetType(event, 'uniqueLinkText');
        assertTarget(event, 'css', 'a[href="/article/nucleaire-iranien"]');
        assertTarget(event, 'xpath', '//a[@href=\'/article/nucleaire-iranien\']');
    });

    it('distingue deux éléments identiques avec un XPath indexé', async function () {
        const spans = await driver.findElements(By.xpath('//span[normalize-space(.)=\'Élément sans locator stable\']'));

        await scrollTo(spans[0]);
        await spans[0].click();

        const firstEvent = await waitForEvent('click');

        assertNoTargetType(firstEvent, 'uniqueElementText');
        assert.ok(targetValue(firstEvent, 'xpath').endsWith('/span[1]'));

        clearEvents();
        await scrollTo(spans[1]);
        await spans[1].click();

        const secondEvent = await waitForEvent('click');

        assertNoTargetType(secondEvent, 'uniqueElementText');
        assert.ok(targetValue(secondEvent, 'xpath').endsWith('/span[2]'));
    });

    it('envoie le framePath pour une iframe simple', async function () {
        await click(By.id('toggleFrame'));
        await waitForEvent('click');
        clearEvents();

        const frame = await driver.wait(until.elementLocated(By.id('testFrame')), 5000);
        await driver.switchTo().frame(frame);

        const input = await driver.wait(until.elementLocated(By.id('frameInput')), 5000);
        await input.sendKeys('iframe200', Key.TAB);

        const event = await waitForEvent('keyup');

        assert.strictEqual(event.value, 'iframe200');
        assertTarget(event, 'id', 'frameInput');
        assert.strictEqual(event.framePath.length, 1);
        assert.strictEqual(event.framePath[0].id, 'testFrame');

        await driver.switchTo().defaultContent();
    });

    it('envoie le framePath complet pour des iframes imbriquées', async function () {
        await click(By.id('openFrameA'));
        await waitForEvent('click');
        clearEvents();

        const frameA = await driver.wait(until.elementLocated(By.id('iframeA')), 5000);
        await driver.switchTo().frame(frameA);

        await click(By.id('openFrameB'));
        clearEvents();

        const frameB = await driver.wait(until.elementLocated(By.id('iframeB')), 5000);
        await driver.switchTo().frame(frameB);

        await click(By.id('openFrameC'));
        clearEvents();

        const frameC = await driver.wait(until.elementLocated(By.id('iframeC')), 5000);
        await driver.switchTo().frame(frameC);

        await click(By.id('deepFrameButton'));

        const event = await waitForTarget('id', 'deepFrameButton');

        assertTarget(event, 'id', 'deepFrameButton');

        assert.strictEqual(event.framePath.length, 3);
        assert.strictEqual(event.framePath[0].id, 'iframeA');
        assert.strictEqual(event.framePath[1].id, 'iframeB');
        assert.strictEqual(event.framePath[2].id, 'iframeC');

        await driver.switchTo().defaultContent();
    });

    it('n envoie pas plusieurs pageLoad pour une URL inchangée', async function () {
        await click(By.css('a[href="#texts"]'));
        await waitForEvent('pageLoad');
        await driver.sleep(1200);

        const pageEvents = getEvents().filter(event => event.command === 'pageLoad' && event.url.endsWith('#texts'));

        assert.strictEqual(pageEvents.length, 1, 'Un seul pageLoad doit être envoyé pour la même URL');
    });

    it('n envoie pas de clic pour un bouton désactivé', async function () {
        const button = await driver.findElement(By.css('button:disabled'));

        try {
            await button.click();
        } catch (error) {
            // refuse.
        }

        await driver.sleep(500);

        const clickEvents = getEvents().filter(event => event.command === 'click');

        assert.strictEqual(clickEvents.length, 0);
    });

    async function openRegressionPage() {
        await driver.get('http://127.0.0.1:8000/recorder-test-page.html');
        await driver.executeScript('document.documentElement.style.scrollBehavior=\'auto\'; const nav=document.querySelector(\'.topnav\'); if(nav) nav.style.position=\'static\';');

        await driver.wait(async () => {
            return await driver.executeScript('return document.documentElement.getAttribute(\'data-recorder-loaded\');') === 'true';
        }, 5000, 'L extension Chrome n est pas chargée');

        await waitForEvent('pageLoad');
        clearEvents();
    }


    async function click(locator) {
        const element = await driver.wait(until.elementLocated(locator), 5000);
        await driver.wait(until.elementIsVisible(element), 5000);
        await driver.executeScript('arguments[0].scrollIntoView({block:\'center\',inline:\'center\',behavior:\'instant\'});', element);

        await driver.wait(async () => {
            return await driver.executeScript('const r=arguments[0].getBoundingClientRect(); return r.top>=0 && r.bottom<=window.innerHeight;',
                element
            );
        }, 3000, 'L élément n est pas positionné dans la fenêtre');

        await element.click();
    }


    async function findVisible(locator) {
        const element = await driver.wait(until.elementLocated(locator), 5000);
        await driver.wait(until.elementIsVisible(element), 5000);
        await scrollTo(element);
        return element;
    }

    async function scrollTo(element) {
        await driver.executeScript('arguments[0].scrollIntoView({block:\'center\',inline:\'center\',behavior:\'instant\'});', element);
        await driver.wait(async () => {
            return await driver.executeScript('const r=arguments[0].getBoundingClientRect(); return r.top>=0 && r.bottom<=window.innerHeight;', element);
        }, 3000);
    }
});

function hasTarget(event, type, value) {
    return Array.isArray(event.targets)
        && event.targets.some(target => target[0] === type && target[1] === value);
}

function assertTarget(event, type, value) {
    assert.ok(hasTarget(event, type, value), `Target absent : ${type} = ${value}`);
}

function assertNoTarget(event, type, value) {
    assert.ok(!hasTarget(event, type, value), `Target interdit présent : ${type} = ${value}`);
}

function assertNoTargetType(event, type) {
    const present = Array.isArray(event.targets) && event.targets.some(target => target[0] === type);
    assert.ok(!present, `Type de target interdit présent : ${type}`);
}


function targetValue(event, type) {
    const target = event.targets.find(item => item[0] === type);
    return target ? target[1] : '';
}