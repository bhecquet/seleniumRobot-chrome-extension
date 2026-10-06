const http = require('http');
const fs = require('fs');
const path = require('path');

let events = [];
let eventServer;
let pageServer;

function startServers() {
    events = [];

    eventServer = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }

        if (req.method === 'POST' && req.url === '/event') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                console.log('[Test server] Event received:', body);
                events.push(JSON.parse(body));
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('OK');
            });
            return;
        }

        res.writeHead(404);
        res.end();
    });

    pageServer = http.createServer((req, res) => {
        const file = path.join(__dirname, '..', 'fixtures', 'recorder-test-page.html');
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(fs.readFileSync(file));
    });

    return Promise.all([
        new Promise(resolve => eventServer.listen(5222, resolve)),
        new Promise(resolve => pageServer.listen(8000, '127.0.0.1', resolve))
    ]);
}

function stopServers() {
    return Promise.all([
        new Promise(resolve => eventServer.close(resolve)),
        new Promise(resolve => pageServer.close(resolve))
    ]);
}

function clearEvents() {
    events = [];
}

async function waitForEvent(command, timeout = 5000) {
    const end = Date.now() + timeout;

    while (Date.now() < end) {
        const event = events.find(item => item.command === command);
        if (event) return event;
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error(`No "${command}" event received within ${timeout} ms`);
}

module.exports = {startServers, stopServers, clearEvents, waitForEvent};