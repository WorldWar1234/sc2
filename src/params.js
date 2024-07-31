const DEFAULT_QUALITY = 40;

function params(req, res, next) {
    const { url, jpeg, bw, l } = req.query;

    if (!url) {
        return res.end('bandwidth-hero-proxy'); // or send an appropriate response if URL is missing
    }

    // Clean up and format the URL
    const urls = Array.isArray(url) ? url.join('&url=') : url;
    const cleanedUrl = urls.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

    // Set parameters for image processing
    req.params.url = cleanedUrl;
    req.query.webp = !jpeg;
    req.query.grayscale = bw !== '0';
    req.query.quality = parseInt(l, 10) || DEFAULT_QUALITY;

    next();
}

module.exports = params;
