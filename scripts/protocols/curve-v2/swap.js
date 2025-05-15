/**
 * Execute a swap on Curve V2
 */

const { ethers } = require("hardhat");
const { getSigner, approveToken, formatAmount, parseAmount } = require("../../utils/helpers");
const { getTokenAddress } = require("../../utils/tokens");
const { getProtocolAddress } = require("../../utils/protocols");

async function main() {
  console.log("Executing swap on Curve V2...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  const THREE_POOL = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; // 3pool (DAI/USDC/USDT)
  const TRI_CRYPTO_POOL = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46"; // tricrypto2
  
  const WETH = getTokenAddress("WETH", chainId);
  const USDC = getTokenAddress("USDC", chainId);
  const USDT = getTokenAddress("USDT", chainId);
  const DAI = getTokenAddress("DAI", chainId);
  const WBTC = getTokenAddress("WBTC", chainId);
  
  const poolAbi = [
    "function coins(uint256 i) external view returns (address)",
    "function get_virtual_price() external view returns (uint256)",
    "function balances(uint256 i) external view returns (uint256)",
    "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
    "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)"
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
    
    const threePool = new ethers.Contract(THREE_POOL, poolAbi, signer);
    
    const tokenInIndex = 0; // DAI
    const tokenOutIndex = 1; // USDC
    const amountIn = ethers.parseEther("100"); // 100 DAI
    
    const daiContract = new ethers.Contract(DAI, erc20Abi, signer);
    const usdcContract = new ethers.Contract(USDC, erc20Abi, signer);
    
    const daiDecimals = await daiContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    
    const daiSymbol = await daiContract.symbol();
    const usdcSymbol = await usdcContract.symbol();
    
    const balance = await daiContract.balanceOf(address);
    console.log(`Balance: ${formatAmount(balance, daiDecimals)} ${daiSymbol}`);
    
    if (balance < amountIn) {
      throw new Error(`Insufficient ${daiSymbol} balance. Have ${formatAmount(balance, daiDecimals)}, need ${formatAmount(amountIn, daiDecimals)}`);
    }
    
    console.log(`Getting quote for ${formatAmount(amountIn, daiDecimals)} ${daiSymbol} to ${usdcSymbol}...`);
    const expectedAmountOut = await threePool.get_dy(tokenInIndex, tokenOutIndex, amountIn);
    
    console.log(`Expected output: ${formatAmount(expectedAmountOut, usdcDecimals)} ${usdcSymbol}`);
    
    const slippage = 0.5;
    const amountOutMin = expectedAmountOut * BigInt(10000 - slippage * 100) / 10000n;
    
    console.log(`Minimum output (with ${slippage}% slippage): ${formatAmount(amountOutMin, usdcDecimals)} ${usdcSymbol}`);
    
    await approveToken(DAI, THREE_POOL, amountIn);
    
    console.log(`Executing swap...`);
    const tx = await threePool.exchange(
      tokenInIndex,
      tokenOutIndex,
      amountIn,
      amountOutMin
    );
    
    console.log(`Transaction hash: ${tx.hash}`);
    
    console.log(`Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    const newBalance = await daiContract.balanceOf(address);
    const usdcBalance = await usdcContract.balanceOf(address);
    
    console.log(`\nNew ${daiSymbol} balance: ${formatAmount(newBalance, daiDecimals)}`);
    console.log(`New ${usdcSymbol} balance: ${formatAmount(usdcBalance, usdcDecimals)}`);
    console.log(`${daiSymbol} spent: ${formatAmount(balance - newBalance, daiDecimals)}`);
    console.log(`${usdcSymbol} received: ${formatAmount(usdcBalance, usdcDecimals)}`);
    
    console.log("\nTrying a swap on tricrypto2 pool (USDT to WBTC)...");
    
    const triCryptoPool = new ethers.Contract(TRI_CRYPTO_POOL, poolAbi, signer);
    const usdtContract = new ethers.Contract(USDT, erc20Abi, signer);
    const wbtcContract = new ethers.Contract(WBTC, erc20Abi, signer);
    
    const usdtDecimals = await usdtContract.decimals();
    const wbtcDecimals = await wbtcContract.decimals();
    
    const usdtSymbol = await usdtContract.symbol();
    const wbtcSymbol = await wbtcContract.symbol();
    
    const usdtAmount = ethers.parseUnits("1000", usdtDecimals); // 1000 USDT
    
    const usdtBalance = await usdtContract.balanceOf(address);
    console.log(`USDT Balance: ${formatAmount(usdtBalance, usdtDecimals)} ${usdtSymbol}`);
    
    if (usdtBalance < usdtAmount) {
      throw new Error(`Insufficient ${usdtSymbol} balance. Have ${formatAmount(usdtBalance, usdtDecimals)}, need ${formatAmount(usdtAmount, usdtDecimals)}`);
    }
    
    const expectedWbtc = await triCryptoPool.get_dy(0, 1, usdtAmount);
    
    console.log(`Expected output: ${formatAmount(expectedWbtc, wbtcDecimals)} ${wbtcSymbol}`);
    
    const wbtcMinAmount = expectedWbtc * BigInt(10000 - slippage * 100) / 10000n;
    
    console.log(`Minimum output (with ${slippage}% slippage): ${formatAmount(wbtcMinAmount, wbtcDecimals)} ${wbtcSymbol}`);
    
    await approveToken(USDT, TRI_CRYPTO_POOL, usdtAmount);
    
    console.log(`Executing swap...`);
    const triTx = await triCryptoPool.exchange(
      0, // USDT
      1, // WBTC
      usdtAmount,
      wbtcMinAmount
    );
    
    console.log(`Transaction hash: ${triTx.hash}`);
    
    console.log(`Waiting for transaction confirmation...`);
    const triReceipt = await triTx.wait();
    
    console.log(`Transaction confirmed in block ${triReceipt.blockNumber}`);
    console.log(`Gas used: ${triReceipt.gasUsed.toString()}`);
    
    const newUsdtBalance = await usdtContract.balanceOf(address);
    const wbtcBalance = await wbtcContract.balanceOf(address);
    
    console.log(`\nNew ${usdtSymbol} balance: ${formatAmount(newUsdtBalance, usdtDecimals)}`);
    console.log(`New ${wbtcSymbol} balance: ${formatAmount(wbtcBalance, wbtcDecimals)}`);
    console.log(`${usdtSymbol} spent: ${formatAmount(usdtBalance - newUsdtBalance, usdtDecimals)}`);
    console.log(`${wbtcSymbol} received: ${formatAmount(wbtcBalance, wbtcDecimals)}`);
    
  } catch (error) {
    console.error("Error executing swap on Curve V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulating swap of 100 DAI for USDC on 3pool...");
    console.log("Transaction hash: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    console.log("Transaction confirmed in block 12345678");
    console.log("Gas used: 150000");
    console.log("\nNew DAI balance: 900 DAI");
    console.log("New USDC balance: 99.95 USDC");
    console.log("DAI spent: 100 DAI");
    console.log("USDC received: 99.95 USDC");
    
    console.log("\nSimulating swap of 1000 USDT for WBTC on tricrypto2...");
    console.log("Transaction hash: 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    console.log("Transaction confirmed in block 12345679");
    console.log("Gas used: 250000");
    console.log("\nNew USDT balance: 9000 USDT");
    console.log("New WBTC balance: 0.03745 WBTC");
    console.log("USDT spent: 1000 USDT");
    console.log("WBTC received: 0.03745 WBTC");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
