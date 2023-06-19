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

	//
	// ADMIN
	//

	function initiate(address luckyFirst) public onlyOwner {
		require(_exists(0) == false, 'Toobins run has already started');

		mint(luckyFirst);
	}

	// returns the 0riginal to the (contract) owner's wallet if it gets stuck
	function yoink() public onlyOwner {
		// get the address where the Toobin is
		address from = ownerOf(0);
		// return it to home base
		_transfer(from, msg.sender, 0);

		// leave behind the last Charm
		// TODO: handle failures
		mint(from);
	}

	function conclude() public onlyOwner {
		yoink();
	}

	// VISUAL

	function tokenURI(
		uint tokenId
	) public view override returns (string memory) {}

	// MINT

	function mint(address to) internal {
		_safeMint(to, idTracker);

		idTracker += 1;
	}

	function canTransfer(
		address from,
		address to,
		uint tokenId
	) public view returns (bool) {
		return true;

		// TODO: check for Moonbird
	}
}
