/*

REQUIRE me to double check the source-code comments


"! REMEMBER how you had to ask Etherscan to delete the source code? Do you want to do that again? 

DOUBLE, TRIPLE check the comments!""

*/

import { spawn } from 'child_process'

import { logger } from '../lib'
import { promptNetwork } from '../lib/prompts'

/*

what MAIN does:
1. prompt you to select which network to deploy to
2. run the hardhat deploy script with the correct argument:
	`pnpm hardhat run scripts/deploy.ts --network ${network}

*/

async function main() {
	logger.newLine()
	logger.autoMoji(logger.colors.orange.bold('Adding source code'))
	logger.newLine()

	const network = await promptNetwork()
	if (!network) {
		logger.warning('Verification cancelled → Network not selected')
		return
	}

	if (network) {
		spawn(
			'pnpm',
			['hardhat', 'run', 'scripts/lib/verify.ts', '--network', network],
			{ stdio: 'inherit' },
		)
	}
}

main()
