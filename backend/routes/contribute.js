const express = require("express");
const router = express.Router();
const contract = require("../contract/contract");
const { db } = require("../server");
const { ethers } = require("ethers");

// POST /api/contribute/:id - Contribute to a specific campaign
router.post("/:id", async (req, res) => {
  const { amount, donorAddress } = req.body;
  const campaignId = req.params.id;

  if (!amount || !donorAddress)
    return res.status(400).json({ error: "Amount and donorAddress are required" });

  try {
    // Convert campaignId to BigNumber if required by contract
    const campaignIdBN = ethers.BigNumber.from(campaignId);

    // Contribute on blockchain
    const tx = await contract.contribute(campaignIdBN, {
      value: ethers.parseEther(amount.toString()), // ensure amount is string
    });
    await tx.wait();

    const campaignRef = db.collection("campaigns").doc(campaignId);
    const donorRef = campaignRef.collection('donors').doc(donorAddress);

    await db.runTransaction(async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef);
      const donorDoc = await transaction.get(donorRef);

      if (!campaignDoc.exists) {
        throw new Error("Campaign does not exist");
      }

      const campaignData = campaignDoc.data();

      let uniqueDonors = campaignData.uniqueDonors || 0;
      if (!donorDoc.exists) {
        // New donor, increment uniqueDonors and add donor record
        uniqueDonors += 1;
        transaction.set(donorRef, { donatedAt: new Date() });
      }

      const raised = (campaignData.raised || 0) + parseFloat(amount);
      
      transaction.update(campaignRef, {
        raised: raised,
        uniqueDonors: uniqueDonors,
      });
    });

    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Contribution failed:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
