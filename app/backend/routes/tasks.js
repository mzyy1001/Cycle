const express = require('express');
const router = express.Router();
const db = require('../db').tasks;
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// POST /api/tasks
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { mood, task, timestamp, length = 30 } = req.body;
  if (!mood || !task || !timestamp)
    return res.status(400).json({ error: 'Missing fields' });

  const stmt = db.prepare(`
    INSERT INTO tasks (user_id, task, mood, timestamp, length)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(userId, task, JSON.stringify(mood), timestamp, length);


  const newTask = {
    id: info.lastInsertRowid,
    task,
    mood,
    timestamp,
    length
  };
  res.status(201).json({ message: 'Task created', task: newTask });
});

// GET /api/tasks
router.get('/', (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const mood = JSON.parse(req.query.mood);
  const search = req.query.search?.toLowerCase();

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (mood) {
    query += ' AND mood LIKE ?';
    params.push(`%${mood}%`);
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

  const {
    mood = JSON.parse(old.mood),
    task: taskName = old.task,
    timestamp = old.timestamp,
    length = old.length,
    isScheduled = old.isScheduled
  } = req.body;

  if (!Array.isArray(mood)) {
    return res.status(400).json({ error: 'Mood must be an array of strings' });
  }

  db.prepare(`
    UPDATE tasks SET mood = ?, task = ?, timestamp = ?, length = ?
    WHERE id = ?
  `).run(mood, taskName, timestamp, length, id);

  res.json({ message: 'Task updated', task: { id, mood, task: taskName, timestamp, length, isScheduled } });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);

  res.json({ message: 'Task deleted' });
});

module.exports = router;
