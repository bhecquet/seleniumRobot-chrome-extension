const assert = require('assert');
const {loadContentScript} = require('../support/content-script-harness');

describe('contentScript click target normalization', function () {
    let recorder;

    afterEach(function () {
        recorder.close();
    });

    it('moves from a span to its parent button', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button id="saveButton">
                    <span id="buttonText">Save</span>
                </button>
            </body>
            </html>
        `);

        const span = recorder.document.getElementById('buttonText');
        const result = recorder.window.normalizeClickTarget(span);

        assert.strictEqual(result.id, 'saveButton');
    });

    it('moves from an image to its parent link', function () {
        recorder = loadContentScript();

        const link = recorder.document.createElement('a');
        link.id = 'logoLink';
        link.href = '/home';

        const image = recorder.document.createElement('img');
        image.id = 'logo';
        image.src = 'logo.png';
        image.alt = 'Home';

        link.appendChild(image);
        recorder.document.body.appendChild(link);

        const result = recorder.window.normalizeClickTarget(image);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.id, 'logoLink');
    });
    it('moves from a label to the associated checkbox', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <label for="acceptTerms">Accept terms</label>
                <input id="acceptTerms" type="checkbox">
            </body>
            </html>
        `);

        const label = recorder.document.querySelector('label');
        const result = recorder.window.normalizeClickTarget(label);

        assert.strictEqual(result.id, 'acceptTerms');
    });

    it('keeps an element with role button', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="customButton" role="button">Save</div>
            </body>
            </html>
        `);

        const button = recorder.document.getElementById('customButton');
        const result = recorder.window.normalizeClickTarget(button);

        assert.strictEqual(result, button);
    });

    it('finds a clickable button ancestor', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <button id="parentButton">
                    <strong>
                        <span id="child">Save</span>
                    </strong>
                </button>
            </body>
            </html>
        `);

        const child = recorder.document.getElementById('child');
        const result = recorder.window.findClickableAncestor(child);

        assert.strictEqual(result.id, 'parentButton');
    });

    it('detects an editable text input', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <input id="username" type="text">
            </body>
            </html>
        `);

        const input = recorder.document.getElementById('username');

        assert.strictEqual(
            recorder.window.isEditableInput(input),
            true
        );
    });

    it('rejects a checkbox as editable input', function () {
        recorder = loadContentScript(`
            <!DOCTYPE html>
            <html>
            <body>
                <input id="checkbox" type="checkbox">
            </body>
            </html>
        `);

        const checkbox = recorder.document.getElementById('checkbox');

        assert.strictEqual(
            recorder.window.isEditableInput(checkbox),
            false
        );
    });
});