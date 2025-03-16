const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const agendamentosRef = db.collection('agendamentos');
const clientesRef = db.collection('clientes');

module.exports = { db, agendamentosRef, clientesRef };