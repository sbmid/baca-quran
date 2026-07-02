const express = require('express');
const GhostDB = require('./index');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Config Manager ---
const configPath = path.join(__dirname, 'ghost-config.json');
let config = {};
function loadConfig() {
    if (!fs.existsSync(configPath)) {
        config = {
            port: 9969,
            password: '12345678',
            token: crypto.randomBytes(32).toString('hex'),
            encryptionKey: crypto.randomBytes(32).toString('hex')
        };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } else {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!config.encryptionKey) {
            config.encryptionKey = crypto.randomBytes(32).toString('hex');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
    }
}
loadConfig();
function saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// --- CLI Args ---
const isApiOnly = process.argv.includes('--api-only');

const app = express();
app.use(express.json({ limit: '50mb' }));
const db = new GhostDB('./mydb', config.encryptionKey);

// --- Auth Middleware ---
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token === config.token) {
            return next();
        }
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// --- Auth Endpoints ---
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === config.password) {
        res.json({ success: true, token: config.token });
    } else {
        res.status(401).json({ error: 'Password salah' });
    }
});

app.post('/api/change-password', requireAuth, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (oldPassword !== config.password) return res.status(401).json({ error: 'Password lama salah' });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    
    config.password = newPassword;
    config.token = crypto.randomBytes(32).toString('hex'); // Rotate token
    saveConfig();
    res.json({ success: true, message: 'Password diganti', token: config.token });
});

// --- API Endpoints ---
app.get('/api/collections', requireAuth, (req, res) => {
    try {
        const files = fs.readdirSync('./mydb');
        const collections = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        res.json(collections);
    } catch (e) {
        res.json([]);
    }
});

app.get('/api/graph-data', requireAuth, (req, res) => {
    try {
        const files = fs.readdirSync('./mydb');
        const nodes = [];
        const links = [];
        
        nodes.push({ id: 'ROOT_DB', name: 'GhostDB', group: 'ROOT', val: 30 });
        
        files.forEach(file => {
            if (!file.endsWith('.json')) return;
            const col = file.replace('.json', '');
            nodes.push({ id: col, name: col, group: 0, val: 15 });
            links.push({ source: col, target: 'ROOT_DB' });
            
            const data = db.all(col);
            data.forEach(item => {
                const itemId = `${col}_${item.id}`;
                const jsonStr = JSON.stringify(item);
                const size = Math.max(2, Math.min(10, jsonStr.length / 50)); 
                
                nodes.push({ id: itemId, name: item.id, group: col, val: size, data: item });
                links.push({ source: itemId, target: col });
            });
        });
        
        res.json({ nodes, links });
    } catch (e) {
        res.json({ nodes: [], links: [] });
    }
});

app.get('/api/:collection', requireAuth, (req, res) => {
    const col = req.params.collection;
    res.json(db.all(col));
});

app.get('/api/:collection/:id', requireAuth, (req, res) => {
    const { collection, id } = req.params;
    const item = db.get(collection, id);
    if (item) res.json(item);
    else res.status(404).json({ error: 'Not found' });
});

app.post('/api/:collection', requireAuth, (req, res) => {
    const col = req.params.collection;
    const data = req.body;
    if (!data.id) return res.status(400).json({ error: 'ID is required' });
    db.set(col, data.id, data);
    res.json({ success: true, data });
});

app.delete('/api/:collection/:id', requireAuth, (req, res) => {
    const { collection, id } = req.params;
    db.delete(collection, id);
    res.json({ success: true });
});

app.delete('/api/:collection', requireAuth, (req, res) => {
    const col = req.params.collection;
    const filePath = path.join('./mydb', `${col}.json`);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to drop collection' });
    }
});

// --- UI Serving ---
if (!isApiOnly) {
    app.use(express.static('public'));
} else {
    app.use((req, res) => {
        res.status(404).json({ error: 'UI is disabled. API Only mode active.' });
    });
}

// --- Start Server ---
const PORT = config.port || 9969;
app.listen(PORT, () => {
    console.log(`\n🚀 GhostDB Server nyala di port ${PORT}`);
    console.log(`🔒 Mode: ${isApiOnly ? 'API Only' : 'Web UI + API'}`);
    if (!isApiOnly) {
        console.log(`🌐 Buka di: http://localhost:${PORT}`);
    }
});
