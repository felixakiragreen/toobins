// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
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
	string public baseTokenURI;

	//
	// ADMIN
	//

	function initiate(address luckyFirst) public onlyOwner {
		require(_exists(0) == false, 'Toobins run has already started');

		internalMint(luckyFirst);
	}

	// returns the 0riginal to the (contract) owner's wallet if it gets stuck
	function yoink() public onlyOwner {
		// get the address where the Toobin is
		address from = ownerOf(0);
		// return it to home base
		_transfer(from, msg.sender, 0);

		// leave behind the last Charm
		internalMint(from);
	}

	function conclude() public onlyOwner {
		yoink();
	}

	function setBaseTokenURI(string memory _baseTokenURI) public onlyOwner {
		baseTokenURI = _baseTokenURI;
	}

	// VISUAL

	function tokenURI(
		uint tokenId
	) public view override returns (string memory) {
		_requireMinted(tokenId);

		return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
	}

	// MINT

	// This prevents Toobins from getting trapped
	function internalMint(address to) internal {
		try this.externalMint(to) {} catch {}
	}

	function externalMint(address to) external {
		require(
			_msgSender() == address(this),
			'Must be called from within the contract'
		);

		_safeMint(to, idTracker);

		idTracker += 1;
	}

	function _requireCanTransfer(address to, uint tokenId) internal view {
		require(_exists(0) == true, 'Toobins run has not yet started');

		// TODO: add support for delegate cash
		require(
			_isApprovedOrOwner(_msgSender(), tokenId),
			'ERC721: transfer caller is not owner nor approved'
		);

		require(tokenId == 0, 'Charms are soulbound and cannot be transferred');

		require(
			IERC721(moonbirds).balanceOf(to) > 0,
			'Toobins can only be transferred to an address with a  Moonbirds'
		);

		require(balanceOf(to) == 0, 'This address already receieved Toobin');
	}

	function canTransfer(address to, uint tokenId) public view returns (bool) {
		_requireCanTransfer(to, tokenId);

		return true;
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
		handleTransfer(from, to, tokenId, _data);
		// do NOT mint when transferring from the (contract) owner
		// (we don't want to leave a Charm in the Owner's address)
		if (from != owner()) {
			internalMint(from);
		}
	}

	function handleTransfer(
		address from,
		address to,
		uint tokenId,
		bytes memory _data
	) internal {
		_requireCanTransfer(to, tokenId);

		_safeTransfer(from, to, tokenId, _data);
	}
}
