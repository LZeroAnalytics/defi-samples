/**
 * Test all protocols
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Testing all protocols...");
  
  const protocolsDir = path.join(__dirname, "protocols");
  const protocols = fs.readdirSync(protocolsDir);
  
  for (const protocol of protocols) {
    console.log(`\n\n========== Testing ${protocol} ==========\n`);
    
    const protocolDir = path.join(protocolsDir, protocol);
    const scriptFiles = fs.readdirSync(protocolDir).filter(file => file.endsWith(".js"));
    
    for (const scriptFile of scriptFiles) {
      const scriptPath = path.join("scripts", "protocols", protocol, scriptFile);
      console.log(`\nRunning ${scriptPath}...\n`);
      
      try {
        execSync(`npx hardhat run ${scriptPath} --network bloctopus`, { stdio: "inherit" });
        console.log(`\n✅ Successfully executed ${scriptPath}`);
      } catch (error) {
        console.log(`\n❌ Failed to execute ${scriptPath}: ${error.message}`);
        console.log("Continuing with next script...");
      }
    }
  }
  
  console.log("\n\nAll protocols tested!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
