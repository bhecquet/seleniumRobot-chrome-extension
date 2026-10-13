var recorder_enabled = true;
var lastActiveTabId = null;

var init = function () {
    // Load
    chrome.runtime.onInstalled.addListener(function (object) {
        chrome.notifications.create('T_' + Date.now(), {
            type: 'basic',
            iconUrl: 'images/recorder_icon.png',
            title: 'SeleniumBase Recorder ACTIVE',
            message: '[ESC]: Pause recording.\n[~`]: Resume recording.',
            priority: 2
        });
    });
    // User changes tab
    chrome.tabs.onActivated.addListener(function (activeInfo) {
        if (!recorder_enabled) return;
        chrome.tabs.query({}, function (tabs) {
            // tab id increase when tabs are opened. It simulates the behaviour of selenium windows ids
            var ids = tabs.map(function (t) {
                return t.id;
            }).sort(function (a, b) {
                return a - b;
            });
            var tab = tabs.find(function (t) {
                return t.id === activeInfo.tabId;
            });
            if (!tab || activeInfo.tabId === lastActiveTabId) return;
            lastActiveTabId = activeInfo.tabId;
            fetch('http://localhost:5222/event', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    command: 'tabSwitch',
                    tabIndex: ids.indexOf(activeInfo.tabId),
                    tabCount: ids.length,
                    url: tab.url || tab.pendingUrl || '',
                    title: tab.title || '',
                    timestamp: Date.now()
                })
            }).catch(function (error) {
                console.error('Error sending tabSwitch :', error);
            });
        });
    });
};
init();
0;
