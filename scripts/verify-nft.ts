import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);

  const tokenArtifact = await hre.artifacts.readArtifact("Token");
  const nftArtifact = await hre.artifacts.readArtifact("NFT");

  const token = new ethers.Contract(
    "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    tokenArtifact.abi,
    signer
  );

  const nft = new ethers.Contract(
    "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
    nftArtifact.abi,
    signer
  );

  // 1. Approve MTK for NFT minting
  const approveTx = await token.approve(
    nft.target,
    ethers.parseUnits("10", 18)
  );
  await approveTx.wait();
  console.log("✅ Token approved");

  // 2. Mint NFT
  const mintTx = await nft.mint();
  await mintTx.wait();
  console.log("✅ NFT minted");

  // 3. Verify ownership
  const owner = await nft.ownerOf(1);
  console.log("NFT #1 owner:", owner);
}

main().catch(console.error);
