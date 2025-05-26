import { useEffect, useState } from 'react';
import FileTree from './fileTree.js';
import { FolderPlus, FilePlus, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

function Explorer({
  onFileSelect,
  activeEditorTabs,
  setActiveEditorTabs,
  setSelectedTabId,
  uid,
  projectId,
  isAuthenticated = false,
}) {
  const defaultFolder = {
    id: 'root',
    type: 'folder',
    name: isAuthenticated ? 'welcome' : 'guest-workspace',
    children: isAuthenticated
      ? []
      : [
          {
            id: 'sample-js',
            type: 'file',
            name: 'sample.js',
            content: '// Welcome to the Code Editor!\n// You\'re in guest mode - changes won\'t be saved permanently.\n\nconsole.log("Hello, World!");\n\n// Try writing some code here!',
            language: 'javascript',
          },
          {
            id: 'sample-py',
            type: 'file',
            name: 'sample.py',
            content: '# Welcome to the Code Editor!\n# You\'re in guest mode - changes won\'t be saved permanently.\n\nprint("Hello, World!")\n\n# Try writing some Python code here!',
            language: 'python',
          },
        ],
  };

  const [fileTree, setFileTree] = useState(defaultFolder);

  function insertNode(tree, parentId, newNode) {
    if (tree.id === parentId) {
      return {
        ...tree,
        children: [...(tree.children || []), newNode],
      };
    }
    if (tree.children) {
      return {
        ...tree,
        children: tree.children.map((child) => insertNode(child, parentId, newNode)),
      };
    }
    return tree;
  }

  function updateNode(tree, id, newName) {
    if (tree.id === id) {
      return {
        ...tree,
        name: newName,
      };
    }
    if (tree.children) {
      return {
        ...tree,
        children: tree.children.map((child) => updateNode(child, id, newName)),
      };
    }
    return tree;
  }

  function deleteNode(tree, id) {
    if (!tree.children) return tree;

    const filteredChildren = tree.children
      .filter((child) => child.id !== id)
      .map((child) => deleteNode(child, id));

    return {
      ...tree,
      children: filteredChildren,
    };
  }

  useEffect(() => {
    async function loadFiles() {
      if (!isAuthenticated || !uid || !projectId) {
        console.log(
          isAuthenticated ? 'UID or projectId missing — skipping file tree load.' : 'Guest mode — using local file tree.'
        );
        setFileTree(defaultFolder);
        return;
      }

      try {
        const res = await axios.get('pages/api/getFileTree', {
          params: { uid, projectId },
        });

        if (res.status === 200 && res.data && typeof res.data === 'object') {
          console.log(`Loaded fileTree for projectId=${projectId}:`, res.data);
          setFileTree(res.data);
        } else {
          console.warn('No file tree found — using default folder.');
          setFileTree(defaultFolder);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn('File tree not found for user — initializing empty structure.');
          setFileTree(defaultFolder);
        } else {
          console.error('Error loading file tree from backend:', error);
        }
      }
    }

    loadFiles();
  }, [uid, projectId, isAuthenticated]);

  const saveFullTreeToMongoDB = async (updatedTree) => {
    if (!isAuthenticated || !uid || !projectId) {
      console.log('Guest mode or missing uid/projectId: Skipping MongoDB save for file tree');
      return;
    }

    try {
      const response = await axios.post('pages/api/saveFileTree', {
        fileTree: updatedTree,
        uid,
        projectId,
      });
      console.log(`File tree saved for projectId=${projectId}:`, response.data);
    } catch (error) {
      console.error('Error saving file tree to MongoDB:', error);
    }
  };

  const handleRename = async (id, newName) => {
    const updatedTree = updateNode(fileTree, id, newName);
    setFileTree(updatedTree);

    if (isAuthenticated) {
      await saveFullTreeToMongoDB(updatedTree);
    }

    setActiveEditorTabs(
      activeEditorTabs.map((tab) => (tab.id === id ? { ...tab, name: newName } : tab))
    );
  };

  const handleDelete = async (id) => {
    const updatedTree = deleteNode(fileTree, id);
    setFileTree(updatedTree || defaultFolder);

    if (isAuthenticated) {
      await saveFullTreeToMongoDB(updatedTree || defaultFolder);
    }

    setActiveEditorTabs(activeEditorTabs.filter((tab) => tab.id !== id));
  };

  const handleAddFile = async (parentId, fileName, fileData = '') => {
    const newFile = {
      id: uuidv4(),
      type: 'file',
      name: fileName,
      content: fileData,
      language: detectLanguageFromFileName(fileName),
    };

    const updatedTree = insertNode(fileTree, parentId, newFile);
    setFileTree(updatedTree);

    if (isAuthenticated) {
      await saveFullTreeToMongoDB(updatedTree);
    }

    setActiveEditorTabs([
      ...activeEditorTabs,
      { id: newFile.id, name: newFile.name, data: newFile.content },
    ]);
    setSelectedTabId(newFile.id);
    onFileSelect(newFile);
  };

  const handleAddFolder = async (parentId, folderName) => {
    const newFolder = {
      id: uuidv4(),
      type: 'folder',
      name: folderName,
      children: [],
    };

    const updatedTree = insertNode(fileTree, parentId, newFolder);
    setFileTree(updatedTree);

    if (isAuthenticated) {
      await saveFullTreeToMongoDB(updatedTree);
    }
  };

  const openFileInEditor = async (file) => {
    if (!activeEditorTabs.some((tab) => tab.id === file.id)) {
      setActiveEditorTabs([
        ...activeEditorTabs,
        { id: file.id, name: file.name, data: file.content || '' },
      ]);
    }
    setSelectedTabId(file.id);
    onFileSelect && onFileSelect(file);
  };

  const detectLanguageFromFileName = (fileName) => {
    const ext = fileName.split('.').pop();
    switch (ext) {
      case 'js':
        return 'javascript';
      case 'py':
        return 'python';
      case 'cpp':
        return 'cpp';
      case 'java':
        return 'java';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="flex flex-col bg-gray-900 text-gray-100 rounded-r-xl shadow-xl w-72 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Explorer</h3>
          {!isAuthenticated && (
            <span className="text-xs text-yellow-400 mt-1">Guest Mode</span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            title="New File"
            onClick={() => handleAddFile('root', 'newFile.js')}
            className="p-1 rounded hover:bg-gray-700 transition"
          >
            <FilePlus size={16} />
          </button>
          <button
            title="New Folder"
            onClick={() => handleAddFolder('root', 'newFolder')}
            className="p-1 rounded hover:bg-gray-700 transition"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="px-3 py-2 bg-yellow-900/30 border-b border-yellow-600/30">
          <p className="text-xs text-yellow-300">
            💡 Files are temporary in guest mode. Login to save permanently.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-900 p-2 custom-scrollbar">
        <FileTree
          fileTree={fileTree}
          openFileInEditor={openFileInEditor}
          handleAddFile={handleAddFile}
          handleAddFolder={handleAddFolder}
          handleRename={handleRename}
          handleDelete={handleDelete}
          renderFolderToggle={(isOpen) =>
            isOpen ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronRight size={14} className="text-gray-400" />
            )
          }
          itemClassName={({ isSelected }) =>
            `flex items-center px-3 py-1 rounded-lg cursor-pointer transition ${
              isSelected ? 'bg-cyan-700 text-white' : 'hover:bg-gray-800 text-gray-300'
            }`
          }
          indentPx={12}
        />
      </div>
    </div>
  );
}

export default Explorer;