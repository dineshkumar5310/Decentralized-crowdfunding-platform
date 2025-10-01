const express = require("express");
const router = express.Router();
const contract = require("../contract/contract");
const { ethers } = require("ethers");

router.post("/", async (req, res) => {
  const { amount } = req.body;

  if (!amount) return res.status(400).json({ error: "Amount is required" });

  try {
    const tx = await contract.contribute({
      value: ethers.parseEther(amount),
    });
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error("Contribution failed:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;