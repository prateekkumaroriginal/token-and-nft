# Blockchain DApp - ERC-20 Token & NFT Platform

A full-stack decentralized application featuring an ERC-20 token and ERC-721 NFT smart contracts with a modern React frontend. Users can transfer tokens and mint NFTs using the custom token as payment.

## Features

- **ERC-20 Token (XToken)**
  - Custom fungible token with configurable name, symbol, and initial supply
  - Transfer tokens between wallets
  - Real-time balance updates
  - Token transfer event tracking

- **ERC-721 NFT Collection (XNonFunToken)**
  - Mint NFTs by paying with ERC-20 tokens
  - Configurable mint fee
  - IPFS-ready metadata URI support
  - NFT minting and transfer event tracking

- **React Frontend**
  - MetaMask wallet integration
  - Real-time contract event listening
  - Network detection and validation
  - Modern dark-themed UI with Tailwind CSS

## Tech Stack

### Smart Contracts
- **Solidity** ^0.8.20
- **Hardhat** v3.1.6
- **OpenZeppelin Contracts** v5.4.0
- **Hardhat Ignition** for deployment

### Frontend
- **React** 19.2
- **TypeScript** 5.9
- **Vite** 7.2
- **Ethers.js** 6.16
- **Tailwind CSS** 4.1

## Project Structure

```
blockchain-assignment/
├── contracts/
│   ├── Token.sol          # ERC-20 token contract
│   └── NFT.sol             # ERC-721 NFT contract
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main application component
│   │   ├── NetworkInfo.tsx # Network information display
│   │   └── main.tsx        # Application entry point
│   ├── config.ts           # Contract addresses and ABIs
│   └── package.json
├── ignition/
│   └── modules/
│       ├── Token.ts        # Token deployment module
│       └── NFT.ts          # NFT deployment module
├── test/
│   └── Counter.ts          # Test files
├── hardhat.config.ts       # Hardhat configuration
└── package.json
```

## Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blockchain-assignment
```

### 2. Install Dependencies

```bash
# Install root dependencies (Hardhat and contracts)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Smart Contracts

### Token.sol (ERC-20)

A standard ERC-20 token with transfer event emissions.

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `name` | XToken | Token name |
| `symbol` | XT | Token symbol |
| `initialSupply` | 1000 tokens | Initial token supply (with 18 decimals) |

### NFT.sol (ERC-721)

An ERC-721 NFT contract that requires ERC-20 token payment for minting.

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `name` | XNonFunToken | NFT collection name |
| `symbol` | XNFT | NFT symbol |
| `mintFee` | 10 tokens | Cost to mint one NFT |
| `baseURI` | ipfs://metadata/ | Base URI for token metadata |

## Deployment

### Local Development (Hardhat Network)

#### 1. Start the Local Blockchain

```bash
npx hardhat node
```

This starts a local Ethereum network on `http://127.0.0.1:8545` with Chain ID `31337`.

#### 2. Deploy Contracts

In a new terminal:

```bash
# Deploy both Token and NFT contracts
npx hardhat ignition deploy ignition/modules/NFT.ts --network localhost
```

The deployment will output the contract addresses. Note these for the frontend configuration.

#### 3. Update Frontend Configuration

After deployment, update `frontend/config.ts` with the deployed contract addresses:

```typescript
export const TOKEN_ADDRESS = "<deployed-token-address>";
export const NFT_ADDRESS = "<deployed-nft-address>";
```

### Testnet Deployment (Sepolia)

#### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

#### 2. Deploy to Sepolia

```bash
npx hardhat ignition deploy ignition/modules/NFT.ts --network sepolia
```

## Running the Frontend

### Development Mode

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

```bash
cd frontend
npm run build
npm run preview
```

## MetaMask Setup

### Adding Hardhat Local Network

1. Open MetaMask
2. Click on the network dropdown
3. Select "Add Network" → "Add a network manually"
4. Enter the following details:
   - **Network Name:** Hardhat Localhost
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH

### Importing Test Accounts

When you run `npx hardhat node`, it displays 20 test accounts with 10,000 ETH each. Import one using its private key:

1. In MetaMask, click the account icon
2. Select "Import Account"
3. Paste a private key from the Hardhat node output

## Usage Guide

### 1. Connect Wallet
Click "Connect MetaMask" to connect your wallet to the DApp.

### 2. View Token Balance
Your ERC-20 token balance is displayed in the Token section.

### 3. Transfer Tokens
1. Enter the recipient's wallet address
2. Enter the amount to transfer
3. Click "Transfer Tokens"
4. Confirm the transaction in MetaMask

### 4. Mint NFT
1. Ensure you have enough tokens (default: 10 XT per NFT)
2. Click "Mint NFT"
3. Approve the token spending if prompted
4. Confirm the mint transaction
5. The minted NFT's Token ID and URI will be displayed

### 5. Event Log
All token transfers, NFT mints, and NFT transfers are logged in real-time in the Event Log panel.

## Contract Events

### Token Contract
- `TokensTransferred(address from, address to, uint256 amount)`

### NFT Contract
- `NFTMinted(address owner, uint256 tokenId)`
- `NFTTransferred(address from, address to, uint256 tokenId)`

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Hardhat Localhost | 31337 | http://127.0.0.1:8545 |
| Sepolia Testnet | 11155111 | Via Infura/Alchemy |

## Troubleshooting

### "Please install MetaMask!"
Install the MetaMask browser extension from [metamask.io](https://metamask.io).

### "You are not connected to Hardhat Localhost"
Ensure you've added the Hardhat network to MetaMask and selected it.

### Transaction Fails
- Check that you have enough ETH for gas fees
- For minting NFTs, ensure you have enough ERC-20 tokens
- Reset MetaMask account if nonce issues occur: Settings → Advanced → Clear Activity Tab Data

### Contract Not Found
Ensure the contract addresses in `frontend/config.ts` match the deployed addresses.

## Development Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node

# Deploy contracts
npx hardhat ignition deploy ignition/modules/NFT.ts --network localhost

# Frontend development
cd frontend && npm run dev

# Lint frontend
cd frontend && npm run lint
```

## Security Considerations

- Never commit private keys or `.env` files
- The contracts use OpenZeppelin's audited implementations
- Always test on testnets before mainnet deployment
- Review token approvals before confirming transactions

## License

ISC
