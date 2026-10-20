const assert = require('assert');
const {loadContentScript} = require('../support/content-script-harness');

describe('contentScript utility functions', function () {
    let recorder;

    beforeEach(function () {
        recorder = loadContentScript();
    });

    afterEach(function () {
        recorder.close();
    });

    describe('isDynamicId', function () {
        it('accepts a stable ID', function () {
            assert.strictEqual(
                recorder.window.isDynamicId('save-profile-id'),
                false
            );
        });

        it('rejects an empty ID', function () {
            assert.strictEqual(
                recorder.window.isDynamicId(''),
                true
            );
        });

        it('rejects a React ID', function () {
            assert.strictEqual(
                recorder.window.isDynamicId('react-1790851234567'),
                true
            );
        });

        it('rejects a UUID', function () {
            assert.strictEqual(
                recorder.window.isDynamicId('550e8400-e29b-41d4-a716-446655440000'),
                true
            );
        });

        it('rejects an ID containing a long number', function () {
            assert.strictEqual(
                recorder.window.isDynamicId('customer-1790851234567'),
                true
            );
        });
    });

    describe('normalizeRecorderText', function () {
        it('removes spaces before and after the text', function () {
            assert.strictEqual(
                recorder.window.normalizeRecorderText('  Save profile  '),
                'Save profile'
            );
        });

        it('replaces multiple spaces with one space', function () {
            assert.strictEqual(
                recorder.window.normalizeRecorderText('Save      profile'),
                'Save profile'
            );
        });

        it('normalizes non-breaking spaces', function () {
            assert.strictEqual(
                recorder.window.normalizeRecorderText('Save\u00A0profile'),
                'Save profile'
            );
        });

        it('removes invisible characters', function () {
            assert.strictEqual(
                recorder.window.normalizeRecorderText('Save\u200Bprofile'),
                'Saveprofile'
            );
        });

        it('returns an empty string for null', function () {
            assert.strictEqual(
                recorder.window.normalizeRecorderText(null),
                ''
            );
        });
    });

    describe('toXPathLiteral', function () {
        it('uses single quotes for simple text', function () {
            assert.strictEqual(
                recorder.window.toXPathLiteral('Save profile'),
                '\'Save profile\''
            );
        });

        it('uses double quotes for text containing an apostrophe', function () {
            assert.strictEqual(
                recorder.window.toXPathLiteral('S\'enregistrer'),
                '"S\'enregistrer"'
            );
        });

        it('uses concat for text containing both quote types', function () {
            const result = recorder.window.toXPathLiteral(
                'L\'utilisateur dit "OK"'
            );

            assert.ok(result.startsWith('concat('));
            assert.ok(result.includes('"\'"'));
        });
    });

    describe('ssOccurrences', function () {
        it('counts non-overlapping occurrences', function () {
            assert.strictEqual(
                recorder.window.ssOccurrences('a-b-a-b', 'a', false),
                2
            );
        });

        it('counts overlapping occurrences', function () {
            assert.strictEqual(
                recorder.window.ssOccurrences('aaaa', 'aa', true),
                3
            );
        });
    });

    describe('simpleHash', function () {
        it('returns the same hash for the same text', function () {
            const first = recorder.window.simpleHash('save-profile');
            const second = recorder.window.simpleHash('save-profile');

            assert.strictEqual(first, second);
        });

        it('returns different hashes for different texts', function () {
            assert.notStrictEqual(
                recorder.window.simpleHash('save-profile'),
                recorder.window.simpleHash('delete-profile')
            );
        });
    });

    describe('sanitizeJavaName', function () {
        it('removes accents and unsupported characters', function () {
            assert.strictEqual(
                recorder.window.sanitizeJavaName('Élément à enregistrer'),
                'Element_a_enregistrer'
            );
        });

        it('prefixes a name starting with a number', function () {
            assert.strictEqual(
                recorder.window.sanitizeJavaName('123 customer'),
                'e_123_customer'
            );
        });

        it('returns element for an empty name', function () {
            assert.strictEqual(
                recorder.window.sanitizeJavaName(''),
                'element'
            );
        });
    });
});