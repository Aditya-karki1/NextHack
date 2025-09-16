// Minimal mock blockchain service used by MRV controller.
// Replace with real implementation when available.

exports.issueCredit = async (recordId, userId, treeCount) => {
  try {
    // simulate async work and return a fake tx hash
    const tx = `MOCK_TX_${String(recordId).slice(0,8)}_${Date.now()}`;
    return tx;
  } catch (err) {
    console.error('blockchainService.issueCredit error', err);
    return null;
  }
};
