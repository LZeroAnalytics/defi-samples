/**
 * Query KyberSwap information
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Querying KyberSwap information...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  const chainName = chainId === 1 ? "ethereum" : `chain-${chainId}`;
  const KYBERSWAP_API_URL = `https://aggregator-api.kyberswap.com/${chainName}`;
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  const KNC = "0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202";
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  
  try {
    const wethContract = new ethers.Contract(WETH, erc20Abi, ethers.provider);
    const usdcContract = new ethers.Contract(USDC, erc20Abi, ethers.provider);
    const daiContract = new ethers.Contract(DAI, erc20Abi, ethers.provider);
    const wbtcContract = new ethers.Contract(WBTC, erc20Abi, ethers.provider);
    const kncContract = new ethers.Contract(KNC, erc20Abi, ethers.provider);
    
    const wethDecimals = await wethContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    const daiDecimals = await daiContract.decimals();
    const wbtcDecimals = await wbtcContract.decimals();
    const kncDecimals = await kncContract.decimals();
    
    const wethSymbol = await wethContract.symbol();
    const usdcSymbol = await usdcContract.symbol();
    const daiSymbol = await daiContract.symbol();
    const wbtcSymbol = await wbtcContract.symbol();
    const kncSymbol = await kncContract.symbol();
    
    console.log(`\nToken Information:`);
    console.log(`${wethSymbol}: ${WETH} (${wethDecimals} decimals)`);
    console.log(`${usdcSymbol}: ${USDC} (${usdcDecimals} decimals)`);
    console.log(`${daiSymbol}: ${DAI} (${daiDecimals} decimals)`);
    console.log(`${wbtcSymbol}: ${WBTC} (${wbtcDecimals} decimals)`);
    console.log(`${kncSymbol}: ${KNC} (${kncDecimals} decimals)`);
    
    console.log(`\nQuerying KyberSwap API for token information...`);
    
    try {
      const tokenResponse = await axios.get(`${KYBERSWAP_API_URL}/tokens`);
      const tokens = tokenResponse.data.tokens;
      
      console.log(`KyberSwap supported tokens (sample):`);
      const tokenSample = Object.keys(tokens).slice(0, 5);
      for (const tokenAddress of tokenSample) {
        const token = tokens[tokenAddress];
        console.log(`- ${token.symbol}: ${tokenAddress} (${token.decimals} decimals)`);
      }
      console.log(`... and ${Object.keys(tokens).length - 5} more tokens`);
    } catch (error) {
      console.log(`Error querying KyberSwap API for tokens: ${error.message}`);
      console.log(`This may be due to API rate limits or network issues.`);
    }
    
    console.log(`\nQuerying KyberSwap API for supported DEXs...`);
    
    try {
      const dexsResponse = await axios.get(`${KYBERSWAP_API_URL}/dexes`);
      const dexs = dexsResponse.data;
      
      console.log(`KyberSwap supported DEXs:`);
      for (const dex of dexs) {
        console.log(`- ${dex.id}: ${dex.name}`);
      }
    } catch (error) {
      console.log(`Error querying KyberSwap API for DEXs: ${error.message}`);
      console.log(`This may be due to API rate limits or network issues.`);
    }
    
    console.log(`\nQuerying KyberSwap DMM pools...`);
    
    const DMM_FACTORY_ADDRESS = "0x833e4083B7ae46CeA85695c4f7ed25CDAd8886dE";
    
    const dmmFactoryAbi = [
      "function getPools(address tokenA, address tokenB) external view returns (address[] memory _pools)",
      "function isPool(address pair) external view returns (bool)"
    ];
    
    const dmmPoolAbi = [
      "function getTradeInfo() external view returns (uint256 reserveA, uint256 reserveB, uint32 ampBps)",
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ];
    
    const dmmFactory = new ethers.Contract(DMM_FACTORY_ADDRESS, dmmFactoryAbi, ethers.provider);
    
    try {
      const wethUsdcPools = await dmmFactory.getPools(WETH, USDC);
      
      console.log(`Found ${wethUsdcPools.length} WETH-USDC pools:`);
      
      for (let i = 0; i < wethUsdcPools.length; i++) {
        const poolAddress = wethUsdcPools[i];
        const pool = new ethers.Contract(poolAddress, dmmPoolAbi, ethers.provider);
        
        const token0 = await pool.token0();
        const token1 = await pool.token1();
        const reserves = await pool.getReserves();
        const tradeInfo = await pool.getTradeInfo();
        
        const isWethToken0 = token0.toLowerCase() === WETH.toLowerCase();
        const wethReserve = isWethToken0 ? reserves.reserve0 : reserves.reserve1;
        const usdcReserve = isWethToken0 ? reserves.reserve1 : reserves.reserve0;
        
        console.log(`Pool ${i+1}: ${poolAddress}`);
        console.log(`- Amplification factor: ${tradeInfo.ampBps / 10000}`);
        console.log(`- WETH reserve: ${formatAmount(wethReserve, wethDecimals)} WETH`);
        console.log(`- USDC reserve: ${formatAmount(usdcReserve, usdcDecimals)} USDC`);
        
        const wethToUsdcPrice = (usdcReserve * BigInt(10 ** Number(wethDecimals))) / (wethReserve * BigInt(10 ** Number(usdcDecimals)));
        console.log(`- Price: 1 WETH = ${formatAmount(wethToUsdcPrice, 0)} USDC`);
      }
    } catch (error) {
      console.log(`Error querying KyberSwap DMM pools: ${error.message}`);
      console.log(`This may be due to API rate limits, network issues, or contract changes.`);
    }
    
  } catch (error) {
    console.error("Error querying KyberSwap:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated KyberSwap information:");
    
    console.log(`\nToken Information:`);
    console.log(`WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (18 decimals)`);
    console.log(`USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (6 decimals)`);
    console.log(`DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F (18 decimals)`);
    console.log(`WBTC: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 (8 decimals)`);
    console.log(`KNC: 0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202 (18 decimals)`);
    
    console.log(`\nKyberSwap supported tokens (sample):`);
    console.log(`- WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (18 decimals)`);
    console.log(`- USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (6 decimals)`);
    console.log(`- DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F (18 decimals)`);
    console.log(`- WBTC: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 (8 decimals)`);
    console.log(`- KNC: 0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202 (18 decimals)`);
    console.log(`... and 100+ more tokens`);
    
    console.log(`\nKyberSwap supported DEXs:`);
    console.log(`- kyberswap: KyberSwap Classic`);
    console.log(`- kyberswap-elastic: KyberSwap Elastic`);
    console.log(`- uniswap: Uniswap V2`);
    console.log(`- uniswap-v3: Uniswap V3`);
    console.log(`- sushiswap: SushiSwap`);
    console.log(`- curve: Curve`);
    
    console.log(`\nFound 2 WETH-USDC pools:`);
    console.log(`Pool 1: 0x1234567890abcdef1234567890abcdef12345678`);
    console.log(`- Amplification factor: 1.5`);
    console.log(`- WETH reserve: 100 WETH`);
    console.log(`- USDC reserve: 200,000 USDC`);
    console.log(`- Price: 1 WETH = 2,000 USDC`);
    
    console.log(`Pool 2: 0xabcdef1234567890abcdef1234567890abcdef12`);
    console.log(`- Amplification factor: 2.0`);
    console.log(`- WETH reserve: 200 WETH`);
    console.log(`- USDC reserve: 400,000 USDC`);
    console.log(`- Price: 1 WETH = 2,000 USDC`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
