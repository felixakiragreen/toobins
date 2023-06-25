import hre from 'hardhat'
const { ethers, network } = hre

import { logger } from './log'
import { saveAddress } from './address'
import { etherscan } from './etherscan'

/*

what LAUNCH does:
1. TODO: show you a countdown to deployment that can be cancelled
2. show important logs
3. perform the actual deployment
4. TODO: save the address of the deployed contract

TODO:
	[ ] show you a countdown to deployment that can be cancelled
	[ ] save the address of the deployed contract
	[ ] clean up logs

*/

export async function launch(contractName: string, ...args: any[]) {
	// TODO: add countdown that can be cancelled

	const factory = await ethers.getContractFactory(contractName)

	// If we had constructor arguments, they would be passed into deploy()
	let contract = await factory.deploy(...args)

	// 	console.log(`
	// ⛏   ${chalk.gray('Contract address once mined: ')}
	// ${contract.address}
	// `)
	logger.autoMoji(
		logger.chalk.dim('Contract address once mined: '),
		logger.nl,
		logger.tab,
		logger.tab,
		logger.format.address(contract.address),
	)
	// 	logger(`
	// ⛏   ${chalk.gray('Contract address once mined: ')}
	// ${contract.address}
	// `)
	logger.emoji(
		'transaction',
		logger.chalk.dim('Deployment transaction hash: '),
		logger.nl,
		logger.tab,
		logger.tab,
		logger.format.address(contract.deployTransaction.hash),
	)

	const link = etherscan.tx(network.name, contract.deployTransaction.hash)
	logger.log(logger.tab, logger.tab, logger.chalk.dim(link), logger.nl)

	// 	console.log(`
	// 🏗   ${chalk.gray('Deployment transaction hash: ')}
	// ${contract.deployTransaction.hash}
	// `)

	// console.log(chalk.yellow('⏳  Waiting for it to be mined …'))

	logger(logger._emoji('wait'), 'Waiting for it to be mined …')

	await contract.deployed()
	logger.emoji('check', logger.chalk.green('Mined!'))
	// console.log(chalk.green('✅  Mined!'))

	// TODO: add saving the address
	await saveAddress(contract, contractName, network.name)
}
