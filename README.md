# seleniumRobot-chrome-extension

Chrome extension that send captured events to a localhost:5222 server. This extension is aimed to be used with the
seleniumRobot-intelliJ-recorder-plugin

Events are sent to the following local endpoint:

```text
http://localhost:5222/event
```

## Requirements

The following tools are required to run or test the extension:

- Google Chrome;
- Node.js 22 or later;
- npm.

Check the installed versions:

```powershell
node -v
npm -v
```

Install the project dependencies:

```powershell
npm install
```

## Unit Tests

Unit tests will verify individual JavaScript functions without starting Chrome or the IntelliJ plugin.

command to run unit test :

```powershell
npm run test:unit
```

## Selenium Integration Tests

The extension already has automated integration tests based on:

- JavaScript;
- Node.js;
- Mocha;
- Selenium WebDriver;
- WebDriver BiDi;
- Google Chrome;
- the native Node.js `assert` module.

These tests verify the complete extension behavior in a real Chrome browser.

### How the tests work

The integration test workflow is:

```text
Mocha
→ Selenium WebDriver
→ Chrome
→ automatic extension installation with WebDriver BiDi
→ non-regression HTML page
→ contentScript.js
→ JSON payload
→ local test server
→ assertions
```

WebDriver BiDi installs the extension automatically when the test session starts.

It is therefore not necessary to:

- create a dedicated Chrome profile;
- open `chrome://extensions`;
- manually enable developer mode;
- manually load the unpacked extension.

The extension is installed at the beginning of the test campaign and removed when the campaign ends.

### Run the integration tests

```powershell
npm run test:extension
```

The expected output is similar to:

```text
SeleniumRobot Recorder extension
  XX passing
```

The exact number of tests may change as new scenarios are added.

### Ports used by the tests

The test campaign automatically starts two HTTP servers.

The HTML test pages are served on:

```text
http://127.0.0.1:8000
```

The recorded extension events are received on:

```text
http://localhost:5222/event
```

The IntelliJ plugin must not be running at the same time as the automated extension tests because both use port `5222`.

### Example payload

Example payload sent after clicking a button:

```json
{
  "command": "click",
  "tagName": "button",
  "inputType": "",
  "targets": [
    [
      "id",
      "save-profile-id"
    ],
    [
      "data-testid",
      "save-profile-testid"
    ],
    [
      "ariaLabel",
      "Save profile"
    ],
    [
      "buttonText",
      "Save"
    ],
    [
      "css",
      "#save-profile-id"
    ],
    [
      "xpath",
      "//*[@id='save-profile-id']"
    ]
  ],
  "value": "",
  "framePath": []
}
```

The tests verify fields such as:

- `command`;
- `tagName`;
- `inputType`;
- `targets`;
- `value`;
- `framePath`;
- `reason`, `url`, and `title` for page changes.

## Manual Testing in Chrome

Manual testing can be used to inspect the extension behavior directly in Chrome.

### Start the Node.js server

From the project root directory, run:

```powershell
node serve.js
```

The terminal displays the URL used by the server.

The non-regression page should then be available at an address similar to:

```text
http://127.0.0.1:8000/recorder-test-page.html
```

The test page must be opened through HTTP.

Do not open it directly with a `file:///` URL because the extension and iframe behavior may be different.

### Load the extension manually

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project directory containing `manifest.json`.

After changing `contentScript.js`:

1. open `chrome://extensions`;
2. click **Reload** for the extension;
3. refresh the test page.

### Receive the recorded events

A server must listen on:

```text
http://localhost:5222/event
```

This server can be:

- the Jetty server started by the IntelliJ plugin;
- the Node.js test server;
- another HTTP server implementing the same contract.

Only one server can use port `5222` at a time.

## Common Issues

### Port 5222 is already in use

On Windows:

```powershell
netstat -ano | findstr :5222
```

Stop the IntelliJ plugin or the server already using port `5222`, then restart the tests.

### Port 8000 is already in use

```powershell
netstat -ano | findstr :8000
```

### Chrome internal error messages

Chrome may display messages such as:

```text
PHONE_REGISTRATION_ERROR
DEPRECATED_ENDPOINT
Failed to connect to MCS endpoint
```

These messages come from internal Chrome services and do not necessarily mean that the Recorder tests failed.

The final Mocha result is the reference for the test campaign.

## Installation After Cloning the Repository

```powershell
git clone REPOSITORY_URL
cd seleniumRobot-chrome-extension
npm install
npm run test:extension
```