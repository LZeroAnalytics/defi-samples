/**
 * Token address mapping based on chain ID
 */

const tokenAddresses = {
  1: {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  },
  136638: {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Use the same addresses initially
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Can be updated if needed
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  }
};

/**
 * Get token address based on symbol and chain ID
 * @param {string} symbol - Token symbol (e.g., 'WETH', 'USDC')
 * @param {number} chainId - Chain ID (defaults to 1 for Ethereum Mainnet)
 * @returns {string} Token address for the specified chain
 */
function getTokenAddress(symbol, chainId = 1) {
  const chainTokens = tokenAddresses[chainId] || tokenAddresses[1];
  return chainTokens[symbol] || tokenAddresses[1][symbol];
}

module.exports = {
  getTokenAddress,
  tokenAddresses
};
