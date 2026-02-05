import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import TokenModule from "./Token.js";

export default buildModule("NFTModule", (m) => {
  // Reuse the deployed ERC-20 token
  const { token } = m.useModule(TokenModule);

  // Deployment-time parameters
  const name = m.getParameter("name", "XNonFunToken");
  const symbol = m.getParameter("symbol", "XNFT");

  const mintFee = m.getParameter(
    "mintFee",
    10n * 10n ** 18n
  );

  const baseURI = m.getParameter(
    "baseURI",
    "ipfs://metadata/"
  );

  // Deploy NFT contract
  const nft = m.contract("NFT", [
    name,
    symbol,
    token,
    mintFee,
    baseURI,
  ]);

  return { nft };
});
