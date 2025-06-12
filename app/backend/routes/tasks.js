const express = require('express');
const router = express.Router();
const db = require('../db').tasks;
const authenticateToken = require('../middleware/auth');
require('dotenv').config();
const path = require('path');

router.use(authenticateToken);

// POST /api/tasks
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { mood, task, timestamp, length = 30 } = req.body;
  if (!mood || !task || !timestamp)
    return res.status(400).json({ error: 'Missing fields' });

  const stmt = db.prepare(`
    INSERT INTO tasks (user_id, task, mood, timestamp, length, isCompleted)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(userId, task, JSON.stringify(mood), timestamp, length, 0);


  const newTask = {
    id: info.lastInsertRowid,
    task,
    mood,
    timestamp,
    length,
    isCOmpleted: 0
  };
  res.status(201).json({ message: 'Task created', task: newTask });
});

// GET /api/tasks
router.get('/', (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  let mood = null;
  if (req.query.mood) {
    try {
      mood = JSON.parse(req.query.mood);
      if (!Array.isArray(mood)) throw new Error();
    } catch (e) {
      return res.status(400).json({ error: 'Invalid mood format. Must be a JSON array.' });
    }
  }
  const search = req.query.search?.toLowerCase();

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (mood && mood.length > 0) {
    const moodConditions = mood.map(() => 'mood LIKE ?').join(' OR ');
    query += ` AND (${moodConditions})`;
    for (const m of mood) {
      params.push(`%${m}%`);
    }
  }

  if (search) {
    query += ' AND LOWER(task) LIKE ?';
    params.push(`%${search}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) AS count FROM (${query})`).get(...params).count;
  const tasks = db.prepare(`${query} ORDER BY timestamp ASC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
  for (const task of tasks) {
    try {
      task.mood = JSON.parse(task.mood);
    } catch {
      task.mood = [];
    }
  }
  res.json({
    tasks,
    totalPages: Math.ceil(total / pageSize)
  });
});

const { spawn } = require('child_process');

router.post('/reschedule', async (req, res) => {
  const userId = req.user.id;
  const inputDate = req.body.date;
  const currMood = req.body.currentMood;

  if (!inputDate || !/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    console.error('Invalid date format:', inputDate);
    return res.status(400).json({ error: 'Missing or invalid date (expected YYYY-MM-DD)' });
  }

  const unlockedTasks = db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND DATE(timestamp) = DATE(?) AND isCompleted = 0 AND isLocked = 0
    ORDER BY timestamp ASC
  `).all(userId, inputDate);

  const lockedTasks = db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND DATE(timestamp) = DATE(?) AND isLocked = 1
    ORDER BY timestamp ASC
  `).all(userId, inputDate);

  if (!unlockedTasks.length) {
    return res.status(404).json({ error: 'No tasks found for this date' });
  }

  const python = spawn('python3', ['reschedule.py'], {
    env: { ...process.env }
  });

  let result = '';
  let error = '';

  python.stdout.on('data', (data) => {
    result += data.toString();
  });

  python.stderr.on('data', (data) => {
    error += data.toString();
  });

  const input = {
    tasks: unlockedTasks,
    blockedSlots: lockedTasks.map(t => ({
      start: t.timestamp,
      end: new Date(new Date(t.timestamp).getTime() + t.length * 60000).toISOString(),
    })),
    date: inputDate,
    currentMood: currMood
  };

  python.stdin.write(JSON.stringify(input));
  python.stdin.end();

  python.on('close', (code) => {
    console.log('[reschedule.py final stdout]', result); 
    console.log('[reschedule.py exit code]', code);
    console.error('[reschedule.py final stderr]', error); 

    if (code !== 0 || error) {
      return res.status(500).json({ error: error || 'Rescheduling failed' });
    }

    try {
      const newTasks = JSON.parse(result);

      const stmt = db.prepare(`UPDATE tasks SET timestamp = ? WHERE id = ?`);
      const updateMany = db.transaction((tasks) => {
        for (const t of tasks) {
          stmt.run(t.timestamp, t.id);
        }
      });
      updateMany(newTasks);

      res.json({ message: 'Tasks rescheduled', tasks: newTasks });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse rescheduled tasks' });
    }
  });
});


router.patch('/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  const stmt = db.prepare('UPDATE tasks SET isCompleted = 1 WHERE id = ?');
  const info = stmt.run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Task not found or already completed' });
  }
  res.json({ message: 'Task marked as completed', id });
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
    isLocked = old.isLocked || false
  } = req.body;

  if (!Array.isArray(mood)) {
    return res.status(400).json({ error: 'Mood must be an array of strings' });
  }

  db.prepare(`
    UPDATE tasks SET mood = ?, task = ?, timestamp = ?, length = ?, isLocked = ?
    WHERE id = ?
  `).run(mood, taskName, timestamp, length, id, isLocked);

  res.json({ message: 'Task updated', task: { id, mood, task: taskName, timestamp, length, isLocked} });
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
