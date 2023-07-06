// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.18;

import '@divergencetech/ethier/contracts/erc721/BaseTokenURI.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import './IDelegationRegistry.sol';

contract Toobins is ERC721, Ownable, BaseTokenURI {
	using Strings for uint256;

	constructor(
		address _moonbirds,
		address _delegationRegistry,
		string memory _baseTokenURI
	) ERC721('Toobins', 'TOOBINS') BaseTokenURI(_baseTokenURI) {
		moonbirds = _moonbirds;
		delegationRegistry = IDelegationRegistry(_delegationRegistry);
	}

	address immutable moonbirds;
	IDelegationRegistry immutable delegationRegistry;
	uint256 public idTracker;

	/**
   @notice By minting to owner and then passing, all checks are preserved.
   */
	function initiate(address luckyFirst) public onlyOwner {
		assert(idTracker == 0);

		_mint(owner(), idTracker++);
		pass(luckyFirst);
	}

	/**
   @notice returns the Toobins to the (contract) owner's wallet if it gets stuck
	@dev charm is minted automatically in _afterTokenTransfer hook
   */
	function yoink() public onlyOwner {
		_transfer(ownerOf(0), msg.sender, 0);
	}

	function _baseURI()
		internal
		view
		override(BaseTokenURI, ERC721)
		returns (string memory)
	{
		return baseTokenURI;
	}

	/**
   @notice primary transfer function
	@dev (doesn't require `from` or `tokenId`)
   */
	function pass(address to) public {
		safeTransferFrom(msg.sender, to, 0);
	}

	/**
	@dev use hooks instead of overriding ERC-721 transfer functions
   */
	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId,
		uint256 batchSize
	) internal virtual override {
		assert(batchSize == 1); // TODO: check if assert is necessary
		// since OpenZeppelin always calls with 1

		if (from == address(0) || to == owner()) {
			// mints are always allowed and we don't stop the owner from yoinking
			return;
		}

		require(
			tokenId == 0,
			'Charms are address-bound and cannot be transferred'
		);
		require(balanceOf(to) == 0, 'This address already received Toobins');
		// TODO: add check for Toobins Charms in the Vault
		require(
			_hasMoonbird(to) || _checkForMoonbirdsVault(to) != address(0),
			'Toobins can only be transferred to an address with a Moonbird'
		);
	}

	function _afterTokenTransfer(
		address from,
		address,
		uint256,
		uint256 batchSize
	) internal virtual override {
		assert(batchSize == 1);
		if (from == address(0)) {
			// mints have no side effects and Charms can't be transferred so we wouldn't be here
			return;
		}

		// @review This is to keep with the functionality as currently implemented, for demonstration purposes,
		// but see other comments around expected behaviour.
		address mintTo = from;
		if (!_hasMoonbird(mintTo)) {
			mintTo = _checkForMoonbirdsVault(from);
		}
		if (mintTo != address(0)) {
			_mint(mintTo, idTracker++); // do NOT use safeMint as this allowed the Wriggler exploit
		}
	}

	//
	// transfer checks with delegation
	//

	function _hasMoonbird(address owner) internal view returns (bool) {
		return IERC721(moonbirds).balanceOf(owner) > 0;
	}

	function _delegateHasMoonbird(
		address delegate
	) internal view returns (bool) {
		return _checkForMoonbirdsVault(delegate) != address(0);
	}

	function _checkForMoonbirdsVault(
		address delegate
	) internal view returns (address) {
		IDelegationRegistry.DelegationInfo[]
			memory delegateInfos = IDelegationRegistry(delegationRegistry)
				.getDelegationsByDelegate(delegate);

		for (uint i = 0; i < delegateInfos.length; i++) {
			IDelegationRegistry.DelegationInfo memory info = delegateInfos[i];

			// TODO: filter delegations

			if (_hasMoonbird(info.vault)) {
				return info.vault;
			}
		}

		return address(0);
	}
}
