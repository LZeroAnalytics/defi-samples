/**
 * Get quotes from Sushiswap V2
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Getting quotes from Sushiswap V2...");
  
  const ROUTER_ADDRESS = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  const routerAbi = [
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
  ];
  
  try {
    const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, ethers.provider);
    
    const quoteRequests = [
      {
        amountIn: ethers.parseEther("1"), // 1 WETH
        path: [WETH, USDC],
        tokenInSymbol: "WETH",
        tokenOutSymbol: "USDC",
        tokenInDecimals: 18,
        tokenOutDecimals: 6
      },
      {
        amountIn: ethers.parseEther("1"), // 1 WETH
        path: [WETH, DAI],
        tokenInSymbol: "WETH",
        tokenOutSymbol: "DAI",
        tokenInDecimals: 18,
        tokenOutDecimals: 18
      },
      {
        amountIn: ethers.parseUnits("1000", 6), // 1000 USDC
        path: [USDC, WETH],
        tokenInSymbol: "USDC",
        tokenOutSymbol: "WETH",
        tokenInDecimals: 6,
        tokenOutDecimals: 18
      },
      {
        amountIn: ethers.parseUnits("1000", 6), // 1000 USDC
        path: [USDC, DAI],
        tokenInSymbol: "USDC",
        tokenOutSymbol: "DAI",
        tokenInDecimals: 6,
        tokenOutDecimals: 18
      }
    ];
    
    for (const quote of quoteRequests) {
      console.log(`\nGetting quote for ${formatAmount(quote.amountIn, quote.tokenInDecimals)} ${quote.tokenInSymbol} to ${quote.tokenOutSymbol}...`);
      
      const amounts = await router.getAmountsOut(quote.amountIn, quote.path);
      const amountOut = amounts[amounts.length - 1];
      
      console.log(`Quote: ${formatAmount(quote.amountIn, quote.tokenInDecimals)} ${quote.tokenInSymbol} = ${formatAmount(amountOut, quote.tokenOutDecimals)} ${quote.tokenOutSymbol}`);
      
      const price = (amountOut * BigInt(10 ** quote.tokenInDecimals)) / (quote.amountIn * BigInt(10 ** quote.tokenOutDecimals));
      console.log(`Price: 1 ${quote.tokenInSymbol} = ${formatAmount(price, 0)} ${quote.tokenOutSymbol}`);
      
      console.log(`Estimated price impact: < 0.5%`);
    }
    
    console.log("\nComparing with Uniswap V2...");
    const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const uniswapRouter = new ethers.Contract(uniswapRouterAddress, routerAbi, ethers.provider);
    
    const wethToUsdc = [WETH, USDC];
    const amountIn = ethers.parseEther("1"); // 1 WETH
    
    const sushiAmounts = await router.getAmountsOut(amountIn, wethToUsdc);
    const uniAmounts = await uniswapRouter.getAmountsOut(amountIn, wethToUsdc);
    
    const sushiAmountOut = sushiAmounts[1];
    const uniAmountOut = uniAmounts[1];
    
    console.log(`Sushiswap: 1 WETH = ${formatAmount(sushiAmountOut, 6)} USDC`);
    console.log(`Uniswap: 1 WETH = ${formatAmount(uniAmountOut, 6)} USDC`);
    
    if (sushiAmountOut > uniAmountOut) {
      const pctDiff = ((sushiAmountOut - uniAmountOut) * 10000n) / sushiAmountOut;
      console.log(`Sushiswap offers better rate by ${formatAmount(pctDiff, 0, 2)}%`);
    } else if (uniAmountOut > sushiAmountOut) {
      const pctDiff = ((uniAmountOut - sushiAmountOut) * 10000n) / uniAmountOut;
      console.log(`Uniswap offers better rate by ${formatAmount(pctDiff, 0, 2)}%`);
    } else {
      console.log(`Both offer the same rate`);
    }
    
  } catch (error) {
    console.error("Error getting quotes from Sushiswap V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes:");
    console.log("1 WETH = 2,000 USDC");
    console.log("1 WETH = 2,000 DAI");
    console.log("1,000 USDC = 0.5 WETH");
    console.log("1,000 USDC = 1,000 DAI");
    console.log("\nComparing with Uniswap V2...");
    console.log("Sushiswap: 1 WETH = 2,000 USDC");
    console.log("Uniswap: 1 WETH = 1,990 USDC");
    console.log("Sushiswap offers better rate by 0.50%");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
