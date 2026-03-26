const express = require("express");
const router = express.Router();
const contract = require("../contract/contract");
const { db, bucket } = require("../server");
const { ethers } = require("ethers");

// GET /api/campaigns - Fetch all campaigns
router.get("/", async (req, res) => {
  try {
    // Check if db is available
    if (!db || typeof db.collection !== 'function') {
      console.log("Firestore not initialized or invalid, returning empty campaigns");
      return res.json([]);
    }

    // Get campaigns from Firestore
    const campaignsSnapshot = await db.collection("campaigns").get();
    const campaigns = [];

    campaignsSnapshot.forEach((doc) => {
      campaigns.push({ id: doc.id, ...doc.data() });
    });

    // If no campaigns in Firestore, return empty array instead of error
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    // Return empty array on error to prevent frontend crash
    res.json([]);
  }
});

// POST /api/campaigns - Create a new campaign
router.post("/", async (req, res) => {
  const { title, description, category, imageURL, goal, deadline, minContribution, owner, receiverAddress } = req.body;

  if (!title || !description || !goal || !deadline || !minContribution || !owner || !receiverAddress) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create campaign on blockchain
    const tx = await contract.createCampaign(
      title,
      description,
      category || "",
      imageURL || "",
      ethers.parseEther(goal.toString()),
      deadline,
      ethers.parseEther(minContribution.toString())
    );
    await tx.wait();

    // Get campaign count to determine ID
    const countBI = await contract.campaignCount();
    const campaignId = Number(countBI.toString());

    // Store in Firestore
    const campaignData = {
      id: campaignId,
      owner,
      receiverAddress,
      title,
      description,
      category: category || "",
      imageURL: imageURL || "",
      goal: parseFloat(goal),
      raised: 0,
      deadline,
      minContribution: parseFloat(minContribution),
      uniqueDonors: 0,
      withdrawn: false,
      createdAt: new Date(),
    };

    await db.collection("campaigns").doc(campaignId.toString()).set(campaignData);

    res.json({ success: true, campaignId, txHash: tx.hash });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
