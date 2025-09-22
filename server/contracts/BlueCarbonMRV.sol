// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlueCarbonMRV is ERC20, Ownable {
    struct MRVRecord {
        string recordId;
        string dataHash;   // Hash of MRV data for immutability
        uint256 treeCount; // Number of trees reported
        uint256 credits;   // Tokens issued after verification
        address owner;
        bool verified;
    }

    mapping(string => MRVRecord) public records;

    event MRVAdded(string recordId, address owner, string dataHash, uint256 treeCount);
    event MRVVerified(string recordId, uint256 creditsIssued);

    constructor() ERC20("BlueCarbon Credit", "BCC") {}

    /**
     * @dev Add MRV record (submitted by owner/admin)
     * Tokens are NOT minted yet.
     */
    function addMRVRecord(
        string memory _recordId,
        string memory _dataHash,
        uint256 _treeCount,
        address _owner
    ) public onlyOwner {
        require(bytes(records[_recordId].recordId).length == 0, "Record already exists");

        records[_recordId] = MRVRecord({
            recordId: _recordId,
            dataHash: _dataHash,
            treeCount: _treeCount,
            credits: 0,
            owner: _owner,
            verified: false
        });

        emit MRVAdded(_recordId, _owner, _dataHash, _treeCount);
    }

    /**
     * @dev Verify MRV record and mint tokens based on tree count
     */
    function verifyMRV(string memory _recordId, uint256 _tokensPerTree) public onlyOwner {
        MRVRecord storage rec = records[_recordId];
        require(bytes(rec.recordId).length > 0, "Record not found");
        require(!rec.verified, "Already verified");

        uint256 totalCredits = rec.treeCount * _tokensPerTree * (10 ** decimals());
        rec.credits = totalCredits;
        rec.verified = true;

        _mint(rec.owner, totalCredits);

        emit MRVVerified(_recordId, totalCredits);
    }

    /**
     * @dev Get MRV record details
     */
    function getMRVRecord(string memory _recordId) public view returns (
        string memory, string memory, uint256, uint256, address, bool
    ) {
        MRVRecord memory rec = records[_recordId];
        return (rec.recordId, rec.dataHash, rec.treeCount, rec.credits, rec.owner, rec.verified);
    }
}
