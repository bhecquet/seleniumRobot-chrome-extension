function stableKeyFrom(el) {
    // stable key based on priority CSS selector
    return 'css:' + getEnhancedSelector(el);
}

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

    const shadowPath = getShadowPath(el);
    const xpath = shadowPath.length === 0 ? getEnhancedXPath(el) : null;
    if (xpath) {
        targets.push(['xpath', xpath]);
    }


    return {
        command: command,
        tagName: currentTag,
        inputType: currentType,
        targets: shadowPath.length === 0 ? targets : targets.filter(t => !String(t[0]).startsWith('xpath')),
        shadowPath: shadowPath,
        value: el.value || '',
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
    };
}

let serverRequestQueue = Promise.resolve();

function sendToServer(actionData) {
    console.log('[Recorder] sending ->', actionData.command, actionData.elementName || '', actionData);
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

function sendAction(el, command, extra = {}) {
    const framePath = getFramePath();
    const base = buildActionData(el, command);
    sendToServer({...base, framePath, ...extra});
}
