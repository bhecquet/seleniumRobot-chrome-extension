/* ======================== SELECTORS ======================== */

var cssPathById = function (el) {
    if (!(el instanceof Element)) return;
    var path = [];
    while (el != null && el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        if (el.id) {
            var elid = el.id;

            // Si id non safe en CSS -> fallback attribut [id="..."]
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

function isGen(str) {
    return /[_-]\d/.test(str) || /\d[a-z]/.test(str);
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

/* ======================== ENVOI SERVEUR ======================== */

function sendToServer(actionData) {
    fetch('http://localhost:5222/event', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(actionData)
    })
        .then(response => response.text())
        .then(data => console.log('Action envoyée au serveur Jetty :', actionData.command, data))
        .catch(error => console.error('Erreur d\'envoi :', error));
}

/*========================= HIERARCHIE DES IFRAMES ===============================*/


function getFramePath() {
    let path = [];
    let frame = window.frameElement;

    while (frame) {

        path.unshift({
            id: frame.id || null,
            name: frame.name || null,
            title: frame.title || null,
            selector: getBestSelector(frame)
        });

        // Remonter au parent
        frame = frame.ownerDocument.defaultView.frameElement;
    }

    return path;
}


/* ======================== BEST SELECTOR ======================== */

var getBestSelector = function (el) {
    if (!(el instanceof Element)) return;
    el = turnIntoParentAsNeeded(el);

    var sel_by_id = cssPathById(el) || '';
    // si id direct et non généré => bon
    if (sel_by_id && !sel_by_id.includes(' > ') && !isGen(sel_by_id)) return sel_by_id;

    var child_count_by_id = sel_by_id ? ssOccurrences(sel_by_id, ' > ') : 999;
    var selector_by_class = cssPathByClass(el) || '';
    var tag_name = tagName(el);

    var non_id_attributes = [];
    non_id_attributes.push('name');
    non_id_attributes.push('data-qa');
    non_id_attributes.push('data-tid');
    non_id_attributes.push('data-el');
    non_id_attributes.push('data-se');
    non_id_attributes.push('data-name');
    non_id_attributes.push('data-auto');
    non_id_attributes.push('data-text');
    non_id_attributes.push('data-test');
    non_id_attributes.push('data-testid');
    non_id_attributes.push('data-test-id');
    non_id_attributes.push('data-test-selector');
    non_id_attributes.push('data-nav');
    non_id_attributes.push('data-sb');
    non_id_attributes.push('data-cy');
    non_id_attributes.push('data-action');
    non_id_attributes.push('data-target');
    non_id_attributes.push('data-tooltip');
    non_id_attributes.push('alt');
    non_id_attributes.push('title');
    non_id_attributes.push('heading');
    non_id_attributes.push('translate');
    non_id_attributes.push('aria-label');
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
    non_id_attributes.push('placeholder');
    non_id_attributes.push('value');
    non_id_attributes.push('ng-click');
    non_id_attributes.push('ng-if');
    non_id_attributes.push('src');

    var selector_by_attr = [];
    var all_by_attr = [];
    var num_by_attr = [];
    var child_count_by_attr = [];

    // 1) attribut unique court => direct
    for (var i = 0; i < non_id_attributes.length; i++) {
        var n_i_attr = non_id_attributes[i];
        selector_by_attr[i] = null;

        if (n_i_attr === 'class') selector_by_attr[i] = selector_by_class;
        else selector_by_attr[i] = cssPathByAttribute(el, n_i_attr);

        if (!selector_by_attr[i]) continue;

        try {
            all_by_attr[i] = document.querySelectorAll(selector_by_attr[i]);
        } catch (e) {
            // selector invalide => on ignore
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

    // tags de base uniques
    var basic_tags = ['h1', 'h2', 'h3', 'canvas', 'center', 'input', 'textarea'];
    for (var b = 0; b < basic_tags.length; b++) {
        var d_qsa = document.querySelectorAll(basic_tags[b]);
        if (tag_name === basic_tags[b] && d_qsa.length === 1 && el === d_qsa[0]) return basic_tags[b];
    }

    //  IMPORTANT : on ne renvoie plus :contains() car PAS CSS standard


    //  sinon choisir le selector le plus court (moins de niveaux)
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

    // tentative de simplification (sans casser)
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
    // CSS.escape si dispo
    if (window.CSS && typeof window.CSS.escape === 'function') {
        return `#${CSS.escape(id)}`;
    }
    // fallback si caractères spéciaux
    if (/\s/.test(id) || id.includes(',') || id.includes('.') || id.includes('(') || id.includes(':')) {
        return null;
    }
    return `#${id}`;
}

function getEnhancedSelector(el) {
    el = turnIntoParentAsNeeded(el);

    if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;

    if (el.id) {
        var idSel = safeCssIdSelector(el.id);
        if (idSel) return idSel;
        return cssPathByAttribute(el, 'id'); // fallback safe
    }

    if (el.getAttribute('name')) return `${tagName(el)}[name="${el.getAttribute('name').replaceAll('"', '\\"')}"]`;
    if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label').replaceAll('"', '\\"')}"]`;

    return getBestSelector(el);
}

function getEnhancedXPath(el) {
    el = turnIntoParentAsNeeded(el);

    if (el.getAttribute('data-testid')) {
        return `//*[@data-testid='${el.getAttribute('data-testid').replaceAll('\'', '\\\'')}']`;
    }
    if (el.id) {
        return `//*[@id='${el.id.replaceAll('\'', '\\\'')}']`;
    }
    if (el.getAttribute('aria-label')) {
        return `//*[@aria-label='${el.getAttribute('aria-label').replaceAll('\'', '\\\'')}']`;
    }

    const text = (el.textContent || '').trim();
    if (text && text.length < 50 && !text.includes('\n')) {
        return `//*[normalize-space(.)='${text.replaceAll('\'', '\\\'')}']`;
    }

    let parts = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && el.tagName.toLowerCase() !== 'html') {
        let tag = el.tagName.toLowerCase();
        let siblings = Array.from(el.parentNode.children).filter(e => e.tagName === el.tagName);
        let part = tag;
        if (siblings.length > 1) {
            let index = siblings.indexOf(el) + 1;
            part += `[${index}]`;
        }
        parts.unshift(part);
        el = el.parentNode;
        if (el && el.tagName && el.tagName.toLowerCase() === 'body') break;
    }
    return `//${parts.join('/')}`;
}


/* ======================== AUTRES (TON CODE) ======================== */

function useHref(tag_name, el) {
    return (tag_name === 'a' && el.hasAttribute('href') &&
        el.getAttribute('href').length > 0 && el.origin !== 'null');
}

function saveRecordedActions() {
    var json_rec_act = JSON.stringify(document.recorded_actions);
    sessionStorage.setItem('recorded_actions', json_rec_act);
}

// (on garde ta logique new_tab_on_new_origin telle quelle)
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

// keep these blocks (as is)
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


/* ======================== PHASE 1: NAMING + DEDUP + INPUT CONSOLIDATION ======================== */

// Dédup click (évite double click enregistré)
const CLICK_DEDUP_MS = 350;
let lastClickKey = null;
let lastClickTs = 0;

// Debounce input (évite keyup lettre par lettre)
const INPUT_DEBOUNCE_MS = 400;
const inputTimers = new Map();  // key -> timeoutId
const lastSentValue = new Map();// key -> last value sent

function simpleHash(str) {
    // hash stable simple (suffisant pour suffix 6 chars)
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
}

function sanitizeJavaName(name) {
    let n = (name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    n = n.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!n) n = 'element';
    if (/^[0-9]/.test(n)) n = 'e_' + n;
    if (n.length > 40) n = n.substring(0, 40);
    return n;
}

function stableKeyFrom(el) {
    // clé stable basée sur CSS selector prioritaire
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


/* ======================== BUILD ACTION DATA (FIABILISÉ) ======================== */

function buildActionData(el, command) {
    el = turnIntoParentAsNeeded(el);

    const targets = [];

    // Cibles "humaines" (ton plugin peut les exploiter si tu veux)
    if (el.id) targets.push(['id', el.id]);
    if (el.getAttribute('name')) targets.push(['name', el.getAttribute('name')]);

    if (el.tagName.toLowerCase() === 'a' && el.textContent.trim()) {
        targets.push(['linkText', el.textContent.trim()]);
    }
    if (el.getAttribute('aria-label')) {
        targets.push(['ariaLabel', el.getAttribute('aria-label')]);
    }
    if (el.getAttribute('role')) {
        targets.push(['role', el.getAttribute('role')]);
    }
    if ((el.tagName.toLowerCase() === 'button' || el.type === 'button') && el.textContent.trim()) {
        targets.push(['buttonText', el.textContent.trim()]);
    }
    if (el.getAttribute('data-testid')) {
        targets.push(['data-testid', el.getAttribute('data-testid')]);
    }

    const css = getEnhancedSelector(el);
    const xpath = getEnhancedXPath(el);
    targets.push(['css', css]);
    targets.push(['xpath', xpath]);

    // elementName amélioré: base + suffix hash du locator => plus de collisions
    const base =
        el.getAttribute('data-testid') ||
        (el.id && !isGen(el.id) ? el.id : null) ||
        el.getAttribute('name') ||
        el.getAttribute('aria-label') ||
        `${command}Element`;

    const key = stableKeyFrom(el);
    const suffix = simpleHash(key).substring(0, 6);
    const elementName = sanitizeJavaName(base) + '_' + suffix;

    return {
        elementName: elementName,
        stableKey: key,              // bonus (si plugin veut dédup)
        command: command,
        tagName: el.tagName.toLowerCase(),
        text: el.textContent.trim() || '',
        attributes: {
            id: el.id || '',
            name: el.getAttribute('name') || '',
            role: el.getAttribute('role') || '',
            ariaLabel: el.getAttribute('aria-label') || '',
            dataTestid: el.getAttribute('data-testid') || '',
            type: el.getAttribute('type') || '',
            href: el.getAttribute('href') || '',
            dataContent: el.getAttribute('data-content') || ''
        },
        targets: targets,
        value: el.value || '',
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
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

            // Si l’iframe a un src non data -> on ouvre comme avant (si c’est votre convention)
            if (el.hasAttribute('src') && el.getAttribute('src').length > 0) {
                if (el.src.startsWith('data:')) return;
                skip_open = true;
                window.open(el.src, '_blank');
            } else {
                // NE PAS remplacer le body !
                // On essaie d'instrumenter l'iframe si même origine
                try {
                    attachRecorderToIframe(el);
                } catch (e) {
                    // si cross-origin ou échec, on ignore
                }
            }

            // On enregistre l’entrée dans l’iframe
            document.recorded_actions.push(['sw_fr', selector, origin, now]);

            // Si on a ouvert, on marque le skip focus (comportement existant)
            if (skip_open) {
                document.recorded_actions.push(['sk_fo', '', origin, now + 1]);
            }

            saveRecordedActions();

            // Ajouter un listener one-shot pour détecter le retour au parent et pousser fr_root
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


/**** action iframe path******/

function sendAction(el, command, extra = {}) {
    const framePath = getFramePath();
    const base = buildActionData(el, command);
    sendToServer({...base, framePath, ...extra});
}


/* -------- CLICK : dédoublonnage + envoi serveur (compatible plugin) -------- */
document.body.addEventListener('click', function (event) {
    const el = turnIntoParentAsNeeded(event.target);
    if (!(el instanceof Element)) return;

    // pause?
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const key = stableKeyFrom(el);
    const t = Date.now();
    if (lastClickKey === key && (t - lastClickTs) < CLICK_DEDUP_MS) {
        return;
    }
    lastClickKey = key;
    lastClickTs = t;

    const framePath = getFramePath();

    //const actionData = buildActionData(el, 'click');

    const actionData = {
        ...buildActionData(el, 'click'),
        framePath: framePath
    };

    sendToServer(actionData);
    // console.log('CLICK FRAME PATH =', framePath);
    document.recorded_actions.push(['click', getBestSelector(el), el.href || '', t]);
    saveRecordedActions();
});


/* -------- DBLCLICK : corrige "dbclick" -> "dblclick" -------- */
document.body.addEventListener('dblclick', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = turnIntoParentAsNeeded(event.target);
    const selector = getBestSelector(el);
    const d_now = Date.now();

    const actionData = buildActionData(el, 'dblclick');
    sendToServer(actionData);

    document.recorded_actions.push(['dblclick', selector, '', d_now]);
    saveRecordedActions();
});


/* -------- SUBMIT : garde ta logique + flush input final si besoin -------- */
document.body.addEventListener('submit', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = event.target;
    const d_now = Date.now();

    // Flush input actif (si editable) avant submit
    const active = document.activeElement;
    if (active && isEditableInput(active)) {
        flushFinalInput(active);
    }

    const actionData = buildActionData(el, 'click'); // tu avais 'click' ici, on garde pour compat plugin
    sendToServer(actionData);

    // Enregistrement local
    const ra_len = document.recorded_actions.length;
    if (ra_len > 0 &&
        document.recorded_actions[ra_len - 1][0] === 'input' &&
        !document.recorded_actions[ra_len - 1][2].endsWith('\n')) {
        const lastSelector = document.recorded_actions[ra_len - 1][1];
        const lastText = document.recorded_actions[ra_len - 1][2] + '\n';
        document.recorded_actions.pop();
        document.recorded_actions.push(['input', lastSelector, lastText, d_now]);
        saveRecordedActions();
    }
});


/* -------- FORM DATA : garde ton code -------- */
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


/* -------- DRAG/DROP : garde ton code -------- */
document.body.addEventListener('dragstart', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    const el = event.target;
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
    const el = event.target;
    const selector = getBestSelector(el);
    var ra_len = document.recorded_actions.length;
    if (ra_len > 0 && document.recorded_actions[ra_len - 1][0] === 'drags') {
        var drg_s = document.recorded_actions[ra_len - 1][1];
        document.recorded_actions.pop();
        document.recorded_actions.push(['ddrop', drg_s, selector, d_now]);
        saveRecordedActions();
    }
});


/* -------- CHANGE : on ajoute ENVOI serveur pour select/checkbox + fix France value="" -------- */
document.body.addEventListener('change', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const d_now = Date.now();
    const el = event.target;
    const selector = getBestSelector(el);
    var ra_len = document.recorded_actions.length;
    var tag_name = tagName(el);
    var e_type = el.type;

    if (tag_name === 'select') {
        var el_computed = document.querySelector(selector);
        var opt = el_computed.options[el_computed.selectedIndex];
        var optText = opt ? opt.text : '';
        var optValue = el_computed.value;

        // Envoi serveur compatible plugin: command "change"
        sendAction(el, 'change', {
            value: (optValue && optValue.length > 0) ? optValue : optText,
            selectedText: optText
        });

        // Local
        document.recorded_actions.push(['s_opt', selector, optText, d_now]);
        saveRecordedActions();
        return;
    }

    // checkbox
    if (tag_name === 'input' && e_type === 'checkbox') {
        sendAction(el, 'change', {value: el.checked ? 'yes' : 'no'});

        // Local
        if (ra_len > 0 &&
            document.recorded_actions[ra_len - 1][1] === selector) {
            document.recorded_actions.pop();
        }
        document.recorded_actions.push(['c_box', selector, el.checked ? 'yes' : 'no', d_now]);
        saveRecordedActions();
        return;
    }

    // range / file (garde ton comportement local)
    if (tag_name === 'input' && e_type === 'range') {
        if (ra_len > 0 && document.recorded_actions[ra_len - 1][1] === selector) {
            document.recorded_actions.pop();
            ra_len = document.recorded_actions.length;
        }
        var value = el.value;
        document.recorded_actions.push(['set_v', selector, value, d_now]);
    } else if (tag_name === 'input' && e_type === 'file') {
        if (ra_len > 0 && document.recorded_actions[ra_len - 1][1] === selector) {
            document.recorded_actions.pop();
            ra_len = document.recorded_actions.length;
        }
        var value2 = el.value;
        document.recorded_actions.push(['cho_f', selector, value2, d_now]);
    }

    saveRecordedActions();
});


/* -------- MOUSEDOWN/MOUSEUP/CONTEXTMENU : garde ton code tel quel -------- */
document.body.addEventListener('mousedown', function (event) {
    reset_if_recorder_undefined();
    new_tab_on_new_origin();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    var el = event.target;
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

    const el = event.target;
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

document.body.addEventListener('contextmenu', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const el = event.target;
    const selector = getBestSelector(el);
    var ra_len = document.recorded_actions.length;
    if (ra_len > 0 &&
        document.recorded_actions[ra_len - 1][0] === 'mo_dn' &&
        document.recorded_actions[ra_len - 1][1] === selector) {
        document.recorded_actions.pop();
        saveRecordedActions();
    }
});


/* ======================== PHASE 1 INPUT: 1 SEUL EVENT PAR SAISIE ======================== */

// On ne veut PLUS envoyer au serveur "keyup" à chaque lettre.
// => On envoie 1 seul "keyup" consolidé (compatible plugin) via input + blur + Enter.

function scheduleFinalInput(el) {
    if (!isEditableInput(el)) return;
    if (el.hasAttribute('readonly')) return;

    const key = stableKeyFrom(el);
    const value = el.value;

    // pas de spam si inchangé
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


// écoute sur input (plus fiable que keyup)
document.addEventListener('input', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = event.target;
    if (!(el instanceof Element)) return;
    scheduleFinalInput(el);
}, true);

// blur ne bubble pas => capture true
document.addEventListener('blur', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = event.target;
    if (!(el instanceof Element)) return;
    flushFinalInput(el);
}, true);
document.body.addEventListener('change', function (event) {
    const el = event.target;
    if (!el) return;

    if (el.tagName.toLowerCase() === 'select') {
        const actionData = buildActionData(el, 'select');
        actionData.value = el.value;

        const selected = el.options[el.selectedIndex];
        actionData.selectedText = selected ? selected.text : '';

        sendToServer(actionData);
    }
});

/* ======================== KEYDOWN: Enter -> flush input (évite sendKeys partiels) ======================== */
document.body.addEventListener('keydown', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = event.target;
    if (!(el instanceof Element)) return;

    const l_key = (event.key || '').toLowerCase();
    if (l_key === 'enter' && isEditableInput(el)) {
        flushFinalInput(el);
    }

    // On SUPPRIME l'envoi "keydown" au serveur pour éviter doublons / commands inconnues plugin.
});


/* ======================== KEYUP: on garde UNIQUEMENT la partie pause/resume + local record ======================== */
document.body.addEventListener('keyup', function (event) {
    reset_if_recorder_undefined();

    // pause+resume controls (ton code)
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

    // Ton ancien enregistrement local input (on le garde),
    // MAIS on n'envoie PLUS au serveur ici.
    const d_now = Date.now();
    const el = event.target;
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


/* ======================== FINAL ======================== */
set_border('#F43344');