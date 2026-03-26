import dotenv from "dotenv";
dotenv.config();

import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { ethers } from "ethers";
import { Storage } from "@google-cloud/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// Initialize Firebase Admin with serviceAccount and storage bucket
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Use .env var like crowd-platform-a5dae.appspot.com
  });
}

const db = admin.firestore();

const storage = new Storage({
  keyFilename: path.join(__dirname, "serviceAccountKey.json"),
});

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
if (!bucketName) {
  throw new Error("Firebase Storage bucket name missing in environment variables.");
}

const bucket = storage.bucket(bucketName);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Polygon RPC provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MAINNET_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Import contract ABI and initialize contract instance
import contractABI from "./contract/CrowdFundABI.json" assert { type: "json" };
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi, wallet);


// Basic health check route
app.get("/", (req, res) => {
  res.send("✅ Backend running with Polygon (MATIC) + Firebase!");
});

// Get all campaigns
app.get("/api/campaigns", async (req, res) => {
  try {
    const snapshot = await db.collection("campaigns").get();
    const campaigns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new campaign
app.post("/api/campaigns", async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      image,
      goalAmount,
      deadline,
      minContribution,
      receiverAddress,
    } = req.body;

    if (!title || !goalAmount || !minContribution || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create campaign on Polygon blockchain (MATIC)
    const tx = await contract.createCampaign(
      title,
      description || "",
      category || "",
      image || "",
      ethers.parseEther(goalAmount.toString()),
      deadline,
      ethers.parseEther(minContribution.toString())
    );
    await tx.wait();

    const campaignId = Number(await contract.campaignCount());

    const campaignData = {
      id: campaignId,
      title,
      description: description || "",
      category: category || "",
      imageURL: image || "",
      goalAmount: parseFloat(goalAmount),
      raisedAmount: 0,
      deadline,
      minContribution: parseFloat(minContribution),
      uniqueDonors: 0,
      withdrawn: false,
      owner: receiverAddress || "",
      createdAt: new Date(),
    };

    await db.collection("campaigns").doc(campaignId.toString()).set(campaignData);

    res.status(201).json({ success: true, campaignId, txHash: tx.hash });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: error.message });
  }
});

// Donate to campaign
app.post("/api/campaigns/:id/donate", async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { donor, amount } = req.body;

    if (!donor || !amount) {
      return res.status(400).json({ error: "Donor and amount are required" });
    }

    const tx = await contract.contribute(campaignId, { value: ethers.parseEther(amount.toString()) });
    await tx.wait();

    const campaignRef = db.collection("campaigns").doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const data = campaignDoc.data();

    await campaignRef.update({
      raisedAmount: data.raisedAmount + parseFloat(amount),
      uniqueDonors: data.uniqueDonors + 1,
    });

    await db.collection("donations").add({
      campaignId,
      donor,
      amount: parseFloat(amount),
      timestamp: new Date(),
    });

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Donation failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw funds
app.post("/api/campaigns/:id/withdraw", async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { owner } = req.body;

    if (!owner) {
      return res.status(400).json({ error: "Owner is required" });
    }

    const tx = await contract.withdraw(campaignId);
    await tx.wait();

    await db.collection("campaigns").doc(campaignId).update({ withdrawn: true });

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Withdraw failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Refund donors
app.post("/api/campaigns/:id/refund", async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { owner } = req.body;

    if (!owner) {
      return res.status(400).json({ error: "Owner is required" });
    }

    const tx = await contract.refund(campaignId);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Refund failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user transactions
app.get("/api/transactions/:userAddress", async (req, res) => {
  try {
    const { userAddress } = req.params;

    const ownedSnapshot = await db.collection("campaigns").where("owner", "==", userAddress).get();

    const ownedCampaigns = ownedSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        owner: data.owner,
        title: data.title,
        description: data.description,
        category: data.category || "",
        imageURL: data.imageURL || "",
        goal: data.goalAmount.toString(),
        raised: data.raisedAmount.toString(),
        deadline: data.deadline.toString(),
        minContribution: data.minContribution.toString(),
        uniqueDonors: data.uniqueDonors.toString(),
        withdrawn: data.withdrawn,
      };
    });

    const donationsSnapshot = await db.collection("donations").where("donor", "==", userAddress).get();

    const contributions = donationsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        campaignId: data.campaignId,
        amount: data.amount.toString(),
        timestamp: data.timestamp,
      };
    });

    res.json({ ownedCampaigns, contributions });
  } catch (error) {
    console.error("Transactions fetch failed:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
