// server.js - simple user management with sqlite3 and bcrypt
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_FILE = './fa_sl.db';
const app = express();
app.use(bodyParser.json());

// open DB (creates file if not exists)
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite DB.');
});

// Initialize schema from previous SQL (idempotent)
const initSql = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_id INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, position TEXT, height_cm INTEGER, weight_kg INTEGER, nationality TEXT, dob DATE, bio TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, agency_name TEXT, license_number TEXT, region TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS clubs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, country TEXT, manager_user_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL);
`;

// run initialization
db.exec(initSql, (err) => {
  if (err) console.error('DB init error:', err);
  // ensure roles exist
  const roles = ['Admin','Agent','Player','ClubManager'];
  roles.forEach(r => {
    db.run('INSERT OR IGNORE INTO roles (name) VALUES (?)', [r]);
  });
});

// Helper: get role id
function getRoleId(roleName) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM roles WHERE name = ?', [roleName], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.id : null);
    });
  });
}

// Routes
// GET all users (with role name)
app.get('/users', (req, res) => {
  const sql = `SELECT u.id,u.full_name,u.email,u.phone,u.created_at,r.name as role
               FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.id`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// GET user by id
app.get('/users/:id', (req, res) => {
  const sql = `SELECT u.id,u.full_name,u.email,u.phone,u.created_at,r.name as role
               FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`;
  db.get(sql, [req.params.id], (err,row) => {
    if (err) return res.status(500).json({error: err.message});
    if (!row) return res.status(404).json({error: 'User not found'});
    res.json(row);
  });
});

// CREATE user (hashes password)
app.post('/users', async (req, res) => {
  try {
    const { full_name, email, role, password, phone } = req.body;
    if (!full_name || !email || !role || !password) return res.status(400).json({error:'Missing fields'});

    const role_id = await new Promise((resolve,reject)=>{
      db.get('SELECT id FROM roles WHERE name = ?', [role], (err,row)=>{
        if (err) return reject(err);
        resolve(row ? row.id : null);
      });
    });
    if (!role_id) return res.status(400).json({error:'Invalid role'});

    const password_hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (full_name,email,role_id,password_hash,phone) VALUES (?,?,?,?,?)');
    stmt.run([full_name,email,role_id,password_hash,phone||null], function(err){
      if (err) return res.status(500).json({error: err.message});
      res.json({id: this.lastID});
    });
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

// UPDATE user (partial)
app.put('/users/:id', (req,res) => {
  const fields = [];
  const values = [];
  const allowed = ['full_name','email','phone','password','role'];
  // handle role and password specially
  (async ()=>{
    try {
      if (req.body.role) {
        const roleName = req.body.role;
        const role_id = await new Promise((resolve,reject)=>{
          db.get('SELECT id FROM roles WHERE name = ?', [roleName], (err,row)=>{ if (err) reject(err); else resolve(row?row.id:null);});
        });
        if (!role_id) return res.status(400).json({error:'Invalid role'});
        fields.push('role_id = ?'); values.push(role_id);
      }
      if (req.body.password) {
        const password_hash = await bcrypt.hash(req.body.password, 10);
        fields.push('password_hash = ?'); values.push(password_hash);
      }
      if (req.body.full_name) { fields.push('full_name = ?'); values.push(req.body.full_name); }
      if (req.body.email) { fields.push('email = ?'); values.push(req.body.email); }
      if (req.body.phone) { fields.push('phone = ?'); values.push(req.body.phone); }

      if (fields.length === 0) return res.status(400).json({error:'No updatable fields'});
      values.push(req.params.id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      db.run(sql, values, function(err){
        if (err) return res.status(500).json({error:err.message});
        res.json({changes: this.changes});
      });
    } catch(err) {
      res.status(500).json({error: err.message});
    }
  })();
});

// DELETE user
app.delete('/users/:id', (req,res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err){
    if (err) return res.status(500).json({error: err.message});
    res.json({deleted: this.changes});
  });
});

// Simple health
app.get('/', (req,res) => res.send('FootballAgentSL backend is running'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on :${PORT}`));