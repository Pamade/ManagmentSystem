const { MongoClient } = require('mongodb');

let db;
let client;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dutxhez.mongodb.net/projekt_studia?retryWrites=true&w=majority`;
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