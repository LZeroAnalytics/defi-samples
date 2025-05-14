/**
 * Get quotes from Curve V2
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Getting quotes from Curve V2...");
  
  const THREE_POOL = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; // 3pool (DAI/USDC/USDT)
  const TRI_CRYPTO_POOL = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46"; // tricrypto2
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  
  const poolAbi = [
    "function coins(uint256 i) external view returns (address)",
    "function get_virtual_price() external view returns (uint256)",
    "function balances(uint256 i) external view returns (uint256)",
    "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
    "function get_dy_underlying(int128 i, int128 j, uint256 dx) external view returns (uint256)",
    "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  
  try {
    console.log("\nGetting quotes from 3pool (DAI/USDC/USDT)...");
    const threePool = new ethers.Contract(THREE_POOL, poolAbi, ethers.provider);
    
    const daiContract = new ethers.Contract(DAI, erc20Abi, ethers.provider);
    const usdcContract = new ethers.Contract(USDC, erc20Abi, ethers.provider);
    const usdtContract = new ethers.Contract(USDT, erc20Abi, ethers.provider);
    
    const daiDecimals = await daiContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    const usdtDecimals = await usdtContract.decimals();
    
    const daiAmount = ethers.parseEther("1000"); // 1000 DAI
    const usdcFromDai = await threePool.get_dy(0, 1, daiAmount);
    
    console.log(`Quote: 1000 DAI = ${formatAmount(usdcFromDai, usdcDecimals)} USDC`);
    console.log(`Rate: 1 DAI = ${formatAmount(usdcFromDai * BigInt(10 ** Number(12)) / daiAmount, usdcDecimals)} USDC`);
    
    const usdcAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    const usdtFromUsdc = await threePool.get_dy(1, 2, usdcAmount);
    
    console.log(`Quote: 1000 USDC = ${formatAmount(usdtFromUsdc, usdtDecimals)} USDT`);
    console.log(`Rate: 1 USDC = ${formatAmount(usdtFromUsdc * BigInt(10 ** Number(0)) / usdcAmount, usdtDecimals)} USDT`);
    
    const usdtAmount = ethers.parseUnits("1000", 6); // 1000 USDT
    const daiFromUsdt = await threePool.get_dy(2, 0, usdtAmount);
    
    console.log(`Quote: 1000 USDT = ${formatAmount(daiFromUsdt, daiDecimals)} DAI`);
    console.log(`Rate: 1 USDT = ${formatAmount(daiFromUsdt * BigInt(10 ** Number(12)) / usdtAmount, daiDecimals)} DAI`);
    
    console.log("\nGetting quotes from tricrypto2 pool...");
    const triCryptoPool = new ethers.Contract(TRI_CRYPTO_POOL, poolAbi, ethers.provider);
    
    try {
      const usdtAmountTri = ethers.parseUnits("10000", 6); // 10000 USDT
      const wbtcFromUsdt = await triCryptoPool.get_dy(0, 1, usdtAmountTri);
      
      const wbtcContract = new ethers.Contract(WBTC, erc20Abi, ethers.provider);
      const wbtcDecimals = await wbtcContract.decimals();
      
      console.log(`Quote: 10000 USDT = ${formatAmount(wbtcFromUsdt, wbtcDecimals)} WBTC`);
      console.log(`Rate: 1 USDT = ${formatAmount(wbtcFromUsdt * BigInt(10 ** Number(0)) / usdtAmountTri, wbtcDecimals)} WBTC`);
      
      const wbtcAmount = ethers.parseUnits("1", 8); // 1 WBTC
      const wethFromWbtc = await triCryptoPool.get_dy(1, 2, wbtcAmount);
      
      const wethContract = new ethers.Contract(WETH, erc20Abi, ethers.provider);
      const wethDecimals = await wethContract.decimals();
      
      console.log(`Quote: 1 WBTC = ${formatAmount(wethFromWbtc, wethDecimals)} WETH`);
      console.log(`Rate: 1 WBTC = ${formatAmount(wethFromWbtc, wethDecimals)} WETH`);
      
      const wethAmount = ethers.parseEther("10"); // 10 WETH
      const usdtFromWeth = await triCryptoPool.get_dy(2, 0, wethAmount);
      
      console.log(`Quote: 10 WETH = ${formatAmount(usdtFromWeth, usdtDecimals)} USDT`);
      console.log(`Rate: 1 WETH = ${formatAmount(usdtFromWeth / BigInt(10), usdtDecimals)} USDT`);
    } catch (error) {
      console.log(`Error getting tricrypto2 quotes: ${error.message}`);
    }
    
    console.log("\nComparing with direct exchange rates...");
    
    const daiToUsdtDirect = await threePool.get_dy(0, 2, daiAmount);
    const daiToUsdcToUsdt = await threePool.get_dy(1, 2, usdcFromDai);
    
    console.log(`Direct: 1000 DAI = ${formatAmount(daiToUsdtDirect, usdtDecimals)} USDT`);
    console.log(`Via USDC: 1000 DAI = ${formatAmount(daiToUsdcToUsdt, usdtDecimals)} USDT (${formatAmount(usdcFromDai, usdcDecimals)} USDC)`);
    
    if (daiToUsdtDirect > daiToUsdcToUsdt) {
      console.log(`Direct route is better by ${formatAmount((daiToUsdtDirect - daiToUsdcToUsdt) * 10000n / daiToUsdtDirect, 2)}%`);
    } else if (daiToUsdcToUsdt > daiToUsdtDirect) {
      console.log(`Indirect route is better by ${formatAmount((daiToUsdcToUsdt - daiToUsdtDirect) * 10000n / daiToUsdcToUsdt, 2)}%`);
    } else {
      console.log(`Both routes offer the same rate`);
    }
    
  } catch (error) {
    console.error("Error getting quotes from Curve V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes from 3pool (DAI/USDC/USDT):");
    console.log("Quote: 1000 DAI = 999.5 USDC");
    console.log("Rate: 1 DAI = 0.9995 USDC");
    console.log("Quote: 1000 USDC = 999.8 USDT");
    console.log("Rate: 1 USDC = 0.9998 USDT");
    console.log("Quote: 1000 USDT = 999.2 DAI");
    console.log("Rate: 1 USDT = 0.9992 DAI");
    
    console.log("\nSimulated quotes from tricrypto2 pool:");
    console.log("Quote: 10000 USDT = 0.3745 WBTC");
    console.log("Rate: 1 USDT = 0.00003745 WBTC");
    console.log("Quote: 1 WBTC = 15.2 WETH");
    console.log("Rate: 1 WBTC = 15.2 WETH");
    console.log("Quote: 10 WETH = 17500 USDT");
    console.log("Rate: 1 WETH = 1750 USDT");
    
    console.log("\nComparing with direct exchange rates...");
    console.log("Direct: 1000 DAI = 999.0 USDT");
    console.log("Via USDC: 1000 DAI = 999.3 USDT (999.5 USDC)");
    console.log("Indirect route is better by 0.03%");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
