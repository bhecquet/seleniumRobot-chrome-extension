/* ======================== SELECTORS ======================== */
document.documentElement.setAttribute('data-recorder-loaded', 'true');
var cssPathById = function (el) {
    if (!(el instanceof Element)) return;
    var path = [];
    while (el != null && el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        if (el.id) {
            var elid = el.id;

            if (/\s/.test(elid) || elid.includes(',') || elid.includes('.') ||
                elid.includes('(') || elid.includes(':') || hasDigit(elid[0])) {
                return cssPathByAttribute(el, 'id');
            }

            selector += '#' + elid;
            path.unshift(selector);
            break;
        } else {
            var sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() === selector) nth++;
            }
            if (nth !== 1) selector += ':nth-of-type(' + nth + ')';
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(' > ');
};

var cssPathByAttribute = function (el, attr) {
    if (!(el instanceof Element)) return;
    var path = [];
    while (el !== null && el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        if (el.hasAttribute(attr) &&
            el.getAttribute(attr).length > 0 &&
            !el.getAttribute(attr).includes('\n')) {

            var the_attr = el.getAttribute(attr);
            the_attr = the_attr.replaceAll('"', '\\"');
            the_attr = the_attr.replaceAll('\'', '\\\'');
            selector += '[' + attr + '="' + the_attr + '"]';
            path.unshift(selector);
            break;

        } else {
            var sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() === selector) nth++;
            }
            if (nth !== 1) selector += ':nth-of-type(' + nth + ')';
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(' > ');
};

var cssPathByClass = function (el) {
    if (!(el instanceof Element)) return;
    var path = [];
    while (el !== null && el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        if (el.hasAttribute('class') &&
            el.getAttribute('class').length > 0 &&
            !el.getAttribute('class').includes(' ') &&
            (el.getAttribute('class').includes('-')) &&
            document.querySelectorAll(selector + '.' + el.getAttribute('class')).length === 1) {
            selector += '.' + el.getAttribute('class');
            path.unshift(selector);
            break;
        } else {
            var sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() === selector) nth++;
            }
            if (nth !== 1) selector += ':nth-of-type(' + nth + ')';
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(' > ');
};

var ssOccurrences = function (string, subString, allowOverlapping) {
    if (subString.length <= 0) return (string.length + 1);
    var n = 0;
    var pos = 0;
    var step = allowOverlapping ? 1 : subString.length;
    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
};

function hasDigit(str) {
    return /\d/.test(str);
}

function isDynamicId(id) {
    if (!id) {
        return true;
    }

    const value = id.trim();

    if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ) {
        return true;
    }

    if (
        /^(mat-|cdk-|ng-|ember-|react-|vue-)/i.test(value)
    ) {
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

function turnIntoParentAsNeeded(el) {
    if (!el || !(el instanceof Element)) return el;
    if (tagName(el) === 'span' || tagName(el) === 'i') {
        if (el.parentElement && tagName(el.parentElement) === 'button') {
            el = el.parentElement;
        } else if (el.parentElement && el.parentElement.parentElement &&
            tagName(el.parentElement.parentElement) === 'button') {
            el = el.parentElement.parentElement;
        }
    }
    return el;
}

function normalizeClickTarget(el) {
    if (!el || !(el instanceof Element)) {
        return el;
    }

    if (el.tagName === 'IMG') {
        const a = el.closest('a[href]');
        if (a) return a;
    }

    if (
        el.tagName === 'LABEL' ||
        (el.tagName === 'SPAN' && el.parentElement && el.parentElement.tagName === 'LABEL')
    ) {
        const label = el.tagName === 'LABEL' ? el : el.parentElement;

        const forId = label.getAttribute('for');
        if (forId) {
            const input = document.getElementById(forId);
            if (input) return input;
        }

        const next = label.nextElementSibling;
        if (
            next &&
            next instanceof Element &&
            next.tagName === 'INPUT' &&
            (next.type === 'radio' || next.type === 'checkbox')
        ) {
            return next;
        }

    }

    if (['SVG', 'PATH', 'I', 'SPAN'].includes(el.tagName)) {
        const clickable = el.closest('button, a[href], [role="button"], [role="link"]');
        if (clickable) return clickable;
    }

    const role = el.getAttribute('role');
    if (role === 'button' || role === 'link') {
        return el;
    }

    if (typeof el.onclick === 'function') {
        return el;
    }

    const clickableParent = el.closest(
        'a[href], button, input[type="button"], input[type="submit"], [role="button"], [role="link"]'
    );
    if (clickableParent) {
        return clickableParent;
    }

    if (el.closest('.context-menu, [role="menu"]')) {
        const menuItem = el.closest('[role="menuitem"], li, button, a');
        if (menuItem) return menuItem;
    }

    return el;

}

function findClickableAncestor(el) {
    let cur = el;

    while (cur && cur !== document.body) {

        if (cur.tagName === 'INPUT' &&
            ['button', 'submit', 'radio', 'checkbox'].includes(cur.type)) {
            return cur;
        }

        if (cur.tagName === 'A' && cur.href) return cur;

        if (cur.tagName === 'BUTTON') return cur;

        const role = cur.getAttribute && cur.getAttribute('role');
        if (role === 'button' || role === 'link' || role === 'menuitem') return cur;

        if (typeof cur.onclick === 'function' &&
            !['FORM', 'DIV', 'SECTION', 'MAIN'].includes(cur.tagName)) {
            return cur;
        }

        cur = cur.parentElement;
    }

    return el;
}

/* ========================  SERVER ======================== */

let serverRequestQueue = Promise.resolve();

function sendToServer(actionData) {
    serverRequestQueue = serverRequestQueue
        .then(() => fetch('http://localhost:5222/event', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(actionData)
        }))
        .then(response => response.text())
        .then(data => console.log('Action envoyée au serveur Jetty :', actionData.command, data))
        .catch(error => console.error('Erreur d’envoi :', actionData.command, error));

    return serverRequestQueue;
}

/*=========================  IFRAMES ===============================*/

function getFrameElementSelector(frameElement) {
    if (!(frameElement instanceof Element)) {
        return null;
    }

    const ownerDocument =
        frameElement.ownerDocument;

    if (
        frameElement.id
        && !isDynamicId(frameElement.id)
    ) {
        const idSelector =
            safeCssIdSelector(frameElement.id);

        try {
            const matches =
                ownerDocument.querySelectorAll(
                    idSelector
                );

            if (
                matches.length === 1
                && matches[0] === frameElement
            ) {
                return idSelector;
            }
        } catch (error) {
            console.warn(
                '[Recorder] Invalid frame ID selector',
                error
            );
        }
    }

    const frameName =
        frameElement.getAttribute('name');

    if (frameName) {
        const nameSelector =
            'iframe[name="'
            + escapeCssAttribute(frameName)
            + '"]';

        try {
            const matches =
                ownerDocument.querySelectorAll(
                    nameSelector
                );

            if (
                matches.length === 1
                && matches[0] === frameElement
            ) {
                return nameSelector;
            }
        } catch (error) {
            console.warn(
                '[Recorder] Invalid frame name selector',
                error
            );
        }
    }

    const frameTitle = frameElement.getAttribute('title');

    if (frameTitle) {
        const titleSelector = 'iframe[title="' + escapeCssAttribute(frameTitle) + '"]';
        try {
            const matches = ownerDocument.querySelectorAll(titleSelector);
            if (
                matches.length === 1
                && matches[0] === frameElement
            ) {
                return titleSelector;
            }
        } catch (error) {
            console.warn(
                '[Recorder] Invalid frame title selector',
                error
            );
        }
    }

    return null;
}

function getFramePath() {
    const path = [];
    let currentWindow = window;

    while (currentWindow !== currentWindow.top) {
        try {
            const frameElement = currentWindow.frameElement;

            if (!frameElement) {
                break;
            }

            path.unshift({
                id:
                    frameElement.id || null,
                name:
                    frameElement.getAttribute('name') || null,
                title:
                    frameElement.getAttribute('title') || null,
                selector:
                    getFrameElementSelector(frameElement)
            });
            currentWindow = currentWindow.parent;
        } catch (error) {
            console.warn('[Recorder] Unable to access ' + 'the parent frame', error);
            break;
        }
    }

    return path;
}

/* ======================== BEST SELECTOR ======================== */

var getBestSelector = function (el) {
    if (!(el instanceof Element)) return;
    el = turnIntoParentAsNeeded(el);

    var sel_by_id = cssPathById(el) || '';

    if (el.id && !isDynamicId(el.id) && sel_by_id && !sel_by_id.includes(' > ')) {
        return sel_by_id;
    }

    var child_count_by_id = sel_by_id ? ssOccurrences(sel_by_id, ' > ') : 999;
    var selector_by_class = cssPathByClass(el) || '';
    var tag_name = tagName(el);

    var non_id_attributes = [];

    non_id_attributes.push('data-testid');
    non_id_attributes.push('data-test');
    non_id_attributes.push('data-cy');
    non_id_attributes.push('formcontrolname');
    non_id_attributes.push('name');
    non_id_attributes.push('aria-label');
    non_id_attributes.push('aria-labelledby');
    non_id_attributes.push('placeholder');
    non_id_attributes.push('data-auto');
    non_id_attributes.push('data-qa');
    non_id_attributes.push('data-tid');
    non_id_attributes.push('data-el');
    non_id_attributes.push('data-se');
    non_id_attributes.push('data-name');
    non_id_attributes.push('data-auto');
    non_id_attributes.push('data-text');
    non_id_attributes.push('data-test-id');
    non_id_attributes.push('data-test-selector');
    non_id_attributes.push('data-nav');
    non_id_attributes.push('data-sb');
    non_id_attributes.push('data-action');
    non_id_attributes.push('data-target');
    non_id_attributes.push('data-tooltip');
    non_id_attributes.push('alt');
    non_id_attributes.push('title');
    non_id_attributes.push('heading');
    non_id_attributes.push('translate');
    non_id_attributes.push('aria-describedby');
    non_id_attributes.push('rel');
    non_id_attributes.push('ng-model');
    non_id_attributes.push('ng-href');
    non_id_attributes.push('href');
    non_id_attributes.push('label');
    non_id_attributes.push('data-content');
    non_id_attributes.push('data-tip');
    non_id_attributes.push('data-for');
    non_id_attributes.push('class');
    non_id_attributes.push('for');
    non_id_attributes.push('value');
    non_id_attributes.push('ng-click');
    non_id_attributes.push('ng-if');
    non_id_attributes.push('src');

    var selector_by_attr = [];
    var all_by_attr = [];
    var num_by_attr = [];
    var child_count_by_attr = [];

    for (var i = 0; i < non_id_attributes.length; i++) {
        var n_i_attr = non_id_attributes[i];
        selector_by_attr[i] = null;

        if (n_i_attr === 'class') selector_by_attr[i] = selector_by_class;
        else selector_by_attr[i] = cssPathByAttribute(el, n_i_attr);

        if (!selector_by_attr[i]) continue;

        try {
            all_by_attr[i] = document.querySelectorAll(selector_by_attr[i]);
        } catch (e) {

            all_by_attr[i] = [];
            continue;
        }

        num_by_attr[i] = all_by_attr[i].length;

        if (!selector_by_attr[i].includes(' > ') &&
            ((num_by_attr[i] === 1) || (el === all_by_attr[i][0]))) {

            if (n_i_attr.startsWith('aria') || n_i_attr === 'for') {
                if (hasDigit(selector_by_attr[i])) continue;
            }
            return selector_by_attr[i];
        }
        child_count_by_attr[i] = ssOccurrences(selector_by_attr[i], ' > ');
    }

    var basic_tags = ['h1', 'h2', 'h3', 'canvas', 'center', 'input', 'textarea'];
    for (var b = 0; b < basic_tags.length; b++) {
        var d_qsa = document.querySelectorAll(basic_tags[b]);
        if (tag_name === basic_tags[b] && d_qsa.length === 1 && el === d_qsa[0]) return basic_tags[b];
    }

    var best_selector = sel_by_id || selector_by_class || tag_name;
    var lowest_child_count = child_count_by_id;

    var child_count_by_class = selector_by_class ? ssOccurrences(selector_by_class, ' > ') : 999;
    if (child_count_by_class < lowest_child_count) {
        best_selector = selector_by_class;
        lowest_child_count = child_count_by_class;
    }

    for (var j = 0; j < non_id_attributes.length; j++) {
        if (child_count_by_attr[j] < lowest_child_count &&
            ((num_by_attr[j] === 1) || (el === all_by_attr[j][0]))) {
            best_selector = selector_by_attr[j];
            lowest_child_count = child_count_by_attr[j];
        }
    }

    best_selector = (best_selector || '').replaceAll('html > body', 'body');

    var selector = best_selector.replaceAll(' > ', ' ');
    selector = selector.replaceAll(' div ', ' ');
    try {
        if (document.querySelector(selector) === el) best_selector = selector;
    } catch (e) {
        // ignore
    }
    return best_selector;
};

/* ======================== ENHANCED SELECTOR / XPATH  ======================== */

function safeCssIdSelector(id) {
    if (!id) return null;

    if (window.CSS && typeof window.CSS.escape === 'function') {
        return `#${CSS.escape(id)}`;
    }

    if (/\s/.test(id) || id.includes(',') || id.includes('.') || id.includes('(') || id.includes(':')) {
        return null;
    }
    return `#${id}`;
}

function escapeCssAttribute(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

function isUniqueCssSelector(selector, expectedElement) {
    if (!selector || !(expectedElement instanceof Element)) {
        return false;
    }

    try {
        const matches = document.querySelectorAll(selector);

        return matches.length === 1 &&
            matches[0] === expectedElement;
    } catch (error) {
        return false;
    }
}

function getEnhancedSelector(el) {
    el = turnIntoParentAsNeeded(el);

    if (!(el instanceof Element)) {
        return null;
    }

    const tag = el.tagName.toLowerCase();

    const type = (el.getAttribute('type') || '').toLowerCase();

    if (el.id && !isDynamicId(el.id)) {
        const idSelector = safeCssIdSelector(el.id);

        if (isUniqueCssSelector(idSelector, el)) {
            return idSelector;
        }
    }

    for (const attributeName of STABLE_DATA_ATTRIBUTES) {
        const attributeValue =
            el.getAttribute(attributeName);

        if (!attributeValue) {
            continue;
        }

        const selector = '[' + attributeName + '="' + escapeCssAttribute(attributeValue) + '"]';

        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    const formControlName = el.getAttribute('formcontrolname');

    if (formControlName) {
        const selector =
            `${tag}[formcontrolname="${escapeCssAttribute(formControlName)}"]`;

        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    const name = el.getAttribute('name');

    if (name) {
        const selector =
            `${tag}[name="${escapeCssAttribute(name)}"]`;

        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    const ariaLabel = el.getAttribute('aria-label');

    if (ariaLabel) {
        const selector =
            `[aria-label="${escapeCssAttribute(ariaLabel)}"]`;

        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    const ariaLabelledBy = el.getAttribute('aria-labelledby');

    if (ariaLabelledBy) {
        const selector =
            `[aria-labelledby="${escapeCssAttribute(ariaLabelledBy)}"]`;

        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    const placeholder = el.getAttribute('placeholder');

    if (placeholder) {
        const selector =
            `${tag}[placeholder="${escapeCssAttribute(placeholder)}"]`;

        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    if (
        tag === 'input' &&
        (type === 'checkbox' || type === 'radio')
    ) {
        const inputName = el.getAttribute('name');
        const inputValue = el.getAttribute('value');

        if (inputName && inputValue) {
            const selector =
                `input[type="${type}"]` +
                `[name="${escapeCssAttribute(inputName)}"]` +
                `[value="${escapeCssAttribute(inputValue)}"]`;

            if (isUniqueCssSelector(selector, el)) {
                return selector;
            }
        }
    }

    return getBestSelector(el);
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

    return 'concat(' + parts
        .map(part => '\'' + part + '\'')
        .join(', "\'", ') + ')';
}

function isLikelyDynamicText(text) {
    if (!text) {
        return true;
    }
    const cleaned = text.trim();
    return cleaned.length > 40 || /\d{5,}/.test(cleaned) || /\d{2}\/\d{2}\/\d{4}/.test(cleaned) || /https?:\/\//i.test(cleaned);
}

/**
 * Checks whether an XPath identifies only the expected element.
 *
 * @param {string} xpath XPath to verify.
 * @param {Element} expectedElement Expected element.
 * @returns {boolean} true when the XPath is unique.
 */
function isUniqueXPath(xpath, expectedElement) {
    if (!xpath || !(expectedElement instanceof Element)) {
        return false;
    }
    try {
        const result = expectedElement.ownerDocument.evaluate(xpath, expectedElement.ownerDocument, null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
        );
        return result.snapshotLength === 1
            && result.snapshotItem(0)
            === expectedElement;
    } catch (error) {
        console.warn('[Recorder] Invalid XPath',
            {
                xpath: xpath,
                element: expectedElement,
                error: error
            }
        );
        return false;
    }
};

function buildXPathFromStableParent(el) {
    let parent = el.parentElement;

    while (parent && parent !== document.body) {
        if (parent.id && !isDynamicId(parent.id)) {
            const parentXPath = '//*[@id=' + toXPathLiteral(parent.id) + ']';

            if (!isUniqueXPath(parentXPath, parent)) {
                parent = parent.parentElement;
                continue;
            }
            const parts = [];
            let current = el;

            while (current && current !== parent) {
                const tag = current.tagName.toLowerCase();

                const siblings = current.parentElement ? Array.from(current.parentElement.children)
                    .filter(node => node.tagName === current.tagName) : [];
                let part = tag;
                if (siblings.length > 1) {
                    part += `[${siblings.indexOf(current) + 1}]`;
                }
                parts.unshift(part);
                current = current.parentElement;
            }
            const xpath = `${parentXPath}//${parts.join('/')}`;
            if (isUniqueXPath(xpath, el)) {
                return xpath;
            }
        }

        parent = parent.parentElement;
    }

    return null;
}

function getEnhancedXPath(el) {
    el = turnIntoParentAsNeeded(el);

    if (!(el instanceof Element)) {
        return null;
    }

    if (el.id && !isDynamicId(el.id)
    ) {
        const idXPath = '//*[@id=' + toXPathLiteral(el.id) + ']';
        if (isUniqueXPath(idXPath, el)) {
            return idXPath;
        }
    }

    for (
        const attributeName of STABLE_DATA_ATTRIBUTES) {
        const attributeValue = el.getAttribute(attributeName);

        if (!attributeValue) {
            continue;
        }

        const dataXPath = '//*[@' + attributeName + '=' + toXPathLiteral(attributeValue) + ']';

        if (
            isUniqueXPath(
                dataXPath,
                el
            )
        ) {
            return dataXPath;
        }
    }
    const formControlName = el.getAttribute('formcontrolname');
    if (formControlName) {
        const formControlXPath = '//*[@formcontrolname=' + toXPathLiteral(formControlName) + ']';
        if (isUniqueXPath(formControlXPath, el)
        ) {
            return formControlXPath;
        }
    }

    const name = el.getAttribute('name');

    if (name) {
        const nameXPath = '//*[@name=' + toXPathLiteral(name) + ']';

        if (isUniqueXPath(nameXPath, el)) {
            return nameXPath;
        }
    }

    const ariaLabel = el.getAttribute('aria-label');

    if (ariaLabel) {
        const ariaLabelXPath = '//*[@aria-label=' + toXPathLiteral(ariaLabel) + ']';

        if (isUniqueXPath(ariaLabelXPath, el)) {
            return ariaLabelXPath;
        }
    }

    const placeholder = el.getAttribute('placeholder');

    if (placeholder) {
        const placeholderXPath = '//*[@placeholder=' + toXPathLiteral(placeholder) + ']';

        if (isUniqueXPath(placeholderXPath, el)) {
            return placeholderXPath;
        }
    }

    const href = el.getAttribute('href');

    if (
        el.tagName.toLowerCase() === 'a'
        && href
        && !href.startsWith('javascript:')
    ) {
        const hrefXPath = '//a[@href=' + toXPathLiteral(href) + ']';
        if (
            isUniqueXPath(hrefXPath, el)) {
            return hrefXPath;
        }
    }
    const text = normalizeRecorderText(el.textContent || '');
    if (
        text
        && text.length <= 40
        && !isLikelyDynamicText(text)
    ) {
        const textXPath = '//' + el.tagName.toLowerCase()
            + '[normalize-space(.)=' + toXPathLiteral(text) + ']';

        if (isUniqueXPath(textXPath, el)) {
            return textXPath;
        }
    }

    const stableParentXPath = buildXPathFromStableParent(el);

    if (stableParentXPath) {
        return stableParentXPath;
    }
    const parts = [];
    let current = el;

    while (
        current
        && current.nodeType
        === Node.ELEMENT_NODE
        && current.tagName
            .toLowerCase() !== 'html'
        ) {
        const tag = current.tagName.toLowerCase();

        const siblings = current.parentNode ? Array.from(current.parentNode.children).filter(node => {
            return node.tagName === current.tagName;
        }) : [];

        let part = tag;
        if (siblings.length > 1) {
            const position = siblings.indexOf(current) + 1;
            part += `[${position}]`;
        }

        parts.unshift(part);
        current = current.parentElement;

        if (current && current.tagName && current.tagName.toLowerCase() === 'body') {
            break;
        }
    }

    const structuralXPath = `//${parts.join('/')}`;

    if (isUniqueXPath(structuralXPath, el)
    ) {
        return structuralXPath;
    }

    console.warn('[Recorder] No unique XPath found', {element: el, structuralXPath: structuralXPath});

    return null;
}

function useHref(tag_name, el) {
    return (tag_name === 'a' && el.hasAttribute('href') &&
        el.getAttribute('href').length > 0 && el.origin !== 'null');
}

function saveRecordedActions() {
    var json_rec_act = JSON.stringify(document.recorded_actions);
    sessionStorage.setItem('recorded_actions', json_rec_act);
}

function new_tab_on_new_origin() {
    var AllAnchorTags = document.getElementsByTagName('a');
    for (var i = 0; i < AllAnchorTags.length; i++) {
        if (!AllAnchorTags[i].sbset) {
            AllAnchorTags[i].sbset = true;
            AllAnchorTags[i].addEventListener('click', function (event) {
                var rec_mode = sessionStorage.getItem('recorder_mode');
                if (rec_mode !== '2' && rec_mode !== '3') {
                    if (this.origin &&
                        this.origin !== 'null' &&
                        this.origin !== document.location.origin &&
                        this.hasAttribute('href')) {
                        event.preventDefault();
                        window.open(this.href, '_blank').focus();
                    }
                } else {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }, false);
        }
    }
}

new_tab_on_new_origin();

var AllInputTags = document.getElementsByTagName('input');
var AllButtonTags = document.getElementsByTagName('button');
var All_IB_Tags = [];
All_IB_Tags.push(...AllInputTags, ...AllButtonTags);
for (var i = 0; i < All_IB_Tags.length; i++) {
    All_IB_Tags[i].addEventListener('click', function (event) {
        var rec_mode = sessionStorage.getItem('recorder_mode');
        if (rec_mode === '2' || rec_mode === '3') {
            event.preventDefault();
            event.stopPropagation();
        }
    }, false);
}

var SearchInputs = document.querySelectorAll('input[type="search"]');
for (var s = 0; s < SearchInputs.length; s++) {
    SearchInputs[s].addEventListener('change', function () {
        new_tab_on_new_origin();
    }, false);
}

var AwayForms = document.querySelectorAll('form[action^="//"]');
for (var f = 0; f < AwayForms.length; f++) {
    AwayForms[f].target = '_blank';
}

var reset_recorder_state = function () {
    document.recorded_actions = [];
    sessionStorage.setItem('pause_recorder', 'no');
    sessionStorage.setItem('recorder_mode', '1');
    sessionStorage.setItem('recorder_title', document.title);
    const d_now = Date.now();
    document.recorder_last_mouseup = d_now;

    var w_orig = window.location.origin;
    var w_href = window.location.href;

    if (sessionStorage.getItem('recorder_activated') === 'yes') {
        var ss_ra = JSON.parse(sessionStorage.getItem('recorded_actions'));
        document.recorded_actions = ss_ra || [];
        document.recorded_actions.push(['_url_', w_orig, w_href, d_now]);
    } else {
        sessionStorage.setItem('recorder_activated', 'yes');
        document.recorded_actions.push(['begin', w_orig, w_href, d_now]);
    }
    saveRecordedActions();
    return;
};
reset_recorder_state();

var reset_if_recorder_undefined = function () {
    if (typeof document.recorded_actions === 'undefined')
        reset_recorder_state();
};

var set_border = function (color) {
    document.querySelector('body').style.border = '5px solid ' + color;
    document.querySelector('body').style.borderRadius = '10px';
};

const CLICK_DEDUP_MS = 350;
let lastClickKey = null;
let lastClickTs = 0;

let pendingClick = null;
const PENDING_CLICK_MS = 70;


const INPUT_DEBOUNCE_MS = 400;
const inputTimers = new Map();
const lastSentValue = new Map();

function simpleHash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
}

function clickCandidateScore(el) {
    if (!(el instanceof Element)) return -999;

    if (el.getAttribute('data-testid')) return 1000;
    if (el.getAttribute('data-test')) return 980;
    if (el.getAttribute('data-cy')) return 980;

    if (el.id && !isDynamicId(el.id)) {
        return 900;
    }

    if (el.getAttribute('formcontrolname')) {
        return 850;
    }

    if (el.getAttribute('name')) return 800;
    if (el.getAttribute('aria-label')) return 700;

    const tag = el.tagName;
    if (tag === 'BUTTON') return 650;
    if (tag === 'A') return 640;
    if (tag === 'INPUT') return 630;


    if (tag === 'FORM') return 100;
    if (tag === 'DIV' || tag === 'SECTION' || tag === 'MAIN') return 150;

    return 300;
};

function sanitizeJavaName(name) {
    let n = (name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    n = n.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!n) n = 'element';
    if (/^[0-9]/.test(n)) n = 'e_' + n;
    if (n.length > 40) n = n.substring(0, 40);
    return n;
}

function stableKeyFrom(el) {
    return 'css:' + getEnhancedSelector(el);
}

function isEditableInput(el) {
    if (!el || !(el instanceof Element)) return false;
    var t = tagName(el);
    if (t === 'textarea') return true;
    if (t !== 'input') return false;
    var type = (el.getAttribute('type') || 'text').toLowerCase();
    return !['checkbox', 'radio', 'range', 'file', 'button', 'submit', 'reset'].includes(type);
}

function getAdjacentText(el) {
    if (!(el instanceof Element)) {
        return '';
    }

    let node = el.nextSibling;

    while (node) {

        if (node.nodeType === Node.TEXT_NODE) {
            const text = (node.textContent || '')
                .replace(/\u00A0/g, ' ')
                .replace(/\u200B/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (text) {
                return text;
            }
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            break;
        }

        node = node.nextSibling;
    }

    return '';
}

function buildScopedCheckboxXPath(el) {
    if (!(el instanceof Element)) {
        return null;
    }

    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();

    if (tag !== 'input' || type !== 'checkbox') {
        return null;
    }

    const parent = el.closest('[id]');

    if (!parent || !parent.id) {
        return null;
    }

    const checkboxes = Array.from(
        parent.querySelectorAll('input[type="checkbox"]')
    );

    const index = checkboxes.indexOf(el);

    if (index < 0) {
        return null;
    }

    const parentTag = parent.tagName.toLowerCase();
    const escapedParentId =
        parent.id.replace(/'/g, '\\\'');

    return '//'
        + parentTag
        + '[@id=\''
        + escapedParentId
        + '\']/input[@type=\'checkbox\']['
        + (index + 1)
        + ']';
}

function normalizeRecorderText(text) {
    return String(text || '')
        .replace(/[\u00A0\u202F\u2007]/g, ' ')
        .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const STABLE_DATA_ATTRIBUTES = [
    'data-selenium-id',
    'data-testid',
    'data-test',
    'data-cy',
    'data-css',
    'data-qa',
    'data-tid',
    'data-auto',
    'data-test-id',
    'data-test-selector'
];

function addUniqueDataAttributeTargets(targets, el) {
    if (!(el instanceof Element)) {
        return;
    }

    for (const attributeName of STABLE_DATA_ATTRIBUTES) {
        const attributeValue =
            el.getAttribute(attributeName);
        if (!attributeValue) {
            continue;
        }
        const selector = '[' + attributeName + '="' + escapeCssAttribute(attributeValue) + '"]';

        if (!isUniqueCssSelector(selector, el)) {
            continue;
        }

        const alreadyPresent = targets.some(target => {
            return target[0] === attributeName && target[1] === attributeValue;
        });
        if (!alreadyPresent) {
            targets.push([
                attributeName,
                attributeValue
            ]);
        }
    }
}

function getFirstStableDataValue(el) {
    for (const attributeName of STABLE_DATA_ATTRIBUTES) {
        const value = el.getAttribute(attributeName);
        if (value) {
            return value;
        }
    }
    return null;
}

function addUniqueTextTarget(targets, el, normalizedText) {
    if (
        !(el instanceof Element)
        || !normalizedText
        || normalizedText.length > 80
    ) {
        return;
    }

    const tagName = el.tagName.toLowerCase();

    const matchingElements = Array.from(document.querySelectorAll(tagName)).filter(candidate => {
        const candidateText = normalizeRecorderText(candidate.textContent || '');
        return candidateText === normalizedText;
    });

    const isUnique = matchingElements.length === 1 && matchingElements[0] === el;
    if (!isUnique) {
        return;
    }

    const alreadyPresent = targets.some(target => {
        return target[0] === 'uniqueElementText' && target[1] === normalizedText;
    });

    if (!alreadyPresent) {
        targets.push([
            'uniqueElementText',
            normalizedText
        ]);
    }
}

function getAssociatedLabelText(el) {
    if (!(el instanceof Element)) {
        return '';
    }

    if (el.id) {
        const labels = Array.from(el.ownerDocument.querySelectorAll('label[for]'));

        const associatedLabel = labels.find(label => {
            return label.getAttribute('for') === el.id;
        });

        if (associatedLabel) {
            return normalizeRecorderText(associatedLabel.textContent || '');
        }
    }

    const parentLabel = el.closest('label');

    if (parentLabel) {
        return normalizeRecorderText(parentLabel.textContent || '');
    }

    return '';
}

/* ======================== BUILD ACTION DATA  ======================== */

function buildActionData(el, command) {
    el = turnIntoParentAsNeeded(el);

    const targets = [];
    const associatedLabelText = getAssociatedLabelText(el);

    if (associatedLabelText && associatedLabelText.length <= 80) {
        targets.push(['labelText', associatedLabelText]);
    }

    const currentTag = el.tagName.toLowerCase();
    const currentType =
        (el.getAttribute('type') || '').toLowerCase();

    const adjacentText = getAdjacentText(el);
    const isCheckableInput = currentTag === 'input' && (currentType === 'checkbox' || currentType === 'radio');
    const normalizedElementText = normalizeRecorderText(el.textContent || (isCheckableInput ? '' : el.getAttribute('value')) || '');

    if (el.id && !isDynamicId(el.id)) {
        const idSelector = safeCssIdSelector(el.id);

        if (idSelector && isUniqueCssSelector(idSelector, el)) {
            targets.push(['id', el.id]);
        }
    }

    addUniqueDataAttributeTargets(
        targets,
        el
    );
    const formControlName = el.getAttribute('formcontrolname');

    if (formControlName) {
        targets.push(['formControlName', formControlName]);
    }

    const name = el.getAttribute('name');

    if (name) {
        const nameSelector = el.tagName.toLowerCase() + '[name="' + escapeCssAttribute(name) + '"]';
        if (isUniqueCssSelector(nameSelector, el)) {
            targets.push(['name', name]);
        }
    }

    if (currentTag === 'a' && normalizedElementText) {
        targets.push(['linkText', normalizedElementText]);

        if (normalizedElementText.length <= 60) {
            const matchingLinks = Array.from(el.ownerDocument.querySelectorAll('a')).filter(candidate => {
                const candidateText = normalizeRecorderText(candidate.innerText || candidate.textContent || '');
                return candidateText === normalizedElementText;
            });

            if (matchingLinks.length === 1 && matchingLinks[0] === el) {
                targets.push(['uniqueLinkText', normalizedElementText]);
            }
        }
    }

    const isLinkElement = currentTag === 'a';

    const isButtonElement = currentTag === 'button' || (
        currentTag === 'input'
        && ['button', 'submit', 'reset'].includes(currentType)
    );

    if (normalizedElementText && normalizedElementText.length <= 80 && !isLinkElement && !isButtonElement && !isCheckableInput) {
        targets.push(['elementText', normalizedElementText]);
    }
    if (!isLinkElement && !isButtonElement && !isCheckableInput) {
        addUniqueTextTarget(targets, el, normalizedElementText);
    }
    if (el.getAttribute('aria-label')) {
        targets.push(['ariaLabel', el.getAttribute('aria-label')]);
    }

    if (el.getAttribute('aria-labelledby')) {
        targets.push([
            'ariaLabelledBy',
            el.getAttribute('aria-labelledby')
        ]);
    }

    if (el.getAttribute('placeholder')) {
        targets.push([
            'placeholder',
            el.getAttribute('placeholder')
        ]);
    }
    if (el.getAttribute('role')) {
        targets.push(['role', el.getAttribute('role')]);
    }
    if (
        isButtonElement
        && normalizedElementText
        && normalizedElementText.length <= 80
    ) {
        targets.push([
            'buttonText',
            normalizedElementText
        ]);

        const matchingButtons = Array.from(el.ownerDocument.querySelectorAll(
                'button, input[type="button"], input[type="submit"], input[type="reset"]'
            )
        ).filter(candidate => {
            const candidateText = normalizeRecorderText(
                candidate.innerText
                || candidate.textContent
                || candidate.getAttribute('value')
                || ''
            );

            return candidateText === normalizedElementText;
        });

        if (
            matchingButtons.length === 1
            && matchingButtons[0] === el
        ) {
            targets.push([
                'uniqueButtonText',
                normalizedElementText
            ]);
        }
    }

    if (currentTag === 'input' && currentType === 'checkbox') {

        const checkboxName = el.getAttribute('name');

        const checkboxValue = el.getAttribute('value');

        if (checkboxName && checkboxValue) {
            const checkboxSelector = 'input[type="checkbox"]' + '[name="' + escapeCssAttribute(checkboxName) + '"]' + '[value="' + escapeCssAttribute(checkboxValue) + '"]';
            if (isUniqueCssSelector(checkboxSelector, el)) {
                targets.push([
                    'checkboxNameValue',
                    checkboxName + '||VALUE||' + checkboxValue
                ]);
            }
        }

        if (adjacentText) {
            targets.push([
                'adjacentText',
                adjacentText
            ]);
        }

        const scopedCheckboxXPath = buildScopedCheckboxXPath(el);

        if (scopedCheckboxXPath) {
            targets.push([
                'xpath:scopedCheckbox',
                scopedCheckboxXPath
            ]);
        }
    }

    const css = getEnhancedSelector(el);
    if (css) {
        targets.push(['css', css]);
    }

    const xpath = getEnhancedXPath(el);
    if (xpath) {
        targets.push(['xpath', xpath]);
    }

    const key = stableKeyFrom(el);
    const suffix = simpleHash(key).substring(0, 6);
    const elementName = sanitizeJavaName(base) + '_' + suffix;

    return {
        command: command,
        tagName: currentTag,
        inputType: currentType,
        targets: targets,
        value: el.value || ''
    };
}

/* ======================== LISTENERS  ======================== */

window.addEventListener('blur', () => {
    setTimeout(() => {
        reset_if_recorder_undefined();
        const rec_mode = sessionStorage.getItem('recorder_mode');
        if (rec_mode === '2' || rec_mode === '3') return;

        const el = document.activeElement;
        const doc_t = document.title;
        const now = Date.now();
        let skip_open = false;

        if (el && tagName(el) === 'iframe' &&
            doc_t.startsWith('iframe') &&
            (Date.now() - document.recorder_last_mouseup) > 32) {

            const selector = getBestSelector(el);
            const origin = window.location.origin;

            if (el.hasAttribute('src') && el.getAttribute('src').length > 0) {
                if (el.src.startsWith('data:')) return;
                skip_open = true;
            } else {

                try {
                    attachRecorderToIframe(el);
                } catch (e) {

                }
            }

            document.recorded_actions.push(['sw_fr', selector, origin, now]);

            if (skip_open) {
                document.recorded_actions.push(['sk_fo', '', origin, now + 1]);
            }

            saveRecordedActions();


            try {
                const onBackToParent = () => {
                    document.removeEventListener('focus', onBackToParent, true);
                    document.recorded_actions.push(['fr_root', '', origin, Date.now()]);
                    saveRecordedActions();
                };
                window.addEventListener('focus', onBackToParent, {once: true});
            } catch (e) {
                // best effort
            }
        }
    });
}, {once: false});


function sendAction(el, command, extra = {}) {
    const framePath = getFramePath();
    const base = buildActionData(el, command);
    sendToServer({...base, framePath, ...extra});
}

document.addEventListener('pointerdown',
    function (event) {
        const target =
            event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const customCheckbox =
            target.closest(
                '[role="checkbox"]'
            );

        if (!customCheckbox) {
            return;
        }
        const previousState = customCheckbox.getAttribute('aria-checked') === 'true';
        customCheckboxStateBeforeClick.set(customCheckbox, previousState);
    },
    true
);


document.body.addEventListener('click', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const rawTarget = event.target;

    if (!(rawTarget instanceof Element)) {
        return;
    }

    const rawTag = rawTarget.tagName.toLowerCase();
    const rawType = (rawTarget.getAttribute('type') || '').toLowerCase();

    if (
        rawTag === 'select' ||
        (
            rawTag === 'input' &&
            ['checkbox', 'radio'].includes(rawType)
        )
    ) {
        return;
    }

    let el = normalizeClickTarget(rawTarget);
    el = findClickableAncestor(el);
    if (!(el instanceof Element)) return;

    const customCheckbox = el.closest('[role="checkbox"]');
    if (customCheckbox) {
        const previousState = customCheckboxStateBeforeClick.get(customCheckbox);
        setTimeout(() => {
            const currentState = customCheckbox.getAttribute('aria-checked') === 'true';

            customCheckboxStateBeforeClick.delete(customCheckbox);
            if (
                typeof previousState === 'boolean'
                && currentState === previousState
            ) {
                console.warn(
                    '[Recorder] Custom checkbox: '
                    + 'no state change detected',
                    {
                        element: customCheckbox,
                        previousState: previousState,
                        currentState: currentState
                    }
                );

                return;
            }

            const command = currentState ? 'check' : 'uncheck';
            const selector = getEnhancedSelector(customCheckbox);
            const now = Date.now();

            sendAction(customCheckbox, command, {
                    value:
                        String(currentState),
                    checked:
                    currentState
                }
            );

            document.recorded_actions.push([
                'c_box',
                selector,
                currentState ? 'yes' : 'no',
                now
            ]);

            saveRecordedActions();
        }, 0);

        return;
    }

    const now = Date.now();
    const score = clickCandidateScore(el);

    if (pendingClick && (now - pendingClick.ts) < PENDING_CLICK_MS) {

        const sameKey = stableKeyFrom(el) === pendingClick.key;
        const related =
            sameKey ||
            (pendingClick.el instanceof Element && pendingClick.el.contains(el)) ||
            (el.contains(pendingClick.el));

        if (related) {
            if (score > pendingClick.score) {
                pendingClick.el = el;
                pendingClick.score = score;
                pendingClick.ts = now;
                pendingClick.key = stableKeyFrom(el);
                pendingClick.event = event;
            }
            return;
        }
    }

    pendingClick = {
        el,
        score,
        ts: now,
        key: stableKeyFrom(el),
        event,
        timer: null
    };

    const localPendingClick = pendingClick;

    localPendingClick.timer = setTimeout(() => {
        if (pendingClick !== localPendingClick) {
            return;
        }

        const el2 = localPendingClick.el;
        const t = Date.now();

        if (
            lastClickKey === localPendingClick.key &&
            (t - lastClickTs) < CLICK_DEDUP_MS
        ) {
            pendingClick = null;
            return;
        }

        lastClickKey = localPendingClick.key;
        lastClickTs = t;

        sendAction(el2, 'click');

        document.recorded_actions.push([
            'click',
            getBestSelector(el2),
            el2.href || '',
            t
        ]);

        saveRecordedActions();
        pendingClick = null;
    }, PENDING_CLICK_MS);
});

document.body.addEventListener('dblclick', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    let el = normalizeClickTarget(event.target);  // MMA : labels, images
    el = findClickableAncestor(el);

    const selector = getBestSelector(el);
    const d_now = Date.now();

    sendAction(el, 'dblclick');

    document.recorded_actions.push(['dblclick', selector, '', d_now]);
    saveRecordedActions();
});


document.body.addEventListener('submit', function (event) {
    reset_if_recorder_undefined();

    if (sessionStorage.getItem('pause_recorder') === 'yes') {
        return;
    }

    const now = Date.now();

    let el = event.submitter;

    if (!(el instanceof Element)) {
        const form = event.target;

        if (form instanceof HTMLFormElement) {
            el = form.querySelector(
                'button[type="submit"], '
                + 'input[type="submit"], '
                + 'button:not([type])'
            );
        }
    }

    if (!(el instanceof Element)) {
        return;
    }

    const active = document.activeElement;

    if (active && isEditableInput(active)) {
        flushFinalInput(active);
    }

    el = normalizeClickTarget(el);
    el = findClickableAncestor(el);

    if (!(el instanceof Element)) {
        return;
    }

    const key = stableKeyFrom(el);

    if (
        lastClickKey === key &&
        (now - lastClickTs) < CLICK_DEDUP_MS
    ) {
        return;
    }

    lastClickKey = key;
    lastClickTs = now;

    sendAction(el, 'click');

    document.recorded_actions.push(['click', getBestSelector(el), '', now]);

    saveRecordedActions();
});

document.body.addEventListener('formdata', function () {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    var ra_len = document.recorded_actions.length;
    if (ra_len > 0 &&
        document.recorded_actions[ra_len - 1][0] === 'input' &&
        !document.recorded_actions[ra_len - 1][2].endsWith('\n')) {
        var selector = document.recorded_actions[ra_len - 1][1];
        var text = document.querySelector(selector).value + '\n';
        document.recorded_actions.pop();
        document.recorded_actions.push(['input', selector, text, d_now]);
        saveRecordedActions();
    }
});

document.body.addEventListener('dragstart', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    const el = findClickableAncestor(event.target);
    const selector = getBestSelector(el);
    var ra_len = document.recorded_actions.length;
    var rec_mode = sessionStorage.getItem('recorder_mode');
    if (rec_mode === '2' || rec_mode === '3') return;
    if (ra_len > 0 &&
        document.recorded_actions[ra_len - 1][0] === 'mo_dn' &&
        document.recorded_actions[ra_len - 1][1] === selector) {
        document.recorded_actions.pop();
    }
    if (el.draggable === true) {
        document.recorded_actions.push(['drags', selector, '', d_now]);
    }
    saveRecordedActions();
});

document.body.addEventListener('dragend', function () {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    var ra_len = document.recorded_actions.length;
    if (ra_len > 0 && document.recorded_actions[ra_len - 1][0] === 'drags') {
        document.recorded_actions.pop();
        saveRecordedActions();
    }
});

document.body.addEventListener('drop', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    const el = findClickableAncestor(event.target);
    const selector = getBestSelector(el);
    var ra_len = document.recorded_actions.length;
    if (ra_len > 0 && document.recorded_actions[ra_len - 1][0] === 'drags') {
        var drg_s = document.recorded_actions[ra_len - 1][1];
        document.recorded_actions.pop();
        document.recorded_actions.push(['ddrop', drg_s, selector, d_now]);
        saveRecordedActions();
    }
});

const lastCheckboxState = new Map();
const customCheckboxStateBeforeClick =
    new WeakMap();

document.body.addEventListener('change', function (event) {
    reset_if_recorder_undefined();

    if (sessionStorage.getItem('pause_recorder') === 'yes') {
        return;
    }

    const el = event.target;

    if (!(el instanceof Element)) {
        return;
    }

    const currentTag = el.tagName.toLowerCase();
    const currentType = (el.getAttribute('type') || '').toLowerCase();

    const selector = getEnhancedSelector(el);
    const now = Date.now();

    if (currentTag === 'select') {

        const selectedOption = el.options[el.selectedIndex];

        const selectedText = selectedOption
            ? selectedOption.text.trim()
            : '';

        const selectedValue = el.value || '';

        sendAction(el, 'select', {
            value: selectedText
                ? 'label=' + selectedText
                : 'value=' + selectedValue,
            selectedText: selectedText
        });

        document.recorded_actions.push([
            's_opt',
            selector,
            selectedText,
            now
        ]);

        saveRecordedActions();
        return;
    }

    if (currentTag === 'input' && currentType === 'checkbox') {
        const checked = Boolean(el.checked);
        const previousState = lastCheckboxState.get(selector);

        if (previousState === checked) {
            return;
        }

        lastCheckboxState.set(selector, checked);

        sendAction(el, checked ? 'check' : 'uncheck', {
            value: checked ? 'true' : 'false'
        });

        document.recorded_actions.push([
            'c_box',
            selector,
            checked ? 'yes' : 'no',
            now
        ]);

        saveRecordedActions();
        return;
    }

    if (currentTag === 'input' && currentType === 'radio') {
        sendAction(el, 'click', {
            value: el.value || ''
        });

        document.recorded_actions.push([
            'click',
            selector,
            el.value || '',
            now
        ]);

        saveRecordedActions();
        return;
    }

    if (currentTag === 'input' && currentType === 'range') {
        sendAction(el, 'change', {
            value: el.value || ''
        });

        document.recorded_actions.push([
            'set_v',
            selector,
            el.value || '',
            now
        ]);

        saveRecordedActions();
        return;
    }

    if (currentTag === 'input' && currentType === 'file') {
        sendAction(el, 'change', {
            value: el.value || ''
        });

        document.recorded_actions.push([
            'cho_f',
            selector,
            el.value || '',
            now
        ]);

        saveRecordedActions();
    }
});


document.body.addEventListener('mousedown', function (event) {
    reset_if_recorder_undefined();
    new_tab_on_new_origin();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    var el = findClickableAncestor(event.target);
    const selector = getBestSelector(el);
    var ra_len = document.recorded_actions.length;
    var rec_mode = sessionStorage.getItem('recorder_mode');
    var tag_name = tagName(el);

    if (rec_mode === '2' || rec_mode === '3') {
        el = turnIntoParentAsNeeded(el);
        var text = el.innerText;
        var t_con = el.textContent;
        var origin = window.location.origin;
        var sel_has_contains = selector.includes(':contains(');

        if (!text) text = '';
        text = text.trim();
        if (el.tagName.toLowerCase() === 'input') text = el.value.trim();
        if (!t_con) t_con = '';

        if (rec_mode === '2' || (
            rec_mode === '3' && sel_has_contains && text === t_con.trim())) {
            document.recorded_actions.push(['as_el', selector, origin, d_now]);
            saveRecordedActions();
            return;
        } else if (rec_mode === '3') {
            var action = 'as_et';
            var match = /\r|\n/.exec(text);
            if (match) {
                var lines = text.split(/\r\n|\r|\n/g);
                text = '';
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].length > 0) {
                        action = 'as_te';
                        text = lines[i];
                        break;
                    }
                }
            }
            var tex_sel = [text, selector];
            document.recorded_actions.push([action, tex_sel, origin, d_now]);
            saveRecordedActions();
            return;
        }
    }

    if (ra_len > 0 && document.recorded_actions[ra_len - 1][0] === 'mo_dn') {
        document.recorded_actions.pop();
    }

    if (tag_name === 'select') {
        // do nothing
    } else {
        document.recorded_actions.push(['mo_dn', selector, '', d_now]);
    }
    saveRecordedActions();
});

document.body.addEventListener('mouseup', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    document.recorder_last_mouseup = d_now;

    const el = findClickableAncestor(event.target);
    var selector = getBestSelector(el);
    var ra_len = document.recorded_actions.length;
    var tag_name = tagName(el);
    var parent_el = el.parentElement;
    var parent_tag_name = parent_el ? tagName(parent_el) : '';
    var grand_el = '';
    var grand_tag_name = '';
    var origin = '';
    var rec_mode = sessionStorage.getItem('recorder_mode');
    if (rec_mode === '2' || rec_mode === '3') return;

    if (parent_el && parent_el.parentElement != null) {
        grand_el = parent_el.parentElement;
        grand_tag_name = tagName(grand_el);
    }

    if (ra_len > 0 &&
        document.recorded_actions[ra_len - 1][1] === selector &&
        (document.recorded_actions[ra_len - 1][0] === 'mo_dn' ||
            tag_name === 'a' || parent_tag_name === 'a') && tag_name !== 'select') {

        var href = '';
        if (useHref(tag_name, el)) {
            href = el.href;
            origin = el.origin;
        } else if (parent_el && useHref(parent_tag_name, parent_el)) {
            href = parent_el.href;
            origin = parent_el.origin;
        } else if (grand_el && useHref(grand_tag_name, grand_el)) {
            href = grand_el.href;
            origin = grand_el.origin;
        }

        document.recorded_actions.pop();
        var child_count = ssOccurrences(selector, ' > ');

        if ((tag_name === 'a' && !el.hasAttribute('onclick') &&
                child_count > 0 && href.length > 0) ||
            (parent_tag_name === 'a' && href.length > 0 &&
                child_count > 1 && parent_el && !parent_el.hasAttribute('onclick')) ||
            (grand_tag_name === 'a' && href.length > 0 &&
                child_count > 2 && grand_el && !grand_el.hasAttribute('onclick'))) {

            var w_orig = window.location.origin;
            if (origin === w_orig)
                document.recorded_actions.push(['_url_', origin, href, d_now]);
            else
                document.recorded_actions.push(['begin', origin, href, d_now]);
        } else {
            document.recorded_actions.push(['click', selector, href, d_now]);
        }

        // hover+click
        if (el.parentElement &&
            el.parentElement.classList.contains('dropdown-content') &&
            el.parentElement.parentElement &&
            el.parentElement.parentElement.classList.contains('dropdown')) {

            var ch_s = selector;
            var pa_el = el.parentElement.parentElement;
            var pa_s = getBestSelector(pa_el);

            if (pa_el.childElementCount >= 2 &&
                !pa_el.firstElementChild.classList.contains('dropdown-content')) {
                pa_el = pa_el.firstElementChild;
                pa_s = getBestSelector(pa_el);
            }
            document.recorded_actions.pop();
            document.recorded_actions.push(['h_clk', pa_s, ch_s, d_now]);

        } else if (tag_name === 'canvas') {
            var rect = el.getBoundingClientRect();
            var p_x = event.clientX - rect.left;
            var p_y = event.clientY - rect.top;
            var c_offset = [selector, p_x, p_y];
            document.recorded_actions.pop();
            document.recorded_actions.push(['canva', c_offset, href, d_now]);
        }
    } else if (ra_len > 0 &&
        document.recorded_actions[ra_len - 1][0] === 'mo_dn' &&
        document.recorded_actions[ra_len - 1][1] === selector &&
        tag_name === 'select') {
        document.recorded_actions.pop();
    } else if (ra_len > 0 &&
        document.recorded_actions[ra_len - 1][0] === 'mo_dn') {
        document.recorded_actions.pop();
    }
    saveRecordedActions();
});

document.body.addEventListener(
    'contextmenu',
    function (event) {
        reset_if_recorder_undefined();

        if (sessionStorage.getItem('pause_recorder') === 'yes') {
            return;
        }
        event.preventDefault();
        let el = normalizeClickTarget(event.target);
        el = findClickableAncestor(el);

        if (!(el instanceof Element)) {
            return;
        }

        const selector = getEnhancedSelector(el);

        const lastAction =
            document.recorded_actions[
            document.recorded_actions.length - 1
                ];

        if (
            lastAction
            && lastAction[0] === 'mo_dn'
            && lastAction[1] === selector
        ) {
            document.recorded_actions.pop();
        }

        sendAction(el, 'contextmenu');
        document.recorded_actions.push(['contextmenu', selector, '', Date.now()]);
        saveRecordedActions();
        console.debug(
            '[Recorder] Context menu recorded',
            {element: el, selector: selector});
    },
    true
);

function scheduleFinalInput(el) {
    if (!isEditableInput(el)) return;
    if (el.hasAttribute('readonly')) return;

    const key = stableKeyFrom(el);
    const value = el.value;

    if (lastSentValue.get(key) === value) return;

    if (inputTimers.has(key)) clearTimeout(inputTimers.get(key));

    inputTimers.set(key, setTimeout(() => {
        flushFinalInput(el);
    }, INPUT_DEBOUNCE_MS));
}

function flushFinalInput(el) {
    if (!isEditableInput(el)) return;
    if (el.hasAttribute('readonly')) return;

    const key = stableKeyFrom(el);

    if (inputTimers.has(key)) {
        clearTimeout(inputTimers.get(key));
        inputTimers.delete(key);
    }

    const value = el.value;
    if (lastSentValue.get(key) === value) return;
    sendAction(el, 'keyup', {value});
    lastSentValue.set(key, value);
}


document.addEventListener('input', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = findClickableAncestor(event.target);
    if (!(el instanceof Element)) return;
    scheduleFinalInput(el);
}, true);


document.addEventListener('blur', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const el = findClickableAncestor(event.target);
    if (!(el instanceof Element)) return;
    flushFinalInput(el);
}, true);


document.body.addEventListener('keydown', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = findClickableAncestor(event.target);
    if (!(el instanceof Element)) return;

    const l_key = (event.key || '').toLowerCase();
    if (l_key === 'enter' && isEditableInput(el)) {
        flushFinalInput(el);
    }


});

/* ======================== KEYUP======================== */
document.body.addEventListener('keyup', function (event) {
    reset_if_recorder_undefined();

    // pause+resume controls
    var pause_rec = sessionStorage.getItem('pause_recorder');
    var rec_mode = sessionStorage.getItem('recorder_mode');
    var l_key = (event.key || '').toLowerCase();
    var no_border = 'none';

    if (l_key === 'escape' && pause_rec === 'no' && rec_mode === '1') {
        sessionStorage.setItem('pause_recorder', 'yes');
        pause_rec = 'yes';
        console.log('Recorder paused');
        document.querySelector('body').style.border = no_border;
        document.title = sessionStorage.getItem('recorder_title');
    } else if ((event.key === '`' || event.key === '~') && pause_rec === 'yes') {
        sessionStorage.setItem('pause_recorder', 'no');
        pause_rec = 'no';
        console.log('Recorder resumed');
        set_border('#F43344');
    } else if (event.key === '^' && pause_rec === 'no') {
        sessionStorage.setItem('recorder_mode', '2');
        set_border('#EF5BE9');
    } else if (event.key === '&' && pause_rec === 'no') {
        sessionStorage.setItem('recorder_mode', '3');
        set_border('#30C6C6');
    } else if (pause_rec === 'no' && l_key !== 'shift' && l_key !== 'backspace') {
        sessionStorage.setItem('recorder_mode', '1');
        set_border('#F43344');
    }

    // after switching modes
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const d_now = Date.now();
    const el = findClickableAncestor(event.target);
    if (!(el instanceof Element)) return;

    const selector = getBestSelector(el);
    var skip_input = false;

    if ((tagName(el) === 'input' &&
            el.type !== 'checkbox' &&
            el.type !== 'range') ||
        tagName(el) === 'textarea') {

        var ra_len = document.recorded_actions.length;

        if (ra_len > 0 && l_key === 'enter' &&
            document.recorded_actions[ra_len - 1][0] === 'input' &&
            document.recorded_actions[ra_len - 1][1] === selector &&
            !document.recorded_actions[ra_len - 1][2].endsWith('\n')) {

            var s_text = document.recorded_actions[ra_len - 1][2] + '\n';
            document.recorded_actions.pop();
            document.recorded_actions.push(['input', selector, s_text, d_now]);
            document.recorded_actions.push(['submi', selector, s_text, d_now]);
            skip_input = true;

        } else if (ra_len > 0 &&
            document.recorded_actions[ra_len - 1][0] === 'click' &&
            document.recorded_actions[ra_len - 1][1] === selector) {

            document.recorded_actions.pop();

        } else if (ra_len > 0 &&
            document.recorded_actions[ra_len - 1][0] === 'input' &&
            document.recorded_actions[ra_len - 1][1] === selector &&
            !document.recorded_actions[ra_len - 1][2].endsWith('\n') &&
            l_key !== 'tab') {

            document.recorded_actions.pop();

        } else if (ra_len > 0 &&
            document.recorded_actions[ra_len - 1][0] === 'input' &&
            document.recorded_actions[ra_len - 1][1] === selector &&
            document.recorded_actions[ra_len - 1][2].endsWith('\n')) {

            skip_input = true;
        }

        if (!skip_input && !el.hasAttribute('readonly') && l_key !== 'tab') {
            document.recorded_actions.push(['input', selector, el.value, d_now]);
        }
    }

    saveRecordedActions();
});

/* ======================== DETECTION PAGE CHANGEMENT ======================== */

if (
    window === window.top
    && !window.__seleniumRobotPageDetectionInstalled
) {
    window.__seleniumRobotPageDetectionInstalled = true;

    let lastPageUrl = null;
    let pageEventTimer = null;

    const sendPageEvent = function (reason) {
        const currentUrl = window.location.href;

        if (currentUrl === lastPageUrl) {
            return;
        }

        lastPageUrl = currentUrl;
        window.clearTimeout(pageEventTimer);

        pageEventTimer = window.setTimeout(function () {
            sendToServer({
                command: 'pageLoad',
                reason: reason,
                url: currentUrl,
                title: document.title || '',
                timestamp: Date.now(),
                framePath: []
            });
        }, 150);
    };

    const initializePageDetection = function () {
        sendPageEvent('load');

        window.addEventListener(
            'popstate',
            function () {
                sendPageEvent('popstate');
            }
        );

        window.addEventListener(
            'hashchange',
            function () {
                sendPageEvent('hashchange');
            }
        );

        const pageMonitoringInterval = window.setInterval(
            function () {
                sendPageEvent('spa');
            },
            500
        );

        window.addEventListener(
            'pagehide',
            function () {
                window.clearInterval(
                    pageMonitoringInterval
                );
            },
            {
                once: true
            }
        );
    };

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initializePageDetection,
            {
                once: true
            }
        );
    } else {
        initializePageDetection();
    }
}

set_border('#F43344');