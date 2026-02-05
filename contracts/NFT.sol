// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NFT is ERC721URIStorage, Ownable {
    string private baseTokenURI;
    uint256 private _tokenIdCounter;
    IERC20 public paymentToken;
    uint256 public mintFee;

    event NFTMinted(address indexed owner, uint256 tokenId);
    event NFTTransferred(
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    constructor(
        string memory name_,
        string memory symbol_,
        address _paymentToken,
        uint256 _mintFee,
        string memory _baseTokenURI
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        mintFee = _mintFee;
        baseTokenURI = _baseTokenURI;
    }

    function mint() external {
        require(
            paymentToken.transferFrom(msg.sender, owner(), mintFee),
            "Token payment failed"
        );

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(msg.sender, tokenId);

        emit NFTMinted(msg.sender, tokenId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = super._update(to, tokenId, auth);

        if (from != address(0) && to != address(0)) {
            emit NFTTransferred(from, to, tokenId);
        }

        return from;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}
