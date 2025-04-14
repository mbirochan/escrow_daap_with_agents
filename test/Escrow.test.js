const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
    async function deployEscrowFixture() {
        const [owner, partyA, partyB, aiAgent, otherAccount, beneficiary] = await ethers.getSigners();
        const Escrow = await ethers.getContractFactory("Escrow");
        const escrow = await Escrow.deploy(partyA.address, partyB.address, aiAgent.address);
        await escrow.deployed();
        return { Escrow, escrow, owner, partyA, partyB, aiAgent, otherAccount, beneficiary };
    }

    describe("Deployment", function () {
        it("Should set the right AI agent, partyA, partyB, and owner", async function () {
            const { escrow, aiAgent, partyA, partyB, owner } = await loadFixture(deployEscrowFixture);
            expect(await escrow.aiAgent()).to.equal(aiAgent.address);  // Verify AI agent address
            expect(await escrow.partyA()).to.equal(partyA.address);    // Verify partyA address
            expect(await escrow.partyB()).to.equal(partyB.address);    // Verify partyB address
            expect(await escrow.owner()).to.equal(owner.address);      // Verify contract owner
        });
    });

    describe("createEscrow", function () {
        it("Should create a new escrow", async function() {
            const { escrow, partyA, partyB } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyA).createEscrow("Test Summary"))
                .to.emit(escrow, "EscrowCreated")
                .withArgs(0, partyA.address, partyB.address);

            const escrowData = await escrow.getEscrowDetails();
            expect(escrowData.partyA).to.equal(partyA.address);
            expect(escrowData.partyB).to.equal(partyB.address);
            expect(escrowData.status).to.equal(0); // Drafting
            expect(escrowData.summary).to.equal("Test Summary");
        });
    });

    describe("lockFunds", function () {
        beforeEach(async function () {
            const { escrow, partyA, partyB } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
        });

        it("Should lock funds successfully", async function() {
            const { escrow, partyA, partyB } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            const amount = ethers.utils.parseEther("1.0");
            await expect(
                escrow.connect(partyA).lockFunds({ value: amount })  // Assuming no escrowId needed after constructor update
            ).to.changeEtherBalances([partyA, escrow], [amount.mul(-1), amount]);

            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.amount).to.equal(amount);
            expect(escrowDetails.status).to.equal(1); // Funded
        });

        it("Should revert if non-PartyA tries to lock funds", async function() {
            const { escrow, partyB } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyB).lockFunds({ value: ethers.utils.parseEther("1.0") }))
                .to.be.revertedWith("Only party A");  // Check for the correct modifier message
        });
    });

    describe("setVerifiables", function () {
        beforeEach(async function () {
            const { escrow, partyA, partyB } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            await escrow.connect(partyA).lockFunds({ value: ethers.utils.parseEther("1.0") });
        });

        it("Should set verifiables successfully", async function() {
            const { escrow, aiAgent } = await loadFixture(deployEscrowFixture);
            const verifiables = ["Condition 1", "Condition 2"];
            await expect(escrow.connect(aiAgent).setVerifiables(verifiables)) // AI Agent sets verifiables
                .to.emit(escrow, "VerifiablesSet").withArgs(verifiables);

            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.verifiables).to.deep.equal(verifiables); // Assuming getEscrowDetails returns verifiables
            expect(escrowDetails.status).to.equal(2); // ConditionsMonitoring
        });

        it("Should revert if non-AI Agent tries to set verifiables", async function() {
            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyA).setVerifiables(["Condition"]))
                .to.be.revertedWith("Only AI");  // Check for correct modifier message
        });
    });

    describe("releaseFunds", function () {
        beforeEach(async function () {
            const { escrow, partyA, partyB, aiAgent } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            await escrow.connect(partyA).lockFunds({ value: ethers.utils.parseEther("1.0") });
            await escrow.connect(aiAgent).setVerifiables(["Condition 1"]);
        });

        it("Should release funds successfully", async function() {
            const { escrow, aiAgent, partyB } = await loadFixture(deployEscrowFixture);
            const amount = ethers.utils.parseEther("1.0");

            await expect(escrow.connect(aiAgent).releaseFunds())
                .to.changeEtherBalances([escrow, partyB], [amount.mul(-1), amount]);

            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.status).to.equal(3); // Completed
        });

        it("Should revert if non-AI Agent tries to release funds", async function() {
            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyA).releaseFunds())
                .to.be.revertedWith("Only AI");  // Check for correct modifier message
        });
    });

    describe("raiseDispute", function () {
        beforeEach(async function () {
            const { escrow, partyA, partyB, aiAgent } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            await escrow.connect(partyA).lockFunds({ value: ethers.utils.parseEther("1.0") });
            await escrow.connect(aiAgent).setVerifiables(["Condition 1"]);
        });

        it("Should allow PartyA to raise a dispute", async function() {
            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyA).raiseDispute("Dispute reason"))
                .to.emit(escrow, "DisputeRaised").withArgs("Dispute reason");

            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.status).to.equal(4); // Disputed
            expect(escrowDetails.disputeReason).to.equal("Dispute reason"); // Assuming disputeReason is stored
        });

        it("Should allow PartyB to raise a dispute", async function() {
            const { escrow, partyB } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyB).raiseDispute("Another reason"))
                .to.emit(escrow, "DisputeRaised").withArgs("Another reason");

            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.status).to.equal(4); // Dispute
            expect(escrowDetails.disputeReason).to.equal("Another reason"); // Assuming disputeReason is stored
        });

        it("Should revert if dispute is raised when not in ConditionsMonitoring state", async function() {
            const { escrow, partyA, partyB, aiAgent } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            // Skip locking funds and setting verifiables
            await expect(escrow.connect(partyB).raiseDispute("Early dispute"))
                .to.be.revertedWith("Incorrect state"); // Check for correct state check
        });
    });

    describe("resolveDispute", function () {
        beforeEach(async function () {
            const { escrow, partyA, partyB, aiAgent } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            await escrow.connect(partyA).lockFunds({ value: ethers.utils.parseEther("1.0") });
            await escrow.connect(aiAgent).setVerifiables(["Condition 1"]);
            await escrow.connect(partyA).raiseDispute("Dispute reason");
        });

        it("Should resolve dispute in favor of PartyA", async function() {
            const { escrow, aiAgent, partyA } = await loadFixture(deployEscrowFixture);
            const amount = ethers.utils.parseEther("1.0");

            await expect(escrow.connect(aiAgent).resolveDispute(partyA.address))
                .to.changeEtherBalances([escrow, partyA], [amount.mul(-1), amount]);

            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.status).to.equal(5); // Resolved
        });

        it("Should resolve dispute in favor of PartyB", async function() {
            const { escrow, aiAgent, partyB } = await loadFixture(deployEscrowFixture);
            const amount = ethers.utils.parseEther("1.0");
            await expect(escrow.connect(aiAgent).resolveDispute(partyB.address))
                .to.changeEtherBalances([escrow, partyB], [amount.mul(-1), amount]);
            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.status).to.equal(5); // Resolved
        });

            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyA).resolveDispute(partyA.address))
                .to.be.revertedWith("Only AI");  // Check for correct modifier
        });

        it("Should revert if attempting to resolve a non-existent dispute", async function() {
            const { escrow, aiAgent, otherAccount } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(aiAgent).resolveDispute(otherAccount.address)) // Assuming otherAccount is not partyA or partyB
                .to.be.revertedWith("Invalid beneficiary");
        });

        it("Should revert if trying to resolve dispute before it's raised", async function() {
            const { escrow, aiAgent, partyA, partyB } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            await escrow.connect(partyA).lockFunds({ value: ethers.utils.parseEther("1.0") });
            await escrow.connect(aiAgent).setVerifiables(["Condition 1"]);
            await expect(escrow.connect(aiAgent).resolveDispute(partyA.address)).to.be.revertedWith("Incorrect state");
            await expect(escrow.connect(aiAgent).resolveDispute(partyB.address)).to.be.revertedWith("Incorrect state");
        });
    });

    describe("Refunds", function() {
        it("Should refund partyA if cancelEscrow is called before funds are locked", async function() {
            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            const initialBalance = await ethers.provider.getBalance(partyA.address);
            await escrow.connect(partyA).cancelEscrow();
            const finalBalance = await ethers.provider.getBalance(partyA.address);
            expect(finalBalance).to.equal(initialBalance);
        });

        it("Should refund partyA if cancelEscrow is called after funds are locked", async function() {
            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
            const amount = ethers.utils.parseEther("1.0");
            await escrow.connect(partyA).lockFunds({ value: amount });
            await expect(escrow.connect(partyA).cancelEscrow()).to.changeEtherBalances([escrow, partyA], [amount.mul(-1), amount]);
            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.status).to.equal(6);
        });
    });

    describe("Pause and Unpause", function() {
        it("Should pause and unpause the contract by owner", async function() {
            const { escrow, owner, partyA } = await loadFixture(deployEscrowFixture);
            await escrow.connect(owner).pause();
            await expect(escrow.connect(partyA).createEscrow("Test")).to.be.revertedWith("Pausable: paused");

            await escrow.connect(owner).unpause();
            await expect(escrow.connect(partyA).createEscrow("Test")).to.emit(escrow, "EscrowCreated");
        });

    });

    describe("cancelEscrow", function () {
        beforeEach(async function () {
            const { escrow, partyA, partyB } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).createEscrow("Test Summary");
        });

        it("Should allow PartyA to cancel the escrow", async function() {
            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyA).cancelEscrow())
                .to.emit(escrow, "EscrowCancelled");

            const escrowDetails = await escrow.getEscrowDetails();
            expect(escrowDetails.status).to.equal(6); // Assuming 6 represents cancelled
        });

        it("Should revert if PartyB tries to cancel", async function() {
            const { escrow, partyB } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(partyB).cancelEscrow())
                .to.be.revertedWith("Only party A");  // Check for correct modifier
        });

        it("Should revert if cancellation is attempted after funds are locked", async function() {
            const { escrow, partyA } = await loadFixture(deployEscrowFixture);
            await escrow.connect(partyA).lockFunds({ value: ethers.utils.parseEther("1.0") });
            await expect(escrow.connect(partyA).cancelEscrow())
                .to.be.revertedWith("Incorrect state");  // Check for correct state check
        });
    });
});