const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());


app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PATCH') {
    console.log('📦 Body:', req.body);
  }
  next();
});



app.use('/api', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/api/test', (req, res) => {
  res.json({ msg: 'Backend is working' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
