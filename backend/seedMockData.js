import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function seedData() {
  const campaigns = [
    {
      id: 1,
      title: "Mock Campaign 1",
      description: "This is a test campaign 1",
      image: "",
      owner: "0x123456789abcdef",
      receiverAddress: "0xabcdef123456789",
      goalAmount: 10,
      raisedAmount: 0,
      minContribution: 0.01,
      deadline: 1950000000,
      uniqueDonors: 0,
      withdrawn: false,
      createdAt: new Date(),
    },
    {
      id: 2,
      title: "Mock Campaign 2",
      description: "This is a test campaign 2",
      image: "",
      owner: "0xabcdef123456789",
      receiverAddress: "0x123456789abcdef",
      goalAmount: 20,
      raisedAmount: 0,
      minContribution: 0.05,
      deadline: 1955000000,
      uniqueDonors: 0,
      withdrawn: false,
      createdAt: new Date(),
    },
  ];

  for (const campaign of campaigns) {
    await db.collection("campaigns").doc(campaign.id.toString()).set(campaign);
  }

  const donations = [
    {
      campaignId: 1,
      donor: "0xabcdef123456789",
      amount: 0.5,
      timestamp: new Date(),
    },
    {
      campaignId: 2,
      donor: "0x123456789abcdef",
      amount: 1,
      timestamp: new Date(),
    },
  ];

  for (const donation of donations) {
    await db.collection("donations").add(donation);
  }

  console.log("✅ Mock data seeded successfully!");
}

seedData();
