const sharp = require('sharp');

const MIN_COMPRESS_LENGTH = 512; // Adjust the minimum compress length as desired
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

function shouldCompress(originType, originSize, webp) {
    if (!originType.startsWith('image')) {
        return false;
    }
    if (originSize === 0) {
        return false;
    }
    if (webp && originSize < MIN_COMPRESS_LENGTH) {
        return false;
    }
    if (!webp && (originType.endsWith('png') || originType.endsWith('gif')) && originSize < MIN_TRANSPARENT_COMPRESS_LENGTH) {
        return false;
    }
    return true;
}

function compress(req, res, input) {
    const format = req.query.webp ? 'webp' : 'jpeg';
    const grayscale = req.query.grayscale === 'true';
    const quality = parseInt(req.query.quality, 10) || 40;
    const originType = req.headers['content-type'] || '';
    const originSize = input.length;
    const webp = req.query.webp;

    if (!shouldCompress(originType, originSize, webp)) {
        res.setHeader('x-proxy-bypass', 1);
        res.setHeader('content-length', input.length);
        return res.status(200).send(input);
    }

    sharp(input)
    .grayscale(grayscale)
    .toFormat(format, {
        quality: quality,
        progressive: true,
        optimizeScans: true
    })
    .toBuffer((err, output, info) => {
        if (err) {
            return res.status(500).send('Error processing image');
        }

        res.setHeader('content-type', `image/${format}`);
        res.setHeader('content-length', info.size);
        res.setHeader('x-original-size', originSize);
        res.setHeader('x-bytes-saved', originSize - info.size);
        res.status(200).send(output);
    });
}

module.exports = compress;
