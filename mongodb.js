import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

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

let db;
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('codeEditor');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

const updateFileInTree = (tree, fileId, content, language) => {
  console.log(`Updating file in tree: fileId=${fileId}, content length=${content.length}`);
  if (tree.id === fileId && tree.type === 'file') {
    console.log(`Found file ${fileId}, updating content`);
    return { ...tree, content, language, updatedAt: new Date() };
  }
  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map((child) => updateFileInTree(child, fileId, content, language)),
    };
  }
  return tree;
};

app.get('/', (req, res) => {
  res.send('Backend server is running');
});

app.get('/api/projects', async (req, res) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ message: 'Missing uid' });
  }

  try {
    const fileTrees = db.collection('fileTrees');
    const userProjects = await fileTrees.find({ uid }).sort({ updatedAt: -1 }).toArray();
    console.log(`Fetched ${userProjects.length} projects for uid=${uid}`);

    const projects = userProjects.map((doc) => ({
      _id: doc._id,
      projectId: doc.projectId,
      name: doc.name,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error retrieving projects:', error);
    res.status(500).json({ error: 'Failed to retrieve projects', details: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, description, uid } = req.body;

  if (!uid) {
    return res.status(400).json({ message: 'Missing uid' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    const fileTrees = db.collection('fileTrees');

    const projectId = uuidv4();
    const defaultFileTree = {
      id: 'root',
      type: 'folder',
      name: 'welcome',
      children: [
        {
          id: `file-${uuidv4()}`,
          type: 'file',
          name: 'index.js',
          content: '// Welcome to your new project!\nconsole.log("Hello, World!");',
          language: 'javascript',
        },
      ],
    };

    const newProject = {
      _id: new ObjectId(),
      projectId,
      name: name.trim(),
      description: description?.trim() || '',
      uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      fileTree: defaultFileTree,
    };

    const result = await fileTrees.insertOne(newProject);
    console.log(`Created project: projectId=${projectId}`);

    const createdProject = {
      _id: result.insertedId,
      projectId,
      name: newProject.name,
      description: newProject.description,
      createdAt: newProject.createdAt,
      updatedAt: newProject.updatedAt,
    };

    res.status(201).json({
      message: 'Project created successfully',
      project: createdProject,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

app.put('/api/projects/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { name, description, uid } = req.body;

  if (!uid) {
    return res.status(400).json({ message: 'Missing uid' });
  }

  try {
    const fileTrees = db.collection('fileTrees');

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();

    const result = await fileTrees.updateOne(
      { projectId, uid },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Updated project: projectId=${projectId}`);
    res.status(200).json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

app.delete('/api/projects/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ message: 'Missing uid' });
  }

  try {
    const fileTrees = db.collection('fileTrees');
    console.log(`Attempting to delete project: projectId=${projectId}, uid=${uid}`);

    const query = { projectId: String(projectId), uid: String(uid) };
    console.log('Delete query:', query);

    const project = await fileTrees.findOne(query);
    if (!project) {
      console.log(`No project found for projectId=${projectId}, uid=${uid}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    const result = await fileTrees.deleteOne(query);
    console.log(`Delete result: matchedCount=${result.matchedCount}, deletedCount=${result.deletedCount}`);

    if (result.deletedCount === 0) {
      console.log(`No project deleted for projectId=${projectId}, uid=${uid}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Deleted project: projectId=${projectId}`);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

app.post('/api/saveFile', async (req, res) => {
  const { fileId, content, language, uid, projectId } = req.body;

  if (!uid || !projectId || !fileId) {
    return res.status(400).json({ message: 'Missing uid, projectId, or fileId' });
  }

  try {
    const fileTrees = db.collection('fileTrees');

    const project = await fileTrees.findOne({ projectId, uid });
    if (!project) {
      console.error(`Project not found: projectId=${projectId}, uid=${uid}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    const updatedFileTree = updateFileInTree(project.fileTree, fileId, content, language);
    console.log(`Updated fileTree for projectId=${projectId}, fileId=${fileId}`);

    const result = await fileTrees.updateOne(
      { projectId, uid },
      { $set: { fileTree: updatedFileTree, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      console.error(`No project matched for update: projectId=${projectId}, uid=${uid}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'File saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file', details: error.message });
  }
});

app.get('/api/getFileTree', async (req, res) => {
  const { uid, projectId } = req.query;
  console.log(`GET /api/getFileTree: uid=${uid}, projectId=${projectId}`);

  if (!uid || !projectId) {
    return res.status(400).json({ message: 'Missing uid or projectId' });
  }

  try {
    const fileTrees = db.collection('fileTrees');
    const project = await fileTrees.findOne({ uid, projectId });

    if (!project) {
      console.error(`No project found: uid=${uid}, projectId=${projectId}`);
      return res.status(404).json({ message: 'No file tree found for this user and project' });
    }

    res.status(200).json(project.fileTree);
  } catch (error) {
    console.error('Error retrieving file tree:', error);
    res.status(500).json({ error: 'Failed to retrieve file tree', details: error.message });
  }
});

app.post('/api/saveFileTree', async (req, res) => {
  const { fileTree, uid, projectId } = req.body;

  if (!fileTree || !uid || !projectId) {
    return res.status(400).json({ message: 'Missing required fields: fileTree, uid, or projectId' });
  }

  try {
    const fileTrees = db.collection('fileTrees');

    const result = await fileTrees.updateOne(
      { uid, projectId },
      { $set: { fileTree, updatedAt: new Date() } },
      { upsert: false }
    );

    if (result.matchedCount === 0) {
      console.error(`No project matched for file tree update: projectId=${projectId}, uid=${uid}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Saved fileTree for projectId=${projectId}`);
    res.status(200).json({ message: 'File tree saved successfully' });
  } catch (error) {
    console.error('Error saving file tree:', error);
    res.status(500).json({ error: 'Failed to save file tree', details: error.message });
  }
});

connectToMongoDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});