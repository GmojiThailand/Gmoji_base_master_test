const mongodb = require('mongodb');
const { MongoClient, ObjectId } = mongodb;

(async () => {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db('api-factory');
    const appId = '587640c995ed3c0c59b14600';
    const cols = [`user_${appId}`, `User_${appId}`];
    for (const col of cols) {
      try {
        const res = await db.collection(col).updateOne({ username: 'GmojiTest' }, { $set: { role: ObjectId('58808abccf1f550f22a8c02a') } });
        console.log(col, res.result || res);
      } catch (e) {
        console.error('ERR', col, e.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    try { await client.close(); } catch (e) {}
  }
})();
