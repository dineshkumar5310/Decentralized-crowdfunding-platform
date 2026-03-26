require("dotenv").config();
const { ethers } = require("ethers");
const ABI = require("./CrowdFundABI.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MAINNET_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract("0x8b2036d6F297E525A368290A54163589640c531d", ABI, wallet);

module.exports = contract;