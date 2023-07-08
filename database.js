const sqlite3 = require('sqlite3').verbose();

// Initialize the db object immediately
let db = new sqlite3.Database('./settings/proxies.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    
    db.run(`CREATE TABLE IF NOT EXISTS proxies(
        id TEXT PRIMARY KEY,
        username TEXT,
        password TEXT,
        proxy_address TEXT,
        port INTEGER,
        valid BOOLEAN,
        last_verification TEXT,
        country_code TEXT,
        city_name TEXT,
        asn_name TEXT,
        asn_number TEXT,
        high_country_confidence BOOLEAN,
        created_at TEXT
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    );`);
    
    console.log('Connected to the database.');
});

module.exports = db;