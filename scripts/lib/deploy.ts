import hre from 'hardhat'
const { ethers, network } = hre

import { logger, Prompts } from './log'
import { launch } from './launch'
import { promptContract } from './prompts'
import { getAddress } from './address'
import { lookupEns } from './ens'

import { getArgs } from '../run/use/args'

/*

what MAIN does:
1. prompt you to select which contract to deploy
2. show you if that contract has been deployed to that network
3. IF on mainnet, lookup & show ENS name
4. prompt you to confirm wallet address to deploy with
5. get the deployment constructor arguments
6. prompt you to confirm deploy
7. trigger launch countdown

*/

async function main() {
	logger.newLine()
	logger.autoMoji(logger.chalk.green.bold('Running final checklist'))
	logger.newLine()

	const contractName = await promptContract()

	if (!contractName) {
		logger.warning('Deploy cancelled → Contract not selected')
		return
	}

	const [deployer] = await ethers.getSigners()
	const { address } = deployer

	logger.autoMoji(
		'Using wallet: ',
		logger.nl,
		logger.tab,
		logger.tab,
		logger.format.address(address),
	)

	logger.autoMoji(
		logger.chalk.dim('Account balance: '),
		logger.chalk.green(ethers.utils.formatEther(await deployer.getBalance())),
	)

	if (network.name === 'mainnet') {
		await lookupEns(address)
	}

	const confirmAddress: Prompts.PromptObject = {
		type: 'confirm',
		name: 'correctAddress',
		message: 'Is that address correct?',
	}

	const { correctAddress } = await logger.prompt(confirmAddress)

	if (!correctAddress) {
		logger.warning('Deploy cancelled → Address not confirmed')
		return
	}

	logger.newLine()

	const args: any[] = await getArgs(contractName)

	logger.newLine()

	const confirmDeploy: Prompts.PromptObject = {
		type: 'confirm',
		name: 'finalConfirmation',
		message: `LAST CHANCE! Confirm deploying ${contractName} to ${network.name}?`,
	}

	const { finalConfirmation } = await logger.prompt(confirmDeploy)

	if (!finalConfirmation) {
		logger.warning('Deploy cancelled → Final confirmation not confirmed')
		return
	}

	if (finalConfirmation) {
		await launch(contractName, ...args)
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
