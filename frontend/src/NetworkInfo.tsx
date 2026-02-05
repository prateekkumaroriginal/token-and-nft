import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function NetworkInfo() {
  const [networkName, setNetworkName] = useState<string>("Not connected");
  const [chainId, setChainId] = useState<string>("");

  useEffect(() => {
    async function loadNetwork() {
      if (!window.ethereum) {
        setNetworkName("MetaMask not found");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      setNetworkName(network.name);
      setChainId(network.chainId.toString());
    }

    loadNetwork();

    // Update when user switches network in MetaMask
    window.ethereum?.on("chainChanged", loadNetwork);

    return () => {
      window.ethereum?.removeListener("chainChanged", loadNetwork);
    };
  }, []);

  const isHardhatNetwork = chainId === "31337";

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Network</p>
          <p className="font-semibold">
            {networkName}
            {chainId && ` (${chainId})`}
          </p>
        </div>
        {chainId && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isHardhatNetwork
                ? "bg-green-900 text-green-200"
                : "bg-yellow-900 text-yellow-200"
            }`}
          >
            {isHardhatNetwork ? "✓ Connected" : "⚠ Wrong Network"}
          </div>
        )}
      </div>
      {chainId && !isHardhatNetwork && (
        <div className="mt-3 bg-yellow-900 border border-yellow-700 text-yellow-200 p-2 rounded text-sm">
          ⚠️ Warning: Please connect to Hardhat Localhost (Chain ID: 31337)
        </div>
      )}
    </div>
  );
}
