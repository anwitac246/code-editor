import { useEffect, useState } from "react";
import FileTree from "./fileTree.js";
import { FolderPlus, FilePlus, ChevronDown, ChevronRight } from "lucide-react";
import axios from "axios";

function Explorer({
  onFileSelect,
  activeEditorTabs,
  setActiveEditorTabs,
  setSelectedTabId,
  uid,
}) {
  const defaultFolder = {
    id: "root",
    type: "folder",
    name: "welcome",
    children: [],
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
    if (!uid) {
      console.warn("UID is missing — skipping file tree load.");
      return;
    }

    try {
      const res = await axios.get("http://localhost:5001/api/getFileTree", {
        params: { uid },
      });

      if (res.status === 200 && res.data && typeof res.data === "object") {
        setFileTree(res.data);
      } else {
        console.warn("No file tree found — using default folder.");
        setFileTree(defaultFolder);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn("File tree not found for user — initializing empty structure.");
        setFileTree(defaultFolder);
      } else {
        console.error("Error loading file tree from backend:", error);
      }
    }
  }

  loadFiles();
}, [uid]);


  const saveFullTreeToMongoDB = async (updatedTree) => {
    try {
      await axios.post("http://localhost:5001/api/saveFileTree", {
        fileTree: updatedTree,
        uid,
      });
      console.log("File tree saved to MongoDB");
    } catch (error) {
      console.error("Error saving file tree to MongoDB:", error);
    }
  };

  const handleRename = async (id, newName) => {
    const updatedTree = updateNode(fileTree, id, newName);
    setFileTree(updatedTree);
    await saveFullTreeToMongoDB(updatedTree);
    setActiveEditorTabs(
      activeEditorTabs.map((tab) =>
        tab.id === id ? { ...tab, name: newName } : tab
      )
    );
  };

  const handleDelete = async (id) => {
    const updatedTree = deleteNode(fileTree, id);
    setFileTree(updatedTree || defaultFolder);
    await saveFullTreeToMongoDB(updatedTree || defaultFolder);
    setActiveEditorTabs(activeEditorTabs.filter((tab) => tab.id !== id));
  };

  const handleAddFile = async (parentId, fileName, fileData = "") => {
    const newFile = {
      id: Date.now().toString(),
      type: "file",
      name: fileName,
      data: fileData,
    };

    const updatedTree = insertNode(fileTree, parentId, newFile);
    setFileTree(updatedTree);
    await saveFullTreeToMongoDB(updatedTree);
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

    const updatedTree = insertNode(fileTree, parentId, newFolder);
    setFileTree(updatedTree);
    await saveFullTreeToMongoDB(updatedTree);
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
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Explorer
        </h3>
        <div className="flex space-x-2">
          <button
            title="New File"
            onClick={() => handleAddFile("root", "newFile.js")}
            className="p-1 rounded hover:bg-gray-700 transition"
          >
            <FilePlus size={16} />
          </button>
          <button
            title="New Folder"
            onClick={() => handleAddFolder("root", "newFolder")}
            className="p-1 rounded hover:bg-gray-700 transition"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

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
                 ? "bg-cyan-700 text-white"
                 : "hover:bg-gray-800 text-gray-300"
             }`
          }
          indentPx={12}
        />
      </div>
    </div>
  );
}

export default Explorer;
