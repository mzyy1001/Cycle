// CHECK-IN
const express = require('express');
const router = express.Router();
const db = require('../db').users;
const authenticateToken = require('../middleware/auth');
require('dotenv').config();
const path = require('path');

router.use(authenticateToken);

router.post('/checkin', (req, res) => {
  const userId = req.user?.id;
  console.log("User ID from token:", req.user?.id);

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const lastDate = user.lastCheckinDate;

  let newStreak = user.streakCount || 0;

  if (lastDate === today) {
    return res.status(200).json({ message: 'Already checked in today', streak: newStreak });
  }

  if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expected = yesterday.toISOString().slice(0, 10);
    if (lastDate === expected) {
      newStreak += 1;
    } else {
      newStreak = 1; // reset streak
    }
  } else {
    newStreak = 1; // first check-in ever
  }

  const updateStmt = db.prepare('UPDATE users SET lastCheckinDate = ?, streakCount = ? WHERE id = ?');
  updateStmt.run(today, newStreak, userId);

  return res.json({ message: 'Check-in recorded', streak: newStreak });
});



router.get('/', (req, res) => {
  const stmt = db.prepare(`
    SELECT id, username, streakCount
    FROM users
    ORDER BY streakCount DESC, username ASC
  `);

  const users = stmt.all();

  res.json({
    rank: users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      streak: u.streakCount,
      isMe: u.id === req.user.id, // frontend 
    })),
  });
});

router.get('/streak', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const stmt = db.prepare('SELECT streakCount FROM users WHERE id = ?');
  const row = stmt.get(userId);

  if (!row) return res.status(404).json({ error: 'User not found' });

  res.json({ streak: row.streakCount });
});
module.exports = router;

