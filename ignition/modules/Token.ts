import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenModule", (m) => {
  const name = m.getParameter("name", "XToken");
  const symbol = m.getParameter("symbol", "XT");
  const initialSupply = m.getParameter(
    "initialSupply",
    1000n * 10n ** 18n
  );

  const token = m.contract("Token", [
    name,
    symbol,
    initialSupply,
  ]);

  return { token };
});
