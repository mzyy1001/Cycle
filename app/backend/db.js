const Database = require('better-sqlite3');
const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    mood TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    length INTEGER NOT NULL DEFAULT 30,
    isScheduled INTEGER NOT NULL DEFAULT 0
  )
`);

module.exports = db;
