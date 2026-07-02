/**
 * Author: Azrial Galih Prasetyo
 * Instagram: @al.sebirumatahari_
 * Telegram: @sbmshop
 * 
 * GhostDB - Karena skema itu mitos, dan migrasi itu buang waktu.
 * Simpen data jadi JSON, panggil, beres. 
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GhostDB {
    constructor(dbPath = './database', secretKey = null) {
        this.dbPath = path.resolve(dbPath);
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
        
        this.keyBuffer = null;
        if (secretKey) {
            this.keyBuffer = Buffer.from(secretKey, 'hex');
        }
        
        this._cache = {};
        this._isCompacting = false;
    }

    _encrypt(text) {
        if (!this.keyBuffer) return text;
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.keyBuffer, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag().toString('base64');
        return `enc:${iv.toString('base64')}:${authTag}:${encrypted}`;
    }

    _decrypt(encryptedText) {
        if (!this.keyBuffer) return encryptedText;
        if (!encryptedText.startsWith('enc:')) return encryptedText;
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 4) return encryptedText;
            const [prefix, iv64, authTag64, ciphertext] = parts;
            const iv = Buffer.from(iv64, 'base64');
            const authTag = Buffer.from(authTag64, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-gcm', this.keyBuffer, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            throw new Error('Decryption Failed! Bad Key or Corrupt Data.');
        }
    }

    _getFile(collection) {
        return path.join(this.dbPath, `${collection}.json`);
    }

    _loadCollection(collection) {
        if (this._cache[collection]) return this._cache[collection];
        
        const file = this._getFile(collection);
        if (!fs.existsSync(file)) {
            this._cache[collection] = {};
            return this._cache[collection];
        }

        let db = {};
        try {
            const rawContent = fs.readFileSync(file, 'utf8').trim();
            if (!rawContent) {
                this._cache[collection] = db;
                return db;
            }

            if (rawContent.startsWith('{') || (rawContent.startsWith('enc:') && !rawContent.includes('\n'))) {
                // Legacy file format parsing (1 big object)
                const parsed = rawContent.startsWith('enc:') 
                    ? JSON.parse(this._decrypt(rawContent)) 
                    : JSON.parse(rawContent);
                db = parsed;
                // Force compact to convert to new Append-Only format
                setTimeout(() => this.compact(collection), 0);
            } else {
                // AOF parsing
                const lines = rawContent.split('\n');
                for (const line of lines) {
                    if (!line) continue;
                    try {
                        const parsed = JSON.parse(this.keyBuffer ? this._decrypt(line) : line);
                        if (parsed.op === 'set' || parsed.op === 'update') {
                            db[parsed.id] = parsed.data;
                        } else if (parsed.op === 'delete') {
                            delete db[parsed.id];
                        }
                    } catch (err) {
                        // Skip corrupted line
                    }
                }
            }
        } catch (e) {
            console.error(`[GhostDB] R.I.P file ${collection}.json. Data Corrupt / Bad Key.`);
        }
        this._cache[collection] = db;
        return db;
    }

    _appendLog(collection, op, id, data = null) {
        const file = this._getFile(collection);
        const logEntry = { op, id, data };
        const jsonStr = JSON.stringify(logEntry);
        const out = this.keyBuffer ? this._encrypt(jsonStr) : jsonStr;
        fs.appendFileSync(file, out + '\n');
        
        if (!this._isCompacting && Math.random() < 0.05) {
            const stat = fs.statSync(file);
            if (stat.size > 2 * 1024 * 1024) { // 2MB limit before auto-compaction
                this.compact(collection);
            }
        }
    }

    compact(collection) {
        if (this._isCompacting) return;
        this._isCompacting = true;
        const db = this._loadCollection(collection);
        const file = this._getFile(collection);
        const tempFile = file + '.tmp';
        
        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            let combined = '';
            for (const [id, data] of Object.entries(db)) {
                const jsonStr = JSON.stringify({ op: 'set', id, data });
                const out = this.keyBuffer ? this._encrypt(jsonStr) : jsonStr;
                combined += out + '\n';
            }
            fs.writeFileSync(tempFile, combined);
            fs.renameSync(tempFile, file);
        } catch (e) {
            console.error('[GhostDB] Gagal compact', e);
        }
        this._isCompacting = false;
    }

    /** Masukin data. Timpa kalo ID udah ada. */
    set(collection, id, data) {
        const db = this._loadCollection(collection);
        const finalData = { id, ...data, _updatedAt: Date.now() };
        db[id] = finalData;
        this._appendLog(collection, 'set', id, finalData);
        return finalData;
    }

    /** Ambil 1 data by ID */
    get(collection, id) {
        const db = this._loadCollection(collection);
        return db[id] || null;
    }

    /** Ambil semua data di collection */
    all(collection) {
        const db = this._loadCollection(collection);
        return Object.values(db);
    }

    /** Cari data pake fungsi filter */
    find(collection, predicate) {
        return this.all(collection).filter(predicate);
    }

    /** Hapus data */
    delete(collection, id) {
        const db = this._loadCollection(collection);
        if (!db[id]) return false;
        delete db[id];
        this._appendLog(collection, 'delete', id);
        return true;
    }

    /** Update partial data. Kalo gaada, return null */
    update(collection, id, data) {
        const db = this._loadCollection(collection);
        if (!db[id]) return null;
        db[id] = { ...db[id], ...data, _updatedAt: Date.now() };
        this._appendLog(collection, 'update', id, db[id]);
        return db[id];
    }

    /** Cek ada data nggak by ID */
    has(collection, id) {
        return !!this._loadCollection(collection)[id];
    }

    /** Cari 1 doang yg match (biar hemat performa) */
    first(collection, predicate) {
        return this.all(collection).find(predicate) || null;
    }

    /** Itung jumlah data */
    count(collection) {
        return Object.keys(this._loadCollection(collection)).length;
    }

    /** Kiamat kecil buat 1 collection */
    clear(collection) {
        this._cache[collection] = {};
        const file = this._getFile(collection);
        fs.writeFileSync(file, ''); 
        return true;
    }
}
module.exports = GhostDB;
