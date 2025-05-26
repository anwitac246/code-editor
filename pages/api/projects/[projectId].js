import clientPromise from '../../../src/lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('codeEditor');
  const { projectId } = req.query;

  if (req.method === 'PUT') {
    const { uid, name, description } = req.body;
    if (!uid) return res.status(400).json({ message: 'Missing uid' });

    const result = await db.collection('fileTrees').updateOne(
      { projectId, uid },
      { $set: { name: name?.trim(), description: description?.trim(), updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json({ message: 'Project updated' });
  }

  else if (req.method === 'DELETE') {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ message: 'Missing uid' });

    const result = await db.collection('fileTrees').deleteOne({ projectId, uid });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json({ message: 'Project deleted' });
  }

  else {
    res.status(405).end();
  }
}
