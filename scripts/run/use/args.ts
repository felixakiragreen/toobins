import hre from 'hardhat'
const { ethers, network } = hre

import { logger, getAddress } from '../../lib'

export async function getArgs(contractName: string): Promise<any[]> {
	let args: any[] = []

	logger.info('Constructor arguments:')

	if (contractName === 'Toobins') {
		// ARGS
		// 1 - MOONBIRDS address
		// 2 - metadata / base token URI
		// 3 - DELEGATION REGISTRY address

		// 1 - MOONBIRDS address
		const moonbirdsAddress = await getAddress('Moonbirds', network.name)
		if (moonbirdsAddress) {
			args.push(moonbirdsAddress)
		} else {
			logger.error('Moonbirds address not found')
		}

		// 2 - DELEGATION REGISTRY address
		const delegationAddress = await getAddress(
			'DelegationRegistry',
			network.name,
		)
		if (delegationAddress) {
			args.push(delegationAddress)
		} else {
			logger.error('DelegationRegistry address not found')
		}

		// 3 - metadata / base token URI

		if (network.name === 'mainnet') {
			const metadata = 'https://metadata.proof.xyz/mythics/toobins/'

			args.push(metadata)
		} else if (network.name === 'goerli') {
			const metadata = 'https://mock-toobins.shuttleapp.rs/'

			args.push(metadata)
		}
	} else {
		logger.info('No constructor arguments provided')
	}

	console.log(args)

	return args
}
