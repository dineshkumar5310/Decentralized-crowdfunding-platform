const express = require("express");
const router = express.Router();
const contract = require("../contract/contract");
const { db } = require("../server");

// POST /api/withdraw/:id - Withdraw funds from a campaign
router.post("/:id", async (req, res) => {
  const campaignId = req.params.id;
  const { ownerAddress } = req.body;

  if (!ownerAddress) return res.status(400).json({ error: "Owner address is required" });

  try {
    // Withdraw on blockchain
    const tx = await contract.withdraw(campaignId);
    await tx.wait();

    // Update Firestore
    const campaignRef = db.collection("campaigns").doc(campaignId);
    await campaignRef.update({
      withdrawn: true,
    });

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Withdraw failed:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
