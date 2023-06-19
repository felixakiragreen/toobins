// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

contract Toobins is Ownable, ERC721 {
	using Strings for uint256;

	constructor(
		address _moonbirds,
		string memory _baseTokenURI
	) ERC721('Toobins', 'TOOBIN') {
		moonbirds = _moonbirds;
		baseTokenURI = _baseTokenURI;
	}

	address public moonbirds;
	uint public idTracker;
	string baseTokenURI;

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
	) public view override returns (string memory) {
		return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
	}

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

	// TRANSFER

	// the primary transfer function
	// (doesn't require `from` or `tokenId`)
	function pass(address to) public {
		transferOverride(msg.sender, to, 0);
	}

	// overriding ERC-721 transfer functions

	function transferFrom(
		address from,
		address to,
		uint tokenId
	) public override {
		transferOverride(from, to, tokenId);
	}

	function safeTransferFrom(
		address from,
		address to,
		uint tokenId
	) public override {
		transferOverride(from, to, tokenId);
	}

	function safeTransferFrom(
		address from,
		address to,
		uint tokenId,
		bytes memory _data
	) public override {
		transferOverride(from, to, tokenId, _data);
	}

	// overriding with the following functions

	function transferOverride(address from, address to, uint tokenId) internal {
		transferOverride(from, to, tokenId, '');
	}

	// this function is where the "share-to-mint" magic happens
	// first do the "transfer", then "mint" to the `from` address
	function transferOverride(
		address from,
		address to,
		uint tokenId,
		bytes memory _data
	) internal {
		// do the transfer
		transfer(from, to, tokenId, _data);
		// do NOT mint when transferring from the (contract) owner
		// (we don't want to leave a Hologram in the Worm's address)
		if (from != owner()) {
			mint(from);
		}
	}

	function transfer(
		address from,
		address to,
		uint tokenId,
		bytes memory _data
	) internal {
		require(tokenId == 0, 'Charms are soulbound and cannot be transferred');

		require(
			// require standard authorization because we overrode safeTransferFrom
			_isApprovedOrOwner(_msgSender(), tokenId),
			'ERC721: transfer caller is not owner nor approved'
		);

		_safeTransfer(from, to, tokenId, _data);
	}
}
