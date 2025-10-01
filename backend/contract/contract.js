require("dotenv").config();
const { ethers } = require("ethers");
const ABI = require("./CrowdFundABI.json");

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MAINNET_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);

module.exports = contract;