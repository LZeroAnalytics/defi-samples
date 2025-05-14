/**
 * Helper functions for DeFi protocol interactions
 */

const { ethers } = require("hardhat");

/**
 * Get signer with ETH for transactions
 * @returns {Promise<ethers.Signer>} Signer with ETH
 */
async function getSigner() {
  const [signer] = await ethers.getSigners();
  return signer;
}

/**
 * Approve token spending for a spender address
 * @param {string} tokenAddress - ERC20 token address
 * @param {string} spenderAddress - Address to approve for spending
 * @param {string|bigint} amount - Amount to approve (or ethers.MaxUint256 for unlimited)
 * @returns {Promise<ethers.ContractTransaction>} Transaction receipt
 */
async function approveToken(tokenAddress, spenderAddress, amount) {
  const signer = await getSigner();
  const erc20Abi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
  
  console.log(`Approving ${spenderAddress} to spend tokens from ${tokenAddress}...`);
  const tx = await tokenContract.approve(spenderAddress, amount);
  await tx.wait();
  console.log(`Approval successful! Transaction hash: ${tx.hash}`);
  
  return tx;
}

/**
 * Get token balance for an address
 * @param {string} tokenAddress - ERC20 token address
 * @param {string} address - Address to check balance for (defaults to signer)
 * @returns {Promise<bigint>} Token balance
 */
async function getTokenBalance(tokenAddress, address = null) {
  const signer = await getSigner();
  const walletAddress = address || await signer.getAddress();
  
  const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"];
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
  
  return await tokenContract.balanceOf(walletAddress);
}

/**
 * Format amount with token decimals
 * @param {string|number} amount - Amount to format
 * @param {number} decimals - Token decimals (default 18)
 * @returns {bigint} Formatted amount
 */
function parseAmount(amount, decimals = 18) {
  return ethers.parseUnits(amount.toString(), decimals);
}

/**
 * Format token amount for display
 * @param {bigint} amount - Amount to format
 * @param {number} decimals - Token decimals (default 18)
 * @param {number} displayDecimals - Number of decimals to display (default 4)
 * @returns {string} Formatted amount string
 */
function formatAmount(amount, decimals = 18, displayDecimals = 4) {
  const formatted = ethers.formatUnits(amount, decimals);
  return parseFloat(formatted).toFixed(displayDecimals);
}

/**
 * Log token balances before and after a transaction
 * @param {string} tokenAddress - ERC20 token address
 * @param {string} tokenSymbol - Token symbol for display
 * @param {Function} transactionFn - Async function that performs the transaction
 * @returns {Promise<any>} Result of the transaction function
 */
async function logBalanceChange(tokenAddress, tokenSymbol, transactionFn) {
  const signer = await getSigner();
  const address = await signer.getAddress();
  
  const balanceBefore = await getTokenBalance(tokenAddress, address);
  console.log(`Balance before: ${formatAmount(balanceBefore)} ${tokenSymbol}`);
  
  const result = await transactionFn();
  
  const balanceAfter = await getTokenBalance(tokenAddress, address);
  console.log(`Balance after: ${formatAmount(balanceAfter)} ${tokenSymbol}`);
  console.log(`Change: ${formatAmount(balanceAfter - balanceBefore)} ${tokenSymbol}`);
  
  return result;
}

module.exports = {
  getSigner,
  approveToken,
  getTokenBalance,
  parseAmount,
  formatAmount,
  logBalanceChange
};
