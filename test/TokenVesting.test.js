const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenVesting", function () {
    let token, vesting, owner, beneficiary, addr1;
    const totalSupply = ethers.utils.parseEther("1000000");
    const vestingAmount = ethers.utils.parseEther("1000");
    const vestingDuration = 30 * 24 * 60 * 60; // 30 days

    beforeEach(async function () {
        [owner, beneficiary, addr1] = await ethers.getSigners();

        // Deploy MockERC20 token
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        token = await MockERC20.deploy("VestingToken", "VTK", 1000000);
        await token.deployed();

        // Deploy TokenVesting contract
        const TokenVesting = await ethers.getContractFactory("TokenVesting");
        vesting = await TokenVesting.deploy(token.address);
        await vesting.deployed();

        // Mint tokens to owner
        await token.mint(owner.address, totalSupply);
    });

    describe("Deployment", function () {
        it("Should set the correct token address", async function () {
            expect(await vesting.token()).to.equal(token.address);
        });

        it("Should set the correct owner", async function () {
            expect(await vesting.owner()).to.equal(owner.address);
        });
    });

    describe("Creating Vesting Schedule", function () {
        it("Should create a vesting schedule successfully", async function () {
            const startTime = Math.floor(Date.now() / 1000) + 100;
            
            // Approve tokens
            await token.approve(vesting.address, vestingAmount);
            
            // Create vesting schedule
            await expect(vesting.createVestingSchedule(
                beneficiary.address,
                vestingAmount,
                startTime,
                vestingDuration
            )).to.emit(vesting, "VestingScheduleCreated")
            .withArgs(beneficiary.address, vestingAmount, startTime, vestingDuration);

            // Check the schedule
            const schedule = await vesting.getVestingSchedule(beneficiary.address);
            expect(schedule.beneficiary).to.equal(beneficiary.address);
            expect(schedule.totalAmount).to.equal(vestingAmount);
            expect(schedule.startTime).to.equal(startTime);
            expect(schedule.vestingDuration).to.equal(vestingDuration);
            expect(schedule.releasedAmount).to.equal(0);
            expect(schedule.isActive).to.be.true;
        });

        it("Should fail if not called by owner", async function () {
            const startTime = Math.floor(Date.now() / 1000) + 100;
            
            await expect(vesting.connect(beneficiary).createVestingSchedule(
                beneficiary.address,
                vestingAmount,
                startTime,
                vestingDuration
            )).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should fail with zero beneficiary address", async function () {
            const startTime = Math.floor(Date.now() / 1000) + 100;
            await token.approve(vesting.address, vestingAmount);
            
            await expect(vesting.createVestingSchedule(
                ethers.constants.AddressZero,
                vestingAmount,
                startTime,
                vestingDuration
            )).to.be.revertedWith("Beneficiary cannot be zero address");
        });

        it("Should fail with zero amount", async function () {
            const startTime = Math.floor(Date.now() / 1000) + 100;
            
            await expect(vesting.createVestingSchedule(
                beneficiary.address,
                0,
                startTime,
                vestingDuration
            )).to.be.revertedWith("Total amount must be greater than 0");
        });

        it("Should fail with zero duration", async function () {
            const startTime = Math.floor(Date.now() / 1000) + 100;
            await token.approve(vesting.address, vestingAmount);
            
            await expect(vesting.createVestingSchedule(
                beneficiary.address,
                vestingAmount,
                startTime,
                0
            )).to.be.revertedWith("Vesting duration must be greater than 0");
        });
    });

    describe("Agreement Signing", function () {
        beforeEach(async function () {
            const startTime = Math.floor(Date.now() / 1000) + 100;
            await token.approve(vesting.address, vestingAmount);
            await vesting.createVestingSchedule(
                beneficiary.address,
                vestingAmount,
                startTime,
                vestingDuration
            );
        });

        it("Should sign agreement successfully", async function () {
            const ipfsHash = "QmTestHash123";
            
            await expect(vesting.connect(beneficiary).signAgreement(ipfsHash))
                .to.emit(vesting, "AgreementSigned")
                .withArgs(beneficiary.address, ipfsHash, await time.latest() + 1);

            const agreement = await vesting.getAgreement(beneficiary.address);
            expect(agreement.ipfsHash).to.equal(ipfsHash);
            expect(agreement.signer).to.equal(beneficiary.address);
            expect(agreement.isSigned).to.be.true;
        });

        it("Should fail with empty IPFS hash", async function () {
            await expect(vesting.connect(beneficiary).signAgreement(""))
                .to.be.revertedWith("IPFS hash cannot be empty");
        });

        it("Should fail if no active vesting schedule", async function () {
            const ipfsHash = "QmTestHash123";
            
            await expect(vesting.connect(addr1).signAgreement(ipfsHash))
                .to.be.revertedWith("No active vesting schedule");
        });
    });

    describe("Token Release", function () {
        beforeEach(async function () {
            const startTime = Math.floor(Date.now() / 1000);
            await token.approve(vesting.address, vestingAmount);
            await vesting.createVestingSchedule(
                beneficiary.address,
                vestingAmount,
                startTime,
                vestingDuration
            );
            
            // Sign agreement
            await vesting.connect(beneficiary).signAgreement("QmTestHash123");
        });

        it("Should calculate releasable amount correctly", async function () {
            // Fast forward time to middle of vesting period
            await network.provider.send("evm_increaseTime", [vestingDuration / 2]);
            await network.provider.send("evm_mine");

            const releasableAmount = await vesting.calculateReleasableAmount(beneficiary.address);
            expect(releasableAmount).to.be.closeTo(
                vestingAmount.div(2),
                ethers.utils.parseEther("10") // Allow 10 token tolerance
            );
        });

        it("Should release tokens successfully", async function () {
            // Fast forward time to middle of vesting period
            await network.provider.send("evm_increaseTime", [vestingDuration / 2]);
            await network.provider.send("evm_mine");

            const initialBalance = await token.balanceOf(beneficiary.address);
            const releasableAmount = await vesting.calculateReleasableAmount(beneficiary.address);

            await expect(vesting.connect(beneficiary).releaseTokens())
                .to.emit(vesting, "TokensReleased")
                .withArgs(beneficiary.address, releasableAmount);

            const finalBalance = await token.balanceOf(beneficiary.address);
            expect(finalBalance.sub(initialBalance)).to.equal(releasableAmount);
        });

        it("Should fail if agreement not signed", async function () {
            // Create new schedule without signing agreement
            await token.approve(vesting.address, vestingAmount);
            const startTime = Math.floor(Date.now() / 1000);
            await vesting.createVestingSchedule(
                addr1.address,
                vestingAmount,
                startTime,
                vestingDuration
            );

            await expect(vesting.connect(addr1).releaseTokens())
                .to.be.revertedWith("Agreement not signed");
        });

        it("Should fail if no tokens to release", async function () {
            await expect(vesting.connect(beneficiary).releaseTokens())
                .to.be.revertedWith("No tokens to release");
        });

        it("Should fail if not beneficiary", async function () {
            await expect(vesting.connect(addr1).releaseTokens())
                .to.be.revertedWith("Not a beneficiary");
        });
    });

    describe("Emergency Withdraw", function () {
        it("Should allow owner to emergency withdraw", async function () {
            const startTime = Math.floor(Date.now() / 1000) + 100;
            await token.approve(vesting.address, vestingAmount);
            await vesting.createVestingSchedule(
                beneficiary.address,
                vestingAmount,
                startTime,
                vestingDuration
            );

            const contractBalance = await token.balanceOf(vesting.address);
            const ownerInitialBalance = await token.balanceOf(owner.address);

            await vesting.emergencyWithdraw(contractBalance);

            const ownerFinalBalance = await token.balanceOf(owner.address);
            expect(ownerFinalBalance.sub(ownerInitialBalance)).to.equal(contractBalance);
        });

        it("Should fail if not called by owner", async function () {
            await expect(vesting.connect(beneficiary).emergencyWithdraw(100))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});