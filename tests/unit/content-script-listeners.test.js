const assert = require('assert');
const {loadContentScript} = require('../support/content-script-harness');

function findEvent(events, command) {
    return events.find(event => event.command === command);
}

describe('contentScript event listeners', function () {
    let recorder;

    afterEach(function () {
        recorder.close();
    });

    it('sends a click event', async function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button id="saveButton">Save</button>
            </body>
            </html>
        `);

        recorder.clearEvents();

        const button = recorder.document.getElementById('saveButton');

        button.dispatchEvent(
            new recorder.window.MouseEvent('click', {
                bubbles: true
            })
        );

        await recorder.wait(150);

        const event = findEvent(recorder.sentEvents, 'click');

        assert.ok(event);
        assert.strictEqual(event.tagName, 'button');
        assert.ok(
            event.targets.some(target =>
                target[0] === 'id'
                && target[1] === 'saveButton'
            )
        );
    });

    it('sends check and uncheck events', async function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <input id="acceptTerms" type="checkbox">
            </body>
            </html>
        `);

        recorder.clearEvents();

        const checkbox = recorder.document.getElementById('acceptTerms');

        checkbox.checked = true;
        checkbox.dispatchEvent(
            new recorder.window.Event('change', {
                bubbles: true
            })
        );

        await recorder.wait(20);

        assert.ok(findEvent(recorder.sentEvents, 'check'));

        recorder.clearEvents();

        checkbox.checked = false;
        checkbox.dispatchEvent(
            new recorder.window.Event('change', {
                bubbles: true
            })
        );

        await recorder.wait(20);

        assert.ok(findEvent(recorder.sentEvents, 'uncheck'));
    });

    it('sends a select event', async function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <select id="country">
                    <option value="fr">France</option>
                    <option value="jp">Japan</option>
                </select>
            </body>
            </html>
        `);

        recorder.clearEvents();

        const select = recorder.document.getElementById('country');
        select.selectedIndex = 1;

        select.dispatchEvent(
            new recorder.window.Event('change', {
                bubbles: true
            })
        );

        await recorder.wait(20);

        const event = findEvent(recorder.sentEvents, 'select');

        assert.ok(event);
        assert.strictEqual(event.value, 'label=Japan');
        assert.strictEqual(event.selectedText, 'Japan');
    });

    it('sends a double-click event', async function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button id="doubleClickButton">Double click</button>
            </body>
            </html>
        `);

        recorder.clearEvents();

        const button = recorder.document.getElementById(
            'doubleClickButton'
        );

        button.dispatchEvent(
            new recorder.window.MouseEvent('dblclick', {
                bubbles: true
            })
        );

        await recorder.wait(20);

        assert.ok(findEvent(recorder.sentEvents, 'dblclick'));
    });

    it('sends a contextmenu event', async function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button id="contextButton">Context menu</button>
            </body>
            </html>
        `);

        recorder.clearEvents();

        const button = recorder.document.getElementById(
            'contextButton'
        );

        button.dispatchEvent(
            new recorder.window.MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true
            })
        );

        await recorder.wait(20);

        assert.ok(findEvent(recorder.sentEvents, 'contextmenu'));
    });

    it('does not send a click while the recorder is paused', async function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button id="saveButton">Save</button>
            </body>
            </html>
        `);

        recorder.clearEvents();
        recorder.window.sessionStorage.setItem(
            'pause_recorder',
            'yes'
        );

        const button = recorder.document.getElementById('saveButton');

        button.dispatchEvent(
            new recorder.window.MouseEvent('click', {
                bubbles: true
            })
        );

        await recorder.wait(150);

        assert.strictEqual(
            findEvent(recorder.sentEvents, 'click'),
            undefined
        );
    });

    it('sends the final input value on blur', async function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <input id="username" type="text">
            </body>
            </html>
        `);

        recorder.clearEvents();

        const input = recorder.document.getElementById('username');
        input.value = 'Sabine';

        input.dispatchEvent(
            new recorder.window.Event('input', {
                bubbles: true
            })
        );

        input.dispatchEvent(
            new recorder.window.FocusEvent('blur', {
                bubbles: false
            })
        );

        await recorder.wait(50);

        const event = findEvent(recorder.sentEvents, 'keyup');

        assert.ok(event);
        assert.strictEqual(event.value, 'Sabine');
    });
});