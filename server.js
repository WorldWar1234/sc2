#!/usr/bin/env node
'use strict';
const express = require('express');
const authenticate = require('./src/authenticate');
const params = require('./src/params');
const compress = require('./src/compress');
const fetch = require('node-fetch'); // Add this for fetching images

const app = express();
const PORT = process.env.PORT || 8080;

app.enable('trust proxy');
app.use(authenticate); // Apply authentication for all routes
app.use(params); // Apply parameter processing for all routes

app.get('/', (req, res) => {
    const url = req.params.url;
    // Fetch the image from the URL and pass it to compress
    fetch(url)
        .then(response => {
            const contentType = response.headers.get('content-type');
            return response.buffer().then(buffer => {
                // Set headers for content type and original size
                req.headers['content-type'] = contentType;
                req.query.originSize = buffer.length;
                return compress(req, res, buffer);
            });
        })
        .catch(err => res.status(500).send('Error fetching image'));
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
