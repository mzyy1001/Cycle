const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/api/test', (req, res) => {
  res.json({ msg: 'Backend is working' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
