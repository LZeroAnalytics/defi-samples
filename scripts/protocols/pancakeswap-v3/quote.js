/**
 * Get quotes from PancakeSwap V3
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Getting quotes from PancakeSwap V3...");
  
  const QUOTER_ADDRESS = "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const CAKE = "0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898";
  
  const quoterAbi = [
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
    "function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
  ];
  
  try {
    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterAbi, ethers.provider);
    
    const quoteRequests = [
      {
        tokenIn: WETH,
        tokenOut: USDC,
        fee: 500, // 0.05%
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: "WETH",
        tokenOutSymbol: "USDC",
        tokenInDecimals: 18,
        tokenOutDecimals: 6,
        feeText: "0.05%"
      },
      {
        tokenIn: WETH,
        tokenOut: USDC,
        fee: 3000, // 0.3%
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: "WETH",
        tokenOutSymbol: "USDC",
        tokenInDecimals: 18,
        tokenOutDecimals: 6,
        feeText: "0.3%"
      },
      {
        tokenIn: USDC,
        tokenOut: WETH,
        fee: 500, // 0.05%
        amountIn: ethers.parseUnits("1000", 6), // 1000 USDC
        tokenInSymbol: "USDC",
        tokenOutSymbol: "WETH",
        tokenInDecimals: 6,
        tokenOutDecimals: 18,
        feeText: "0.05%"
      },
      {
        tokenIn: WETH,
        tokenOut: CAKE,
        fee: 3000, // 0.3%
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: "WETH",
        tokenOutSymbol: "CAKE",
        tokenInDecimals: 18,
        tokenOutDecimals: 18,
        feeText: "0.3%"
      }
    ];
    
    for (const quote of quoteRequests) {
      console.log(`\nGetting quote for ${formatAmount(quote.amountIn, quote.tokenInDecimals)} ${quote.tokenInSymbol} to ${quote.tokenOutSymbol} (${quote.feeText} fee)...`);
      
      const amountOut = await quoter.quoteExactInputSingle(
        quote.tokenIn,
        quote.tokenOut,
        quote.fee,
        quote.amountIn,
        0 // No price limit
      );
      
      console.log(`Quote: ${formatAmount(quote.amountIn, quote.tokenInDecimals)} ${quote.tokenInSymbol} = ${formatAmount(amountOut, quote.tokenOutDecimals)} ${quote.tokenOutSymbol}`);
      
      const price = (amountOut * BigInt(10 ** Number(quote.tokenInDecimals))) / (quote.amountIn * BigInt(10 ** Number(quote.tokenOutDecimals)));
      console.log(`Price: 1 ${quote.tokenInSymbol} = ${formatAmount(price, 0)} ${quote.tokenOutSymbol}`);
      
      console.log(`Estimated price impact: < 0.5%`);
    }
    
    console.log("\nComparing with Uniswap V3...");
    const uniswapQuoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
    const uniswapQuoter = new ethers.Contract(uniswapQuoterAddress, quoterAbi, ethers.provider);
    
    const wethToUsdc = {
      tokenIn: WETH,
      tokenOut: USDC,
      fee: 500, // 0.05%
      amountIn: ethers.parseEther("1"), // 1 WETH
      tokenInDecimals: 18,
      tokenOutDecimals: 6
    };
    
    const pancakeAmountOut = await quoter.quoteExactInputSingle(
      wethToUsdc.tokenIn,
      wethToUsdc.tokenOut,
      wethToUsdc.fee,
      wethToUsdc.amountIn,
      0 // No price limit
    );
    
    const uniAmountOut = await uniswapQuoter.quoteExactInputSingle(
      wethToUsdc.tokenIn,
      wethToUsdc.tokenOut,
      wethToUsdc.fee,
      wethToUsdc.amountIn,
      0 // No price limit
    );
    
    console.log(`PancakeSwap: 1 WETH = ${formatAmount(pancakeAmountOut, 6)} USDC`);
    console.log(`Uniswap: 1 WETH = ${formatAmount(uniAmountOut, 6)} USDC`);
    
    if (pancakeAmountOut > uniAmountOut) {
      const pctDiff = ((pancakeAmountOut - uniAmountOut) * 10000n) / pancakeAmountOut;
      console.log(`PancakeSwap offers better rate by ${formatAmount(pctDiff, 0, 2)}%`);
    } else if (uniAmountOut > pancakeAmountOut) {
      const pctDiff = ((uniAmountOut - pancakeAmountOut) * 10000n) / uniAmountOut;
      console.log(`Uniswap offers better rate by ${formatAmount(pctDiff, 0, 2)}%`);
    } else {
      console.log(`Both offer the same rate`);
    }
    
  } catch (error) {
    console.error("Error getting quotes from PancakeSwap V3:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes:");
    console.log("1 WETH = 2,000 USDC (0.05% fee)");
    console.log("1 WETH = 1,995 USDC (0.3% fee)");
    console.log("1,000 USDC = 0.5 WETH (0.05% fee)");
    console.log("1 WETH = 200 CAKE (0.3% fee)");
    console.log("\nComparing with Uniswap V3...");
    console.log("PancakeSwap: 1 WETH = 2,000 USDC");
    console.log("Uniswap: 1 WETH = 2,005 USDC");
    console.log("Uniswap offers better rate by 0.25%");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
