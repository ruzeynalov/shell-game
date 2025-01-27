// server.mjs
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Redis from 'ioredis';

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ioredis client setup
const redisClient = new Redis("rediss://:p64efc76d71d932225353f32f6accc20514acbb73df5b3c540c8f989437356d92@ec2-3-218-212-254.compute-1.amazonaws.com:10230", {
  tls: {
    rejectUnauthorized: false,
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Initialize Redis data structure if empty
const RESULTS_KEY = 'results';
(async () => {
  const exists = await redisClient.exists(RESULTS_KEY);
  if (!exists) {
    await redisClient.set(RESULTS_KEY, JSON.stringify([]));
  }
})();

// Routes
app.get('/api/results', async (req, res) => {
  try {
    const data = await redisClient.get(RESULTS_KEY);
    const results = JSON.parse(data) || [];
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching results');
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const { username, outcome } = req.body;
    if (!username || !outcome) {
      return res.status(400).send('Invalid data');
    }

    const newResult = { username, outcome, timestamp: new Date().toISOString() };
    const data = await redisClient.get(RESULTS_KEY);
    const results = JSON.parse(data) || [];

    results.push(newResult);
    await redisClient.set(RESULTS_KEY, JSON.stringify(results));

    res.status(201).json(newResult);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving result');
  }
});

// Leaderboard route
app.get('/api/leaderboard', async (req, res) => {
  try {
    const data = await redisClient.get(RESULTS_KEY);
    const results = JSON.parse(data) || [];

    // Tally wins for each username
    const tallies = {};
    for (const entry of results) {
      const { username, outcome } = entry;
      if (!tallies[username]) {
        tallies[username] = { username, wins: 0 };
      }
      if (outcome === 'win') {
        tallies[username].wins++;
      }
    }

    // Convert tallies to an array and sort by wins descending
    const leaderboard = Object.values(tallies).sort((a, b) => b.wins - a.wins);
    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching leaderboard');
  }
});

// 3) Optionally serve your React build
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
