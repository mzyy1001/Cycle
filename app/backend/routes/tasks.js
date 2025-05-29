// backend/routes/tasks.js
const express = require('express');
const router = express.Router();

let tasks = [];


router.post('/', (req, res) => {
  const { mood, task, timestamp, length = 30 } = req.body;
  if (!mood || !task || !timestamp) return res.status(400).json({ error: 'Missing fields' });
  const newTask = {
    id: tasks.length + 1,
    mood,
    task,
    timestamp,
    length,
    isScheduled: false
  };
  tasks.push(newTask);
  res.status(201).json({ message: 'Task created', task: newTask });
});

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 5;
  const paged = tasks.slice((page - 1) * pageSize, page * pageSize);
  res.json({ tasks: paged, totalPages: Math.ceil(tasks.length / pageSize) });
});

router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { mood, task: taskName, timestamp, length } = req.body;
  if (mood) task.mood = mood;
  if (taskName) task.task = taskName;
  if (timestamp) task.timestamp = timestamp;
  if (length) task.length = length;

  res.json({ message: 'Task updated', task });
});

router.patch('/:id/schedule', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.isScheduled = true;
  res.json({ message: 'Task scheduled', task });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(index, 1);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
