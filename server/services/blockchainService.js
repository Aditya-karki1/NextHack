// const ethers = require("ethers");
// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();

// // Load contract ABI
// const contractJson = JSON.parse(
//   fs.readFileSync(
//     path.join(__dirname, "../artifacts/contracts/BlueCarbonMRV.sol/BlueCarbonMRV.json"),
//     "utf8"
//   )
// );
// const CONTRACT_ABI = contractJson.abi;
// const CONTRACT_ADDRESS = process.env.BLUE_CARBON_CONTRACT_ADDRESS;

// // Configure provider
// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

// // Validate private key
// const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
// if (!privateKey || !privateKey.startsWith("0x") || privateKey.length !== 66) {
//   throw new Error("Invalid DEPLOYER_PRIVATE_KEY in .env");
// }

// // Configure signer
// const signer = new ethers.Wallet(privateKey, provider);

// // Create contract instance
// const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// // Helper for logging
// const log = (...args) => console.log("[BlockchainService]", ...args);

// module.exports = {
//   /**
//    * Add MRV record and verify it
//    */
//   addMRVAndVerify: async (recordId, dataHash, treeCount, ngoWallet, tokensPerTree) => {
//     try {
//       log("Starting addMRVAndVerify...", { recordId, treeCount, ngoWallet, tokensPerTree });

//       if (!treeCount || treeCount <= 0) throw new Error("Invalid tree count");
//       if (!ngoWallet) throw new Error("NGO wallet address is required");

//       const totalTokens = treeCount * tokensPerTree;
//       log("Calculated total tokens to mint:", totalTokens);

//       // Get current nonce
//       let nonce = await provider.getTransactionCount(signer.address);
//       log("Current nonce:", nonce);

//       // Add MRV record
//       log("Calling addMRVRecord on contract...");
//       const tx = await contract.addMRVRecord(recordId, dataHash, treeCount, ngoWallet, { nonce });
//       log("addMRVRecord transaction hash:", tx.hash);
//       await tx.wait();
//       log("addMRVRecord confirmed");

//       // Increment nonce for next transaction
//       nonce += 1;

//       // Verify MRV and mint tokens
//       log("Calling verifyMRV on contract...");
//       const verifyTx = await contract.verifyMRV(recordId, tokensPerTree, { nonce });
//       log("verifyMRV transaction hash:", verifyTx.hash);
//       await verifyTx.wait();
//       log("verifyMRV confirmed");

//       return tx.hash;
//     } catch (error) {
//       log("Blockchain error:", error);
//       if (error.code === 'NONCE_EXPIRED') {
//         log("Nonce issue detected. Consider resetting your nonce or waiting for previous tx to mine.");
//       }
//       throw error;
//     }
//   },

//   /**
//    * Get MRV record from blockchain
//    */
//   getMRVRecord: async (recordId) => {
//     try {
//       log("Fetching MRV record:", recordId);
//       const record = await contract.getMRVRecord(recordId);
//       const result = {
//         recordId: record[0],
//         dataHash: record[1],
//         treeCount: record[2].toString(),
//         credits: record[3].toString(),
//         owner: record[4],
//         verified: record[5],
//       };
//       log("MRV record fetched:", result);
//       return result;
//     } catch (error) {
//       log("Error fetching MRV record:", error);
//       throw error;
//     }
//   },

//   /**
//    * Get token balance of an address
//    */
//   getBalance: async (walletAddress) => {
//     try {
//       log("Fetching balance for:", walletAddress);
//       const balance = await contract.balanceOf(walletAddress);
//       const formatted = ethers.formatUnits(balance, 18);
//       log("Balance fetched:", formatted);
//       return formatted;
//     } catch (error) {
//       log("Error fetching balance:", error);
//       throw error;
//     }
//   },
// };

const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Load contract ABI
const contractJson = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../artifacts/contracts/BlueCarbonMRV.sol/BlueCarbonMRV.json"),
    "utf8"
  )
);
const CONTRACT_ABI = contractJson.abi;
const CONTRACT_ADDRESS = process.env.BLUE_CARBON_CONTRACT_ADDRESS;

// Configure provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

// Validate private key
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey || !privateKey.startsWith("0x") || privateKey.length !== 66) {
  throw new Error("Invalid DEPLOYER_PRIVATE_KEY in .env");
}

// Configure signer
const signer = new ethers.Wallet(privateKey, provider);

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// Helper for logging
const log = (...args) => console.log("[BlockchainService]", ...args);

module.exports = {
  /**
   * Add MRV record and verify it (for NGO)
   */
  addMRVAndVerify: async (recordId, dataHash, treeCount, ngoWallet, tokensPerTree) => {
    try {
      log("Starting addMRVAndVerify...", { recordId, treeCount, ngoWallet, tokensPerTree });
      if (!treeCount || treeCount <= 0) throw new Error("Invalid tree count");
      if (!ngoWallet) throw new Error("NGO wallet address is required");

      let nonce = await provider.getTransactionCount(signer.address);

      // 1️⃣ Add MRV record
      const tx = await contract.addMRVRecord(recordId, dataHash, treeCount, ngoWallet, { nonce });
      await tx.wait();

      // 2️⃣ Verify MRV & mint tokens to NGO
      nonce += 1;
      const verifyTx = await contract.verifyMRV(recordId, tokensPerTree, { nonce });
      await verifyTx.wait();

      return verifyTx.hash;
    } catch (error) {
      log("Blockchain error:", error);
      throw error;
    }
  },

  /**
   * Mint ERC20 tokens to a company wallet (for purchased credits)
   */
  mintTokens: async (companyWallet, credits) => {
    try {
      log("Minting tokens to company:", companyWallet, "Credits:", credits);
      if (!companyWallet) throw new Error("Company wallet is required");
      if (!credits || credits <= 0) throw new Error("Invalid credit amount");

      const nonce = await provider.getTransactionCount(signer.address);
      const tx = await contract.allocateCreditsToCompany(companyWallet, credits, { nonce });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      log("Blockchain minting error:", error);
      throw error;
    }
  },

  /**
   * Transfer ERC20 tokens from NGO → Company
   */
 transferCredits: async (toWallet, credits) => {
  try {
    log("Transferring credits to:", toWallet, "Credits:", credits);
    if (!toWallet) throw new Error("Recipient wallet is required");
    if (!credits || credits <= 0) throw new Error("Invalid credit amount");

    const nonce = await provider.getTransactionCount(signer.address);
    const tx = await contract.transferCompanyCredits(toWallet, credits, { nonce });
    await tx.wait();
    log("Credits transferred successfully:", tx.hash);
    return tx.hash;
  } catch (error) {
    log("Blockchain transfer error:", error);
    throw error;
  }
}
,

  /**
   * Get MRV record from blockchain
   */
  getMRVRecord: async (recordId) => {
    try {
      const record = await contract.getMRVRecord(recordId);
      return {
        recordId: record[0],
        dataHash: record[1],
        treeCount: record[2].toString(),
        credits: record[3].toString(),
        owner: record[4],
        verified: record[5],
      };
    } catch (error) {
      log("Error fetching MRV record:", error);
      throw error;
    }
  },

  /**
   * Get token balance of an address
   */
  getBalance: async (walletAddress) => {
    try {
      const balance = await contract.balanceOf(walletAddress);
      console.log(balance);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      log("Error fetching balance:", error);
      throw error;
    }
  },
};
