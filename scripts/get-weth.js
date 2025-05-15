/**
 * Script to get WETH by wrapping ETH
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("./utils/helpers");
const { getTokenAddress } = require("./utils/tokens");

async function main() {
  console.log("Getting WETH by wrapping ETH...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  const WETH_ADDRESS = getTokenAddress("WETH", chainId);
  
  const wethAbi = [
    "function deposit() external payable",
    "function balanceOf(address owner) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
  ];
  
  try {
    const signer = await ethers.provider.getSigner();
    const address = await signer.getAddress();
    console.log(`Using address: ${address}`);
    
    const weth = new ethers.Contract(WETH_ADDRESS, wethAbi, signer);
    
    const decimals = await weth.decimals();
    const symbol = await weth.symbol();
    
    const initialBalance = await weth.balanceOf(address);
    console.log(`Initial ${symbol} balance: ${formatAmount(initialBalance, decimals)}`);
    
    const ethBalance = await ethers.provider.getBalance(address);
    console.log(`ETH balance: ${formatAmount(ethBalance, 18)}`);
    
    if (ethBalance === 0n) {
      throw new Error("No ETH balance available for wrapping");
    }
    
    // Wrap a smaller amount, just 1 ETH
    const amountToWrap = ethers.parseEther("1");
    
    console.log(`Wrapping ${formatAmount(amountToWrap, 18)} ETH to ${symbol}...`);
    
    const tx = await weth.deposit({ value: amountToWrap });
    console.log(`Transaction hash: ${tx.hash}`);
    
    console.log(`Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    const newBalance = await weth.balanceOf(address);
    console.log(`New ${symbol} balance: ${formatAmount(newBalance, decimals)}`);
    console.log(`${symbol} received: ${formatAmount(newBalance - initialBalance, decimals)}`);
    
  } catch (error) {
    console.error("Error getting WETH:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
