import clientPromise from '../../src/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { uid, projectId } = req.query;

  if (!uid || !projectId) return res.status(400).json({ message: 'Missing uid or projectId' });

  try {
    const client = await clientPromise;
    const db = client.db('codeEditor');
    const project = await db.collection('fileTrees').findOne({ uid, projectId });

    if (!project) return res.status(404).json({ message: 'No file tree found' });

    res.status(200).json(project.fileTree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
