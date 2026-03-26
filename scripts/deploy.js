const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contract with account:", deployer.address);

  const artifact = await hre.artifacts.readArtifact("CrowdFund");
  const factory = new hre.ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  const contract = await factory.deploy(); // Ethers v6: this waits for deployment
  console.log("✅ Contract deployed to:", contract.target); // Use .target instead of .address
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});