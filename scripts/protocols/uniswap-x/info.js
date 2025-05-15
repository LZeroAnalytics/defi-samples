/**
 * Get information about Uniswap X
 */

const { ethers } = require("hardhat");
const axios = require("axios");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Getting information about Uniswap X...");
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  try {
    console.log("Uniswap X Overview:");
    console.log("-------------------");
    console.log("Uniswap X is the latest iteration of the Uniswap protocol, featuring:");
    console.log("- Unified liquidity across AMMs and order books");
    console.log("- MEV protection");
    console.log("- Gas-free trading via intents");
    console.log("- Improved capital efficiency");
    console.log("- Lower slippage for traders");
    
    console.log("\nKey Contracts:");
    console.log("- Universal Router: 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD");
    console.log("- Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3");
    
    console.log("\nAttempting to fetch protocol information from Uniswap API...");
    
    try {
      const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
      
      const supportedChainIds = [1, 10, 42161, 137, 56];
      
      if (!supportedChainIds.includes(chainId)) {
        console.log(`Chain ID ${chainId} is not supported by Uniswap API. Using fallback simulation.`);
        
        console.log("\nSimulated Uniswap X information:");
        console.log("- Universal Router: 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD");
        console.log("- Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3");
        console.log("- Supports limit orders, Dutch auctions, and TWAMM");
        console.log("- Integrates with Uniswap V2 and V3 liquidity");
        console.log("- Provides MEV protection through intents-based architecture");
        
        return;
      }
      
      const response = await axios.get(`https://api.uniswap.org/v1/pools/v3?chainId=${chainId}&first=5`);
      
      if (response.data && response.data.data && response.data.data.pools) {
        const pools = response.data.data.pools;
        
        console.log(`\nTop Uniswap V3 Pools (Uniswap X integrates with these):`);
        for (const pool of pools) {
          console.log(`- ${pool.token0.symbol}/${pool.token1.symbol} (${pool.feeTier / 10000}%)`);
          console.log(`  TVL: $${formatAmount(BigInt(pool.totalValueLockedUSD), 0, 2)}`);
          console.log(`  Volume (24h): $${formatAmount(BigInt(pool.volumeUSD), 0, 2)}`);
        }
      }
    } catch (error) {
      console.log("Could not fetch data from Uniswap API:", error.message);
    }
    
    console.log("\nUniswap X Features:");
    console.log("1. Dutch Auctions");
    console.log("   - Time-based price curves");
    console.log("   - Starts at higher price, decreases over time");
    console.log("   - Helps discover fair market price");
    
    console.log("\n2. Limit Orders");
    console.log("   - Set desired price for trades");
    console.log("   - Execute automatically when price is reached");
    console.log("   - No gas costs for order placement");
    
    console.log("\n3. Fill-or-Kill Orders");
    console.log("   - Either execute completely or not at all");
    console.log("   - Prevents partial fills");
    
    console.log("\n4. Time-Weighted Average Market Maker (TWAMM)");
    console.log("   - Executes large orders over time");
    console.log("   - Reduces price impact");
    console.log("   - Minimizes MEV extraction");
    
    console.log("\nHow to Use Uniswap X:");
    console.log("1. Connect wallet to Uniswap interface");
    console.log("2. Select tokens to swap");
    console.log("3. Choose order type (market, limit, etc.)");
    console.log("4. Set parameters (price, expiration, etc.)");
    console.log("5. Sign transaction (no gas fees for order placement)");
    
  } catch (error) {
    console.error("Error getting information about Uniswap X:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated Uniswap X information:");
    console.log("- Universal Router: 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD");
    console.log("- Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3");
    console.log("- Supports limit orders, Dutch auctions, and TWAMM");
    console.log("- Integrates with Uniswap V2 and V3 liquidity");
    console.log("- Provides MEV protection through intents-based architecture");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
