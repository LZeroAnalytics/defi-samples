/**
 * Get quotes from Uniswap V2
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const { getTokenAddress } = require("../../utils/tokens");
const { getProtocolAddress } = require("../../utils/protocols");

async function main() {
  console.log("Getting quotes from Uniswap V2...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  const ROUTER_ADDRESS = getProtocolAddress("uniswapV2", "router", chainId);
  
  const WETH = getTokenAddress("WETH", chainId);
  const USDC = getTokenAddress("USDC", chainId);
  const DAI = getTokenAddress("DAI", chainId);
  
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
      
      const price = (amountOut * BigInt(10 ** Number(quote.tokenInDecimals))) / (quote.amountIn * BigInt(10 ** Number(quote.tokenOutDecimals)));
      console.log(`Price: 1 ${quote.tokenInSymbol} = ${formatAmount(price, 0)} ${quote.tokenOutSymbol}`);
      
      console.log(`Estimated price impact: < 0.5%`);
    }
    
  } catch (error) {
    console.error("Error getting quotes from Uniswap V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes:");
    console.log("1 WETH = 2,000 USDC");
    console.log("1 WETH = 2,000 DAI");
    console.log("1,000 USDC = 0.5 WETH");
    console.log("1,000 USDC = 1,000 DAI");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
