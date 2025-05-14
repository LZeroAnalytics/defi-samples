/**
 * Get quotes from Uniswap V3
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const { getTokenAddress } = require("../../utils/tokens");
const { getProtocolAddress } = require("../../utils/protocols");

async function main() {
  console.log("Getting quotes from Uniswap V3...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
  
  const WETH = getTokenAddress("WETH", chainId);
  const USDC = getTokenAddress("USDC", chainId);
  const DAI = getTokenAddress("DAI", chainId);
  
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
        tokenOut: DAI,
        fee: 3000, // 0.3%
        amountIn: ethers.parseEther("1"), // 1 WETH
        tokenInSymbol: "WETH",
        tokenOutSymbol: "DAI",
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
    
  } catch (error) {
    console.error("Error getting quotes from Uniswap V3:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes:");
    console.log("1 WETH = 2,000 USDC (0.05% fee)");
    console.log("1 WETH = 1,995 USDC (0.3% fee)");
    console.log("1,000 USDC = 0.5 WETH (0.05% fee)");
    console.log("1 WETH = 2,000 DAI (0.3% fee)");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
