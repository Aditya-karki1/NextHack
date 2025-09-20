import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying contracts...");

  // Deploy CarbonToken
  const CarbonToken = await ethers.getContractFactory("CarbonToken");
  const carbonToken = await CarbonToken.deploy("Carbon Token", "CTK");
  await carbonToken.waitForDeployment();
  console.log("✅ CarbonToken deployed to:", await carbonToken.getAddress());

  // Deploy ReportCertificate
  const ReportCertificate = await ethers.getContractFactory("ReportCertificate");
  const reportCertificate = await ReportCertificate.deploy("Report Certificate", "RCERT");
  await reportCertificate.waitForDeployment();
  console.log("✅ ReportCertificate deployed to:", await reportCertificate.getAddress());
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
