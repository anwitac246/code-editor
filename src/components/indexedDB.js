// indexedDB.js
import { openDB } from 'idb';

const DB_NAME = 'fileDB';
const STORE_NAME = 'files';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

// For the editor: save file content using a key (e.g., file id)
export async function saveFile(id, content) {
  const db = await getDB();
  await db.put(STORE_NAME, { id, data: content });
}

// For the editor: load file content by key
export async function loadFile(id) {
  const db = await getDB();
  const item = await db.get(STORE_NAME, id);
  return item ? item.data : null;
}

// For file explorer: save a file or folder object
export async function saveFileOrFolder(item) {
  const db = await getDB();
  await db.put(STORE_NAME, item);
}

export async function getAllFilesAndFolders() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function deleteFileOrFolder(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
