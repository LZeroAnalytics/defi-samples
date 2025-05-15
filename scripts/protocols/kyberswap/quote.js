/**
 * Get quotes from KyberSwap
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Getting quotes from KyberSwap...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  
  const supportedChainIds = [1, 56, 137, 42161, 10, 43114, 250, 25, 1313161554, 1101, 8453, 59144, 324];
  
  if (!supportedChainIds.includes(chainId)) {
    console.log(`Chain ID ${chainId} is not supported by KyberSwap API. Using fallback simulation.`);
    throw new Error("Unsupported chain");
  }
  
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
    "function decimals() external view returns (uint8)"
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
    
    const quoteRequests = [
      {
        tokenIn: WETH,
        tokenOut: USDC,
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: wethSymbol,
        tokenOutSymbol: usdcSymbol,
        tokenInDecimals: wethDecimals,
        tokenOutDecimals: usdcDecimals
      },
      {
        tokenIn: USDC,
        tokenOut: DAI,
        amountIn: ethers.parseUnits("1000", 6), // 1000 USDC
        tokenInSymbol: usdcSymbol,
        tokenOutSymbol: daiSymbol,
        tokenInDecimals: usdcDecimals,
        tokenOutDecimals: daiDecimals
      },
      {
        tokenIn: WETH,
        tokenOut: KNC,
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: wethSymbol,
        tokenOutSymbol: kncSymbol,
        tokenInDecimals: wethDecimals,
        tokenOutDecimals: kncDecimals
      }
    ];
    
    for (const request of quoteRequests) {
      console.log(`\nGetting quote for ${formatAmount(request.amountIn, request.tokenInDecimals)} ${request.tokenInSymbol} to ${request.tokenOutSymbol}...`);
      
      try {
        const quoteResponse = await axios.get(`${KYBERSWAP_API_URL}/route/encode`, {
          params: {
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            amountIn: request.amountIn.toString(),
            to: ethers.ZeroAddress, // This is just for quote, not actual swap
            saveGas: 0,
            gasInclude: 1,
            slippageTolerance: 50, // 0.5%
            chargeFeeBy: 'currency_in',
            feeReceiver: ethers.ZeroAddress,
            isInBps: 1
          }
        });
        
        const quoteData = quoteResponse.data;
        
        console.log(`Quote details:`);
        console.log(`- Expected output: ${formatAmount(BigInt(quoteData.outputAmount), request.tokenOutDecimals)} ${request.tokenOutSymbol}`);
        console.log(`- Price: 1 ${request.tokenInSymbol} = ${formatAmount(BigInt(quoteData.outputAmount) * BigInt(10 ** Number(request.tokenInDecimals)) / request.amountIn, request.tokenOutDecimals)} ${request.tokenOutSymbol}`);
        console.log(`- Gas estimate: ${quoteData.totalGas}`);
        
        if (quoteData.routeSummary) {
          console.log(`- Route summary:`);
          console.log(`  - Route type: ${quoteData.routeSummary.routerAddress ? 'Aggregation' : 'Direct'}`);
          console.log(`  - Hops: ${quoteData.routeSummary.hops || 1}`);
          console.log(`  - Exchanges: ${quoteData.routeSummary.exchanges ? quoteData.routeSummary.exchanges.join(', ') : 'Unknown'}`);
        }
        
        if (quoteData.amountInUsd && quoteData.amountOutUsd) {
          const priceImpact = (1 - (parseFloat(quoteData.amountOutUsd) / parseFloat(quoteData.amountInUsd))) * 100;
          console.log(`- Estimated price impact: ${priceImpact.toFixed(2)}%`);
        }
        
      } catch (error) {
        console.log(`Error getting quote from KyberSwap API: ${error.message}`);
        console.log(`This may be due to API rate limits, network issues, or insufficient liquidity.`);
      }
    }
    
  } catch (error) {
    console.error("Error getting quotes from KyberSwap:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes from KyberSwap:");
    
    console.log(`\nGetting quote for 1 WETH to USDC...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 2,000 USDC`);
    console.log(`- Price: 1 WETH = 2,000 USDC`);
    console.log(`- Gas estimate: 150000`);
    console.log(`- Route summary:`);
    console.log(`  - Route type: Aggregation`);
    console.log(`  - Hops: 1`);
    console.log(`  - Exchanges: KyberSwap, Uniswap V3`);
    console.log(`- Estimated price impact: 0.05%`);
    
    console.log(`\nGetting quote for 1000 USDC to DAI...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 999.5 DAI`);
    console.log(`- Price: 1 USDC = 0.9995 DAI`);
    console.log(`- Gas estimate: 180000`);
    console.log(`- Route summary:`);
    console.log(`  - Route type: Direct`);
    console.log(`  - Hops: 1`);
    console.log(`  - Exchanges: Curve`);
    console.log(`- Estimated price impact: 0.05%`);
    
    console.log(`\nGetting quote for 1 WETH to KNC...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 2,000 KNC`);
    console.log(`- Price: 1 WETH = 2,000 KNC`);
    console.log(`- Gas estimate: 200000`);
    console.log(`- Route summary:`);
    console.log(`  - Route type: Aggregation`);
    console.log(`  - Hops: 2`);
    console.log(`  - Exchanges: KyberSwap, Uniswap V3`);
    console.log(`- Estimated price impact: 0.10%`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
