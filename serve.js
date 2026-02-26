const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5222;


app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(bodyParser.json());

app.get('/event', (req, res) => {
    res.send('Serveur prêt à recevoir des événements via POST.');
});

app.post('/event', (req, res) => {
    console.log('Event reçu :', req.body);
    res.status(200).send({status: 'OK', received: req.body});
});

app.listen(PORT, () => {
    console.log(`Serveur Node.js en écoute sur http://localhost:${PORT}`);
});