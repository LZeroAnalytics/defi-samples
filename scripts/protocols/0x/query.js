/**
 * Query 0x Protocol information
 */

const { ethers } = require("hardhat");
const { formatAmount } = require("../../utils/helpers");
const axios = require("axios");

async function main() {
  console.log("Querying 0x Protocol information...");
  
  const ZRX_API_URL = "https://api.0x.org";
  
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  
  const erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  
  try {
    const wethContract = new ethers.Contract(WETH, erc20Abi, ethers.provider);
    const usdcContract = new ethers.Contract(USDC, erc20Abi, ethers.provider);
    const daiContract = new ethers.Contract(DAI, erc20Abi, ethers.provider);
    const wbtcContract = new ethers.Contract(WBTC, erc20Abi, ethers.provider);
    
    const wethDecimals = await wethContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    const daiDecimals = await daiContract.decimals();
    const wbtcDecimals = await wbtcContract.decimals();
    
    const wethSymbol = await wethContract.symbol();
    const usdcSymbol = await usdcContract.symbol();
    const daiSymbol = await daiContract.symbol();
    const wbtcSymbol = await wbtcContract.symbol();
    
    console.log(`\nToken Information:`);
    console.log(`${wethSymbol}: ${WETH} (${wethDecimals} decimals)`);
    console.log(`${usdcSymbol}: ${USDC} (${usdcDecimals} decimals)`);
    console.log(`${daiSymbol}: ${DAI} (${daiDecimals} decimals)`);
    console.log(`${wbtcSymbol}: ${WBTC} (${wbtcDecimals} decimals)`);
    
    console.log(`\nQuerying 0x API for available sources...`);
    
    try {
      const sourcesResponse = await axios.get(`${ZRX_API_URL}/swap/v1/sources`);
      const sources = sourcesResponse.data;
      
      console.log(`Available sources on 0x:`);
      for (const [source, enabled] of Object.entries(sources)) {
        console.log(`- ${source}: ${enabled ? 'Enabled' : 'Disabled'}`);
      }
    } catch (error) {
      console.log(`Error querying 0x API for sources: ${error.message}`);
      console.log(`This may be due to API rate limits or network issues.`);
    }
    
    console.log(`\nQuerying 0x API for token prices...`);
    
    const tokenPairs = [
      { sellToken: WETH, buyToken: USDC, sellAmount: ethers.parseEther("1"), sellSymbol: wethSymbol, buySymbol: usdcSymbol, sellDecimals: wethDecimals, buyDecimals: usdcDecimals },
      { sellToken: USDC, buyToken: DAI, sellAmount: ethers.parseUnits("1000", 6), sellSymbol: usdcSymbol, buySymbol: daiSymbol, sellDecimals: usdcDecimals, buyDecimals: daiDecimals },
      { sellToken: WETH, buyToken: WBTC, sellAmount: ethers.parseEther("10"), sellSymbol: wethSymbol, buySymbol: wbtcSymbol, sellDecimals: wethDecimals, buyDecimals: wbtcDecimals }
    ];
    
    for (const pair of tokenPairs) {
      try {
        const priceResponse = await axios.get(`${ZRX_API_URL}/swap/v1/price`, {
          params: {
            sellToken: pair.sellToken,
            buyToken: pair.buyToken,
            sellAmount: pair.sellAmount.toString()
          }
        });
        
        const priceData = priceResponse.data;
        
        console.log(`\nPrice for ${formatAmount(pair.sellAmount, pair.sellDecimals)} ${pair.sellSymbol} to ${pair.buySymbol}:`);
        console.log(`Expected output: ${formatAmount(BigInt(priceData.buyAmount), pair.buyDecimals)} ${pair.buySymbol}`);
        console.log(`Price: 1 ${pair.sellSymbol} = ${formatAmount(BigInt(priceData.price) * BigInt(10 ** pair.buyDecimals), pair.buyDecimals)} ${pair.buySymbol}`);
        console.log(`Sources: ${JSON.stringify(priceData.sources.filter(s => s.proportion > "0"), null, 2)}`);
        console.log(`Gas estimate: ${priceData.estimatedGas}`);
      } catch (error) {
        console.log(`Error querying 0x API for ${pair.sellSymbol}/${pair.buySymbol} price: ${error.message}`);
        console.log(`This may be due to API rate limits or network issues.`);
      }
    }
    
  } catch (error) {
    console.error("Error querying 0x Protocol:", error);
    
    console.log("\nFalling back to simulation mode...");
    console.log("Simulated 0x Protocol information:");
    
    console.log(`\nToken Information:`);
    console.log(`WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (18 decimals)`);
    console.log(`USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (6 decimals)`);
    console.log(`DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F (18 decimals)`);
    console.log(`WBTC: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 (8 decimals)`);
    
    console.log(`\nAvailable sources on 0x:`);
    console.log(`- Uniswap_V2: Enabled`);
    console.log(`- Uniswap_V3: Enabled`);
    console.log(`- Sushiswap: Enabled`);
    console.log(`- Curve: Enabled`);
    console.log(`- Balancer: Enabled`);
    console.log(`- 0x: Enabled`);
    
    console.log(`\nPrice for 1 WETH to USDC:`);
    console.log(`Expected output: 2,000 USDC`);
    console.log(`Price: 1 WETH = 2,000 USDC`);
    console.log(`Sources: [{"name":"Uniswap_V3","proportion":"0.8"},{"name":"Sushiswap","proportion":"0.2"}]`);
    console.log(`Gas estimate: 150000`);
    
    console.log(`\nPrice for 1000 USDC to DAI:`);
    console.log(`Expected output: 999.5 DAI`);
    console.log(`Price: 1 USDC = 0.9995 DAI`);
    console.log(`Sources: [{"name":"Curve","proportion":"1.0"}]`);
    console.log(`Gas estimate: 180000`);
    
    console.log(`\nPrice for 10 WETH to WBTC:`);
    console.log(`Expected output: 0.6 WBTC`);
    console.log(`Price: 1 WETH = 0.06 WBTC`);
    console.log(`Sources: [{"name":"Uniswap_V3","proportion":"0.7"},{"name":"Balancer","proportion":"0.3"}]`);
    console.log(`Gas estimate: 200000`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
