import { useEffect, useState } from "react";
import FileTree from "./fileTree.js";
import Tree from "../hooks/tree.js";
import {
  saveFileOrFolder,
  getAllFilesAndFolders,
  deleteFileOrFolder,
} from "./indexedDB";
import { FolderPlus, FilePlus } from "lucide-react";

function Explorer({
  onFileSelect,
  activeEditorTabs,
  setActiveEditorTabs,
  setSelectedTabId,
}) {
  const defaultFolder = {
    id: "root",
    type: "folder",
    name: "welcome",
    children: [],
  };

  const [fileTree, setFileTree] = useState(defaultFolder);
  const { insertNode, deleteNode, updateNode } = Tree();

  useEffect(() => {
    async function loadFiles() {
      const storedFiles = await getAllFilesAndFolders();
      if (storedFiles.length > 0) {
        setFileTree({
          id: "root",
          type: "folder",
          name: "welcome",
          children: storedFiles,
        });
      }
    }
    loadFiles();
  }, []);

  const handleRename = async (id, newName) => {
    setFileTree(updateNode(fileTree, id, newName));
    await saveFileOrFolder({ ...fileTree, name: newName });
    setActiveEditorTabs(
      activeEditorTabs.map((tab) =>
        tab.id === id ? { ...tab, name: newName } : tab
      )
    );
  };

  const handleDelete = async (id) => {
    const updatedTree = deleteNode(fileTree, id);
    setFileTree(updatedTree || defaultFolder);
    await deleteFileOrFolder(id);
    setActiveEditorTabs(activeEditorTabs.filter((tab) => tab.id !== id));
  };

  const handleAddFile = async (parentId, fileName, fileData = "") => {
    const newFile = {
      id: Date.now().toString(),
      type: "file",
      name: fileName,
      data: fileData || "",
    };

    setFileTree(insertNode(fileTree, parentId, newFile));
    await saveFileOrFolder(newFile);
    setActiveEditorTabs([
      ...activeEditorTabs,
      { id: newFile.id, name: newFile.name, data: newFile.data },
    ]);
    setSelectedTabId(newFile.id);
  };

  const handleAddFolder = async (parentId, folderName) => {
    const newFolder = {
      id: Date.now().toString(),
      type: "folder",
      name: folderName,
      children: [],
    };

    setFileTree(insertNode(fileTree, parentId, newFolder));
    await saveFileOrFolder(newFolder);
  };

  const openFileInEditor = async (file) => {
    if (!activeEditorTabs.some((tab) => tab.id === file.id)) {
      setActiveEditorTabs([
        ...activeEditorTabs,
        { id: file.id, name: file.name, data: file.data },
      ]);
    }
    setSelectedTabId(file.id);
    onFileSelect && onFileSelect(file);
  };

  return (
    <div className="flex flex-col bg-gray-900 text-gray-100 rounded-r-xl shadow-xl w-72 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Explorer
        </h3>
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

      {/* File tree */}
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
            `flex items-center px-3 py-1 rounded-lg cursor-pointer transition
             ${
               isSelected
                 ? 'bg-cyan-700 text-white'
                 : 'hover:bg-gray-800 text-gray-300'
             }`
          }
          indentPx={12}
        />
      </div>
    </div>
  );
}

export default Explorer;
