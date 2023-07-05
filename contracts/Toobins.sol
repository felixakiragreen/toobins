// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import './IDelegationRegistry.sol';

contract Toobins is Ownable, ERC721 {
	using Strings for uint256;

	constructor(
		address _moonbirds,
		string memory _baseTokenURI,
		address _delegationRegistry
	) ERC721('Toobins', 'TOOBINS') {
		moonbirds = _moonbirds;
		baseTokenURI = _baseTokenURI;
		delegationRegistry = IDelegationRegistry(_delegationRegistry);
	}

	address public moonbirds;
	uint public idTracker;
	string public baseTokenURI;
	IDelegationRegistry public delegationRegistry;

	//
	// ADMIN
	//

	// Please note: there is no check for a moonbird on the initiate
	function initiate(address luckyFirst) public onlyOwner {
		require(_exists(0) == false, 'Toobins run has already started');

		internalMint(luckyFirst);
	}

	function conclude() public onlyOwner {
		yoink();
	}

	// returns the Toobins to the (contract) owner's wallet if it gets stuck
	function yoink() public onlyOwner {
		// get the address where the Toobins is
		address from = ownerOf(0);
		// return it to home base
		_transfer(from, msg.sender, 0);
		// leave behind a Charm
		internalMint(from);
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

	// This try+catch prevents Toobins from getting trapped
	// In the same way The Worm was trapped by The Wriggler
	function internalMint(address to) internal {
		try this.externalMint(to) {} catch {}
	}

	function externalMint(address to) external {
		require(
			msg.sender == address(this),
			'Must be called from within the contract'
		);

		_safeMint(to, idTracker);

		idTracker += 1;
	}

	// TRANSFER

	// the primary transfer function
	// (doesn't require `from` or `tokenId`)
	function pass(address to) public {
		transferFrom(msg.sender, to, 0);
	}

	// overriding ERC-721 transfer functions

	function transferFrom(
		address from,
		address to,
		uint tokenId
	) public override {
		safeTransferFrom(from, to, tokenId, '');
	}

	function safeTransferFrom(
		address from,
		address to,
		uint tokenId
	) public override {
		safeTransferFrom(from, to, tokenId, '');
	}

	function safeTransferFrom(
		address from,
		address to,
		uint tokenId,
		bytes memory _data
	) public override {
		_requireBasicTransferChecks(to, tokenId);
		_requireSpecialTransferChecks(to);

		_pass(from, to, tokenId, _data);
	}

	// overriding with the following functions

	function _pass(
		address from,
		address to,
		uint tokenId,
		bytes memory _data
	) internal {
		handleTransfer(from, to, tokenId, _data);

		// if there is a moonbird, mint to sender
		if (hasMoonbird(msg.sender)) {
			handleMint(msg.sender);
		} else {
			// if delegated, mint to vault
			address vault = checkForMoonbirdsVault(msg.sender);
			if (vault != address(0)) {
				handleMint(vault);
			}
		}
	}

	function handleTransfer(
		address from,
		address to,
		uint tokenId,
		bytes memory _data
	) internal {
		_requireBasicTransferChecks(to, tokenId);
		_requireSpecialTransferChecks(to);

		_safeTransfer(from, to, tokenId, _data);
	}

	function handleMint(address location) internal {
		// do NOT mint when transferring from the (contract) owner
		// (we don't want to leave a Charm in the Owner's address)
		if (location != owner()) {
			internalMint(location);
		}
	}

	//
	// transfer checks with delegation
	//

	function canTransfer(address to, uint tokenId) public view returns (bool) {
		_requireBasicTransferChecks(to, tokenId);
		_requireSpecialTransferChecks(to);

		return true;
	}

	function _requireBasicTransferChecks(
		address to,
		uint tokenId
	) internal view {
		require(_exists(0), 'Toobins run has not yet started');

		require(tokenId == 0, 'Charms are soulbound and cannot be transferred');

		require(balanceOf(to) == 0, 'This address already receieved Toobins');

		require(
			_isApprovedOrOwner(msg.sender, tokenId),
			'ERC721: caller is not token owner or approved'
		);
	}

	function _requireSpecialTransferChecks(address to) internal view {
		// check if they have a moonbird
		bool toHasMoonbird = hasMoonbird(to);
		if (toHasMoonbird) {
			return;
		}

		// check if they have a delegated vault with a moonbird
		bool toDelegateHasMoonbird = delegateHasMoonbird(to);
		if (toDelegateHasMoonbird) {
			return;
		}

		require(
			toHasMoonbird,
			'Toobins can only be transferred to an address with a Moonbird'
		);
	}

	function hasMoonbird(address owner) internal view returns (bool) {
		return IERC721(moonbirds).balanceOf(owner) > 0;
	}

	function delegateHasMoonbird(address delegate) internal view returns (bool) {
		return checkForMoonbirdsVault(delegate) != address(0);
	}

	function checkForMoonbirdsVault(
		address delegate
	) internal view returns (address) {
		IDelegationRegistry.DelegationInfo[]
			memory delegateInfos = IDelegationRegistry(delegationRegistry)
				.getDelegationsByDelegate(delegate);

		for (uint i = 0; i < delegateInfos.length; i++) {
			IDelegationRegistry.DelegationInfo memory info = delegateInfos[i];

			if (hasMoonbird(info.vault)) {
				return info.vault;
			}
		}

		return address(0);
	}
}
