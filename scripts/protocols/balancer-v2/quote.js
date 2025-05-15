/**
 * Get quotes from Balancer V2
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const { getTokenAddress } = require("../../utils/tokens");
const { getProtocolAddress } = require("../../utils/protocols");

async function main() {
  console.log("Getting quotes from Balancer V2...");
  
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  const VAULT_ADDRESS = getProtocolAddress("balancer", "vault", chainId);
  const QUERY_PROCESSOR = "0xE39B5e3B6D74016b2F6A9673D7d7493B6DF549d5";
  
  const WETH = getTokenAddress("WETH", chainId);
  const USDC = getTokenAddress("USDC", chainId);
  const DAI = getTokenAddress("DAI", chainId);
  const BAL = "0xba100000625a3754423978a60c9317c58a424e3D";
  
  const WETH_DAI_POOL = "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a"; // WETH-DAI 80/20
  const WETH_USDC_POOL = "0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019"; // WETH-USDC 50/50
  
  const vaultAbi = [
    "function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)",
    "function queryBatchSwap(uint8 kind, tuple(bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, tuple(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds) external returns (int256[] assetDeltas)"
  ];
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  
  try {
    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, ethers.provider);
    
    const wethContract = new ethers.Contract(WETH, erc20Abi, ethers.provider);
    const usdcContract = new ethers.Contract(USDC, erc20Abi, ethers.provider);
    const daiContract = new ethers.Contract(DAI, erc20Abi, ethers.provider);
    
    const wethDecimals = await wethContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    const daiDecimals = await daiContract.decimals();
    
    console.log("\nGetting quote for WETH to DAI using WETH-DAI pool...");
    
    const wethAmount = ethers.parseEther("1"); // 1 WETH
    
    const wethDaiPoolTokens = await vault.getPoolTokens(WETH_DAI_POOL);
    const wethDaiTokens = wethDaiPoolTokens.tokens;
    
    const wethIndex = wethDaiTokens.findIndex(addr => addr.toLowerCase() === WETH.toLowerCase());
    const daiIndex = wethDaiTokens.findIndex(addr => addr.toLowerCase() === DAI.toLowerCase());
    
    if (wethIndex !== -1 && daiIndex !== -1) {
      try {
        const swaps = [
          {
            poolId: WETH_DAI_POOL,
            assetInIndex: 0,
            assetOutIndex: 1,
            amount: wethAmount,
            userData: "0x"
          }
        ];
        
        const assets = [WETH, DAI];
        
        const funds = {
          sender: ethers.ZeroAddress,
          fromInternalBalance: false,
          recipient: ethers.ZeroAddress,
          toInternalBalance: false
        };
        
        const kind = 0;
        
        const deltas = await vault.queryBatchSwap(kind, swaps, assets, funds);
        
        const daiOut = deltas[1] * -1n;
        
        console.log(`Quote: 1 WETH = ${formatAmount(daiOut, daiDecimals)} DAI`);
        console.log(`Rate: 1 WETH = ${formatAmount(daiOut, daiDecimals)} DAI`);
      } catch (error) {
        console.log(`Error querying batch swap: ${error.message}`);
        
        const wethBalance = wethDaiPoolTokens.balances[wethIndex];
        const daiBalance = wethDaiPoolTokens.balances[daiIndex];
        
        const spotPrice = (daiBalance * BigInt(10 ** Number(wethDecimals))) / (wethBalance * BigInt(10 ** Number(daiDecimals)));
        
        console.log(`Fallback quote using pool balances:`);
        console.log(`Quote: 1 WETH ≈ ${formatAmount(spotPrice, 0)} DAI`);
        console.log(`Note: This is an approximation and doesn't account for slippage or fees`);
      }
    }
    
    console.log("\nGetting quote for WETH to USDC using WETH-USDC pool...");
    
    const wethUsdcPoolTokens = await vault.getPoolTokens(WETH_USDC_POOL);
    const wethUsdcTokens = wethUsdcPoolTokens.tokens;
    
    const wethUsdcIndex = wethUsdcTokens.findIndex(addr => addr.toLowerCase() === WETH.toLowerCase());
    const usdcIndex = wethUsdcTokens.findIndex(addr => addr.toLowerCase() === USDC.toLowerCase());
    
    if (wethUsdcIndex !== -1 && usdcIndex !== -1) {
      try {
        const swaps = [
          {
            poolId: WETH_USDC_POOL,
            assetInIndex: 0,
            assetOutIndex: 1,
            amount: wethAmount,
            userData: "0x"
          }
        ];
        
        const assets = [WETH, USDC];
        
        const funds = {
          sender: ethers.ZeroAddress,
          fromInternalBalance: false,
          recipient: ethers.ZeroAddress,
          toInternalBalance: false
        };
        
        const kind = 0;
        
        const deltas = await vault.queryBatchSwap(kind, swaps, assets, funds);
        
        const usdcOut = deltas[1] * -1n;
        
        console.log(`Quote: 1 WETH = ${formatAmount(usdcOut, usdcDecimals)} USDC`);
        console.log(`Rate: 1 WETH = ${formatAmount(usdcOut, usdcDecimals)} USDC`);
      } catch (error) {
        console.log(`Error querying batch swap: ${error.message}`);
        
        const wethBalance = wethUsdcPoolTokens.balances[wethUsdcIndex];
        const usdcBalance = wethUsdcPoolTokens.balances[usdcIndex];
        
        const spotPrice = (usdcBalance * BigInt(10 ** Number(wethDecimals))) / (wethBalance * BigInt(10 ** Number(usdcDecimals)));
        
        console.log(`Fallback quote using pool balances:`);
        console.log(`Quote: 1 WETH ≈ ${formatAmount(spotPrice, 0)} USDC`);
        console.log(`Note: This is an approximation and doesn't account for slippage or fees`);
      }
    }
    
    console.log("\nGetting quote for USDC to DAI (multi-hop through WETH)...");
    
    const usdcAmount = ethers.parseUnits("1000", usdcDecimals); // 1000 USDC
    
    try {
      const swaps = [
        {
          poolId: WETH_USDC_POOL,
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: usdcAmount,
          userData: "0x"
        },
        {
          poolId: WETH_DAI_POOL,
          assetInIndex: 1,
          assetOutIndex: 2,
          amount: 0, // This will be filled with the output from the first swap
          userData: "0x"
        }
      ];
      
      const assets = [USDC, WETH, DAI];
      
      const funds = {
        sender: ethers.ZeroAddress,
        fromInternalBalance: false,
        recipient: ethers.ZeroAddress,
        toInternalBalance: false
      };
      
      const kind = 0;
      
      const deltas = await vault.queryBatchSwap(kind, swaps, assets, funds);
      
      const daiOut = deltas[2] * -1n;
      
      console.log(`Quote: 1000 USDC = ${formatAmount(daiOut, daiDecimals)} DAI`);
      console.log(`Rate: 1 USDC = ${formatAmount(daiOut / BigInt(1000), daiDecimals)} DAI`);
    } catch (error) {
      console.log(`Error querying multi-hop batch swap: ${error.message}`);
      console.log(`Multi-hop quotes require more complex calculations and may not be available in this simple example.`);
    }
    
  } catch (error) {
    console.error("Error getting quotes from Balancer V2:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated quotes from Balancer V2:");
    
    console.log("\nGetting quote for WETH to DAI using WETH-DAI pool...");
    console.log("Quote: 1 WETH = 2,000 DAI");
    console.log("Rate: 1 WETH = 2,000 DAI");
    
    console.log("\nGetting quote for WETH to USDC using WETH-USDC pool...");
    console.log("Quote: 1 WETH = 2,000 USDC");
    console.log("Rate: 1 WETH = 2,000 USDC");
    
    console.log("\nGetting quote for USDC to DAI (multi-hop through WETH)...");
    console.log("Quote: 1000 USDC = 999.5 DAI");
    console.log("Rate: 1 USDC = 0.9995 DAI");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
