-- schema.sql
PRAGMA foreign_keys = ON;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Users (common auth & contact info)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_id INTEGER NOT NULL,
  password_hash TEXT NOT NULL,     -- store bcrypt hashed password in production
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Players profile (1:1 with users where role = 'Player')
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  position TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  nationality TEXT,
  dob DATE,
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Agents profile (1:1 with users where role = 'Agent')
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  agency_name TEXT,
  license_number TEXT,
  region TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT,
  manager_user_id INTEGER,         -- FK to users (ClubManager)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Optional: audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  meta TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert roles
INSERT OR IGNORE INTO roles (name) VALUES ('Admin'), ('Agent'), ('Player'), ('ClubManager');

-- SAMPLE USERS
-- NOTE: For demo, we store plaintext-like sample placeholders in password_hash column.
-- In production: generate bcrypt hashes and store them instead.
-- Use the backend script below to create properly hashed accounts.
INSERT INTO users (full_name, email, role_id, password_hash, phone)
VALUES
('Admin One','admin1@example.com', (SELECT id FROM roles WHERE name='Admin'), 'Password123!', '+23277000001'),
('Admin Two','admin2@example.com', (SELECT id FROM roles WHERE name='Admin'), 'Password123!', '+23277000002'),

('Agent One','agent1@example.com', (SELECT id FROM roles WHERE name='Agent'), 'Password123!', '+23277100001'),
('Agent Two','agent2@example.com', (SELECT id FROM roles WHERE name='Agent'), 'Password123!', '+23277100002'),

('Player One','player1@example.com', (SELECT id FROM roles WHERE name='Player'), 'Password123!', '+23277200001'),
('Player Two','player2@example.com', (SELECT id FROM roles WHERE name='Player'), 'Password123!', '+23277200002'),

('Club Manager One','clubmgr1@example.com', (SELECT id FROM roles WHERE name='ClubManager'), 'Password123!', '+23277300001'),
('Club Manager Two','clubmgr2@example.com', (SELECT id FROM roles WHERE name='ClubManager'), 'Password123!', '+23277300002');

-- Sample player profiles (link to the two player users above)
INSERT INTO players (user_id, position, height_cm, weight_kg, nationality, dob, bio)
VALUES
((SELECT id FROM users WHERE email='player1@example.com'), 'Forward', 178, 72, 'Sierra Leone', '2002-06-15', 'Young attacking talent.'),
((SELECT id FROM users WHERE email='player2@example.com'), 'Midfielder', 175, 70, 'Sierra Leone', '2001-11-22', 'Creative playmaker.');

-- Sample agent profiles
INSERT INTO agents (user_id, agency_name, license_number, region)
VALUES
((SELECT id FROM users WHERE email='agent1@example.com'), 'SL Talent Agency', 'AG-001', 'Freetown'),
((SELECT id FROM users WHERE email='agent2@example.com'), 'Coastline Sports', 'AG-002', 'Bo');

-- Sample clubs managed by club managers
INSERT INTO clubs (name, country, manager_user_id)
VALUES
('Central FC', 'Sierra Leone', (SELECT id FROM users WHERE email='clubmgr1@example.com')),
('Riverside United', 'Sierra Leone', (SELECT id FROM users WHERE email='clubmgr2@example.com'));

--dml operations
SELECT * FROM users;

UPDATE users
SET email = 'john_updated@player.com'
WHERE id = 1;

DELETE FROM users
WHERE id = 4;