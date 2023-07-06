// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract MockMoonbirds is ERC721 {
	constructor() ERC721('Moonbirds', 'M') {}

	uint public idTracker;

	function mint() public {
		_mint(msg.sender, idTracker++);
	}

	function mintTo(address to) public {
		_mint(to, idTracker++);
	}
}
