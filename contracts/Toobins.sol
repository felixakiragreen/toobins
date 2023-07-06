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
	uint256 public idTracker = 1; // 0 is Toobins
	string public baseTokenURI;
	IDelegationRegistry public delegationRegistry;

	//
	// ADMIN
	//

	// note: no check for a moonbird on the initiate
	function initiate(address luckyFirst) public onlyOwner {
		_mint(luckyFirst, 0);
	}

	function conclude() public onlyOwner {
		yoink();
	}

	// returns the Toobins to the (contract) owner's wallet if it gets stuck
	// note: charm is minted automatically in _afterTokenTransfer hook
	function yoink() public onlyOwner {
		_transfer(ownerOf(0), msg.sender, 0);
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

	// TRANSFER

	// the primary transfer function
	// (doesn't require `from` or `tokenId`)
	function pass(address to) public {
		transferFrom(msg.sender, to, 0);
	}

	// instead of overriding ERC-721 we can use hooks

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

		require(tokenId == 0, 'Charms are soulbound and cannot be transferred');
		require(balanceOf(to) == 0, 'This address already receieved Toobins');
		// TODO: add check for Toobins Charms in the Vault
		require(
			hasMoonbird(to) || checkForMoonbirdsVault(to) != address(0),
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
		if (!hasMoonbird(mintTo)) {
			mintTo = checkForMoonbirdsVault(from);
		}
		if (mintTo != address(0)) {
			_mint(mintTo, idTracker++); // do NOT use safeMint as this allowed the Wriggler exploit
		}
	}

	//
	// transfer checks with delegation
	//

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
