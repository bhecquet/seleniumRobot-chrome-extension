function hasDigit(str) {
    return /\d/.test(str);
}

function isGen(str) {
    return /[_-]\d/.test(str) || /\d[a-z]/.test(str);
}

function isDynamicId(id) {
    if (!id) {
        return true;
    }

    const value = id.trim();

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return true;
    }

    if (/^(mat-|cdk-|ng-|ember-|react-|vue-)/i.test(value)) {
        return true;
    }

    if (/\d{8,}/.test(value)) {
        return true;
    }

    if (/^[0-9a-f]{16,}$/i.test(value)) {
        return true;
    }

    return false;
}

function tagName(el) {
    return el.tagName.toLowerCase();
}

function ssOccurrences(string, subString, allowOverlapping) {
    if (subString.length <= 0) {
        return string.length + 1;
    }

    let count = 0;
    let position = 0;
    const step = allowOverlapping ? 1 : subString.length;

    while (true) {
        position = string.indexOf(subString, position);

        if (position < 0) {
            break;
        }

        count++;
        position += step;
    }

    return count;
}

function simpleHash(str) {
    let hash = 2166136261;

    for (let index = 0; index < str.length; index++) {
        hash ^= str.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16);
}

function sanitizeJavaName(name) {
    let normalized = (name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '');

    normalized = normalized.replace(/[^a-zA-Z0-9_]/g, '_');

    if (!normalized) {
        normalized = 'element';
    }

    if (/^[0-9]/.test(normalized)) {
        normalized = 'e_' + normalized;
    }

    if (normalized.length > 40) {
        normalized = normalized.substring(0, 40);
    }

    return normalized;
}

function normalizeRecorderText(text) {
    return String(text || '')
        .replace(/[\u00A0\u202F\u2007]/g, ' ')
        .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function toXPathLiteral(value) {
    const text = String(value);

    if (!text.includes('\'')) {
        return '\'' + text + '\'';
    }

    if (!text.includes('"')) {
        return '"' + text + '"';
    }

    const parts = text.split('\'');

    return 'concat('
        + parts.map(part => '\'' + part + '\'').join(', "\'", ')
        + ')';
}

function isLikelyDynamicText(text) {
    if (!text) {
        return true;
    }

    const cleaned = text.trim();

    return cleaned.length > 40
        || /\d{5,}/.test(cleaned)
        || /\d{2}\/\d{2}\/\d{4}/.test(cleaned)
        || /https?:\/\//i.test(cleaned);
}

function escapeCssAttribute(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

function safeCssIdSelector(id) {
    if (!id) {
        return null;
    }

    if (window.CSS && typeof window.CSS.escape === 'function') {
        return `#${CSS.escape(id)}`;
    }

    if (
        /\s/.test(id)
        || id.includes(',')
        || id.includes('.')
        || id.includes('(')
        || id.includes(':')
    ) {
        return null;
    }

    return `#${id}`;
}