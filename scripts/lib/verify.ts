/*

REQUIRE me to double check the source-code comments


"! REMEMBER how you had to ask Etherscan to delete the source code? Do you want to do that again? 

DOUBLE, TRIPLE check the comments!""

*/

import hre from 'hardhat'
const { network, ethers } = hre

import { spawn } from 'child_process'

import { logger, getAddress } from '../lib'
import { promptContract } from '../lib/prompts'

import { getArgs } from '../run/use/args'

/*

what MAIN does:
1. prompt you to select which network to deploy to
2. run the hardhat deploy script with the correct argument:
	`yarn hardhat run scripts/deploy.ts --network ${network}

*/

async function main() {
	logger.newLine()
	logger.autoMoji(logger.colors.orange.bold('Adding source code2'))
	logger.newLine()

	const contractName = await promptContract()

	if (!contractName) {
		logger.warning('Deploy cancelled → Contract not selected')
		return
	}

	console.log(`contractttttt to ${contractName}`)

	const contractAddress = await getAddress(contractName, network.name)

	const args: any[] = await getArgs(contractName)

	// const edwormAddress = await getAddress('Edworm', network.name)

	// ➜ yarn verify:mainnet 0x30Be5EddC57d03914E5D04cb78A12F5784544B1f

	// https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html

	// hardhat verify --network ropsten

	// hre.run("verify:verify", {
	//   // other args
	//   libraries: {
	//     SomeLibrary: "0x...",
	//   }
	// }
	if (network && contractAddress) {
		spawn(
			'pnpm',
			[
				'hardhat',
				'verify',
				'--network',
				network.name,
				contractAddress,
				...args,
			],
			{ stdio: 'inherit' },
		)
	}
}

main()
