// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 initialSupply
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, initialSupply);
    }

    event TokensTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._update(from, to, amount);

        // from and to are both non-zero only during transfers
        if (from != address(0) && to != address(0)) {
            emit TokensTransferred(from, to, amount);
        }
    }
}
