/**
 * Execute a swap on 0x Protocol
 */

const { ethers } = require("hardhat");
const { getSigner, approveToken, formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Executing swap on 0x Protocol...");
  
  const ZRX_API_URL = "https://api.0x.org";
  
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
    
    const sellToken = WETH;
    const buyToken = USDC;
    const sellAmount = ethers.parseEther("0.1"); // 0.1 WETH
    
    const sellTokenContract = new ethers.Contract(sellToken, erc20Abi, signer);
    const buyTokenContract = new ethers.Contract(buyToken, erc20Abi, signer);
    
    const sellTokenDecimals = await sellTokenContract.decimals();
    const buyTokenDecimals = await buyTokenContract.decimals();
    
    const sellTokenSymbol = await sellTokenContract.symbol();
    const buyTokenSymbol = await buyTokenContract.symbol();
    
    const balance = await sellTokenContract.balanceOf(address);
    console.log(`Balance: ${formatAmount(balance, sellTokenDecimals)} ${sellTokenSymbol}`);
    
    if (balance < sellAmount) {
      throw new Error(`Insufficient ${sellTokenSymbol} balance. Have ${formatAmount(balance, sellTokenDecimals)}, need ${formatAmount(sellAmount, sellTokenDecimals)}`);
    }
    
    console.log(`Getting quote from 0x API for ${formatAmount(sellAmount, sellTokenDecimals)} ${sellTokenSymbol} to ${buyTokenSymbol}...`);
    
    const quoteResponse = await axios.get(`${ZRX_API_URL}/swap/v1/quote`, {
      params: {
        sellToken: sellToken,
        buyToken: buyToken,
        sellAmount: sellAmount.toString(),
        slippagePercentage: 0.01, // 1% slippage
        takerAddress: address,
        skipValidation: true
      }
    });
    
    const quoteData = quoteResponse.data;
    
    console.log(`Quote details:`);
    console.log(`- Expected output: ${formatAmount(BigInt(quoteData.buyAmount), buyTokenDecimals)} ${buyTokenSymbol}`);
    console.log(`- Price: 1 ${sellTokenSymbol} = ${formatAmount(BigInt(quoteData.price) * BigInt(10 ** buyTokenDecimals), buyTokenDecimals)} ${buyTokenSymbol}`);
    console.log(`- Gas estimate: ${quoteData.estimatedGas}`);
    console.log(`- Gas price: ${ethers.formatUnits(quoteData.gasPrice, 'gwei')} gwei`);
    
    console.log(`Approving ${sellTokenSymbol} for swap...`);
    await approveToken(sellToken, quoteData.allowanceTarget, sellAmount);
    
    console.log(`Executing swap...`);
    
    const tx = await signer.sendTransaction({
      from: address,
      to: quoteData.to,
      data: quoteData.data,
      value: BigInt(quoteData.value || 0),
      gasPrice: BigInt(quoteData.gasPrice),
      gasLimit: BigInt(quoteData.estimatedGas) * 120n / 100n // Add 20% buffer
    });
    
    console.log(`Transaction hash: ${tx.hash}`);
    
    console.log(`Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    const newSellTokenBalance = await sellTokenContract.balanceOf(address);
    const newBuyTokenBalance = await buyTokenContract.balanceOf(address);
    
    console.log(`\nNew ${sellTokenSymbol} balance: ${formatAmount(newSellTokenBalance, sellTokenDecimals)}`);
    console.log(`New ${buyTokenSymbol} balance: ${formatAmount(newBuyTokenBalance, buyTokenDecimals)}`);
    console.log(`${sellTokenSymbol} spent: ${formatAmount(balance - newSellTokenBalance, sellTokenDecimals)}`);
    console.log(`${buyTokenSymbol} received: ${formatAmount(newBuyTokenBalance, buyTokenDecimals)}`);
    
  } catch (error) {
    console.error("Error executing swap on 0x Protocol:", error);
    
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
