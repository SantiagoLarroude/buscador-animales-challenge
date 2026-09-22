const fs = require('fs/promises');
const path = require('path');

// Dynamic paths to the /database folder
const DB_DIR = path.join(__dirname, '../../database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const ANIMALS_FILE = path.join(DB_DIR, 'animals.json');

/**
 * Ensure the /database directory and base files exist.
 */
async function ensureDbExists() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });

    // If users.json does not exist, create an empty []
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // If animals.json does not exist, create an empty []
    try {
      await fs.access(ANIMALS_FILE);
    } catch {
      await fs.writeFile(ANIMALS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error initializing JSON DB:', error);
  }
}

/**
 * Safe JSON read.
 * @param {string} filePath
 * @returns {Promise<Array|Object>}
 */
async function readJson(filePath) {
  await ensureDbExists();
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

/**
 * Atomic JSON write.
 * @param {string} filePath
 * @param {Array|Object} data
 */
async function writeJson(filePath, data) {
  await ensureDbExists();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

module.exports = {
  getUsers: () => readJson(USERS_FILE),
  saveUsers: (users) => writeJson(USERS_FILE, users),
  getAnimals: () => readJson(ANIMALS_FILE),
  saveAnimals: (animals) => writeJson(ANIMALS_FILE, animals),
};
