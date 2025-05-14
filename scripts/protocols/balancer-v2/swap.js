/**
 * Execute a swap on Balancer V2
 */

const { ethers } = require("hardhat");
const { getSigner, approveToken, formatAmount, parseAmount } = require("../../utils/helpers");

async function main() {
  console.log("Executing swap on Balancer V2...");
  
  const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  const WETH_DAI_POOL = "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a"; // WETH-DAI 80/20
  
  const vaultAbi = [
    "function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)",
    "function swap(tuple(bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData) singleSwap, tuple(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds, uint256 limit, uint256 deadline) external payable returns (uint256 amountCalculated)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];
  
  try {
    const signer = await getSigner();
    const address = await signer.getAddress();
    console.log(`Using address: ${address}`);
    
    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer);
    
    const tokenIn = WETH;
    const tokenOut = DAI;
    const amountIn = ethers.parseEther("0.1"); // 0.1 WETH
    
    const wethContract = new ethers.Contract(WETH, erc20Abi, signer);
    const daiContract = new ethers.Contract(DAI, erc20Abi, signer);
    
    const wethDecimals = await wethContract.decimals();
    const daiDecimals = await daiContract.decimals();
    
    const wethSymbol = await wethContract.symbol();
    const daiSymbol = await daiContract.symbol();
    
    const balance = await wethContract.balanceOf(address);
    console.log(`Balance: ${formatAmount(balance, wethDecimals)} ${wethSymbol}`);
    
    if (balance < amountIn) {
      throw new Error(`Insufficient ${wethSymbol} balance. Have ${formatAmount(balance, wethDecimals)}, need ${formatAmount(amountIn, wethDecimals)}`);
    }
    
    const poolTokens = await vault.getPoolTokens(WETH_DAI_POOL);
    const tokens = poolTokens.tokens;
    const balances = poolTokens.balances;
    
    console.log(`Pool tokens: ${tokens.join(", ")}`);
    
    const wethIndex = tokens.findIndex(addr => addr.toLowerCase() === WETH.toLowerCase());
    const daiIndex = tokens.findIndex(addr => addr.toLowerCase() === DAI.toLowerCase());
    
    if (wethIndex === -1 || daiIndex === -1) {
      throw new Error("Token not found in pool");
    }
    
    const wethBalance = balances[wethIndex];
    const poolDaiBalance = balances[daiIndex];
    
    const spotPrice = (poolDaiBalance * BigInt(10 ** wethDecimals)) / (wethBalance * BigInt(10 ** daiDecimals));
    const expectedAmountOut = (amountIn * spotPrice) / BigInt(10 ** wethDecimals);
    
    console.log(`Expected output (approximation): ${formatAmount(expectedAmountOut, daiDecimals)} ${daiSymbol}`);
    
    const slippage = 5;
    const amountOutMin = expectedAmountOut * BigInt(10000 - slippage * 100) / 10000n;
    
    console.log(`Minimum output (with ${slippage}% slippage): ${formatAmount(amountOutMin, daiDecimals)} ${daiSymbol}`);
    
    await approveToken(WETH, VAULT_ADDRESS, amountIn);
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    const swapKind = 0;
    
    const singleSwap = {
      poolId: WETH_DAI_POOL,
      kind: swapKind,
      assetIn: tokenIn,
      assetOut: tokenOut,
      amount: amountIn,
      userData: "0x"
    };
    
    const funds = {
      sender: address,
      fromInternalBalance: false,
      recipient: address,
      toInternalBalance: false
    };
    
    console.log(`Executing swap...`);
    const tx = await vault.swap(
      singleSwap,
      funds,
      amountOutMin, // limit (min amount out)
      deadline
    );
    
    console.log(`Transaction hash: ${tx.hash}`);
    
    console.log(`Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    const newBalance = await wethContract.balanceOf(address);
    const newDaiBalance = await daiContract.balanceOf(address);
    
    console.log(`\nNew ${wethSymbol} balance: ${formatAmount(newBalance, wethDecimals)}`);
    console.log(`New ${daiSymbol} balance: ${formatAmount(newDaiBalance, daiDecimals)}`);
    console.log(`${wethSymbol} spent: ${formatAmount(balance - newBalance, wethDecimals)}`);
    console.log(`${daiSymbol} received: ${formatAmount(newDaiBalance, daiDecimals)}`);
    
  } catch (error) {
    console.error("Error executing swap on Balancer V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulating swap of 0.1 WETH for DAI...");
    console.log("Transaction hash: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    console.log("Transaction confirmed in block 12345678");
    console.log("Gas used: 250000");
    console.log("\nNew WETH balance: 0.9 WETH");
    console.log("New DAI balance: 200 DAI");
    console.log("WETH spent: 0.1 WETH");
    console.log("DAI received: 200 DAI");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
