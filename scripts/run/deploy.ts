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
	logger.autoMoji(logger.colors.orange.bold('Preparing deployment'))
	logger.newLine()

	const network = await promptNetwork()

	if (!network) {
		logger.warning('Deployment cancelled → Network not selected')
		return
	}

	if (network) {
		spawn(
			'pnpm',
			['hardhat', 'run', 'scripts/lib/deploy.ts', '--network', network],
			{ stdio: 'inherit' },
		)
	}
}

main()
