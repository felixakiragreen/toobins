import hre from 'hardhat'
const { ethers, network } = hre

import { logger } from './log'

export async function lookupEns(address: string): Promise<string> {
	if (network.name !== 'mainnet') {
		logger.error('ENS name only available on mainnet')
		throw new Error('ENS name only available on mainnet')
	}

	const ensName = await ethers.provider.lookupAddress(address)

	if (ensName) {
		logger.success(
			`Found ENS ${logger.chalk.bold(ensName)} for ${logger.format.address(
				address,
			)} `,
		)
	} else {
		logger.warning(`No ENS was found for ${logger.format.address(address)} `)
	}
	return ensName
}
