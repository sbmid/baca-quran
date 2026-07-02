const GhostDB = require('./index');

// 1. Inisialisasi DB (Otomatis bikin folder 'mydb' kalo belum ada)
const db = new GhostDB('./mydb');

console.log("👻 GhostDB Test Run...\n");

// 2. Set Data (Collection: users)
db.set('users', 'u1', { name: 'Al', role: 'Lazy Dev', energy: 10 });
db.set('users', 'u2', { name: 'Budi', role: 'Rajin', energy: 100 });

// 3. Get Data
console.log("👤 Get 'u1':", db.get('users', 'u1'));

// 4. Find Data
const malas = db.find('users', u => u.energy < 50);
console.log("🛌 User malas:", malas);

// 5. All Data
console.log("👥 Semua user:", db.all('users'));

// 6. Update
db.update('users', 'u1', { energy: 5, status: 'rebahan' });
console.log("🔄 Al di-update (partial):", db.get('users', 'u1'));

// 7. First, Has, Count
console.log("🥇 User pertama yg rajin:", db.first('users', u => u.role === 'Rajin'));
console.log("❓ Punya u2 nggak?:", db.has('users', 'u2'));
console.log("🔢 Jumlah user:", db.count('users'));

// 8. Delete & Clear
db.delete('users', 'u2');
console.log("🗑️ Budi dihapus. Punya u2 sekarang?:", db.has('users', 'u2'));
console.log("🔢 Jumlah user sekarang:", db.count('users'));

db.clear('users');
console.log("💥 Kiamat! Jumlah user:", db.count('users'));

console.log("\n✅ Test beres. Liat folder 'mydb' buat liat isi file JSON-nya.");
