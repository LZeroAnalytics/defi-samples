/**
 * Get quotes from 1inch Protocol
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Getting quotes from 1inch Protocol...");
  
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
    "function decimals() external view returns (uint8)"
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
    
    const quoteRequests = [
      {
        fromToken: WETH,
        toToken: USDC,
        amount: ethers.parseEther("1"), // 1 WETH
        fromSymbol: wethSymbol,
        toSymbol: usdcSymbol,
        fromDecimals: wethDecimals,
        toDecimals: usdcDecimals
      },
      {
        fromToken: USDC,
        toToken: DAI,
        amount: ethers.parseUnits("1000", 6), // 1000 USDC
        fromSymbol: usdcSymbol,
        toSymbol: daiSymbol,
        fromDecimals: usdcDecimals,
        toDecimals: daiDecimals
      },
      {
        fromToken: WETH,
        toToken: WBTC,
        amount: ethers.parseEther("10"), // 10 WETH
        fromSymbol: wethSymbol,
        toSymbol: wbtcSymbol,
        fromDecimals: wethDecimals,
        toDecimals: wbtcDecimals
      }
    ];
    
    for (const request of quoteRequests) {
      console.log(`\nGetting quote for ${formatAmount(request.amount, request.fromDecimals)} ${request.fromSymbol} to ${request.toSymbol}...`);
      
      try {
        const quoteResponse = await axios.get(`${ONEINCH_API_URL}/quote`, {
          params: {
            fromTokenAddress: request.fromToken,
            toTokenAddress: request.toToken,
            amount: request.amount.toString(),
            protocols: 'UNISWAP_V3,UNISWAP_V2,SUSHI,CURVE,BALANCER_V2'
          }
        });
        
        const quoteData = quoteResponse.data;
        
        console.log(`Quote details:`);
        console.log(`- Expected output: ${formatAmount(BigInt(quoteData.toAmount), request.toDecimals)} ${request.toSymbol}`);
        console.log(`- Price: 1 ${request.fromSymbol} = ${formatAmount(BigInt(quoteData.toAmount) * BigInt(10 ** Number(request.fromDecimals)) / request.amount, request.toDecimals)} ${request.toSymbol}`);
        console.log(`- Gas estimate: ${quoteData.estimatedGas}`);
        
        if (quoteData.protocols && quoteData.protocols.length > 0) {
          console.log(`- Protocols used: ${JSON.stringify(quoteData.protocols.map(p => p.map(s => s.name)), null, 2)}`);
        }
        
      } catch (error) {
        console.log(`Error getting quote from 1inch API: ${error.message}`);
        console.log(`This may be due to API rate limits, network issues, or insufficient liquidity.`);
      }
    }
    
  } catch (error) {
    console.error("Error getting quotes from 1inch Protocol:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes from 1inch Protocol:");
    
    console.log(`\nGetting quote for 1 WETH to USDC...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 2,000 USDC`);
    console.log(`- Price: 1 WETH = 2,000 USDC`);
    console.log(`- Gas estimate: 150000`);
    console.log(`- Protocols used: [["UNISWAP_V3"], ["CURVE"]]`);
    
    console.log(`\nGetting quote for 1000 USDC to DAI...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 999.5 DAI`);
    console.log(`- Price: 1 USDC = 0.9995 DAI`);
    console.log(`- Gas estimate: 180000`);
    console.log(`- Protocols used: [["CURVE"]]`);
    
    console.log(`\nGetting quote for 10 WETH to WBTC...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 0.6 WBTC`);
    console.log(`- Price: 1 WETH = 0.06 WBTC`);
    console.log(`- Gas estimate: 200000`);
    console.log(`- Protocols used: [["UNISWAP_V3"], ["BALANCER_V2"]]`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
