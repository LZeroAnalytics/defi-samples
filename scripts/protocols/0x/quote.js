/**
 * Get quotes from 0x Protocol
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Getting quotes from 0x Protocol...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  
  const supportedChainIds = [1, 56, 137, 42161, 10, 43114, 42220, 250];
  
  if (!supportedChainIds.includes(chainId)) {
    console.log(`Chain ID ${chainId} is not supported by 0x API. Using fallback simulation.`);
    throw new Error("Unsupported chain");
  }
  
  const ZRX_API_URL = `https://api.0x.org`;
  
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
        sellToken: WETH,
        buyToken: USDC,
        sellAmount: ethers.parseEther("1"), // 1 WETH
        sellSymbol: wethSymbol,
        buySymbol: usdcSymbol,
        sellDecimals: wethDecimals,
        buyDecimals: usdcDecimals
      },
      {
        sellToken: USDC,
        buyToken: DAI,
        sellAmount: ethers.parseUnits("1000", 6), // 1000 USDC
        sellSymbol: usdcSymbol,
        buySymbol: daiSymbol,
        sellDecimals: usdcDecimals,
        buyDecimals: daiDecimals
      },
      {
        sellToken: WETH,
        buyToken: WBTC,
        sellAmount: ethers.parseEther("10"), // 10 WETH
        sellSymbol: wethSymbol,
        buySymbol: wbtcSymbol,
        sellDecimals: wethDecimals,
        buyDecimals: wbtcDecimals
      }
    ];
    
    for (const request of quoteRequests) {
      console.log(`\nGetting quote for ${formatAmount(request.sellAmount, request.sellDecimals)} ${request.sellSymbol} to ${request.buySymbol}...`);
      
      try {
        const quoteResponse = await axios.get(`${ZRX_API_URL}/swap/v1/quote`, {
          params: {
            sellToken: request.sellToken,
            buyToken: request.buyToken,
            sellAmount: request.sellAmount.toString(),
            slippagePercentage: 0.01, // 1% slippage
            skipValidation: true
          }
        });
        
        const quoteData = quoteResponse.data;
        
        console.log(`Quote details:`);
        console.log(`- Expected output: ${formatAmount(BigInt(quoteData.buyAmount), request.buyDecimals)} ${request.buySymbol}`);
        console.log(`- Price: 1 ${request.sellSymbol} = ${formatAmount(BigInt(quoteData.price) * BigInt(10 ** Number(request.buyDecimals)), request.buyDecimals)} ${request.buySymbol}`);
        console.log(`- Gas estimate: ${quoteData.estimatedGas}`);
        console.log(`- Gas price: ${ethers.formatUnits(quoteData.gasPrice, 'gwei')} gwei`);
        console.log(`- Protocol fee: ${ethers.formatEther(quoteData.protocolFee)} ETH`);
        console.log(`- Sources: ${JSON.stringify(quoteData.sources.filter(s => s.proportion > "0"), null, 2)}`);
        
        const sellAmountUSD = quoteData.sellAmount * quoteData.sellTokenToEthRate * quoteData.ethToUsdRate;
        const buyAmountUSD = quoteData.buyAmount * quoteData.buyTokenToEthRate * quoteData.ethToUsdRate;
        const priceImpact = (1 - (buyAmountUSD / sellAmountUSD)) * 100;
        
        console.log(`- Estimated price impact: ${priceImpact.toFixed(2)}%`);
        
        const gasCostETH = BigInt(quoteData.estimatedGas) * BigInt(quoteData.gasPrice);
        const gasCostUSD = Number(ethers.formatEther(gasCostETH)) * quoteData.ethToUsdRate;
        const totalCostUSD = sellAmountUSD - buyAmountUSD + gasCostUSD;
        
        console.log(`- Gas cost: ~${gasCostUSD.toFixed(2)} USD`);
        console.log(`- Total cost (including gas): ~${totalCostUSD.toFixed(2)} USD`);
        
      } catch (error) {
        console.log(`Error getting quote from 0x API: ${error.message}`);
        console.log(`This may be due to API rate limits, network issues, or insufficient liquidity.`);
      }
    }
    
  } catch (error) {
    console.error("Error getting quotes from 0x Protocol:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes from 0x Protocol:");
    
    console.log(`\nGetting quote for 1 WETH to USDC...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 2,000 USDC`);
    console.log(`- Price: 1 WETH = 2,000 USDC`);
    console.log(`- Gas estimate: 150000`);
    console.log(`- Gas price: 20 gwei`);
    console.log(`- Protocol fee: 0 ETH`);
    console.log(`- Sources: [{"name":"Uniswap_V3","proportion":"0.8"},{"name":"Sushiswap","proportion":"0.2"}]`);
    console.log(`- Estimated price impact: 0.05%`);
    console.log(`- Gas cost: ~6.00 USD`);
    console.log(`- Total cost (including gas): ~6.00 USD`);
    
    console.log(`\nGetting quote for 1000 USDC to DAI...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 999.5 DAI`);
    console.log(`- Price: 1 USDC = 0.9995 DAI`);
    console.log(`- Gas estimate: 180000`);
    console.log(`- Gas price: 20 gwei`);
    console.log(`- Protocol fee: 0 ETH`);
    console.log(`- Sources: [{"name":"Curve","proportion":"1.0"}]`);
    console.log(`- Estimated price impact: 0.05%`);
    console.log(`- Gas cost: ~7.20 USD`);
    console.log(`- Total cost (including gas): ~7.70 USD`);
    
    console.log(`\nGetting quote for 10 WETH to WBTC...`);
    console.log(`Quote details:`);
    console.log(`- Expected output: 0.6 WBTC`);
    console.log(`- Price: 1 WETH = 0.06 WBTC`);
    console.log(`- Gas estimate: 200000`);
    console.log(`- Gas price: 20 gwei`);
    console.log(`- Protocol fee: 0 ETH`);
    console.log(`- Sources: [{"name":"Uniswap_V3","proportion":"0.7"},{"name":"Balancer","proportion":"0.3"}]`);
    console.log(`- Estimated price impact: 0.10%`);
    console.log(`- Gas cost: ~8.00 USD`);
    console.log(`- Total cost (including gas): ~8.00 USD`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
