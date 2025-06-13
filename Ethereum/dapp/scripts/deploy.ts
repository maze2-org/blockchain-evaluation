import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with address:", deployer.address);

    const ContractFactory = await ethers.getContractFactory("IABS");
    const contract = await ContractFactory.deploy(); // ajoute les arguments si ton constructeur en prend
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("Deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
