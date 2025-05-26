import clientPromise from '../../src/lib/mongodb';

const updateFileInTree = (tree, fileId, content, language) => {
  if (tree.id === fileId && tree.type === 'file') {
    return { ...tree, content, language, updatedAt: new Date() };
  }
  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map((child) =>
        updateFileInTree(child, fileId, content, language)
      ),
    };
  }
  return tree;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { fileId, content, language, uid, projectId } = req.body;

  if (!uid || !projectId || !fileId) return res.status(400).json({ message: 'Missing fields' });

  try {
    const client = await clientPromise;
    const db = client.db('codeEditor');

    const project = await db.collection('fileTrees').findOne({ projectId, uid });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updatedFileTree = updateFileInTree(project.fileTree, fileId, content, language);

    const result = await db.collection('fileTrees').updateOne(
      { projectId, uid },
      { $set: { fileTree: updatedFileTree, updatedAt: new Date() } }
    );

    res.status(200).json({ message: 'File saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
