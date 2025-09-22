const { ethers } = require("hardhat");

async function main() {
  // Get deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // Get contract factory
  const BlueCarbonMRV = await ethers.getContractFactory("BlueCarbonMRV");

  // Deploy contract
  const contract = await BlueCarbonMRV.deploy(); // v6 deploy returns the deployed contract

  // No need to call contract.deployed() in ethers v6

  console.log(`BlueCarbonMRV contract deployed at: ${contract.target || contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment error:", error);
    process.exit(1);
  });
