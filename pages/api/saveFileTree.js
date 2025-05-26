import clientPromise from '../../src/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { fileTree, uid, projectId } = req.body;

  if (!fileTree || !uid || !projectId) return res.status(400).json({ message: 'Missing required fields' });

  try {
    const client = await clientPromise;
    const db = client.db('codeEditor');

    const result = await db.collection('fileTrees').updateOne(
      { uid, projectId },
      { $set: { fileTree, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json({ message: 'File tree saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
