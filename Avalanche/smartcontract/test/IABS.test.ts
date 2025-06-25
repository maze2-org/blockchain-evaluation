import { ethers } from "hardhat";
import { expect } from "chai";

describe("IABS", function () {
    let owner: any;
    let user: any;
    let contract: any;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();

        const ContractFactory = await ethers.getContractFactory("IABS");
        contract = await ContractFactory.deploy();
        await contract.waitForDeployment();
    });

    it("should mint 1000 tokens when user sends 0.01 ETH", async function () {
        await contract.connect(user).mint({ value: ethers.parseEther("0.01") });

        const balance = await contract.balanceOf(user.address);
        expect(balance).to.equal(ethers.parseUnits("1000", 18));
    });

    it("should allow only owner to withdraw", async function () {
        // Let the user mint (contract holds 0.01 ETH)
        await contract.connect(user).mint({ value: ethers.parseEther("0.01") });

        // Attempt withdraw as non-owner
        await expect(contract.connect(user).withdraw()).to.be.revertedWith("Only owner can withdraw");

        // Owner withdraws
        const initialBalance = await ethers.provider.getBalance(owner.address);
        const tx = await contract.connect(owner).withdraw();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * (tx.gasPrice || 0n);
        const finalBalance = await ethers.provider.getBalance(owner.address);

        expect(finalBalance).to.be.greaterThan(initialBalance - gasUsed);
    });
});
