document.documentElement.setAttribute('data-recorder-loaded', 'true');

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

    // tag relevance
    const tag = el.tagName;
    if (tag === 'BUTTON') return 650;
    if (tag === 'A') return 640;
    if (tag === 'INPUT') return 630;

    // penalize containers
    if (tag === 'FORM') return 100;
    if (tag === 'DIV' || tag === 'SECTION' || tag === 'MAIN') return 150;

    return 300;
};


function isEditableInput(el) {
    if (!el || !(el instanceof Element)) return false;
    var t = tagName(el);
    if (t === 'textarea') return true;
    if (t !== 'input') return false;
    var type = (el.getAttribute('type') || 'text').toLowerCase();
    return !['checkbox', 'radio', 'range', 'file', 'button', 'submit', 'reset'].includes(type);
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

                // instrument iframe if origin is the same
                try {
                    attachRecorderToIframe(el);
                } catch (e) {
                    // if cross-origin or failure, ignore
                }
            }

            document.recorded_actions.push(['sw_fr', selector, origin, now]);

            if (skip_open) {
                document.recorded_actions.push(['sk_fo', '', origin, now + 1]);
            }

            saveRecordedActions();

            // Add a one-shot listener to detect return to parent and push fr_root
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

document.addEventListener('pointerdown',
    function (event) {
        const target =
            getEventTarget(event);
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

    const rawTarget = getEventTarget(event);

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
        // 'change' is not fired when a radio is already selected, so radios are recorded on 'click'
        if (rawTag === 'input' && rawType === 'radio') {
            const now = Date.now();
            sendAction(rawTarget, 'click', {value: rawTarget.value || ''});
            document.recorded_actions.push([
                'click',
                getEnhancedSelector(rawTarget),
                rawTarget.value || '',
                now
            ]);
            saveRecordedActions();
        }
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
        clickTs: now,
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

        // real click time, not the debounced send time
        sendAction(el2, 'click', {timestamp: localPendingClick.clickTs});

        document.recorded_actions.push([
            'click',
            getBestSelector(el2),
            el2.href || '',
            localPendingClick.clickTs
        ]);

        saveRecordedActions();
        pendingClick = null;
    }, PENDING_CLICK_MS);
});

document.body.addEventListener('dblclick', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    let el = normalizeClickTarget(getEventTarget(event));  // MMA : labels, images
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
        const form = getEventTarget(event);

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
    const el = findClickableAncestor(getEventTarget(event));
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
    const el = findClickableAncestor(getEventTarget(event));
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

    const el = getEventTarget(event);

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

    // radios are recorded on 'click'
    if (currentTag === 'input' && currentType === 'radio') {
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

/* -------- MOUSEDOWN/MOUSEUP/CONTEXTMENU  -------- */
document.body.addEventListener('mousedown', function (event) {
    reset_if_recorder_undefined();
    new_tab_on_new_origin();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const d_now = Date.now();
    var el = findClickableAncestor(getEventTarget(event));
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

    const el = findClickableAncestor(getEventTarget(event));
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
        let el = normalizeClickTarget(getEventTarget(event));
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

// listen on input (more reliable than keyup)
document.addEventListener('input', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = findClickableAncestor(getEventTarget(event));
    if (!(el instanceof Element)) return;
    scheduleFinalInput(el);
}, true);

// blur does not bubble => capture true
document.addEventListener('blur', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;
    const el = findClickableAncestor(getEventTarget(event));
    if (!(el instanceof Element)) return;
    flushFinalInput(el);
}, true);

/* ======================== KEYDOWN ======================== */
document.body.addEventListener('keydown', function (event) {
    reset_if_recorder_undefined();
    if (sessionStorage.getItem('pause_recorder') === 'yes') return;

    const el = findClickableAncestor(getEventTarget(event));
    if (!(el instanceof Element)) return;

    const l_key = (event.key || '').toLowerCase();
    if (l_key === 'enter' && isEditableInput(el)) {
        flushFinalInput(el);
    }


});

/* ======================== KEYUP: we keep ONLY the pause/resume part + local record ======================== */
document.body.addEventListener('keyup', function (event) {
    reset_if_recorder_undefined();


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
    const el = findClickableAncestor(getEventTarget(event));
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

/* ======================== VERIFY (sr-verify) ======================== */
// The agent marks an element to check without clicking or changing the page:
//   el.setAttribute('data-sr-verify', 'business name');
//   el.dispatchEvent(new CustomEvent('sr-verify', {bubbles: true}));
// The element is the event target, so nothing has to cross the isolated world.

if (!window.__seleniumRobotVerifyInstalled) {
    window.__seleniumRobotVerifyInstalled = true;

    const visibleText = function (el) {
        return normalizeRecorderText(el.innerText || el.textContent || '');
    };

    const observedValue = function (el) {
        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute('type') || '').toLowerCase();
        if (tag === 'select') {
            return el.selectedOptions.length ? normalizeRecorderText(el.selectedOptions[0].text) : '';
        }
        if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
            return String(el.checked);
        }
        if (tag === 'input' || tag === 'textarea') {
            return el.value || '';
        }
        return visibleText(el);
    };

    // <td>label</td><td>value</td>, <dt>/<dd>, <h2>/<input>... : value is the element right after its label
    const labelForwardTarget = function (el) {
        const label = el.previousElementSibling;
        if (!label) {
            return null;
        }
        const labelText = visibleText(label);
        if (!labelText || labelText.length > 60 || label.querySelector('input,select,textarea,button')) {
            return null;
        }
        const tag = el.tagName.toLowerCase();
        const labelTag = label.tagName.toLowerCase();
        const sameLabels = Array.from(el.ownerDocument.querySelectorAll(labelTag))
            .filter(candidate => visibleText(candidate) === labelText);
        if (sameLabels.length !== 1) {
            return null;
        }
        return ['labelForward', labelText + '||TAG||' + tag + '||LABELTAG||' + labelTag];
    };

    document.addEventListener('sr-verify', function (event) {
        const el = getEventTarget(event);
        if (!(el instanceof Element)) {
            return;
        }
        const checkName = el.getAttribute('data-sr-verify') || '';
        el.removeAttribute('data-sr-verify');

        const base = buildActionData(el, 'verify');
        const targets = base.targets;
        const tag = el.tagName.toLowerCase();

        const labelTarget = labelForwardTarget(el);
        if (labelTarget) {
            targets.unshift(labelTarget);
        }

        sendToServer({
            ...base,
            targets: targets,
            checkName: checkName,
            observed: observedValue(el),
            framePath: getFramePath()
        });
    }, true);
}
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