var cssPathById = function (el) {
    if (!(el instanceof Element)) return;
    var path = [];
    while (el != null && el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        if (el.id) {
            var elid = el.id;

            // if id not safe in CSS -> fallback attribut [id="..."]
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
            getSearchRoot(el).querySelectorAll(selector + '.' + el.getAttribute('class')).length === 1) {
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

/**
 * Normalize click target to avoid :
 *  - Clicked IMG: move up to ancestor <a href="..."> (real link)
 *  - LABEL / SPAN inside a LABEL: move up to associated <input> (radio/checkbox)
 *  - Icons (<svg>, <path>, <i>, <span> "cosmetic"): move up to button/link
 *  - Styled accessible Divs: respect role="button"/"link" and onclick
 *  - Otherwise: move up to clickable container (a, button, input[type=button|submit], role)
 *
 * Returns the Element that SHOULD be “clicked” functionally.
 */
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
        if (next && next instanceof Element && next.tagName === 'INPUT' && (next.type === 'radio' || next.type === 'checkbox')) {
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

function isFileInput(el) {
    return el instanceof Element
        && el.tagName === 'INPUT'
        && (el.getAttribute('type') || '').toLowerCase() === 'file';
}

// Returns the <input type="file"> opened by a click on `el` (the input itself or a label bound to it), else null
function getFileInputForClick(el) {
    if (isFileInput(el)) return el;
    const label = el instanceof Element ? el.closest('label') : null;
    return label && isFileInput(label.control) ? label.control : null;
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

function getFrameElementSelector(frameElement) {
    if (!(frameElement instanceof Element)) {
        return null;
    }

    const ownerDocument = frameElement.ownerDocument;

    if (frameElement.id && !isDynamicId(frameElement.id)
    ) {
        const idSelector = safeCssIdSelector(frameElement.id);

        try {
            const matches = ownerDocument.querySelectorAll(idSelector);

            if (matches.length === 1 && matches[0] === frameElement) {
                return idSelector;
            }
        } catch (error) {
            console.warn('[Recorder] Invalid frame ID selector', error);
        }
    }

    const frameName = frameElement.getAttribute('name');
    if (frameName) {
        const nameSelector = 'iframe[name="' + escapeCssAttribute(frameName) + '"]';
        try {
            const matches = ownerDocument.querySelectorAll(nameSelector);

            if (matches.length === 1 && matches[0] === frameElement) {
                return nameSelector;
            }
        } catch (error) {
            console.warn('[Recorder] Invalid frame name selector', error);
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
            console.warn('[Recorder] Invalid frame title selector', error);
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
            all_by_attr[i] = getSearchRoot(el).querySelectorAll(selector_by_attr[i]);
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
        var d_qsa = getSearchRoot(el).querySelectorAll(basic_tags[b]);
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
        if (getSearchRoot(el).querySelector(selector) === el) best_selector = selector;
    } catch (e) {
        // ignore
    }
    return best_selector;
};

/* ======================== SHADOW DOM ======================== */

// A listener placed on document.body sees event.target "retargeted" on the shadow DOM host ;
// composedPath()[0] gives the actually targeted element (only open shadow roots).
function getEventTarget(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.length > 0 && path[0] instanceof Element) {
        return path[0];
    }
    return event.target;
}

// root of element search : document or shadow root that contains it
function getSearchRoot(el) {
    const root = el && typeof el.getRootNode === 'function' ? el.getRootNode() : document;
    return root && typeof root.querySelectorAll === 'function' ? root : document;
}

function isInShadowDom(el) {
    return el instanceof Element && el.getRootNode() instanceof ShadowRoot;
}

function getShadowHostSelector(host) {
    if (host.id && !isDynamicId(host.id)) {
        const idSelector = safeCssIdSelector(host.id);
        if (idSelector && isUniqueCssSelector(idSelector, host)) {
            return idSelector;
        }
    }
    const tag = host.tagName.toLowerCase();
    if (isUniqueCssSelector(tag, host)) {
        return tag;
    }
    return cssPathById(host);
}

// CSS selector for hosts to traverse, from the outermost to the innermost (nested shadow DOMs)
function getShadowPath(el) {
    const path = [];
    let root = el.getRootNode();
    while (root instanceof ShadowRoot) {
        path.unshift(getShadowHostSelector(root.host));
        root = root.host.getRootNode();
    }
    return path;
}

function isUniqueCssSelector(selector, expectedElement) {
    if (!selector || !(expectedElement instanceof Element)) {
        return false;
    }

    try {
        const matches = getSearchRoot(expectedElement).querySelectorAll(selector);

        return matches.length === 1 && matches[0] === expectedElement;
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
        const selector = `${tag}[formcontrolname="${escapeCssAttribute(formControlName)}"]`;

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
        const selector = `[aria-labelledby="${escapeCssAttribute(ariaLabelledBy)}"]`;

        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    const placeholder = el.getAttribute('placeholder');

    if (placeholder) {
        const selector = `${tag}[placeholder="${escapeCssAttribute(placeholder)}"]`;
        if (isUniqueCssSelector(selector, el)) {
            return selector;
        }
    }

    if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
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


/**
 * Checks whether an XPath identifies only the expected element.
 *
 * @param {string} xpath XPath to verify.
 * @param {Element} expectedElement Expected element.
 * @returns {boolean} true when the XPath is unique.
 */
function isUniqueXPath(xpath, expectedElement) {
    if (!xpath || !(expectedElement instanceof Element) || isInShadowDom(expectedElement)) {
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
        console.warn('[Recorder] Invalid XPath', {xpath: xpath, element: expectedElement, error: error}
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

        if (isUniqueXPath(dataXPath, el)
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

    if (el.tagName.toLowerCase() === 'a' && href && !href.startsWith('javascript:')
    ) {
        const hrefXPath = '//a[@href=' + toXPathLiteral(href) + ']';
        if (isUniqueXPath(hrefXPath, el)) {
            return hrefXPath;
        }
    }
    const text = normalizeRecorderText(el.textContent || '');
    if (text && text.length <= 40 && !isLikelyDynamicText(text)
    ) {
        const textXPath = '//' + el.tagName.toLowerCase() + '[normalize-space(.)=' + toXPathLiteral(text) + ']';
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
    return (tag_name === 'a' && el.hasAttribute('href') && el.getAttribute('href').length > 0 && el.origin !== 'null');
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

        /*
         * Stop at next HTML element
         * for example <br> or another tag.
         */
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
    const checkboxes = Array.from(parent.querySelectorAll('input[type="checkbox"]'));

    const index = checkboxes.indexOf(el);

    if (index < 0) {
        return null;
    }

    const parentTag = parent.tagName.toLowerCase();
    const escapedParentId = parent.id.replace(/'/g, '\\\'');
    return '//' + parentTag + '[@id=\'' + escapedParentId + '\']/input[@type=\'checkbox\'][' + (index + 1) + ']';
}


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
            targets.push([attributeName, attributeValue]);
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
    if (!(el instanceof Element) || !normalizedText || normalizedText.length > 80) {
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
        targets.push(['uniqueElementText', normalizedText]);
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
