const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
    let Escrow;
    let escrow;
    let owner;
    let partyA;
    let partyB;
    let aiAgent;
    let otherAccount;

    beforeEach(async function () {
        [owner, partyA, partyB, aiAgent, otherAccount] = await ethers.getSigners();
        
        Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy(aiAgent.address);
        await escrow.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right AI agent", async function () {
            expect(await escrow.aiAgent()).to.equal(aiAgent.address);
        });

        it("Should set the right owner", async function () {
            expect(await escrow.owner()).to.equal(owner.address);
        });
    });

    describe("createEscrow", function () {
        it("Should create a new escrow", async function () {
            const summary = "Test escrow agreement";
            await expect(escrow.connect(partyA).createEscrow(partyB.address, summary))
                .to.emit(escrow, "EscrowCreated")
                .withArgs(0, partyA.address, partyB.address);

            const escrowData = await escrow.escrows(0);
            expect(escrowData.partyA).to.equal(partyA.address);
            expect(escrowData.partyB).to.equal(partyB.address);
            expect(escrowData.status).to.equal(0); // Drafting
        });

        it("Should not allow creating escrow with self", async function () {
            await expect(
                escrow.connect(partyA).createEscrow(partyA.address, "Test")
            ).to.be.revertedWith("Cannot create escrow with self");
        });
    });

    describe("lockFunds", function () {
        beforeEach(async function () {
            await escrow.connect(partyA).createEscrow(partyB.address, "Test");
        });

        it("Should lock funds successfully", async function () {
            const amount = ethers.utils.parseEther("1.0");
            await expect(
                escrow.connect(partyA).lockFunds(0, { value: amount })
            )
                .to.emit(escrow, "FundsLocked")
                .withArgs(0, amount);

            const escrowData = await escrow.escrows(0);
            expect(escrowData.amount).to.equal(amount);
            expect(escrowData.status).to.equal(1); // Funded
        });

        it("Should not allow non-partyA to lock funds", async function () {
            await expect(
                escrow.connect(partyB).lockFunds(0, { value: ethers.utils.parseEther("1.0") })
            ).to.be.revertedWith("Only partyA can perform this action");
        });
    });

    describe("setVerifiables", function () {
        beforeEach(async function () {
            await escrow.connect(partyA).createEscrow(partyB.address, "Test");
            await escrow.connect(partyA).lockFunds(0, { value: ethers.utils.parseEther("1.0") });
        });

        it("Should set verifiables successfully", async function () {
            const verifiables = ["Condition 1", "Condition 2"];
            await expect(escrow.connect(partyA).setVerifiables(0, verifiables))
                .to.emit(escrow, "VerifiablesSet")
                .withArgs(0, verifiables);

            const escrowData = await escrow.escrows(0);
            expect(escrowData.status).to.equal(2); // ConditionsMonitoring
        });

        it("Should allow AI agent to set verifiables", async function () {
            const verifiables = ["Condition 1"];
            await expect(escrow.connect(aiAgent).setVerifiables(0, verifiables))
                .to.emit(escrow, "VerifiablesSet")
                .withArgs(0, verifiables);
        });
    });

    describe("releaseFunds", function () {
        beforeEach(async function () {
            await escrow.connect(partyA).createEscrow(partyB.address, "Test");
            await escrow.connect(partyA).lockFunds(0, { value: ethers.utils.parseEther("1.0") });
            await escrow.connect(partyA).setVerifiables(0, ["Condition 1"]);
        });

        it("Should release funds successfully", async function () {
            const initialBalance = await ethers.provider.getBalance(partyB.address);
            await expect(escrow.connect(aiAgent).releaseFunds(0))
                .to.emit(escrow, "FundsReleased")
                .withArgs(0, partyB.address);

            const finalBalance = await ethers.provider.getBalance(partyB.address);
            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("1.0"));
        });

        it("Should not allow non-AI to release funds", async function () {
            await expect(escrow.connect(partyA).releaseFunds(0))
                .to.be.revertedWith("Unauthorized AI agent");
        });
    });

    describe("raiseDispute", function () {
        beforeEach(async function () {
            await escrow.connect(partyA).createEscrow(partyB.address, "Test");
            await escrow.connect(partyA).lockFunds(0, { value: ethers.utils.parseEther("1.0") });
            await escrow.connect(partyA).setVerifiables(0, ["Condition 1"]);
        });

        it("Should allow partyA to raise dispute", async function () {
            await expect(escrow.connect(partyA).raiseDispute(0, "Test reason"))
                .to.emit(escrow, "DisputeRaised")
                .withArgs(0, "Test reason");

            const escrowData = await escrow.escrows(0);
            expect(escrowData.status).to.equal(4); // Disputed
        });

        it("Should allow partyB to raise dispute", async function () {
            await expect(escrow.connect(partyB).raiseDispute(0, "Test reason"))
                .to.emit(escrow, "DisputeRaised")
                .withArgs(0, "Test reason");
        });
    });

    describe("resolveDispute", function () {
        beforeEach(async function () {
            await escrow.connect(partyA).createEscrow(partyB.address, "Test");
            await escrow.connect(partyA).lockFunds(0, { value: ethers.utils.parseEther("1.0") });
            await escrow.connect(partyA).setVerifiables(0, ["Condition 1"]);
            await escrow.connect(partyA).raiseDispute(0, "Test reason");
        });

        it("Should resolve dispute in favor of partyA", async function () {
            const initialBalance = await ethers.provider.getBalance(partyA.address);
            await expect(escrow.connect(aiAgent).resolveDispute(0, partyA.address))
                .to.emit(escrow, "DisputeResolved")
                .withArgs(0, partyA.address);

            const finalBalance = await ethers.provider.getBalance(partyA.address);
            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("1.0"));
        });

        it("Should resolve dispute in favor of partyB", async function () {
            const initialBalance = await ethers.provider.getBalance(partyB.address);
            await expect(escrow.connect(aiAgent).resolveDispute(0, partyB.address))
                .to.emit(escrow, "DisputeResolved")
                .withArgs(0, partyB.address);

            const finalBalance = await ethers.provider.getBalance(partyB.address);
            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("1.0"));
        });
    });

    describe("cancelEscrow", function () {
        beforeEach(async function () {
            await escrow.connect(partyA).createEscrow(partyB.address, "Test");
        });

        it("Should cancel escrow successfully", async function () {
            await expect(escrow.connect(partyA).cancelEscrow(0))
                .to.emit(escrow, "EscrowCancelled")
                .withArgs(0);

            const escrowData = await escrow.escrows(0);
            expect(escrowData.status).to.equal(6); // Cancelled
        });

        it("Should not allow cancellation after funding", async function () {
            await escrow.connect(partyA).lockFunds(0, { value: ethers.utils.parseEther("1.0") });
            await expect(escrow.connect(partyA).cancelEscrow(0))
                .to.be.revertedWith("Can only cancel in Drafting state");
        });
    });
}); 