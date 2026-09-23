const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = process.env.DB_DIR
  ? path.resolve(process.env.DB_DIR)
  : path.join(__dirname, '../../database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const ANIMALS_FILE = path.join(DB_DIR, 'animals.json');
let usersMutationQueue = Promise.resolve();

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

  } catch (error) {
    throw new Error(`No se pudo inicializar la persistencia JSON: ${error.message}`, { cause: error });
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
    const parsed = JSON.parse(data || '[]');
    if (!Array.isArray(parsed)) {
      throw new Error('El contenido debe ser un arreglo JSON.');
    }
    return parsed;
  } catch (error) {
    throw new Error(`No se pudo leer ${path.basename(filePath)}: ${error.message}`, { cause: error });
  }
}

/**
 * Atomic JSON write.
 * @param {string} filePath
 * @param {Array|Object} data
 */
async function writeJson(filePath, data) {
  await ensureDbExists();
  const temporaryFile = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    await fs.rename(temporaryFile, filePath);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => {});
    throw new Error(`No se pudo escribir ${path.basename(filePath)}: ${error.message}`, { cause: error });
  }
}

function enqueueUsersMutation(operation) {
  const queuedOperation = usersMutationQueue.then(operation, operation);
  usersMutationQueue = queuedOperation.then(() => undefined, () => undefined);
  return queuedOperation;
}

async function createUser({ email, passwordHash }) {
  return enqueueUsersMutation(async () => {
    const users = await readJson(USERS_FILE);
    if (users.some((user) => user.email.toLowerCase() === email)) {
      return null;
    }

    const maxExistingId = users.reduce((maxId, user) => Math.max(maxId, Number(user.id) || 0), 0);
    const newUser = {
      id: Math.max(Date.now(), maxExistingId + 1),
      email,
      passwordHash,
    };

    users.push(newUser);
    await writeJson(USERS_FILE, users);
    return newUser;
  });
}

function saveUsers(users) {
  return enqueueUsersMutation(() => writeJson(USERS_FILE, users));
}

module.exports = {
  getUsers: () => readJson(USERS_FILE),
  saveUsers,
  createUser,
  getAnimals: () => readJson(ANIMALS_FILE),
  saveAnimals: (animals) => writeJson(ANIMALS_FILE, animals),
};
