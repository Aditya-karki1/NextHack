// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CarbonToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct MRVReport {
        string reportId;         // Off-chain MRV report ID (from MongoDB)
        address reporter;        // Address who submitted the report
        string projectId;        // Project ID (on-chain or external)
        string droneDataHash;    // IPFS or hash reference of drone data
        bool verified;           // Status of verification
        uint256 creditsIssued;   // Tokens minted after verification
    }

    mapping(string => MRVReport) public reports;

    event MRVSubmitted(string reportId, address reporter, string projectId, string droneDataHash);
    event MRVVerified(string reportId, uint256 credits);

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // Submit MRV report before verification
    function submitMRV(string memory reportId, string memory projectId, string memory droneDataHash) external {
        require(bytes(reports[reportId].reportId).length == 0, "Report already exists");

        reports[reportId] = MRVReport({
            reportId: reportId,
            reporter: msg.sender,
            projectId: projectId,
            droneDataHash: droneDataHash,
            verified: false,
            creditsIssued: 0
        });

        emit MRVSubmitted(reportId, msg.sender, projectId, droneDataHash);
    }

    // Verify MRV report & mint credits
    function verifyAndMint(string memory reportId, uint256 credits) external onlyRole(VERIFIER_ROLE) {
        MRVReport storage report = reports[reportId];
        require(!report.verified, "Report already verified");

        report.verified = true;
        report.creditsIssued = credits;
        _mint(report.reporter, credits);

        emit MRVVerified(reportId, credits);
    }

    // Admin can grant roles
    function grantMinter(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, account);
    }

    function grantVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, account);
    }
}
