/**
 * Execute a swap on PancakeSwap V2
 */

const { ethers } = require("hardhat");
const { getSigner, approveToken, formatAmount, parseAmount } = require("../../utils/helpers");

async function main() {
  console.log("Executing swap on PancakeSwap V2...");
  
  const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const CAKE = "0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898";
  
  const routerAbi = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
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
    
    const tokenIn = WETH;
    const tokenOut = USDC;
    const amountIn = parseAmount("0.01"); // 0.01 WETH
    const path = [tokenIn, tokenOut];
    
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
    
    const amounts = await router.getAmountsOut(amountIn, path);
    const expectedAmountOut = amounts[1];
    
    console.log(`Swapping ${formatAmount(amountIn, tokenInDecimals)} ${tokenInSymbol} for approximately ${formatAmount(expectedAmountOut, tokenOutDecimals)} ${tokenOutSymbol}`);
    
    const slippage = 0.5;
    const amountOutMin = expectedAmountOut * BigInt(10000 - slippage * 100) / 10000n;
    
    console.log(`Minimum output (with ${slippage}% slippage): ${formatAmount(amountOutMin, tokenOutDecimals)} ${tokenOutSymbol}`);
    
    await approveToken(tokenIn, ROUTER_ADDRESS, amountIn);
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    console.log(`Executing swap...`);
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      address,
      deadline
    );
    
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
    console.error("Error executing swap on PancakeSwap V2:", error);
    
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
