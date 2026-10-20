const assert = require('assert');
const {loadContentScript} = require('../support/content-script-harness');

function hasTarget(action, type, value) {
    return action.targets.some(target =>
        target[0] === type && target[1] === value
    );
}

function hasTargetType(action, type) {
    return action.targets.some(target => target[0] === type);
}

describe('contentScript targets and selectors', function () {
    let recorder;

    afterEach(function () {
        recorder.close();
    });

    it('uses a stable ID', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <head><title>Test</title></head>
            <body>
                <button id="save-profile-id">Save</button>
            </body>
            </html>
        `);

        const button = recorder.document.getElementById('save-profile-id');
        const action = recorder.window.buildActionData(button, 'click');

        assert.ok(hasTarget(action, 'id', 'save-profile-id'));
        assert.strictEqual(recorder.window.getEnhancedSelector(button), '#save-profile-id');
    });

    it('rejects a dynamic ID and uses data-qa', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button id="react-1790851234567" data-qa="save-profile">
                    Save
                </button>
            </body>
            </html>
        `);

        const button = recorder.document.querySelector('button');
        const action = recorder.window.buildActionData(button, 'click');

        assert.strictEqual(hasTarget(action, 'id', 'react-1790851234567'), false);
        assert.ok(hasTarget(action, 'data-qa', 'save-profile'));
    });

    it('adds data-selenium-id and data-testid', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button
                    data-selenium-id="save-customer"
                    data-testid="save-customer-button">
                    Save customer
                </button>
            </body>
            </html>
        `);

        const button = recorder.document.querySelector('button');
        const action = recorder.window.buildActionData(button, 'click');

        assert.ok(hasTarget(action, 'data-selenium-id', 'save-customer'));
        assert.ok(hasTarget(action, 'data-testid', 'save-customer-button'));
    });

    it('detects an associated label using for', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <label for="customerName">Customer name</label>
                <input id="customerName" type="text">
            </body>
            </html>
        `);

        const input = recorder.document.getElementById('customerName');

        assert.strictEqual(recorder.window.getAssociatedLabelText(input), 'Customer name');
    });

    it('detects a parent label', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <label>
                    Customer name
                    <input type="text">
                </label>
            </body>
            </html>
        `);

        const input = recorder.document.querySelector('input');

        assert.strictEqual(recorder.window.getAssociatedLabelText(input), 'Customer name');
    });

    it('adds uniqueButtonText for a unique button', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button>Save customer</button>
            </body>
            </html>
        `);

        const button = recorder.document.querySelector('button');
        const action = recorder.window.buildActionData(button, 'click');

        assert.ok(hasTarget(action, 'buttonText', 'Save customer'));
        assert.ok(hasTarget(action, 'uniqueButtonText', 'Save customer'));
    });

    it('does not add uniqueButtonText for duplicated buttons', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button>Action</button>
                <button>Action</button>
            </body>
            </html>
        `);

        const button = recorder.document.querySelectorAll('button')[1];
        const action = recorder.window.buildActionData(button, 'click');

        assert.ok(hasTarget(action, 'buttonText', 'Action'));
        assert.strictEqual(hasTargetType(action, 'uniqueButtonText'), false);
    });

    it('adds uniqueLinkText for a unique link', function () {
        recorder = loadContentScript();

        const link = recorder.document.createElement('a');
        link.href = '#contact';
        link.textContent = 'Contact';

        recorder.document.body.appendChild(link);

        const action = recorder.window.buildActionData(link, 'click');

        assert.ok(hasTarget(action, 'linkText', 'Contact'));
        assert.ok(hasTarget(action, 'uniqueLinkText', 'Contact'));
    });

    it('does not add uniqueLinkText for duplicated links', function () {
        recorder = loadContentScript();

        const firstLink = recorder.document.createElement('a');
        firstLink.href = '/first';
        firstLink.textContent = 'Learn more';

        const secondLink = recorder.document.createElement('a');
        secondLink.href = '/second';
        secondLink.textContent = 'Learn more';

        recorder.document.body.appendChild(firstLink);
        recorder.document.body.appendChild(secondLink);

        const links = recorder.document.querySelectorAll('a');

        assert.strictEqual(links.length, 2);

        const action = recorder.window.buildActionData(secondLink, 'click');
        assert.ok(hasTarget(action, 'linkText', 'Learn more'));
        assert.strictEqual(hasTargetType(action, 'uniqueLinkText'), false);

        assert.ok(hasTarget(action, 'xpath', '//a[@href=\'/second\']'));
    });

    it('uses placeholder as a target', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <input type="text" placeholder="City or station">
            </body>
            </html>
        `);

        const input = recorder.document.querySelector('input');
        const action = recorder.window.buildActionData(input, 'click');

        assert.ok(hasTarget(action, 'placeholder', 'City or station'));
    });

    it('creates a checkbox name and value target', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <input
                    type="checkbox"
                    name="sector"
                    value="insurance">
            </body>
            </html>
        `);

        const checkbox = recorder.document.querySelector('input');
        const action = recorder.window.buildActionData(
            checkbox,
            'check'
        );

        assert.ok(hasTarget(action, 'checkboxNameValue', 'sector||VALUE||insurance'));
    });

    it('creates an XPath containing an apostrophe', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <span>S'enregistrer</span>
            </body>
            </html>
        `);

        const span = recorder.document.querySelector('span');
        const xpath = recorder.window.getEnhancedXPath(span);

        assert.strictEqual(xpath, '//span[normalize-space(.)="S\'enregistrer"]');
    });
});