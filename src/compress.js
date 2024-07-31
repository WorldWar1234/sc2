const sharp = require('sharp');

function redirect(req, res) {
    if (res.headersSent) {
        return;
    }
    res.setHeader('content-length', 0);
    res.removeHeader('cache-control');
    res.removeHeader('expires');
    res.removeHeader('date');
    res.removeHeader('etag');
    res.setHeader('location', encodeURI(req.params.url));
    res.status(302).end();
}

function bypass(req, res, buffer) {
    res.setHeader('x-proxy-bypass', 1);
    res.setHeader('content-length', buffer.length);
    res.status(200).send(buffer);
}

function compress(req, res, input) {
    const format = req.params.webp ? 'webp' : 'jpeg';

    if (shouldCompress(req)) {
        sharp(input)
            .grayscale(req.params.grayscale)
            .toFormat(format, {
                quality: req.params.quality,
                progressive: true,
                optimizeScans: true
            })
            .toBuffer((err, output, info) => {
                if (err || !info || res.headersSent) {
                    return redirect(req, res);
                }

                res.setHeader('content-type', `image/${format}`);
                res.setHeader('content-length', info.size);
                res.setHeader('x-original-size', req.params.originSize);
                res.setHeader('x-bytes-saved', req.params.originSize - info.size);
                res.status(200).send(output);
            });
    } else {
        bypass(req, res, input);
    }
}

function shouldCompress(req) {
    const MIN_COMPRESS_LENGTH = 512; // Adjust the minimum compress length as desired
    const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

    const { originType, originSize, webp } = req.params;

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

module.exports = compress;
