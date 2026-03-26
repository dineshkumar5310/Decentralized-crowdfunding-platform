const express = require("express");
const router = express.Router();
const { db } = require("../server");

// GET /api/transactions/:userAddress - Get user transaction history
router.get("/:userAddress", async (req, res) => {
  const { userAddress } = req.params;

  try {
    // Fetch campaigns owned by the user
    const ownedCampaignsSnapshot = await db.collection("campaigns").where("owner", "==", userAddress).get();
    const ownedCampaigns = [];
    ownedCampaignsSnapshot.forEach((doc) => {
      ownedCampaigns.push({ id: doc.id, ...doc.data() });
    });

    // Fetch contributions made by the user (assuming we store contributions in a separate collection)
    // For now, we'll simulate or note that this needs to be implemented
    // In a real app, you'd have a contributions collection with donorAddress, campaignId, amount, timestamp
    const contributions = []; // Placeholder

    // Fetch withdrawals and refunds if applicable
    // This would require additional collections or events tracking

    res.json({
      ownedCampaigns,
      contributions,
      // Add other transaction types as needed
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
