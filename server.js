
const express = require('express');
const authenticate = require('./src/authenticate');
const params = require('./src/params');
const compress = require('./src/compress');
const fetch = require('node-fetch'); // For fetching images
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.enable('trust proxy');
app.use(authenticate); // Apply authentication for all routes
app.use(params); // Apply parameter processing for all routes

app.get('/', (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('No URL provided');
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            return response.buffer().then(buffer => {
                console.log('Fetch Status:', response.status);
                console.log('Content-Type:', contentType);
                console.log('Buffer Length:', buffer.length);

                req.headers['content-type'] = contentType;
                req.query.originSize = buffer.length;

                // Call the compress function
                compress(req, res, buffer);
            });
        })
        .catch(err => {
            console.error('Error fetching or processing image:', err);
            res.status(500).send('Error fetching or processing image');
        });
});

app.get('/test-image', (req, res) => {
    const imagePath = path.join(__dirname, 'path/to/your/test-image.jpg');
    res.sendFile(imagePath, err => {
        if (err) {
            console.error('Error serving static image:', err);
            res.status(500).send('Error serving image');
        }
    });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
