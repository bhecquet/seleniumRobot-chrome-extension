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

    describe('file upload', function () {
        const html = `
            <!DOCTYPE html>
            <html>
            <body>
                <label id="uploadLabel" for="doc">Choose <span id="labelText">a file</span></label>
                <input id="doc" type="file">
                <input id="plain" type="text">
                <label id="plainLabel" for="plain">Name</label>
            </body>
            </html>
        `;

        function setFiles(input, names) {
            Object.defineProperty(input, 'files', {
                configurable: true,
                value: names.map(name => ({name}))
            });
        }

        function click(element) {
            element.dispatchEvent(new recorder.window.MouseEvent('click', {bubbles: true}));
        }

        it('does not record a click on a file input', async function () {
            recorder = loadContentScript(html);
            recorder.clearEvents();

            click(recorder.document.getElementById('doc'));
            await recorder.wait(150);

            assert.strictEqual(recorder.sentEvents.length, 0);
        });

        it('does not record a click on a label bound to a file input', async function () {
            recorder = loadContentScript(html);
            recorder.clearEvents();

            click(recorder.document.getElementById('uploadLabel'));
            click(recorder.document.getElementById('labelText'));
            await recorder.wait(150);

            assert.strictEqual(findEvent(recorder.sentEvents, 'click'), undefined);
        });

        it('still records a click on a label bound to another input', async function () {
            recorder = loadContentScript(html);
            recorder.clearEvents();

            click(recorder.document.getElementById('plainLabel'));
            await recorder.wait(150);

            assert.ok(findEvent(recorder.sentEvents, 'click'));
        });

        it('sends a sendKeys event with the file name on change', async function () {
            recorder = loadContentScript(html);
            recorder.clearEvents();

            const input = recorder.document.getElementById('doc');
            setFiles(input, ['report.pdf']);
            input.dispatchEvent(new recorder.window.Event('change', {bubbles: true}));
            await recorder.wait(50);

            const events = recorder.sentEvents.filter(e => e.tagName === 'input');
            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].command, 'sendKeys');
            assert.strictEqual(events[0].inputType, 'file');
            assert.strictEqual(events[0].value, 'report.pdf');
            assert.deepStrictEqual(events[0].files, ['report.pdf']);
            assert.ok(events[0].targets.some(t => t[0] === 'id' && t[1] === 'doc'));
        });

        it('sends all selected file names for a multiple upload', async function () {
            recorder = loadContentScript(html);
            recorder.clearEvents();

            const input = recorder.document.getElementById('doc');
            setFiles(input, ['a.txt', 'b.txt']);
            input.dispatchEvent(new recorder.window.Event('change', {bubbles: true}));
            await recorder.wait(50);

            const event = findEvent(recorder.sentEvents, 'sendKeys');
            assert.strictEqual(event.value, 'a.txt\nb.txt');
            assert.deepStrictEqual(event.files, ['a.txt', 'b.txt']);
        });

        it('ignores a change with no selected file', async function () {
            recorder = loadContentScript(html);
            recorder.clearEvents();

            const input = recorder.document.getElementById('doc');
            setFiles(input, []);
            input.dispatchEvent(new recorder.window.Event('change', {bubbles: true}));
            await recorder.wait(50);

            assert.strictEqual(recorder.sentEvents.length, 0);
        });
    });
});