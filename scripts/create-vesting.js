const { ethers } = require("hardhat");

async function main() {
    // Get contract addresses from deployment
    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with deployed address
    const vestingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Update with deployed address
    
    const [deployer] = await ethers.getSigners();
    
    // Get contract instances
    const token = await ethers.getContractAt("MockERC20", tokenAddress);
    const vesting = await ethers.getContractAt("TokenVesting", vestingAddress);
    
    // Beneficiary address (you can change this to any address)
    const beneficiaryAddress = process.argv[2] || deployer.address;
    
    // Vesting parameters
    const totalAmount = ethers.utils.parseEther("1000"); // 1000 tokens
    const startTime = Math.floor(Date.now() / 1000); // Start now
    const vestingDuration = 30 * 24 * 60 * 60; // 30 days in seconds
    
    console.log("Creating vesting schedule...");
    console.log("Beneficiary:", beneficiaryAddress);
    console.log("Total Amount:", ethers.utils.formatEther(totalAmount), "VTK");
    console.log("Start Time:", new Date(startTime * 1000).toLocaleString());
    console.log("Duration:", vestingDuration / (24 * 60 * 60), "days");
    
    // Approve tokens for vesting contract
    console.log("\nApproving tokens...");
    const approveTx = await token.approve(vestingAddress, totalAmount);
    await approveTx.wait();
    console.log("Tokens approved");
    
    // Create vesting schedule
    console.log("\nCreating vesting schedule...");
    const createTx = await vesting.createVestingSchedule(
        beneficiaryAddress,
        totalAmount,
        startTime,
        vestingDuration
    );
    await createTx.wait();
    console.log("Vesting schedule created!");
    console.log("Transaction hash:", createTx.hash);
    
    // Verify the schedule
    const schedule = await vesting.getVestingSchedule(beneficiaryAddress);
    console.log("\nVesting Schedule Created:");
    console.log("- Beneficiary:", schedule.beneficiary);
    console.log("- Total Amount:", ethers.utils.formatEther(schedule.totalAmount), "VTK");
    console.log("- Start Time:", new Date(schedule.startTime * 1000).toLocaleString());
    console.log("- Duration:", schedule.vestingDuration.toNumber() / (24 * 60 * 60), "days");
    console.log("- Is Active:", schedule.isActive);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });