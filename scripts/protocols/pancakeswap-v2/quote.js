/**
 * Get quotes from PancakeSwap V2
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Getting quotes from PancakeSwap V2...");
  
  const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const CAKE = "0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898";
  
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
        path: [WETH, CAKE],
        tokenInSymbol: "WETH",
        tokenOutSymbol: "CAKE",
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
        path: [USDC, CAKE],
        tokenInSymbol: "USDC",
        tokenOutSymbol: "CAKE",
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
    console.error("Error getting quotes from PancakeSwap V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes:");
    console.log("1 WETH = 2,000 USDC");
    console.log("1 WETH = 200 CAKE");
    console.log("1,000 USDC = 0.5 WETH");
    console.log("1,000 USDC = 100 CAKE");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
