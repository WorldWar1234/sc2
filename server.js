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

    request.get(
        url,
        {
            headers: {
                ...pick(req.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': 'Bandwidth-Hero Compressor',
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
                via: '1.1 bandwidth-hero',
                'Accept': 'image/*' // Add the 'Accept' header to request
            },
            timeout: 10000,
            maxRedirects: 5,
            encoding: null,
            strictSSL: false,
            gzip: true,
            jar: true
        },
        (err, origin, buffer) => {
            if (err || origin.statusCode >= 400) {
                // Redirect on error
                res.setHeader('content-length', 0);
                res.removeHeader('cache-control');
                res.removeHeader('expires');
                res.removeHeader('date');
                res.removeHeader('etag');
                res.setHeader('location', encodeURI(url));
                return res.status(302).end();
            }

            // Copy headers from the original response
            for (const [key, value] of Object.entries(origin.headers)) {
                try {
                    res.setHeader(key, value);
                } catch (e) {
                    console.log(e.message);
                }
            }

            res.setHeader('content-encoding', 'identity');
            req.params.originType = origin.headers['content-type'] || '';
            req.params.originSize = buffer.length;

            // Pass the buffer to compress
            compress(req, res, buffer);
        }
    );
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
