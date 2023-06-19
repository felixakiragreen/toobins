// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Toobins is Ownable, ERC721 {
	constructor(address _moonbirds) ERC721('Toobins', 'TOOBIN') {
		// TODO: pass in metadata URI
		moonbirds = _moonbirds;
	}

	address public moonbirds;
	uint public idTracker;
}
