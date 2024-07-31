#!/usr/bin/env node
'use strict';

const express = require('express');
const authenticate = require('./src/authenticate');
const params = require('./src/params');
const compress = require('./src/compress');
const request = require('request');
const { pick } = require('lodash');

const app = express();
const PORT = process.env.PORT || 8080;

app.enable('trust proxy');
app.use(authenticate); // Apply authentication for all routes
app.use(params); // Apply parameter processing for all routes

app.get('/', (req, res) => {
    const url = req.params.url;

    if (!url) {
        return res.status(400).send('Missing URL parameter');
    }

    request.get(
        url,
        {
            headers: {
                ...pick(req.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': 'Bandwidth-Hero Compressor',
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
                via: '1.1 bandwidth-hero',
                'Accept': 'image/*'
            },
            timeout: 10000,
            maxRedirects: 5,
            encoding: null,
            strictSSL: false,
            gzip: true,
            jar: true
        },
        (err, response, buffer) => {
            if (err || response.statusCode >= 400) {
                // Send a plain error response instead of redirecting
                return res.status(500).send('Error fetching image: ' + (err ? err.message : 'Status code ' + response.statusCode));
            }

            // Set response headers from the fetched image
            res.setHeader('content-type', response.headers['content-type'] || 'application/octet-stream');
            res.setHeader('content-length', buffer.length);

            // Pass the buffer to compress
            compress(req, res, buffer);
        }
    );
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
