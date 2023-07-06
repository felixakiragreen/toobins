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
   @notice By calling the beforeTokenHook from owner, all checks are preserved.
   */
	function initiate(address luckyFirst) public onlyOwner {
		assert(idTracker == 0);

		_beforeTokenTransfer(owner(), luckyFirst, idTracker, 1);
		_mint(luckyFirst, idTracker++);
	}

	/**
   @notice Returns the Toobins to the (contract) owner's wallet if it gets stuck
	@dev Charm is minted automatically in _afterTokenTransfer hook
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
   @notice Convenience Transfer function
	@dev (Doesn't require `from` or `tokenId`)
   */
	function pass(address to) public {
		safeTransferFrom(msg.sender, to, 0);
	}

	/**
	@notice This is where the transfer checks happen
	@dev Using hooks instead of overriding ERC-721 transfer functions
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
		require(
			_hasMoonbird(to) || _checkForMoonbirdsVault(to) != address(0),
			'Toobins can only be transferred to an address with a Moonbird'
		);
	}

	/**
	@notice This is where the mint happens after a transfer
	*/
	function _afterTokenTransfer(
		address from,
		address,
		uint256,
		uint256 batchSize
	) internal virtual override {
		assert(batchSize == 1);

		if (from != address(0)) {
			_mint(from, idTracker++); // do NOT use safeMint as this allowed the Wriggler exploit
		}
	}

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

			// Filter out delegations that are not relevant to Moonbirds
			if (info.type_ == IDelegationRegistry.DelegationType.NONE) {
				continue;
			}
			if (
				info.type_ == IDelegationRegistry.DelegationType.TOKEN &&
				info.contract_ != moonbirds
			) {
				continue;
			}
			if (
				info.type_ == IDelegationRegistry.DelegationType.CONTRACT &&
				info.contract_ != moonbirds
			) {
				continue;
			}

			if (_hasMoonbird(info.vault)) {
				return info.vault;
			}
		}

		return address(0);
	}
}
