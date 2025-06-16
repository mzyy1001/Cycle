const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('users.db');

const fakeUsers = [
  { username: 'alice', streak: 12 },
  { username: 'bob', streak: 9 },
  { username: 'charlie', streak: 8 },
  { username: 'daisy', streak: 7 },
  { username: 'edward', streak: 6 },
  { username: 'felix', streak: 6 },
  { username: 'gina', streak: 5 },
  { username: 'henry', streak: 4 },
];

(async () => {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, lastCheckinDate, streakCount)
    VALUES (?, ?, ?, ?)
  `);

  for (const user of fakeUsers) {
    const hashedPassword = await bcrypt.hash('fakepassword', 10);
    insertStmt.run(
      user.username,
      hashedPassword,
      new Date().toISOString().slice(0, 10),
      user.streak
    );
    console.log(`Inserted fake user: ${user.username}`);
  }

  db.close();
})();
