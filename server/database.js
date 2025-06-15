const { MongoClient } = require('mongodb');

let db;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dutxhez.mongodb.net/projekt_studia?retryWrites=true&w=majority&tls=true`;

async function initDatabase() {
  try {
    const client = await MongoClient.connect(uri, {
      tlsAllowInvalidCertificates: false,
    });

    db = client.db();
    return db;
  } catch (err) {
    process.exit(1);
  }
}

function getDatabase() {
  return db;
}

module.exports = { initDatabase, getDatabase };