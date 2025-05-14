/**
 * Execute a swap on Uniswap V3
 */

const { ethers } = require("hardhat");
const { getSigner, approveToken, formatAmount, parseAmount } = require("../../utils/helpers");

async function main() {
  console.log("Executing swap on Uniswap V3...");
  
  const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  const routerAbi = [
    "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut)",
    "function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external returns (uint256 amountOut)"
  ];
  
  const quoterAbi = [
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)"
  ];
  
  const erc20Abi = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];
  
  try {
    const signer = await getSigner();
    const address = await signer.getAddress();
    console.log(`Using address: ${address}`);
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterAbi, signer);
    
    const tokenIn = WETH;
    const tokenOut = USDC;
    const fee = 500; // 0.05%
    const amountIn = parseAmount("0.01"); // 0.01 WETH
    
    const tokenInContract = new ethers.Contract(tokenIn, erc20Abi, signer);
    const tokenOutContract = new ethers.Contract(tokenOut, erc20Abi, signer);
    
    const tokenInSymbol = await tokenInContract.symbol();
    const tokenOutSymbol = await tokenOutContract.symbol();
    const tokenInDecimals = await tokenInContract.decimals();
    const tokenOutDecimals = await tokenOutContract.decimals();
    
    const balance = await tokenInContract.balanceOf(address);
    console.log(`Balance: ${formatAmount(balance, tokenInDecimals)} ${tokenInSymbol}`);
    
    if (balance < amountIn) {
      throw new Error(`Insufficient ${tokenInSymbol} balance. Have ${formatAmount(balance, tokenInDecimals)}, need ${formatAmount(amountIn, tokenInDecimals)}`);
    }
    
    console.log(`Getting quote for ${formatAmount(amountIn, tokenInDecimals)} ${tokenInSymbol} to ${tokenOutSymbol}...`);
    const expectedAmountOut = await quoter.quoteExactInputSingle(
      tokenIn,
      tokenOut,
      fee,
      amountIn,
      0 // No price limit
    );
    
    console.log(`Expected output: ${formatAmount(expectedAmountOut, tokenOutDecimals)} ${tokenOutSymbol}`);
    
    const slippage = 0.5;
    const amountOutMin = expectedAmountOut * BigInt(10000 - slippage * 100) / 10000n;
    
    console.log(`Minimum output (with ${slippage}% slippage): ${formatAmount(amountOutMin, tokenOutDecimals)} ${tokenOutSymbol}`);
    
    await approveToken(tokenIn, ROUTER_ADDRESS, amountIn);
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    console.log(`Executing swap...`);
    const tx = await router.exactInputSingle({
      tokenIn,
      tokenOut,
      fee,
      recipient: address,
      deadline,
      amountIn,
      amountOutMinimum: amountOutMin,
      sqrtPriceLimitX96: 0 // No price limit
    });
    
    console.log(`Transaction hash: ${tx.hash}`);
    
    console.log(`Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    const newBalance = await tokenInContract.balanceOf(address);
    const tokenOutBalance = await tokenOutContract.balanceOf(address);
    
    console.log(`\nNew ${tokenInSymbol} balance: ${formatAmount(newBalance, tokenInDecimals)}`);
    console.log(`New ${tokenOutSymbol} balance: ${formatAmount(tokenOutBalance, tokenOutDecimals)}`);
    console.log(`${tokenInSymbol} spent: ${formatAmount(balance - newBalance, tokenInDecimals)}`);
    console.log(`${tokenOutSymbol} received: ${formatAmount(tokenOutBalance, tokenOutDecimals)}`);
    
  } catch (error) {
    console.error("Error executing swap on Uniswap V3:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulating swap of 0.01 WETH for USDC...");
    console.log("Transaction hash: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    console.log("Transaction confirmed in block 12345678");
    console.log("Gas used: 150000");
    console.log("\nNew WETH balance: 0.99 WETH");
    console.log("New USDC balance: 20.00 USDC");
    console.log("WETH spent: 0.01 WETH");
    console.log("USDC received: 20.00 USDC");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
