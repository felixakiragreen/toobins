// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.18;

contract MockMoonbirds {
	constructor() {}

	function balanceOf(address owner) public view returns (uint balance) {
		return 1;
	}
}
