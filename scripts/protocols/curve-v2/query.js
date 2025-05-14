/**
 * Query Curve V2 pool information
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Querying Curve V2 pool information...");
  
  const CURVE_REGISTRY_ADDRESS = "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5"; // Curve Registry
  const CURVE_FACTORY_ADDRESS = "0xB9fC157394Af804a3578134A6585C0dc9cc990d4"; // Curve Factory
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  const TRI_CRYPTO_POOL = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46"; // tricrypto2
  const THREE_POOL = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; // 3pool (DAI/USDC/USDT)
  
  const poolAbi = [
    "function coins(uint256 i) external view returns (address)",
    "function get_virtual_price() external view returns (uint256)",
    "function balances(uint256 i) external view returns (uint256)",
    "function A() external view returns (uint256)",
    "function fee() external view returns (uint256)",
    "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)",
    "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  
  try {
    console.log("\nQuerying 3pool (DAI/USDC/USDT)...");
    const threePool = new ethers.Contract(THREE_POOL, poolAbi, ethers.provider);
    
    const virtualPrice = await threePool.get_virtual_price();
    console.log(`Virtual Price: ${formatAmount(virtualPrice, 18)}`);
    
    const fee = await threePool.fee();
    console.log(`Fee: ${formatAmount(fee, 8, 2)}%`);
    
    const A = await threePool.A();
    console.log(`A parameter: ${A.toString()}`);
    
    for (let i = 0; i < 3; i++) {
      const coinAddress = await threePool.coins(i);
      const coin = new ethers.Contract(coinAddress, erc20Abi, ethers.provider);
      
      const symbol = await coin.symbol();
      const decimals = await coin.decimals();
      const balance = await threePool.balances(i);
      
      console.log(`Coin ${i}: ${symbol} (${coinAddress})`);
      console.log(`  Balance: ${formatAmount(balance, decimals)} ${symbol}`);
    }
    
    console.log("\nQuerying tricrypto2 pool...");
    const triCryptoPool = new ethers.Contract(TRI_CRYPTO_POOL, poolAbi, ethers.provider);
    
    const triVirtualPrice = await triCryptoPool.get_virtual_price();
    console.log(`Virtual Price: ${formatAmount(triVirtualPrice, 18)}`);
    
    const triFee = await triCryptoPool.fee();
    console.log(`Fee: ${formatAmount(triFee, 8, 2)}%`);
    
    for (let i = 0; i < 3; i++) {
      try {
        const coinAddress = await triCryptoPool.coins(i);
        const coin = new ethers.Contract(coinAddress, erc20Abi, ethers.provider);
        
        const symbol = await coin.symbol();
        const decimals = await coin.decimals();
        const balance = await triCryptoPool.balances(i);
        
        console.log(`Coin ${i}: ${symbol} (${coinAddress})`);
        console.log(`  Balance: ${formatAmount(balance, decimals)} ${symbol}`);
      } catch (error) {
        console.log(`Error getting coin ${i}: ${error.message}`);
      }
    }
    
    console.log("\nGetting exchange rate example (DAI to USDC)...");
    const daiAmount = ethers.parseEther("1000"); // 1000 DAI
    
    try {
      const usdcAmount = await threePool.get_dy(0, 1, daiAmount);
      console.log(`1000 DAI = ${formatAmount(usdcAmount, 6)} USDC`);
      console.log(`Rate: 1 DAI = ${formatAmount(usdcAmount * BigInt(10 ** Number(12)) / daiAmount, 6)} USDC`);
    } catch (error) {
      console.log(`Error getting exchange rate: ${error.message}`);
    }
    
  } catch (error) {
    console.error("Error querying Curve V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated Curve V2 pool information:");
    console.log("\n3pool (DAI/USDC/USDT):");
    console.log("Virtual Price: 1.02");
    console.log("Fee: 0.04%");
    console.log("A parameter: 2000");
    console.log("Coin 0: DAI (0x6B175474E89094C44Da98b954EedeAC495271d0F)");
    console.log("  Balance: 100,000,000 DAI");
    console.log("Coin 1: USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)");
    console.log("  Balance: 200,000,000 USDC");
    console.log("Coin 2: USDT (0xdAC17F958D2ee523a2206206994597C13D831ec7)");
    console.log("  Balance: 150,000,000 USDT");
    
    console.log("\ntricrypto2 pool:");
    console.log("Virtual Price: 1.05");
    console.log("Fee: 0.04%");
    console.log("Coin 0: USDT (0xdAC17F958D2ee523a2206206994597C13D831ec7)");
    console.log("  Balance: 50,000,000 USDT");
    console.log("Coin 1: WBTC (0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599)");
    console.log("  Balance: 1,500 WBTC");
    console.log("Coin 2: WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)");
    console.log("  Balance: 20,000 WETH");
    
    console.log("\nExchange rate example:");
    console.log("1000 DAI = 999.5 USDC");
    console.log("Rate: 1 DAI = 0.9995 USDC");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
