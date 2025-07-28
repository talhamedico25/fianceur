import { ethers } from 'ethers';

// Contract addresses - update these after deployment
export const CONTRACT_ADDRESSES = {
    TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Update after deployment
    VESTING: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" // Update after deployment
};

// Contract ABIs
export const TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function faucet(uint256 amount)"
];

export const VESTING_ABI = [
    "function createVestingSchedule(address beneficiary, uint256 totalAmount, uint256 startTime, uint256 vestingDuration)",
    "function signAgreement(string memory ipfsHash)",
    "function releaseTokens()",
    "function calculateReleasableAmount(address beneficiary) view returns (uint256)",
    "function getVestingSchedule(address beneficiary) view returns (tuple(address beneficiary, uint256 totalAmount, uint256 startTime, uint256 vestingDuration, uint256 releasedAmount, bool isActive))",
    "function getAgreement(address signer) view returns (tuple(string ipfsHash, address signer, uint256 timestamp, bool isSigned))",
    "function token() view returns (address)",
    "event VestingScheduleCreated(address indexed beneficiary, uint256 totalAmount, uint256 startTime, uint256 vestingDuration)",
    "event TokensReleased(address indexed beneficiary, uint256 amount)",
    "event AgreementSigned(address indexed signer, string ipfsHash, uint256 timestamp)"
];

export class ContractService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.tokenContract = null;
        this.vestingContract = null;
    }
    
    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }
        
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // Initialize contracts
            this.tokenContract = new ethers.Contract(
                CONTRACT_ADDRESSES.TOKEN,
                TOKEN_ABI,
                this.signer
            );
            
            this.vestingContract = new ethers.Contract(
                CONTRACT_ADDRESSES.VESTING,
                VESTING_ABI,
                this.signer
            );
            
            const address = await this.signer.getAddress();
            console.log('Connected to wallet:', address);
            return address;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }
    
    async getWalletAddress() {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        return await this.signer.getAddress();
    }
    
    async getTokenBalance(address) {
        if (!this.tokenContract) {
            throw new Error('Contract not initialized');
        }
        const balance = await this.tokenContract.balanceOf(address);
        return ethers.utils.formatEther(balance);
    }
    
    async getVestingSchedule(address) {
        if (!this.vestingContract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const schedule = await this.vestingContract.getVestingSchedule(address);
            return {
                beneficiary: schedule.beneficiary,
                totalAmount: ethers.utils.formatEther(schedule.totalAmount),
                startTime: schedule.startTime.toNumber(),
                vestingDuration: schedule.vestingDuration.toNumber(),
                releasedAmount: ethers.utils.formatEther(schedule.releasedAmount),
                isActive: schedule.isActive
            };
        } catch (error) {
            console.error('Error getting vesting schedule:', error);
            return null;
        }
    }
    
    async getAgreement(address) {
        if (!this.vestingContract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const agreement = await this.vestingContract.getAgreement(address);
            return {
                ipfsHash: agreement.ipfsHash,
                signer: agreement.signer,
                timestamp: agreement.timestamp.toNumber(),
                isSigned: agreement.isSigned
            };
        } catch (error) {
            console.error('Error getting agreement:', error);
            return null;
        }
    }
    
    async calculateReleasableAmount(address) {
        if (!this.vestingContract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const amount = await this.vestingContract.calculateReleasableAmount(address);
            return ethers.utils.formatEther(amount);
        } catch (error) {
            console.error('Error calculating releasable amount:', error);
            return '0';
        }
    }
    
    async signAgreement(ipfsHash) {
        if (!this.vestingContract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const tx = await this.vestingContract.signAgreement(ipfsHash);
            console.log('Signing agreement transaction:', tx.hash);
            await tx.wait();
            console.log('Agreement signed successfully');
            return tx.hash;
        } catch (error) {
            console.error('Error signing agreement:', error);
            throw error;
        }
    }
    
    async releaseTokens() {
        if (!this.vestingContract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const tx = await this.vestingContract.releaseTokens();
            console.log('Release tokens transaction:', tx.hash);
            await tx.wait();
            console.log('Tokens released successfully');
            return tx.hash;
        } catch (error) {
            console.error('Error releasing tokens:', error);
            throw error;
        }
    }
    
    async requestTestTokens(amount = "1000") {
        if (!this.tokenContract) {
            throw new Error('Contract not initialized');
        }
        
        try {
            const tx = await this.tokenContract.faucet(ethers.utils.parseEther(amount));
            console.log('Faucet transaction:', tx.hash);
            await tx.wait();
            console.log('Test tokens received');
            return tx.hash;
        } catch (error) {
            console.error('Error requesting test tokens:', error);
            throw error;
        }
    }
}

export const contractService = new ContractService();