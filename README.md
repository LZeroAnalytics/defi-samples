# DeFi Samples

This repository contains sample scripts for interacting with various DeFi protocols on Ethereum mainnet using Hardhat and ethers.js.

## Supported Protocols

- Uniswap V2
- Uniswap V3
- Uniswap X
- Sushiswap V2
- PancakeSwap V2
- PancakeSwap V3
- Curve V2
- Balancer V2
- 0x Protocol (Aggregator)
- 1inch
- Kyberswap

## Setup

1. Clone the repository:
```bash
git clone https://github.com/LZeroAnalytics/defi-samples.git
cd defi-samples
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your RPC URL and private key:
```
RPC_URL=https://your-rpc-url
CHAIN_ID=1
PRIVATE_KEY=your-private-key
```

## Usage

Each protocol has its own directory under `scripts/protocols/` with various scripts for querying, getting quotes, and executing swaps.

### Example: Querying Uniswap V2

```bash
npx hardhat run scripts/protocols/uniswap-v2/query.js --network bloctopus
```

### Example: Getting a Quote from 1inch

```bash
npx hardhat run scripts/protocols/1inch/quote.js --network bloctopus
```

### Example: Executing a Swap on Kyberswap

```bash
npx hardhat run scripts/protocols/kyberswap/swap.js --network bloctopus
```

## Script Structure

Each protocol directory contains the following scripts:

- `query.js`: Retrieves information about the protocol, such as supported pools, tokens, and liquidity
- `quote.js`: Gets a quote for a token swap without executing the transaction
- `swap.js`: Executes a token swap transaction

## Environment Variables

- `RPC_URL`: The RPC endpoint for the Ethereum network
- `CHAIN_ID`: The chain ID of the network
- `PRIVATE_KEY`: The private key for the account that will execute transactions

## Notes

- These scripts are designed to work with a forked Ethereum mainnet
- Some protocols may not be available on all networks
- Always check your token balances and approvals before executing swaps
- The scripts include fallback simulation for scenarios where direct contract interaction fails
