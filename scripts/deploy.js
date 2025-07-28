const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // Deploy MockERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
        "VestingToken",
        "VTK",
        1000000 // 1 million tokens
    );
    await token.deployed();
    console.log("MockERC20 deployed to:", token.address);
    
    // Deploy TokenVesting contract
    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    const vesting = await TokenVesting.deploy(token.address);
    await vesting.deployed();
    console.log("TokenVesting deployed to:", vesting.address);
    
    // Mint some tokens to deployer for testing
    await token.mint(deployer.address, ethers.utils.parseEther("100000"));
    console.log("Minted 100,000 tokens to deployer");
    
    // Save deployment info
    const deploymentInfo = {
        network: await ethers.provider.getNetwork(),
        token: {
            address: token.address,
            name: "VestingToken",
            symbol: "VTK"
        },
        vesting: {
            address: vesting.address
        },
        deployer: deployer.address
    };
    
    console.log("\nDeployment completed!");
    console.log("Save this information for frontend configuration:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });