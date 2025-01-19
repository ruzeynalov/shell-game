// server.mjs
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Setup lowdb
const dbFilePath = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFilePath);
const db = new Low(new JSONFile('db.json'), {
  // autoLoad means it'll automatically call read()
  // autoSave means it'll automatically call write()
  autoLoad: true,
  autoSave: true,

  // If there's no data after reading, use this default
  defaultData: {
    results: []
  }
});

async function initDB() {
  await db.read();
  db.data ||= { results: [] }; // fallback if empty
  await db.write();
}

// 1) Wait for DB init to finish
await initDB();

// 2) Define your routes, which can now safely reference db.data
app.get('/api/results', async (req, res) => {
  await db.read(); // always refresh from file
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

// 3) Optionally serve your React build
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// 4) Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
