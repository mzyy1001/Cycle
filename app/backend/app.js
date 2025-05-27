const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let moodEntries = [];

app.post('/api/mood', (req, res) => {
    console.log('Received mood entry:', req.body);
    const { mood, timestamp } = req.body;
    moodEntries.push({ mood, timestamp });
    res.status(201).json({ message: 'Entry saved' });
});

app.get('/api/mood', (req, res) => {
    console.log('Fetching mood entries');
    res.json(moodEntries);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
