// server.mjs
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Same as before
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Setup lowdb with autoLoad, autoSave, defaultData
const db = new Low(new JSONFile('db.json'), {
  autoLoad: true,
  autoSave: true,
  defaultData: {
    results: []
  }
});

async function initDB() {
  await db.read();
  db.data ||= { results: [] };
  await db.write();
}

// Wait for DB init
await initDB();

// Existing routes
app.get('/api/results', async (req, res) => {
  await db.read();
  res.json(db.data.results);
});

app.post('/api/results', async (req, res) => {
  await db.read();
  db.data.results.push({
    username: req.body.username,
    outcome: req.body.outcome,
    timestamp: new Date().toISOString()
  });
  await db.write();
  res.status(201).json({ message: 'Result saved' });
});

// NEW Leaderboard route - minimal addition
app.get('/api/leaderboard', async (req, res) => {
  await db.read();
  // Tally wins for each username
  const tallies = {};
  for (const entry of db.data.results) {
    const { username, outcome } = entry;
    if (!tallies[username]) {
      tallies[username] = { username, wins: 0 };
    }
    if (outcome === 'win') {
      tallies[username].wins++;
    }
  }
  // Convert to array, sort descending by wins
  const leaderboard = Object.values(tallies).sort((a, b) => b.wins - a.wins);
  res.json(leaderboard);
});

// Serve React build
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
