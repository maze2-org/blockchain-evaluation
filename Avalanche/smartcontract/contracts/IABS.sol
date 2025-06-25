// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract IABS is ERC20 {
    address public owner;

    constructor() ERC20("Iabs Token", "IABS") {
        owner = msg.sender;
    }

    function mint() external payable {
        require(msg.value >= 0.01 ether, "Insufficient payment");
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
