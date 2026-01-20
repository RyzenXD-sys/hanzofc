const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const urlStorage = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

function bikinKode() {
    return Math.random().toString(36).substring(2, 7);
}

function getCurrentDomain(req) {
    // Di Vercel, header 'x-forwarded-host' akan berisi domain asli
    if (process.env.NODE_ENV === 'production') {
        const forwardedHost = req.headers['x-forwarded-host'];
        if (forwardedHost) {
            // Kalau ada x-forwarded-host, pakai itu
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            return protocol + '://' + forwardedHost;
        }
        // Kalau gak ada, pakai host biasa
        return req.protocol + '://' + req.get('host');
    }
    return 'http://localhost:' + PORT;
}

app.post('/shorten', (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL mana bang?' });
    }
    
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'http://' + url;
    }
    
    const shortCode = bikinKode();
    urlStorage.set(shortCode, finalUrl);
    
    const currentDomain = getCurrentDomain(req);
    
    res.json({
        original: finalUrl,
        shortCode: shortCode,
        shortUrl: currentDomain + '/' + shortCode
    });
});

app.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    const originalUrl = urlStorage.get(shortCode);
    
    if (originalUrl) {
        res.redirect(originalUrl);
    } else {
        res.status(404).send(`
            <h1>404 - Link ga ketemu</h1>
            <a href="/">Kembali ke home</a>
        `);
    }
});

app.get('/api/urls', (req, res) => {
    const currentDomain = getCurrentDomain(req);
    const urls = Array.from(urlStorage.entries()).map(([code, url]) => ({
        code,
        url,
        shortUrl: currentDomain + '/' + code
    }));
    res.json(urls);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
    console.log('Mode: ' + (process.env.NODE_ENV || 'development'));
});
