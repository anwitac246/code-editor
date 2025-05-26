import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import clientPromise from '../../../src/lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('codeEditor');
  const collection = db.collection('fileTrees');

  if (req.method === 'GET') {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ message: 'Missing uid' });

    const projects = await collection.find({ uid }).sort({ updatedAt: -1 }).toArray();
    res.status(200).json({
      projects: projects.map(({ _id, projectId, name, description, createdAt, updatedAt }) => ({
        _id, projectId, name, description, createdAt, updatedAt,
      })),
    });
  }

  else if (req.method === 'POST') {
    const { name, description, uid } = req.body;
    if (!uid || !name) return res.status(400).json({ message: 'Missing required fields' });

    const projectId = uuidv4();
    const newProject = {
      _id: new ObjectId(),
      projectId,
      name: name.trim(),
      description: description?.trim() || '',
      uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      fileTree: {
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
      },
    };

    const result = await collection.insertOne(newProject);
    res.status(201).json({
      message: 'Project created',
      project: {
        _id: result.insertedId,
        projectId,
        name: newProject.name,
        description: newProject.description,
        createdAt: newProject.createdAt,
        updatedAt: newProject.updatedAt,
      },
    });
  }

  else {
    res.status(405).end();
  }
}
