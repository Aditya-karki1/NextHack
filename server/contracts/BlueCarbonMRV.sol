// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlueCarbonMRV is ERC20, Ownable {
    struct MRVRecord {
        string recordId;
        string dataHash;    // Hash of MRV data for immutability
        uint256 treeCount;  // Number of trees reported
        uint256 credits;    // Tokens issued after verification
        address owner;      // NGO wallet
        bool verified;
    }

    struct CompanyCredit {
        address wallet;     // Company wallet
        uint256 credits;    // Tokens allocated
    }

    mapping(string => MRVRecord) public records;             // NGO MRV records
    mapping(address => CompanyCredit) public companyCredits; // Corporate credits by wallet

    // ---------------- Events ----------------
    event MRVAdded(string recordId, address ngoWallet, string dataHash, uint256 treeCount);
    event MRVVerified(string recordId, uint256 creditsIssued);
    event CompanyCreditsAllocated(address companyWallet, uint256 creditsAllocated);
    event TokensMinted(address indexed wallet, uint256 amount);
    event CompanyCreditsBurned(address indexed wallet, uint256 amount);

    constructor() ERC20("BlueCarbon Credit", "BCC") {}

    // ---------------- NGO MRV Functions ----------------
    function addMRVRecord(
        string memory _recordId,
        string memory _dataHash,
        uint256 _treeCount,
        address _ngoWallet
    ) public onlyOwner {
        require(bytes(records[_recordId].recordId).length == 0, "Record already exists");

        records[_recordId] = MRVRecord({
            recordId: _recordId,
            dataHash: _dataHash,
            treeCount: _treeCount,
            credits: 0,
            owner: _ngoWallet,
            verified: false
        });

        emit MRVAdded(_recordId, _ngoWallet, _dataHash, _treeCount);
    }

    function verifyMRV(string memory _recordId, uint256 _tokensPerTree) public onlyOwner {
        MRVRecord storage rec = records[_recordId];
        require(bytes(rec.recordId).length > 0, "Record not found");
        require(!rec.verified, "Already verified");

        uint256 totalCredits = rec.treeCount * _tokensPerTree * (10 ** decimals());
        rec.credits = totalCredits;
        rec.verified = true;

        _mint(rec.owner, totalCredits);
        emit MRVVerified(_recordId, totalCredits);
        emit TokensMinted(rec.owner, totalCredits);
    }

    function getMRVRecord(string memory _recordId) public view returns (
        string memory, string memory, uint256, uint256, address, bool
    ) {
        MRVRecord memory rec = records[_recordId];
        return (rec.recordId, rec.dataHash, rec.treeCount, rec.credits, rec.owner, rec.verified);
    }

    // Optional: batch fetch
    function getAllMRVRecords(string[] memory recordIds) public view returns (MRVRecord[] memory) {
        MRVRecord[] memory results = new MRVRecord[](recordIds.length);
        for (uint i = 0; i < recordIds.length; i++) {
            results[i] = records[recordIds[i]];
        }
        return results;
    }

    // ---------------- Company Functions ----------------
    function allocateCreditsToCompany(address _companyWallet, uint256 _credits) public onlyOwner {
        require(_companyWallet != address(0), "Invalid wallet");

        companyCredits[_companyWallet].wallet = _companyWallet;
        companyCredits[_companyWallet].credits += _credits;

        uint256 mintAmount = _credits * (10 ** decimals());
        _mint(_companyWallet, mintAmount);

        emit CompanyCreditsAllocated(_companyWallet, _credits);
        emit TokensMinted(_companyWallet, mintAmount);
    }

    function allocateCreditsToCompanies(address[] memory _wallets, uint256[] memory _credits) public onlyOwner {
        require(_wallets.length == _credits.length, "Array length mismatch");
        for (uint i = 0; i < _wallets.length; i++) {
            allocateCreditsToCompany(_wallets[i], _credits[i]);
        }
    }

    function getCompanyCredits(address _companyWallet) public view returns (uint256) {
        return companyCredits[_companyWallet].credits;
    }

    function burnCompanyCredits(uint256 _credits) public {
        require(companyCredits[msg.sender].credits >= _credits, "Not enough credits");
        uint256 burnAmount = _credits * (10 ** decimals());
        companyCredits[msg.sender].credits -= _credits;
        _burn(msg.sender, burnAmount);

        emit CompanyCreditsBurned(msg.sender, _credits);
    }

    // ---------------- Utility Functions ----------------
    function transferCompanyCredits(address _to, uint256 _credits) public {
        require(_credits > 0, "Amount must be > 0");

        uint256 tokenAmount = _credits * (10 ** decimals());
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");

        companyCredits[msg.sender].credits -= _credits;
        companyCredits[_to].credits += _credits;

        _transfer(msg.sender, _to, tokenAmount);
    }
}
