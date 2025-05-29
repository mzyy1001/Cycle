// backend/routes/users.js
const express = require('express');
const router = express.Router();

const users = [];

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'User already exists' });
  users.push({ username, password });
  res.status(201).json({ message: 'User registered' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ message: 'Login successful', token: username });
});

module.exports = router;
