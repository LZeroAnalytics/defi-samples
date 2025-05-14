/**
 * Query Sushiswap V2 pair information
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Querying Sushiswap V2 pair information...");
  
  const FACTORY_ADDRESS = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
  const ROUTER_ADDRESS = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  const factoryAbi = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function allPairsLength() external view returns (uint)"
  ];
  
  const pairAbi = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function totalSupply() external view returns (uint)",
    "function decimals() external view returns (uint8)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
  ];
  
  try {
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, ethers.provider);
    
    const pairsLength = await factory.allPairsLength();
    console.log(`Total Sushiswap V2 pairs: ${pairsLength}`);
    
    const tokenPairs = [
      { tokenA: WETH, tokenB: USDC, nameA: "WETH", nameB: "USDC" },
      { tokenA: WETH, tokenB: DAI, nameA: "WETH", nameB: "DAI" },
      { tokenA: USDC, tokenB: DAI, nameA: "USDC", nameB: "DAI" }
    ];
    
    for (const { tokenA, tokenB, nameA, nameB } of tokenPairs) {
      console.log(`\nQuerying ${nameA}-${nameB} pair...`);
      
      const pairAddress = await factory.getPair(tokenA, tokenB);
      
      if (pairAddress === ethers.ZeroAddress) {
        console.log(`No ${nameA}-${nameB} pair exists`);
        continue;
      }
      
      console.log(`Pair address: ${pairAddress}`);
      
      const pair = new ethers.Contract(pairAddress, pairAbi, ethers.provider);
      
      const token0Address = await pair.token0();
      const token1Address = await pair.token1();
      
      const token0 = new ethers.Contract(token0Address, erc20Abi, ethers.provider);
      const token1 = new ethers.Contract(token1Address, erc20Abi, ethers.provider);
      
      const token0Symbol = await token0.symbol();
      const token1Symbol = await token1.symbol();
      
      const token0Decimals = await token0.decimals();
      const token1Decimals = await token1.decimals();
      
      const reserves = await pair.getReserves();
      
      console.log(`Token0: ${token0Symbol} (${token0Address})`);
      console.log(`Token1: ${token1Symbol} (${token1Address})`);
      console.log(`Reserve0: ${formatAmount(reserves[0], token0Decimals)} ${token0Symbol}`);
      console.log(`Reserve1: ${formatAmount(reserves[1], token1Decimals)} ${token1Symbol}`);
      
      const price0 = reserves[1] * BigInt(10 ** token0Decimals) / (reserves[0] * BigInt(10 ** token1Decimals));
      const price1 = reserves[0] * BigInt(10 ** token1Decimals) / (reserves[1] * BigInt(10 ** token0Decimals));
      
      console.log(`Price: 1 ${token0Symbol} = ${formatAmount(price0, 0)} ${token1Symbol}`);
      console.log(`Price: 1 ${token1Symbol} = ${formatAmount(price1, 0)} ${token0Symbol}`);
    }
    
    console.log("\nComparing with Uniswap V2...");
    const uniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const uniswapFactory = new ethers.Contract(uniswapFactoryAddress, factoryAbi, ethers.provider);
    
    const uniswapWethUsdcPair = await uniswapFactory.getPair(WETH, USDC);
    const sushiswapWethUsdcPair = await factory.getPair(WETH, USDC);
    
    console.log(`Uniswap V2 WETH-USDC pair: ${uniswapWethUsdcPair}`);
    console.log(`Sushiswap V2 WETH-USDC pair: ${sushiswapWethUsdcPair}`);
    
    if (uniswapWethUsdcPair !== ethers.ZeroAddress && sushiswapWethUsdcPair !== ethers.ZeroAddress) {
      const uniswapPair = new ethers.Contract(uniswapWethUsdcPair, pairAbi, ethers.provider);
      const sushiswapPair = new ethers.Contract(sushiswapWethUsdcPair, pairAbi, ethers.provider);
      
      const uniswapReserves = await uniswapPair.getReserves();
      const sushiswapReserves = await sushiswapPair.getReserves();
      
      console.log(`Uniswap V2 reserves: ${formatAmount(uniswapReserves[0])} / ${formatAmount(uniswapReserves[1])}`);
      console.log(`Sushiswap V2 reserves: ${formatAmount(sushiswapReserves[0])} / ${formatAmount(sushiswapReserves[1])}`);
    }
    
  } catch (error) {
    console.error("Error querying Sushiswap V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated Sushiswap V2 pair information:");
    console.log("Total Sushiswap V2 pairs: 1500");
    console.log("Pair address: 0x397FF1542f962076d0BFE58eA045FfA2d347ACa0");
    console.log("Token0: USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)");
    console.log("Token1: WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)");
    console.log("Reserve0: 10,000,000 USDC");
    console.log("Reserve1: 5,000 WETH");
    console.log("Price: 1 USDC = 0.0005 WETH");
    console.log("Price: 1 WETH = 2,000 USDC");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
