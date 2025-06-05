const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// POST /api/tasks
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { mood, task, timestamp, length = 30 } = req.body;
  if (!mood || !task || !timestamp)
    return res.status(400).json({ error: 'Missing fields' });

  const stmt = db.prepare(`
    INSERT INTO tasks (userId, task, mood, timestamp, length, isScheduled)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  const info = stmt.run(userId, task, mood, timestamp, length);


  const newTask = {
    id: info.lastInsertRowid,
    task,
    mood,
    timestamp,
    length,
    isScheduled: false
  };
  res.status(201).json({ message: 'Task created', task: newTask });
});

// GET /api/tasks
router.get('/', (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const mood = req.query.mood;
  const search = req.query.search?.toLowerCase();
  const isScheduled = req.query.isScheduled;

  let query = 'SELECT * FROM tasks WHERE userId = ?';
  const params = [userId];

  if (mood) {
    query += ' AND mood = ?';
    params.push(mood);
  }

  if (isScheduled === 'true' || isScheduled === 'false') {
    query += ' AND isScheduled = ?';
    params.push(isScheduled === 'true' ? 1 : 0);
  }

  if (search) {
    query += ' AND LOWER(task) LIKE ?';
    params.push(`%${search}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) AS count FROM (${query})`).get(...params).count;
  const tasks = db.prepare(`${query} ORDER BY timestamp ASC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

  res.json({
    tasks,
    totalPages: Math.ceil(total / pageSize)
  });
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const old = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!old) return res.status(404).json({ error: 'Task not found' });

  const { mood = old.mood, task: taskName = old.task, timestamp = old.timestamp, length = old.length, isScheduled = old.isScheduled } = req.body;

  db.prepare(`
    UPDATE tasks SET mood = ?, task = ?, timestamp = ?, length = ?, isScheduled = ?
    WHERE id = ?
  `).run(mood, taskName, timestamp, length, isScheduled ? 1 : 0, id);

  res.json({ message: 'Task updated', task: { id, mood, task: taskName, timestamp, length, isScheduled } });
});

// PATCH /api/tasks/:id/schedule
router.patch('/:id/schedule', (req, res) => {
  const id = parseInt(req.params.id);
  const stmt = db.prepare('UPDATE tasks SET isScheduled = 1 WHERE id = ?');
  const info = stmt.run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ message: 'Task scheduled', task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND userId = ?').get(id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);

  res.json({ message: 'Task deleted' });
});

module.exports = router;
