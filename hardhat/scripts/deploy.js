const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { FEE, VRF_COORDINATOR, LINK_TOKEN, KEY_HASH } = require("../constants");


async function main() {
  const randomWinnerGame = await ethers.getContractFactory("RandomWinnerGame");

  const deployedRandomWinnerGameContract = await randomWinnerGame.deploy(
    VRF_COORDINATOR,
    LINK_TOKEN,
    KEY_HASH,
    FEE
  );

  await deployedRandomWinnerGameContract.deployed();

    // print the address of the deployed contract
  console.log(
    "Verify Contract Address",
    deployedRandomWinnerGameContract.address
  );

  console.log("Sleeping....");
  //wait for the etherscan to notice that the contract has been deployed
  await sleep(30000);

  // Verify the contract after deploying
  await hre.run("verify:verify",{
    address: deployedRandomWinnerGameContract.address,
    constructorArguments: [VRF_COORDINATOR, LINK_TOKEN, KEY_HASH, FEE],
  })
}

function sleep(ms) {
  return new Promise((resolve)=> setTimeout(resolve,ms))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })