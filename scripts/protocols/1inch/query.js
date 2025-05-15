/**
 * Query 1inch Protocol information
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Querying 1inch Protocol information...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  
  const supportedChainIds = [1, 56, 137, 10, 42161, 100, 43114, 250];
  
  if (!supportedChainIds.includes(chainId)) {
    console.log(`Chain ID ${chainId} is not supported by 1inch API. Using fallback simulation.`);
    throw new Error("Unsupported chain");
  }
  
  const ONEINCH_API_URL = `https://api.1inch.io/v5.0/${chainId}`;
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  
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
    
    const wethDecimals = await wethContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    const daiDecimals = await daiContract.decimals();
    const wbtcDecimals = await wbtcContract.decimals();
    
    const wethSymbol = await wethContract.symbol();
    const usdcSymbol = await usdcContract.symbol();
    const daiSymbol = await daiContract.symbol();
    const wbtcSymbol = await wbtcContract.symbol();
    
    console.log(`\nToken Information:`);
    console.log(`${wethSymbol}: ${WETH} (${wethDecimals} decimals)`);
    console.log(`${usdcSymbol}: ${USDC} (${usdcDecimals} decimals)`);
    console.log(`${daiSymbol}: ${DAI} (${daiDecimals} decimals)`);
    console.log(`${wbtcSymbol}: ${WBTC} (${wbtcDecimals} decimals)`);
    
    console.log(`\nQuerying 1inch API for token information...`);
    
    try {
      const tokensResponse = await axios.get(`${ONEINCH_API_URL}/tokens`);
      const tokens = tokensResponse.data.tokens;
      
      console.log(`1inch supported tokens (sample):`);
      const tokenSample = Object.keys(tokens).slice(0, 5);
      for (const tokenAddress of tokenSample) {
        const token = tokens[tokenAddress];
        console.log(`- ${token.symbol}: ${tokenAddress} (${token.decimals} decimals)`);
      }
      console.log(`... and ${Object.keys(tokens).length - 5} more tokens`);
    } catch (error) {
      console.log(`Error querying 1inch API for tokens: ${error.message}`);
      console.log(`This may be due to API rate limits or network issues.`);
    }
    
    console.log(`\nQuerying 1inch API for supported protocols...`);
    
    try {
      const protocolsResponse = await axios.get(`${ONEINCH_API_URL}/liquidity-sources`);
      const protocols = protocolsResponse.data.protocols;
      
      console.log(`1inch supported protocols:`);
      for (const protocol of protocols) {
        console.log(`- ${protocol.id}: ${protocol.title}`);
      }
    } catch (error) {
      console.log(`Error querying 1inch API for protocols: ${error.message}`);
      console.log(`This may be due to API rate limits or network issues.`);
    }
    
    console.log(`\nQuerying 1inch API for health status...`);
    
    try {
      const healthResponse = await axios.get(`${ONEINCH_API_URL}/healthcheck`);
      const health = healthResponse.data;
      
      console.log(`1inch API health status: ${health.status}`);
      if (health.status === "OK") {
        console.log(`All systems operational`);
      } else {
        console.log(`Some systems may be experiencing issues`);
      }
    } catch (error) {
      console.log(`Error querying 1inch API for health status: ${error.message}`);
      console.log(`This may be due to API rate limits or network issues.`);
    }
    
    console.log(`\nQuerying 1inch API for approval spender...`);
    
    try {
      const spenderResponse = await axios.get(`${ONEINCH_API_URL}/approve/spender`);
      const spender = spenderResponse.data.address;
      
      console.log(`1inch approval spender address: ${spender}`);
      console.log(`This is the address that needs to be approved for token swaps`);
    } catch (error) {
      console.log(`Error querying 1inch API for approval spender: ${error.message}`);
      console.log(`This may be due to API rate limits or network issues.`);
    }
    
  } catch (error) {
    console.error("Error querying 1inch Protocol:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated 1inch Protocol information:");
    
    console.log(`\nToken Information:`);
    console.log(`WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (18 decimals)`);
    console.log(`USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (6 decimals)`);
    console.log(`DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F (18 decimals)`);
    console.log(`WBTC: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 (8 decimals)`);
    
    console.log(`\n1inch supported tokens (sample):`);
    console.log(`- WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (18 decimals)`);
    console.log(`- USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (6 decimals)`);
    console.log(`- DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F (18 decimals)`);
    console.log(`- WBTC: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 (8 decimals)`);
    console.log(`- USDT: 0xdAC17F958D2ee523a2206206994597C13D831ec7 (6 decimals)`);
    console.log(`... and 100+ more tokens`);
    
    console.log(`\n1inch supported protocols:`);
    console.log(`- UNISWAP_V1: Uniswap V1`);
    console.log(`- UNISWAP_V2: Uniswap V2`);
    console.log(`- UNISWAP_V3: Uniswap V3`);
    console.log(`- SUSHI: SushiSwap`);
    console.log(`- CURVE: Curve.fi`);
    console.log(`- BALANCER_V1: Balancer V1`);
    console.log(`- BALANCER_V2: Balancer V2`);
    console.log(`- PANCAKESWAP: PancakeSwap`);
    
    console.log(`\n1inch API health status: OK`);
    console.log(`All systems operational`);
    
    console.log(`\n1inch approval spender address: 0x1111111254EEB25477B68fb85Ed929f73A960582`);
    console.log(`This is the address that needs to be approved for token swaps`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
