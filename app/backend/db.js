const Database = require('better-sqlite3');
const tasksDB = new Database('tasks.db');

tasksDB.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task TEXT NOT NULL,
    mood TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    length INTEGER NOT NULL DEFAULT 30,
    isCompleted INTEGER NOT NULL DEFAULT 0
  )
`);

const usersDB = new Database('users.db');

usersDB.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

module.exports = { tasks: tasksDB, users: usersDB };
