/**
 * Protocol contract addresses based on chain ID
 */

const protocolAddresses = {
  1: {
    uniswapV2: {
      factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    },
    uniswapV3: {
      factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      router: "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    },
    curve: {
      registry: "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5",
      factory: "0xB9fC157394Af804a3578134A6585C0dc9cc990d4"
    },
    balancer: {
      vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
    },
    sushiswapV2: {
      factory: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
      router: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
    },
    pancakeswapV2: {
      factory: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
      router: "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    },
    pancakeswapV3: {
      factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
      router: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4"
    },
    uniswapX: {
      universalRouter: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
      permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3"
    }
  },
  136638: {
    uniswapV2: {
      factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Use the same addresses initially
      router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"  // Can be updated if needed
    },
    uniswapV3: {
      factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      router: "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    },
    curve: {
      registry: "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5",
      factory: "0xB9fC157394Af804a3578134A6585C0dc9cc990d4"
    },
    balancer: {
      vault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
    },
    sushiswapV2: {
      factory: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
      router: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
    },
    pancakeswapV2: {
      factory: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
      router: "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    },
    pancakeswapV3: {
      factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
      router: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4"
    },
    uniswapX: {
      universalRouter: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
      permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3"
    }
  }
};

/**
 * Get protocol contract address based on protocol, contract name, and chain ID
 * @param {string} protocol - Protocol name (e.g., 'uniswapV2', 'curve')
 * @param {string} contract - Contract name (e.g., 'factory', 'router')
 * @param {number} chainId - Chain ID (defaults to 1 for Ethereum Mainnet)
 * @returns {string|null} Contract address for the specified protocol and chain
 */
function getProtocolAddress(protocol, contract, chainId = 1) {
  const chainProtocols = protocolAddresses[chainId] || protocolAddresses[1];
  const protocolContracts = chainProtocols[protocol] || protocolAddresses[1][protocol];
  return protocolContracts ? protocolContracts[contract] : null;
}

module.exports = {
  getProtocolAddress,
  protocolAddresses
};
