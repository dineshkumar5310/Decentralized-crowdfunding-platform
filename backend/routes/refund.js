const express = require("express");
const router = express.Router();
const contract = require("../contract/contract");
const { db } = require("../server");

// POST /api/refund/:id - Refund contributions for a campaign
router.post("/:id", async (req, res) => {
  const campaignId = req.params.id;
  const { ownerAddress } = req.body;

  if (!ownerAddress) return res.status(400).json({ error: "Owner address is required" });

  try {
    // Refund on blockchain
    const tx = await contract.refund(campaignId);
    await tx.wait();

    // Note: Refund doesn't change campaign data in Firestore, as it's per donor
    // You might want to track refunds separately if needed

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Refund failed:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
