require("dotenv").config();
const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

let db;

function initDatabase() {
    db = new sqlite3.Database('./settings/proxies.db', (err) => {
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
        
        console.log('Connected to the proxies database.');
    });
}

async function registerUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users(username, password) VALUES(?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
}

function loginUser(username, password) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
      if (err) {
        reject(err.message);
      }
      if (row && await bcrypt.compare(password, row.password)) {
        resolve(row);
      } else {
        reject('Incorrect username or password');
      }
    });
  });
}

async function listProxies(country, page) {
    const url = new URL('https://proxy.webshare.io/api/v2/proxy/list/');
    url.searchParams.append('mode', 'backbone');
    url.searchParams.append('country_code__in', country);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('page_size', '500');

    const req = await fetch(url.href, {
        method: "GET",
        headers: {
            Authorization: `Token ${process.env.webshare_token}`
        }
    });

    const res = await req.json();
    return res.results;
}

async function insertProxies(proxies) {
    for (const proxy of proxies) {
        await db.run(`INSERT OR REPLACE INTO proxies(id, username, password, proxy_address, port, valid, last_verification, country_code, city_name, asn_name, asn_number, high_country_confidence, created_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [proxy.id, proxy.username, proxy.password, proxy.proxy_address, proxy.port, proxy.valid, proxy.last_verification, proxy.country_code, proxy.city_name, proxy.asn_name, proxy.asn_number, proxy.high_country_confidence, proxy.created_at],
            function(err) {
            if (err) {
                return console.log(err.message);
            }
            // A row is inserted or updated
            console.log(`A row with id ${proxy.id} has been inserted or updated.`);
        });
    }
}


async function initData() {
    const totalProxies = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM proxies`, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });

    const countries = await new Promise((resolve, reject) => {
        db.all(`SELECT DISTINCT country_code FROM proxies`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    return {
        totalProxies,
        countries
    };
}

async function getCountryCities(country) {
    const cities = await new Promise((resolve, reject) => {
        db.all(`SELECT DISTINCT city_name FROM proxies WHERE country_code = ?`, [country], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    return cities;
}

module.exports = {
    registerUser,
    loginUser,
    initDatabase,
    listProxies,
    insertProxies,
    initData,
    getCountryCities
};
