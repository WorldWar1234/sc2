#!/usr/bin/env node
'use strict';
const express = require('express');
const request = require('request');
const compress = require('./src/compress');

const app = express();
const PORT = process.env.PORT || 8080;

app.enable('trust proxy');

app.get('/', (req, res) => {
    const url = req.query.url; // Ensure 'url' is passed as a query parameter

    if (!url) {
        return res.status(400).send('Missing URL parameter');
    }

    // Fetch the image from the URL
    request.get(url, {
        encoding: null, // Get the response as a Buffer
        headers: {
            'User-Agent': 'MyApp/1.0', // Customize headers if needed
            'Accept': 'image/*',
            // Add other headers if required
        }
    }, (err, response, buffer) => {
        if (err || response.statusCode >= 400) {
            console.error('Error fetching image:', err || `Status code: ${response.statusCode}`);
            return res.status(500).send('Error fetching image');
        }

        const contentType = response.headers['content-type'] || '';
        req.params.originType = contentType;
        req.params.originSize = buffer.length;

        compress(req, res, buffer);
    });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
