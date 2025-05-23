import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 5001;
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

app.get('/', (req, res) => {
  res.send('✅ Backend server is running');
});

app.post('/api/saveFile', async (req, res) => {
  const { fileName, content, language, uid } = req.body;

  if (!uid) return res.status(400).json({ message: 'Missing uid' });
  if (!fileName || content === undefined || !language) {
    return res.status(400).json({ message: 'Missing required file fields' });
  }

  try {
    const db = client.db('codeEditor');
    const files = db.collection('files');

    const existingFile = await files.findOne({ fileName, uid });

    if (existingFile) {
      await files.updateOne(
        { fileName, uid },
        { $set: { content, language, updatedAt: new Date() } }
      );
      res.status(200).json({ message: `File "${fileName}" updated successfully` });
    } else {
      await files.insertOne({
        fileName,
        content,
        language,
        uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      res.status(201).json({ message: `File "${fileName}" saved successfully` });
    }
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.get('/api/getFiles', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ message: 'Missing uid' });

  try {
    const db = client.db('codeEditor');
    const files = db.collection('files');
    const fileList = await files.find({ uid }).toArray();
    res.status(200).json(fileList);
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

app.post('/api/saveFileTree', async (req, res) => {
  const { fileTree, uid } = req.body;

  if (!fileTree || !uid) {
    return res.status(400).json({ message: "Missing required fields: fileTree or uid" });
  }

  try {
    const database = client.db('codeEditor');
    const trees = database.collection('fileTrees');

    await trees.updateOne(
      { uid },
      { $set: { fileTree, updatedAt: new Date() } },
      { upsert: true }
    );

    res.status(200).json({ message: 'File tree with contents saved successfully' });
  } catch (error) {
    console.error('Error saving file tree:', error);
    res.status(500).json({ error: 'Failed to save file tree' });
  }
});


app.get('/api/getFileTree', async (req, res) => {
  console.log('➡️  GET /api/getFileTree called with query:', req.query);
  const { uid } = req.query;

  if (!uid) {
    console.log('Missing uid in query');
    return res.status(400).json({ message: 'Missing uid' });
  }

  try {
    const db = client.db('codeEditor');
    const trees = db.collection('fileTrees');
    const userTree = await trees.findOne({ uid });

    if (!userTree) {
      return res.status(404).json({ message: 'No file tree found for this user' });
    }

    res.status(200).json(userTree.fileTree);
  } catch (error) {
    console.error('Error retrieving file tree:', error);
    res.status(500).json({ error: 'Failed to retrieve file tree' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  connectToMongoDB();
});
