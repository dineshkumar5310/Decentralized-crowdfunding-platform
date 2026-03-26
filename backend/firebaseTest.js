import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function testFirestore() {
  try {
    const snapshot = await db.collection("campaigns").get();
    console.log("Firestore connected, documents:", snapshot.size);
  } catch (err) {
    console.error("Firestore connection error:", err);
  }
}

testFirestore();
