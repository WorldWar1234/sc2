#!/usr/bin/env node
'use strict';

const express = require('express');
const fetch = require('node-fetch');
const params = require('./src/params');
const compress = require('./src/compress');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(params); // Apply parameter processing for all routes

app.get('/', async (req, res) => {
    try {
        const response = await fetch(req.params.url);
        const contentType = response.headers.get('content-type');
        const buffer = await response.buffer();
        
        console.log(`Fetch Status: ${response.status}`);
        console.log(`Content-Type: ${contentType}`);
        console.log(`Buffer Length: ${buffer.length}`);

        if (response.status !== 200) {
            return res.status(response.status).send('Error fetching image');
        }

        req.headers['content-type'] = contentType;
        req.query.originSize = buffer.length;
        
        compress(req, res, buffer);
    } catch (err) {
        console.error('Error fetching or processing image:', err);
        res.status(500).send('Error fetching image');
    }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
