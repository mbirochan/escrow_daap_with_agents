const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy Escrow contract
    const Escrow = await hre.ethers.getContractFactory("Escrow");
    const aiAgentAddress = process.env.AI_AGENT_ADDRESS; // Get AI agent address from environment
    if (!aiAgentAddress) {
        throw new Error("AI_AGENT_ADDRESS environment variable is not set");
    }
    
    const escrow = await Escrow.deploy(aiAgentAddress);
    await escrow.deployed();

    console.log("Escrow deployed to:", escrow.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 