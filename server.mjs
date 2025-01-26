// server.mjs
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'rediss://:p64efc76d71d932225353f32f6accc20514acbb73df5b3c540c8f989437356d92@ec2-3-218-212-254.compute-1.amazonaws.com:10230', // Ensure Redis URL is set for Heroku
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
await redisClient.connect();

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
