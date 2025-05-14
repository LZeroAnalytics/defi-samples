/**
 * Get quotes from Uniswap X
 */

const { ethers } = require("hardhat");
const axios = require("axios");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Getting quotes from Uniswap X...");
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  const erc20Abi = [
    "function decimals() external view returns (uint8)"
  ];
  
  try {
    const provider = ethers.provider;
    
    const wethContract = new ethers.Contract(WETH, erc20Abi, provider);
    const usdcContract = new ethers.Contract(USDC, erc20Abi, provider);
    const daiContract = new ethers.Contract(DAI, erc20Abi, provider);
    
    const wethDecimals = await wethContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    const daiDecimals = await daiContract.decimals();
    
    const quoteRequests = [
      {
        tokenIn: WETH,
        tokenOut: USDC,
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: "WETH",
        tokenOutSymbol: "USDC",
        tokenInDecimals: wethDecimals,
        tokenOutDecimals: usdcDecimals
      },
      {
        tokenIn: USDC,
        tokenOut: WETH,
        amountIn: ethers.parseUnits("1000", 6), // 1000 USDC
        tokenInSymbol: "USDC",
        tokenOutSymbol: "WETH",
        tokenInDecimals: usdcDecimals,
        tokenOutDecimals: wethDecimals
      },
      {
        tokenIn: WETH,
        tokenOut: DAI,
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: "WETH",
        tokenOutSymbol: "DAI",
        tokenInDecimals: wethDecimals,
        tokenOutDecimals: daiDecimals
      }
    ];
    
    for (const quote of quoteRequests) {
      console.log(`\nGetting quote for ${formatAmount(quote.amountIn, quote.tokenInDecimals)} ${quote.tokenInSymbol} to ${quote.tokenOutSymbol}...`);
      
      try {
        const url = `https://api.uniswap.org/v1/quote?protocols=v2%2Cv3%2Cmixed&tokenInAddress=${quote.tokenIn}&tokenInChainId=1&tokenOutAddress=${quote.tokenOut}&tokenOutChainId=1&amount=${quote.amountIn.toString()}&type=exactIn`;
        
        const response = await axios.get(url);
        const quoteData = response.data;
        
        const amountOut = BigInt(quoteData.quote);
        
        console.log(`Quote: ${formatAmount(quote.amountIn, quote.tokenInDecimals)} ${quote.tokenInSymbol} = ${formatAmount(amountOut, quote.tokenOutDecimals)} ${quote.tokenOutSymbol}`);
        
        const price = (amountOut * BigInt(10 ** Number(quote.tokenInDecimals))) / (quote.amountIn * BigInt(10 ** Number(quote.tokenOutDecimals)));
        console.log(`Price: 1 ${quote.tokenInSymbol} = ${formatAmount(price, 0)} ${quote.tokenOutSymbol}`);
        
        console.log(`Routing:`);
        for (const route of quoteData.routingInfo) {
          console.log(`- Protocol: ${route.protocol}`);
          console.log(`  Portion: ${route.portion * 100}%`);
          if (route.route) {
            for (const hop of route.route) {
              console.log(`  Hop: ${hop.tokenIn.symbol} -> ${hop.tokenOut.symbol} (${hop.fee / 10000}% fee)`);
            }
          }
        }
        
        console.log(`Gas estimate: ${quoteData.gasUseEstimate} units`);
        
      } catch (error) {
        console.error(`Error getting quote for ${quote.tokenInSymbol} to ${quote.tokenOutSymbol}:`, error.message);
        
        console.log("Falling back to simulation...");
        
        let simulatedAmountOut;
        if (quote.tokenInSymbol === "WETH" && quote.tokenOutSymbol === "USDC") {
          simulatedAmountOut = ethers.parseUnits("2000", 6); // 1 WETH = 2000 USDC
        } else if (quote.tokenInSymbol === "USDC" && quote.tokenOutSymbol === "WETH") {
          simulatedAmountOut = ethers.parseEther("0.0005"); // 1000 USDC = 0.5 WETH
        } else if (quote.tokenInSymbol === "WETH" && quote.tokenOutSymbol === "DAI") {
          simulatedAmountOut = ethers.parseEther("2000"); // 1 WETH = 2000 DAI
        }
        
        console.log(`Simulated quote: ${formatAmount(quote.amountIn, quote.tokenInDecimals)} ${quote.tokenInSymbol} = ${formatAmount(simulatedAmountOut, quote.tokenOutDecimals)} ${quote.tokenOutSymbol}`);
        
        console.log(`Simulated routing:`);
        console.log(`- Protocol: v3`);
        console.log(`  Portion: 70%`);
        console.log(`  Hop: ${quote.tokenInSymbol} -> ${quote.tokenOutSymbol} (0.05% fee)`);
        console.log(`- Protocol: v2`);
        console.log(`  Portion: 30%`);
        console.log(`  Hop: ${quote.tokenInSymbol} -> ${quote.tokenOutSymbol}`);
        
        console.log(`Simulated gas estimate: 150000 units`);
      }
    }
    
  } catch (error) {
    console.error("Error getting quotes from Uniswap X:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes:");
    console.log("1 WETH = 2,000 USDC");
    console.log("1,000 USDC = 0.5 WETH");
    console.log("1 WETH = 2,000 DAI");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
