/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import FileTree from "./fileTree.js";
import Tree from "../hooks/tree.js";
import { saveFileOrFolder, getAllFilesAndFolders, deleteFileOrFolder } from "./indexedDB";

function Explorer({ onFileSelect, activeEditorTabs, setActiveEditorTabs, setSelectedTabId }) {
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
        setFileTree({ id: "root", type: "folder", name: "welcome", children: storedFiles });
      }
    }
    loadFiles();
  }, []);

  const handleRename = async (id, newName) => {
    setFileTree(updateNode(fileTree, id, newName));
    await saveFileOrFolder({ ...fileTree, name: newName });
    setActiveEditorTabs(
      activeEditorTabs.map((tab) => (tab.id === id ? { ...tab, name: newName } : tab))
    );
  };

  const handleDelete = async (id) => {
    const updatedTree = deleteNode(fileTree, id);
    setFileTree(updatedTree || defaultFolder);
    await deleteFileOrFolder(id);
    setActiveEditorTabs(activeEditorTabs.filter((tab) => tab.id !== id));
  };

  // Create a new file with empty content by default.
  const handleAddFile = async (parentId, fileName, fileData = "") => {
    const newFile = {
      id: Date.now().toString(),
      type: "file",
      name: fileName,
      data: fileData || "",
    };

    setFileTree(insertNode(fileTree, parentId, newFile));
    await saveFileOrFolder(newFile);
    setActiveEditorTabs([...activeEditorTabs, { id: newFile.id, name: newFile.name, data: newFile.data }]);
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

  // When a file is clicked, open it by invoking the callback.
  const openFileInEditor = async (file) => {
    // Manage active editor tabs using setActiveEditorTabs (there is no function named handleActiveEditorTabs)
    if (!activeEditorTabs.some((tab) => tab.id === file.id)) {
      setActiveEditorTabs([...activeEditorTabs, { id: file.id, name: file.name, data: file.data }]);
    }
    setSelectedTabId(file.id);
    onFileSelect && onFileSelect(file);
  };

  return (
    <div className="min-w-80 border-r border-r-vsdark-3 flex flex-col">
      <div className="px-4 py-2 border-b border-b-vsdark-3">
        <h3 className="text-xxs uppercase text-vsdark-4">Explorer</h3>
      </div>
      <div className="p-2 overflow-auto h-full">
        <FileTree
          handleDelete={handleDelete}
          handleAddFile={handleAddFile}
          handleAddFolder={handleAddFolder}
          handleRename={handleRename}
          fileTree={fileTree}
          openFileInEditor={openFileInEditor}
        />
      </div>
    </div>
  );
}

export default Explorer;
