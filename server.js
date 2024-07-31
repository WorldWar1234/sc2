#!/usr/bin/env node
'use strict';
const express = require('express');
const params = require('./src/params');
const compress = require('./src/compress');
const fetch = require('node-fetch'); // Add this for fetching images

const app = express();
const PORT = process.env.PORT || 8080;

app.enable('trust proxy');
app.use(params); // Apply parameter processing for all routes

app.get('/', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('No URL provided');
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');
        const buffer = await response.buffer();

        // Set headers for content type and original size
        req.headers['Content-Type'] = contentType;
        req.query.originSize = buffer.length;

        // Compress the image
        compress(req, res, buffer);
    } catch (err) {
        console.error('Error fetching or processing image:', err.message);
        res.status(500).send('Error fetching or processing image');
    }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
