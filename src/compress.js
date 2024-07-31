const sharp = require('sharp');
const redirect = require('./redirect');

function compress(req, res, input) {
    // Determine the output format based on query parameters
    const format = req.query.webp ? 'webp' : 'jpeg';

    sharp(input)
        .grayscale(req.query.grayscale === 'true') // Ensure proper boolean handling
        .toFormat(format, {
            quality: parseInt(req.query.quality, 10) || 40, // Use default quality if not provided
            progressive: true,
            optimizeScans: true
        })
        .toBuffer((err, output, info) => {
            if (err) {
                console.error('Error processing image:', err);
                return redirect(req, res);
            }

            if (!info) {
                console.error('No image info available');
                return redirect(req, res);
            }

            // Set appropriate headers
            res.setHeader('Content-Type', `image/${format}`);
            res.setHeader('Content-Length', info.size);
            res.setHeader('X-Original-Size', req.query.originSize);
            res.setHeader('X-Bytes-Saved', req.query.originSize - info.size);

            // Send the processed image
            res.status(200).send(output);
        });
}

module.exports = compress;
