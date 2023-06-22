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
		transferOverride(msg.sender, to, 0);
	}

	function delegatedPass(address vault, address to) public {
		// TODO: handle this properly
		// if (
		// 	!delegationRegistry.checkDelegateForContract(
		// 		_msgSender(),
		// 		vault,
		// 		address(this)
		// 	)
		// ) revert NotDelegatedError();

		//
		transferOverride(vault, to, 0);
	}

	//    function mintForInvisibleFriends(
	//     uint256[] calldata originalIds
	//   )
	//     external
	//     payable
	//     verifySaleState(SaleState.Private)
	//     verifyTokenBasedMintEnabled
	//     verifyAmount(originalIds.length)
	//     verifyAvailableSupply(originalIds.length)
	//   {
	//     _checkOwnershipAndMarkIDsMinted(originalIds, _msgSender());
	//     _mint(_msgSender(), originalIds.length);
	//   }

	//   function delegatedMintForInvisibleFriends(
	//     address vault,
	//     uint256[] calldata originalIds
	//   )
	//     external
	//     payable
	//     verifySaleState(SaleState.Private)
	//     verifyTokenBasedMintEnabled
	//     verifyAmount(originalIds.length)
	//     verifyAvailableSupply(originalIds.length)
	//   {
	//     if (!delegationRegistry.checkDelegateForContract(_msgSender(), vault, address(this))) revert NotDelegatedError();

	//     _checkOwnershipAndMarkIDsMinted(originalIds, vault);
	//     _mint(_msgSender(), originalIds.length);
	//   }

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
		_requireTransferChecks(to, tokenId);

		_safeTransfer(from, to, tokenId, _data);
	}

	//
	// transfer checks with delegation
	//

	function canTransfer(address to, uint tokenId) public view returns (bool) {
		_requireTransferChecks(to, tokenId);

		return true;
	}

	function _requireTransferChecks(address to, uint tokenId) internal view {
		_requireBasicTransferChecks(to, tokenId);
		_requireSpecialTransferChecks(to, tokenId);
	}

	function _requireBasicTransferChecks(
		address to,
		uint tokenId
	) internal view {
		require(_exists(0), 'Toobins run has not yet started');

		require(tokenId == 0, 'Charms are soulbound and cannot be transferred');

		require(balanceOf(to) == 0, 'This address already receieved Toobins');
	}

	function _requireSpecialTransferChecks(
		address to,
		uint tokenId
	) internal view {
		// owner doesn't need special checks
		if (to == owner()) {
			return;
		}

		// ensure the sender is the owner or approved
		require(
			_isApprovedOrOwner(msg.sender, tokenId),
			'ERC721: transfer caller is not owner nor approved'
		);

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
			'Toobins can only be transferred to an address with a Moonbirds'
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
			memory delegateInfos = delegationRegistry.getDelegationsByDelegate(
				delegate
			);

		for (uint i = 0; i < delegateInfos.length; i++) {
			IDelegationRegistry.DelegationInfo memory info = delegateInfos[i];

			if (hasMoonbird(info.vault)) {
				return info.vault;
			}
		}

		return address(0);
	}
}
