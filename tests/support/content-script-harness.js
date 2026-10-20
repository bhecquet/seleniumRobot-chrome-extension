const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {JSDOM} = require('jsdom');

function loadContentScript(html = '<!DOCTYPE html><html><head><title>Unit test</title></head><body></body></html>') {
    const dom = new JSDOM(html, {
        url: 'http://127.0.0.1:8000/unit-test.html',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });

    const sentEvents = [];
    const window = dom.window;

    window.fetch = async function (url, options = {}) {
        if (options.body) {
            sentEvents.push(JSON.parse(options.body));
        }

        return {
            ok: true,
            status: 200,
            text: async function () {
                return 'OK';
            }
        };
    };

    window.open = function () {
        return {
            focus: function () {
            }
        };
    };

    if (!window.CSS) {
        window.CSS = {};
    }

    if (typeof window.CSS.escape !== 'function') {
        window.CSS.escape = function (value) {
            return String(value).replace(/[^a-zA-Z0-9_-]/g, function (character) {
                return '\\' + character;
            });
        };
    }

    window.setInterval = function () {
        return 1;
    };

    window.clearInterval = function () {
    };
    const context = dom.getInternalVMContext();
    const scriptFiles = ['src/content/recorder-utils.js', 'src/content/recorder-selectors.js', 'src/content/recorder-actions.js', 'src/content/contentScript.js'];
    for (const scriptFile of scriptFiles) {
        const source = fs.readFileSync(path.resolve(__dirname, '../..', scriptFile), 'utf8');
        vm.runInContext(source, context, {filename: scriptFile});
    }

    return {
        window,
        document: window.document,
        sentEvents,

        async wait(milliseconds = 100) {
            await new Promise(resolve => setTimeout(resolve, milliseconds));
        },

        clearEvents() {
            sentEvents.length = 0;
        },
        close() {
            window.close();
        }
    };
}

module.exports = {
    loadContentScript
};