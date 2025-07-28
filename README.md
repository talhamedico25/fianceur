# Token Vesting dApp

A full-stack decentralized application (dApp) for token vesting with IPFS document signing functionality. Built with Solidity smart contracts, React frontend, and ethers.js for blockchain interaction.

## Features

### Smart Contract Features
- **Token Vesting**: Linear vesting schedule with customizable duration
- **IPFS Document Signing**: Store and sign agreement documents on IPFS
- **Access Control**: Only beneficiaries can release their vested tokens
- **Security**: Built with OpenZeppelin contracts for security and reentrancy protection

### Frontend Features
- **Wallet Connection**: MetaMask integration
- **Document Upload**: Upload files or paste text to IPFS
- **Agreement Signing**: Sign documents on the blockchain
- **Vesting Dashboard**: Real-time vesting progress and token release

## Tech Stack

- **Smart Contracts**: Solidity 0.8.19, OpenZeppelin
- **Development**: Hardhat, Ethers.js
- **Frontend**: React, CSS3
- **Storage**: IPFS (simulated for demo)
- **Wallet**: MetaMask

## Project Structure

```
├── contracts/
│   ├── TokenVesting.sol      # Main vesting contract
│   └── MockERC20.sol         # Test token contract
├── scripts/
│   ├── deploy.js             # Deployment script
│   └── create-vesting.js     # Create vesting schedule
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── utils/           # Contract and IPFS utilities
│   │   ├── App.js           # Main app component
│   │   └── App.css          # Styles
│   └── public/              # Static files
└── hardhat.config.js        # Hardhat configuration
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension
- Git

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd token-vesting-dapp

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Start Local Blockchain

```bash
# Start Hardhat local network
npx hardhat node
```

Keep this terminal running. The local blockchain will be available at `http://127.0.0.1:8545`.

### 3. Deploy Smart Contracts

In a new terminal:

```bash
# Deploy contracts to local network
npx hardhat run scripts/deploy.js --network localhost
```

**Important**: Copy the deployed contract addresses from the output and update them in `frontend/src/utils/contract.js`:

```javascript
export const CONTRACT_ADDRESSES = {
    TOKEN: "YOUR_TOKEN_ADDRESS_HERE",
    VESTING: "YOUR_VESTING_ADDRESS_HERE"
};
```

### 4. Configure MetaMask

1. Open MetaMask
2. Add a new network with these settings:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. Import a test account using one of the private keys from the Hardhat node output

### 5. Create a Test Vesting Schedule

```bash
# Create vesting schedule for the connected MetaMask account
npx hardhat run scripts/create-vesting.js --network localhost

# Or specify a specific beneficiary address
npx hardhat run scripts/create-vesting.js --network localhost -- 0xYourAddressHere
```

### 6. Start the Frontend

```bash
cd frontend
npm start
```

The dApp will be available at `http://localhost:3000`.

## Usage Guide

### 1. Connect Wallet
- Click "Connect MetaMask" to connect your wallet
- Make sure you're on the Hardhat Local network

### 2. Upload and Sign Agreement
- **Method 1**: Upload a file (supports .txt, .pdf, .doc, .docx)
- **Method 2**: Paste text directly into the textarea
- Click "Upload to IPFS" to store the document
- Click "Sign Agreement on Blockchain" to record the signature

### 3. View Vesting Dashboard
- See your token balance and releasable amount
- Monitor vesting progress with the progress bar
- View vesting schedule details
- Check agreement signing status

### 4. Release Tokens
- Tokens can only be released after signing an agreement
- Click "Release X.XXX VTK" to claim available tokens
- Tokens are released linearly over the vesting period

## Smart Contract Functions

### TokenVesting.sol

#### Owner Functions
- `createVestingSchedule(address, uint256, uint256, uint256)`: Create vesting schedule
- `emergencyWithdraw(uint256)`: Emergency token withdrawal

#### Beneficiary Functions
- `signAgreement(string)`: Sign agreement with IPFS hash
- `releaseTokens()`: Release vested tokens
- `calculateReleasableAmount(address)`: View releasable amount

#### View Functions
- `getVestingSchedule(address)`: Get vesting details
- `getAgreement(address)`: Get agreement details

## Development

### Run Tests
```bash
npx hardhat test
```

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Testnet
1. Update `hardhat.config.js` with testnet configuration
2. Add your private key and RPC URL
3. Deploy: `npx hardhat run scripts/deploy.js --network <network-name>`

## Security Considerations

- Uses OpenZeppelin's battle-tested contracts
- Implements reentrancy protection
- Requires agreement signing before token release
- Owner-only functions for schedule creation
- Emergency withdrawal function for contract owner

## IPFS Integration

The current implementation uses a simulated IPFS service for demonstration. For production:

1. Replace the IPFS service in `frontend/src/utils/ipfs.js`
2. Use services like:
   - [Pinata](https://pinata.cloud/)
   - [Infura IPFS](https://infura.io/product/ipfs)
   - [Web3.Storage](https://web3.storage/)

## Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Ensure you're on the correct network (Hardhat Local)
   - Refresh the page and try reconnecting

2. **Contract Address Errors**
   - Verify contract addresses in `frontend/src/utils/contract.js`
   - Redeploy contracts if needed

3. **Transaction Failures**
   - Check if you have enough ETH for gas fees
   - Ensure you have test tokens in your account

4. **Vesting Schedule Not Found**
   - Run the create-vesting script to create a schedule
   - Check that you're using the correct beneficiary address

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open a GitHub issue or contact the development team.
