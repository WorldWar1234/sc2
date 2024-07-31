#!/usr/bin/env node
'use strict';
const express = require('express');
const request = require('request');
const compress = require('./src/compress');
const params = require('./src/params');

const app = express();
const PORT = process.env.PORT || 8080;

// Apply the params middleware to process query parameters
app.use(params);

app.get('/', (req, res) => {
    const url = req.params.url; // Use processed URL from params middleware

    // Fetch the image from the URL
    request({
        uri: url, // Specify the URL with 'uri'
        method: 'GET',
        encoding: null, // Get the response as a Buffer
        headers: {
            'User-Agent': 'MyApp/1.0', // Customize headers if needed
            'Accept': 'image/*',
            // Add other headers if required
        }
    }, (err, response, buffer) => {
        if (err) {
            console.error('Error fetching image:', err);
            return res.status(500).send('Error fetching image');
        }

        if (response.statusCode >= 400) {
            console.error('Error fetching image: Status code', response.statusCode);
            return res.status(response.statusCode).send('Error fetching image');
        }

        const contentType = response.headers['content-type'] || '';
        req.params.originType = contentType;
        req.params.originSize = buffer.length;

        compress(req, res, buffer);
    });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
