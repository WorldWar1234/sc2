#!/usr/bin/env node

'use strict';

const express = require('express');
const authenticate = require('./src/authenticate');
const params = require('./src/params');
const fetchImage = require('./src/fetchImage');
const compress = require('./src/compress');

const app = express();

const PORT = process.env.PORT || 8080;

app.enable('trust proxy');

app.get('/', authenticate, params, async (req, res) => {
    try {
        const imageBuffer = await fetchImage(req.params.url);
        compress(req, res, imageBuffer);
    } catch (error) {
        console.error('Error fetching or processing image:', error);
        res.status(500).send('Error fetching or processing image');
    }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
