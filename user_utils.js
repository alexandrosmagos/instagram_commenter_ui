const bcrypt = require('bcrypt');
const db = require('./database');

async function checkIfUserExists() {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users LIMIT 1', [], (err, row) => {
            if (err) {
                console.error(`Error checking if user exists: ${err}`);
                reject(err);
            }
            resolve(row ? true : false);
        });
    });
}

async function registerUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users(username, password) VALUES(?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            return console.log(err.message);
        }
        console.log(`A new user has been created with rowid ${this.lastID}`);
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

module.exports = { checkIfUserExists, registerUser, loginUser };