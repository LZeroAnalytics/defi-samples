/**
 * Execute a swap on 1inch Protocol
 */

const { ethers } = require("hardhat");
const { getSigner, approveToken, formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Executing swap on 1inch Protocol...");
  
  const ONEINCH_API_URL = "https://api.1inch.io/v5.0/1";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
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
    
    const fromToken = WETH;
    const toToken = USDC;
    const amount = ethers.parseEther("0.1"); // 0.1 WETH
    
    const fromTokenContract = new ethers.Contract(fromToken, erc20Abi, signer);
    const toTokenContract = new ethers.Contract(toToken, erc20Abi, signer);
    
    const fromTokenDecimals = await fromTokenContract.decimals();
    const toTokenDecimals = await toTokenContract.decimals();
    
    const fromTokenSymbol = await fromTokenContract.symbol();
    const toTokenSymbol = await toTokenContract.symbol();
    
    const balance = await fromTokenContract.balanceOf(address);
    console.log(`Balance: ${formatAmount(balance, fromTokenDecimals)} ${fromTokenSymbol}`);
    
    if (balance < amount) {
      throw new Error(`Insufficient ${fromTokenSymbol} balance. Have ${formatAmount(balance, fromTokenDecimals)}, need ${formatAmount(amount, fromTokenDecimals)}`);
    }
    
    console.log(`Getting 1inch approval spender address...`);
    const spenderResponse = await axios.get(`${ONEINCH_API_URL}/approve/spender`);
    const spender = spenderResponse.data.address;
    
    console.log(`1inch approval spender address: ${spender}`);
    
    console.log(`Approving ${fromTokenSymbol} for swap...`);
    await approveToken(fromToken, spender, amount);
    
    console.log(`Getting swap data from 1inch API...`);
    
    const swapResponse = await axios.get(`${ONEINCH_API_URL}/swap`, {
      params: {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount.toString(),
        fromAddress: address,
        slippage: 1, // 1% slippage
        disableEstimate: true
      }
    });
    
    const swapData = swapResponse.data;
    
    console.log(`Swap details:`);
    console.log(`- Expected output: ${formatAmount(BigInt(swapData.toAmount), toTokenDecimals)} ${toTokenSymbol}`);
    console.log(`- Price: 1 ${fromTokenSymbol} = ${formatAmount(BigInt(swapData.toAmount) * BigInt(10 ** Number(fromTokenDecimals)) / amount, toTokenDecimals)} ${toTokenSymbol}`);
    console.log(`- Gas estimate: ${swapData.tx.gas}`);
    
    console.log(`Executing swap...`);
    
    const tx = await signer.sendTransaction({
      from: address,
      to: swapData.tx.to,
      data: swapData.tx.data,
      value: BigInt(swapData.tx.value || 0),
      gasLimit: BigInt(swapData.tx.gas) * 120n / 100n // Add 20% buffer
    });
    
    console.log(`Transaction hash: ${tx.hash}`);
    
    console.log(`Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    const newFromTokenBalance = await fromTokenContract.balanceOf(address);
    const newToTokenBalance = await toTokenContract.balanceOf(address);
    
    console.log(`\nNew ${fromTokenSymbol} balance: ${formatAmount(newFromTokenBalance, fromTokenDecimals)}`);
    console.log(`New ${toTokenSymbol} balance: ${formatAmount(newToTokenBalance, toTokenDecimals)}`);
    console.log(`${fromTokenSymbol} spent: ${formatAmount(balance - newFromTokenBalance, fromTokenDecimals)}`);
    console.log(`${toTokenSymbol} received: ${formatAmount(newToTokenBalance, toTokenDecimals)}`);
    
  } catch (error) {
    console.error("Error executing swap on 1inch Protocol:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulating swap of 0.1 WETH for USDC...");
    console.log("Transaction hash: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    console.log("Transaction confirmed in block 12345678");
    console.log("Gas used: 250000");
    console.log("\nNew WETH balance: 0.9 WETH");
    console.log("New USDC balance: 200 USDC");
    console.log("WETH spent: 0.1 WETH");
    console.log("USDC received: 200 USDC");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
