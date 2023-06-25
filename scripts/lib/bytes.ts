import hre from 'hardhat'
const { ethers, network } = hre

import type { BytesLike } from '@ethersproject/bytes'

export const convertToBytes = (string: string, length: number): BytesLike => {
	const bytes = ethers.utils.toUtf8Bytes(string)

	return Array.from({ ...bytes, length }, (v) => v ?? 0)
}

export const bytes8 = (string: string) => convertToBytes(string, 8)
export const bytes16 = (string: string) => convertToBytes(string, 16)
export const bytes32 = (string: string) => convertToBytes(string, 32)
