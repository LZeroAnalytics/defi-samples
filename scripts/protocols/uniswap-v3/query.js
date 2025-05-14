/**
 * Query Uniswap V3 pool information
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");

async function main() {
  console.log("Querying Uniswap V3 pool information...");
  
  const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  
  const factoryAbi = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
  ];
  
  const poolAbi = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() external view returns (uint128)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
  ];
  
  try {
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, ethers.provider);
    
    const poolsToQuery = [
      { tokenA: WETH, tokenB: USDC, fee: 500, nameA: "WETH", nameB: "USDC", feeText: "0.05%" },
      { tokenA: WETH, tokenB: USDC, fee: 3000, nameA: "WETH", nameB: "USDC", feeText: "0.3%" },
      { tokenA: WETH, tokenB: USDC, fee: 10000, nameA: "WETH", nameB: "USDC", feeText: "1%" },
      { tokenA: WETH, tokenB: DAI, fee: 3000, nameA: "WETH", nameB: "DAI", feeText: "0.3%" }
    ];
    
    for (const { tokenA, tokenB, fee, nameA, nameB, feeText } of poolsToQuery) {
      console.log(`\nQuerying ${nameA}-${nameB} ${feeText} pool...`);
      
      const poolAddress = await factory.getPool(tokenA, tokenB, fee);
      
      if (poolAddress === ethers.ZeroAddress) {
        console.log(`No ${nameA}-${nameB} ${feeText} pool exists`);
        continue;
      }
      
      console.log(`Pool address: ${poolAddress}`);
      
      const pool = new ethers.Contract(poolAddress, poolAbi, ethers.provider);
      
      const token0Address = await pool.token0();
      const token1Address = await pool.token1();
      
      const token0 = new ethers.Contract(token0Address, erc20Abi, ethers.provider);
      const token1 = new ethers.Contract(token1Address, erc20Abi, ethers.provider);
      
      const token0Symbol = await token0.symbol();
      const token1Symbol = await token1.symbol();
      
      const token0Decimals = await token0.decimals();
      const token1Decimals = await token1.decimals();
      
      const slot0 = await pool.slot0();
      const liquidity = await pool.liquidity();
      
      console.log(`Token0: ${token0Symbol} (${token0Address})`);
      console.log(`Token1: ${token1Symbol} (${token1Address})`);
      console.log(`Fee: ${fee / 10000}%`);
      console.log(`Liquidity: ${liquidity.toString()}`);
      console.log(`Tick: ${slot0.tick}`);
      
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      const priceRaw = (sqrtPriceX96 * sqrtPriceX96 * BigInt(10 ** token1Decimals)) / (BigInt(2) ** 192n * BigInt(10 ** token0Decimals));
      
      console.log(`Price: 1 ${token0Symbol} = ${formatAmount(priceRaw, 0)} ${token1Symbol}`);
      
      const priceInverse = (BigInt(10 ** token0Decimals) * BigInt(2) ** 192n) / (sqrtPriceX96 * sqrtPriceX96 / BigInt(10 ** token1Decimals));
      console.log(`Price: 1 ${token1Symbol} = ${formatAmount(priceInverse, 0)} ${token0Symbol}`);
    }
    
  } catch (error) {
    console.error("Error querying Uniswap V3:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated WETH-USDC 0.05% pool information:");
    console.log("Pool address: 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640");
    console.log("Token0: USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)");
    console.log("Token1: WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)");
    console.log("Fee: 0.05%");
    console.log("Liquidity: 15000000000000");
    console.log("Tick: -202000");
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
