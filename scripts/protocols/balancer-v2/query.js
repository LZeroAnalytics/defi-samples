/**
 * Query Balancer V2 pool information
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Querying Balancer V2 pool information...");
  
  const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  const BALANCER_QUERIES = "0xE39B5e3B6D74016b2F6A9673D7d7493B6DF549d5";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const BAL = "0xba100000625a3754423978a60c9317c58a424e3D";
  
  const WETH_DAI_POOL = "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a"; // WETH-DAI 80/20
  const WETH_USDC_POOL = "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019"; // WETH-USDC 50/50
  
  const vaultAbi = [
    "function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  
  try {
    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, ethers.provider);
    
    console.log("\nQuerying WETH-DAI pool...");
    const wethDaiPoolId = WETH_DAI_POOL;
    
    const wethDaiData = await vault.getPoolTokens(wethDaiPoolId);
    const wethDaiTokens = wethDaiData.tokens;
    const wethDaiBalances = wethDaiData.balances;
    
    console.log(`Pool ID: ${wethDaiPoolId}`);
    console.log(`Last Change Block: ${wethDaiData.lastChangeBlock}`);
    
    for (let i = 0; i < wethDaiTokens.length; i++) {
      const tokenAddress = wethDaiTokens[i];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, ethers.provider);
      
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const balance = wethDaiBalances[i];
      
      console.log(`Token ${i}: ${symbol} (${tokenAddress})`);
      console.log(`  Balance: ${formatAmount(balance, decimals)} ${symbol}`);
    }
    
    console.log("\nQuerying WETH-USDC pool...");
    const wethUsdcPoolId = WETH_USDC_POOL;
    
    const wethUsdcData = await vault.getPoolTokens(wethUsdcPoolId);
    const wethUsdcTokens = wethUsdcData.tokens;
    const wethUsdcBalances = wethUsdcData.balances;
    
    console.log(`Pool ID: ${wethUsdcPoolId}`);
    console.log(`Last Change Block: ${wethUsdcData.lastChangeBlock}`);
    
    for (let i = 0; i < wethUsdcTokens.length; i++) {
      const tokenAddress = wethUsdcTokens[i];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, ethers.provider);
      
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const balance = wethUsdcBalances[i];
      
      console.log(`Token ${i}: ${symbol} (${tokenAddress})`);
      console.log(`  Balance: ${formatAmount(balance, decimals)} ${symbol}`);
    }
    
    if (wethDaiTokens.length >= 2) {
      const wethContract = new ethers.Contract(WETH, erc20Abi, ethers.provider);
      const daiContract = new ethers.Contract(DAI, erc20Abi, ethers.provider);
      
      const wethIndex = wethDaiTokens.findIndex(addr => addr.toLowerCase() === WETH.toLowerCase());
      const daiIndex = wethDaiTokens.findIndex(addr => addr.toLowerCase() === DAI.toLowerCase());
      
      if (wethIndex !== -1 && daiIndex !== -1) {
        const wethDecimals = await wethContract.decimals();
        const daiDecimals = await daiContract.decimals();
        
        const wethBalance = wethDaiBalances[wethIndex];
        const daiBalance = wethDaiBalances[daiIndex];
        
        const spotPrice = (daiBalance * BigInt(10 ** Number(wethDecimals))) / (wethBalance * BigInt(10 ** Number(daiDecimals)));
        
        console.log(`\nSpot Price: 1 WETH = ${formatAmount(spotPrice, 0)} DAI`);
        console.log(`Spot Price: 1 DAI = ${formatAmount(BigInt(10 ** 36) / spotPrice, 18)} WETH`);
      }
    }
    
    if (wethUsdcTokens.length >= 2) {
      const wethContract = new ethers.Contract(WETH, erc20Abi, ethers.provider);
      const usdcContract = new ethers.Contract(USDC, erc20Abi, ethers.provider);
      
      const wethIndex = wethUsdcTokens.findIndex(addr => addr.toLowerCase() === WETH.toLowerCase());
      const usdcIndex = wethUsdcTokens.findIndex(addr => addr.toLowerCase() === USDC.toLowerCase());
      
      if (wethIndex !== -1 && usdcIndex !== -1) {
        const wethDecimals = await wethContract.decimals();
        const usdcDecimals = await usdcContract.decimals();
        
        const wethBalance = wethUsdcBalances[wethIndex];
        const usdcBalance = wethUsdcBalances[usdcIndex];
        
        const spotPrice = (usdcBalance * BigInt(10 ** Number(wethDecimals))) / (wethBalance * BigInt(10 ** Number(usdcDecimals)));
        
        console.log(`\nSpot Price: 1 WETH = ${formatAmount(spotPrice, 0)} USDC`);
        console.log(`Spot Price: 1 USDC = ${formatAmount(BigInt(10 ** 24) / spotPrice, 18)} WETH`);
      }
    }
    
  } catch (error) {
    console.error("Error querying Balancer V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated Balancer V2 pool information:");
    
    console.log("\nWETH-DAI pool:");
    console.log("Pool ID: 0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a");
    console.log("Last Change Block: 15000000");
    console.log("Token 0: WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)");
    console.log("  Balance: 1,000 WETH");
    console.log("Token 1: DAI (0x6B175474E89094C44Da98b954EedeAC495271d0F)");
    console.log("  Balance: 2,000,000 DAI");
    console.log("\nSpot Price: 1 WETH = 2,000 DAI");
    console.log("Spot Price: 1 DAI = 0.0005 WETH");
    
    console.log("\nWETH-USDC pool:");
    console.log("Pool ID: 0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019");
    console.log("Last Change Block: 15000000");
    console.log("Token 0: WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)");
    console.log("  Balance: 500 WETH");
    console.log("Token 1: USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)");
    console.log("  Balance: 1,000,000 USDC");
    console.log("\nSpot Price: 1 WETH = 2,000 USDC");
    console.log("Spot Price: 1 USDC = 0.0005 WETH");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
