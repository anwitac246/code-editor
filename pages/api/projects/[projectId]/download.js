import JSZip from 'jszip';
import clientPromise from '../../../../src/lib/mongodb';

const addToZip = (zip, node, currentPath = '') => {
  if (node.type === 'file') {
    const filePath = currentPath ? `${currentPath}/${node.name}` : node.name;
    zip.file(filePath, node.content || '');
  } else if (node.children) {
    const folderPath = currentPath ? `${currentPath}/${node.name}` : node.name;
    node.children.forEach(child => addToZip(zip, child, folderPath));
    if (node.children.length === 0) zip.folder(folderPath);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { projectId, uid } = req.query;
  if (!projectId || !uid) return res.status(400).json({ message: 'Missing projectId or uid' });

  try {
    const client = await clientPromise;
    const db = client.db('codeEditor');
    const project = await db.collection('fileTrees').findOne({ projectId, uid });

    if (!project || !project.fileTree?.children?.length) {
      return res.status(404).json({ message: 'Project or files not found' });
    }

    const zip = new JSZip();
    project.fileTree.children.forEach(child => addToZip(zip, child));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const filename = `${project.name.replace(/\W+/g, '_')}_project.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(zipBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to download', error: error.message });
  }
}
