const { MongoClient } = require('mongodb');

let db;
let client;

const uri = process.env.URI;
console.log('MongoDB URI:', uri);
async function initDatabase() {
  try {
    client = await MongoClient.connect(uri);

    db = client.db();
    console.log('Connected to MongoDB');
    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}

function getDatabase() {
  return db;
}

module.exports = { initDatabase, getDatabase };