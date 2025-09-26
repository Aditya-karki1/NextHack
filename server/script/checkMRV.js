const blockchainService = require("../services/blockchainService");

const recordId = "68d65dd0e74177795838e206"; // Replace with your MRV record ID
const ngoWallet = "0xAF0A15ef40994Dc0aC5345f67a242F5dCA36eb03"; // Replace with NGO wallet

async function checkMRV() {
  try {
    console.log("Fetching MRV record from blockchain...");
    const record = await blockchainService.getMRVRecord(recordId);
    console.log("MRV Record:", record);

    console.log("Fetching NGO token balance...");
    const balance = await blockchainService.getBalance(ngoWallet);
    console.log("NGO token balance:", balance);
  } catch (err) {
    console.error("Error checking MRV or balance:", err);
  }
}

checkMRV();
