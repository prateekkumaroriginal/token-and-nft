import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { TOKEN_ADDRESS, TOKEN_ABI, NFT_ADDRESS, NFT_ABI } from "../config";
import NetworkInfo from "./NetworkInfo";

type TokenTransferEvent = {
  type: "token_transfer";
  from: string;
  to: string;
  amount: string;
  timestamp: number;
};

type NFTMintEvent = {
  type: "nft_mint";
  owner: string;
  tokenId: string;
  timestamp: number;
};

type NFTTransferEvent = {
  type: "nft_transfer";
  from: string;
  to: string;
  tokenId: string;
  timestamp: number;
};

type Event = TokenTransferEvent | NFTMintEvent | NFTTransferEvent;

function App() {
  const [account, setAccount] = useState<string>("");
  const [networkName, setNetworkName] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  
  // ERC-20 Token state
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [tokenBalance, setTokenBalance] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  
  // NFT state
  const [nftName, setNftName] = useState<string>("");
  const [nftSymbol, setNftSymbol] = useState<string>("");
  const [mintFee, setMintFee] = useState<string>("");
  const [lastTokenId, setLastTokenId] = useState<string>("");
  const [lastTokenURI, setLastTokenURI] = useState<string>("");
  
  // Events
  const [events, setEvents] = useState<Event[]>([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      
      const network = await provider.getNetwork();
      setNetworkName(network.name);
      setChainId(network.chainId.toString());
      
      await loadContractData(provider, address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet");
    }
  }

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum || !account) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount("");
      } else if (accounts[0] !== account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        await loadContractData(provider, address);
      }
    };

    const handleChainChanged = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setNetworkName(network.name);
      setChainId(network.chainId.toString());
      if (account) {
        await loadContractData(provider, account);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [account]);

  async function loadContractData(provider: ethers.BrowserProvider, address: string) {
    try {
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);

      // Load token info
      const [name, symbol, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.balanceOf(address),
      ]);
      setTokenName(name);
      setTokenSymbol(symbol);
      setTokenBalance(ethers.formatUnits(balance, 18));

      // Load NFT info
      const [nftNameVal, nftSymbolVal, fee] = await Promise.all([
        nftContract.name(),
        nftContract.symbol(),
        nftContract.mintFee(),
      ]);
      setNftName(nftNameVal);
      setNftSymbol(nftSymbolVal);
      setMintFee(ethers.formatUnits(fee, 18));
    } catch (error) {
      console.error("Error loading contract data:", error);
    }
  }

  async function transferTokens() {
    if (!account || !recipientAddress || !transferAmount) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

      const amount = ethers.parseUnits(transferAmount, 18);
      const tx = await tokenContract.transfer(recipientAddress, amount);
      await tx.wait();
      
      // Refresh balance
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(balance, 18));
      
      setRecipientAddress("");
      setTransferAmount("");
    } catch (error) {
      console.error("Error transferring tokens:", error);
      alert("Failed to transfer tokens");
    }
  }

  async function mintNFT() {
    if (!account) {
      alert("Please connect your wallet");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, signer);

      // Get mint fee
      const fee = await nftContract.mintFee();
      
      // Check allowance
      const allowance = await tokenContract.allowance(account, NFT_ADDRESS);
      if (allowance < fee) {
        // Approve tokens
        const approveTx = await tokenContract.approve(NFT_ADDRESS, fee);
        await approveTx.wait();
      }

      // Mint NFT
      const mintTx = await nftContract.mint();
      await mintTx.wait();
      
      // Refresh token balance
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Failed to mint NFT");
    }
  }

  // Event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
    const nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);

    // Track seen events to prevent duplicates
    const seenEvents = new Set<string>();

    const handleTokenTransfer = (from: string, to: string, amount: bigint, event: any) => {
      const eventKey = `token_${event.log?.transactionHash || ''}_${event.log?.index || Date.now()}`;
      if (seenEvents.has(eventKey)) return;
      seenEvents.add(eventKey);

      setEvents((prev) => [
        {
          type: "token_transfer",
          from,
          to,
          amount: ethers.formatUnits(amount, 18),
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    };

    const handleNFTMinted = async (owner: string, tokenId: bigint, event: any) => {
      const eventKey = `mint_${event.log?.transactionHash || ''}_${tokenId.toString()}`;
      if (seenEvents.has(eventKey)) return;
      seenEvents.add(eventKey);

      setLastTokenId(tokenId.toString());
      
      // Fetch token URI
      try {
        const uri = await nftContract.tokenURI(tokenId);
        setLastTokenURI(uri);
      } catch (error) {
        console.error("Error fetching token URI:", error);
      }

      setEvents((prev) => [
        {
          type: "nft_mint",
          owner,
          tokenId: tokenId.toString(),
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    };

    const handleNFTTransferred = (from: string, to: string, tokenId: bigint, event: any) => {
      const eventKey = `transfer_${event.log?.transactionHash || ''}_${tokenId.toString()}`;
      if (seenEvents.has(eventKey)) return;
      seenEvents.add(eventKey);

      setEvents((prev) => [
        {
          type: "nft_transfer",
          from,
          to,
          tokenId: tokenId.toString(),
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    };

    // Set up listeners
    tokenContract.on("TokensTransferred", handleTokenTransfer);
    nftContract.on("NFTMinted", handleNFTMinted);
    nftContract.on("NFTTransferred", handleNFTTransferred);

    // Cleanup
    return () => {
      tokenContract.off("TokensTransferred", handleTokenTransfer);
      nftContract.off("NFTMinted", handleNFTMinted);
      nftContract.off("NFTTransferred", handleNFTTransferred);
      seenEvents.clear();
    };
  }, []);

  const isHardhatNetwork = chainId === "31337";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Blockchain DApp
        </h1>

        {/* Network Info */}
        <NetworkInfo />

        {/* Wallet Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Wallet</h2>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Connect MetaMask
            </button>
          ) : (
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Connected:</span>{" "}
                <span className="font-mono text-sm">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </p>
              <p>
                <span className="font-semibold">Network:</span> {networkName} (Chain ID: {chainId})
              </p>
              {!isHardhatNetwork && (
                <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-3 rounded mt-4">
                  ⚠️ Warning: You are not connected to Hardhat Localhost (31337)
                </div>
              )}
            </div>
          )}
        </div>

        {/* ERC-20 Token Section */}
        {account && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">ERC-20 Token</h2>
            <div className="space-y-4">
              <div>
                <p>
                  <span className="font-semibold">Name:</span> {tokenName || "Loading..."}
                </p>
                <p>
                  <span className="font-semibold">Symbol:</span> {tokenSymbol || "Loading..."}
                </p>
                <p>
                  <span className="font-semibold">Your Balance:</span>{" "}
                  {tokenBalance ? `${tokenBalance} ${tokenSymbol}` : "Loading..."}
                </p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl font-semibold mb-3">Transfer Tokens</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Recipient address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full bg-gray-700 text-gray-100 px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-gray-700 text-gray-100 px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={transferTokens}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Transfer Tokens
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NFT Section */}
        {account && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">NFT Collection</h2>
            <div className="space-y-4">
              <div>
                <p>
                  <span className="font-semibold">Name:</span> {nftName || "Loading..."}
                </p>
                <p>
                  <span className="font-semibold">Symbol:</span> {nftSymbol || "Loading..."}
                </p>
                <p>
                  <span className="font-semibold">Mint Fee:</span>{" "}
                  {mintFee ? `${mintFee} ${tokenSymbol}` : "Loading..."}
                </p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <button
                  onClick={mintNFT}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors mb-4"
                >
                  Mint NFT
                </button>
              </div>

              {lastTokenId && (
                <div className="border-t border-gray-700 pt-4">
                  <p>
                    <span className="font-semibold">Last Minted Token ID:</span> {lastTokenId}
                  </p>
                  {lastTokenURI && (
                    <p className="mt-2">
                      <span className="font-semibold">Token URI:</span>{" "}
                      <span className="font-mono text-sm break-all">{lastTokenURI}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Log Panel */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Event Log</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-400">No events yet</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  className="bg-gray-700 p-4 rounded-lg border border-gray-600"
                >
                  {event.type === "token_transfer" && (
                    <div>
                      <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">
                        Token Transfer
                      </span>
                      <p>
                        <span className="font-semibold">From:</span>{" "}
                        <span className="font-mono text-sm">
                          {event.from.slice(0, 6)}...{event.from.slice(-4)}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">To:</span>{" "}
                        <span className="font-mono text-sm">
                          {event.to.slice(0, 6)}...{event.to.slice(-4)}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Amount:</span> {event.amount} {tokenSymbol}
                      </p>
                    </div>
                  )}
                  {event.type === "nft_mint" && (
                    <div>
                      <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded mr-2">
                        NFT Minted
                      </span>
                      <p>
                        <span className="font-semibold">Owner:</span>{" "}
                        <span className="font-mono text-sm">
                          {event.owner.slice(0, 6)}...{event.owner.slice(-4)}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Token ID:</span> {event.tokenId}
                      </p>
                    </div>
                  )}
                  {event.type === "nft_transfer" && (
                    <div>
                      <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded mr-2">
                        NFT Transferred
                      </span>
                      <p>
                        <span className="font-semibold">From:</span>{" "}
                        <span className="font-mono text-sm">
                          {event.from.slice(0, 6)}...{event.from.slice(-4)}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">To:</span>{" "}
                        <span className="font-mono text-sm">
                          {event.to.slice(0, 6)}...{event.to.slice(-4)}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Token ID:</span> {event.tokenId}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
