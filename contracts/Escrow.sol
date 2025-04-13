// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Escrow is ReentrancyGuard, Ownable, Pausable {
    // Enums
    enum EscrowStatus {
        Drafting,
        Funded,
        ConditionsMonitoring,
        Released,
        Disputed,
        Resolved,
        Cancelled
    }

    // Structs
    struct Escrow {
        address partyA;
        address partyB;
        uint256 amount;
        string contractSummary;
        string[] verifiables;
        EscrowStatus status;
        uint256 createdAt;
        uint256 releasedAt;
    }

    // State Variables
    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCounter;
    address public aiAgent;

    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed partyA,
        address indexed partyB
    );
    event FundsLocked(uint256 indexed escrowId, uint256 amount);
    event VerifiablesSet(uint256 indexed escrowId, string[] conditions);
    event FundsReleased(uint256 indexed escrowId, address recipient);
    event DisputeRaised(uint256 indexed escrowId, string reason);
    event DisputeResolved(uint256 indexed escrowId, address winner);
    event EscrowCancelled(uint256 indexed escrowId);

    // Modifiers
    modifier onlyPartyA(uint256 _escrowId) {
        require(
            msg.sender == escrows[_escrowId].partyA,
            "Only partyA can perform this action"
        );
        _;
    }

    modifier onlyPartyB(uint256 _escrowId) {
        require(
            msg.sender == escrows[_escrowId].partyB,
            "Only partyB can perform this action"
        );
        _;
    }

    modifier onlyAI() {
        require(msg.sender == aiAgent, "Unauthorized AI agent");
        _;
    }

    modifier validEscrow(uint256 _escrowId) {
        require(_escrowId < escrowCounter, "Invalid escrow ID");
        _;
    }

    constructor(address _aiAgent) Ownable(msg.sender) {
        require(_aiAgent != address(0), "Invalid AI agent address");
        aiAgent = _aiAgent;
    }

    // Functions
    function createEscrow(
        address _partyB,
        string memory _summary
    ) external whenNotPaused returns (uint256) {
        require(_partyB != address(0), "Invalid partyB address");
        require(_partyB != msg.sender, "Cannot create escrow with self");

        uint256 escrowId = escrowCounter++;
        escrows[escrowId] = Escrow({
            partyA: msg.sender,
            partyB: _partyB,
            amount: 0,
            contractSummary: _summary,
            verifiables: new string[](0),
            status: EscrowStatus.Drafting,
            createdAt: block.timestamp,
            releasedAt: 0
        });

        emit EscrowCreated(escrowId, msg.sender, _partyB);
        return escrowId;
    }

    function lockFunds(
        uint256 _escrowId
    )
        external
        payable
        validEscrow(_escrowId)
        onlyPartyA(_escrowId)
        whenNotPaused
    {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.Drafting,
            "Escrow must be in Drafting state"
        );
        require(msg.value > 0, "Amount must be greater than 0");

        escrow.amount = msg.value;
        escrow.status = EscrowStatus.Funded;

        emit FundsLocked(_escrowId, msg.value);
    }

    function setVerifiables(
        uint256 _escrowId,
        string[] calldata _verifiables
    ) external validEscrow(_escrowId) whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.partyA || msg.sender == aiAgent,
            "Only partyA or AI agent can set verifiables"
        );
        require(
            escrow.status == EscrowStatus.Funded,
            "Escrow must be in Funded state"
        );

        escrow.verifiables = _verifiables;
        escrow.status = EscrowStatus.ConditionsMonitoring;

        emit VerifiablesSet(_escrowId, _verifiables);
    }

    function releaseFunds(
        uint256 _escrowId
    ) external nonReentrant validEscrow(_escrowId) onlyAI whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.ConditionsMonitoring,
            "Invalid escrow status"
        );

        escrow.status = EscrowStatus.Released;
        escrow.releasedAt = block.timestamp;

        (bool success, ) = escrow.partyB.call{value: escrow.amount}("");
        require(success, "Transfer failed");

        emit FundsReleased(_escrowId, escrow.partyB);
    }

    function raiseDispute(
        uint256 _escrowId,
        string memory _reason
    ) external validEscrow(_escrowId) whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.partyA || msg.sender == escrow.partyB,
            "Only parties can raise dispute"
        );
        require(
            escrow.status == EscrowStatus.ConditionsMonitoring,
            "Can only dispute during monitoring"
        );

        escrow.status = EscrowStatus.Disputed;

        emit DisputeRaised(_escrowId, _reason);
    }

    function resolveDispute(
        uint256 _escrowId,
        address _winner
    ) external nonReentrant validEscrow(_escrowId) onlyAI whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.Disputed,
            "Escrow must be in Disputed state"
        );
        require(
            _winner == escrow.partyA || _winner == escrow.partyB,
            "Winner must be one of the parties"
        );

        escrow.status = EscrowStatus.Resolved;

        (bool success, ) = _winner.call{value: escrow.amount}("");
        require(success, "Transfer failed");

        emit DisputeResolved(_escrowId, _winner);
    }

    function cancelEscrow(
        uint256 _escrowId
    ) external validEscrow(_escrowId) onlyPartyA(_escrowId) whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.Drafting,
            "Can only cancel in Drafting state"
        );

        escrow.status = EscrowStatus.Cancelled;

        emit EscrowCancelled(_escrowId);
    }

    // Admin functions
    function setAIAgent(address _newAIAgent) external onlyOwner {
        require(_newAIAgent != address(0), "Invalid AI agent address");
        aiAgent = _newAIAgent;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
