import hre from 'hardhat'
const { ethers, network } = hre

import { parseName } from 'hardhat/utils/contract-names'

import path from 'path'
import fse from 'fs-extra'

import { logger, Prompts } from './log'
import { getAddress } from './address'

/*

what promptNetwork does
0. list networks (constants)
1. prompt you to select which network to deploy to
2. return the network name

*/

const NETWORKS = ['localhost', 'goerli', 'mainnet']

export async function promptNetwork(question?: string) {
	const selectNetwork: Prompts.PromptObject = {
		type: 'select',
		name: 'network',
		message: question || 'Which network?',
		choices: NETWORKS.map((networkName) => ({
			title: networkName,
			value: networkName,
			description: networkName === 'goerli' ? 'testing on OpenSea' : undefined,
		})),
	}

	const { network } = await logger.prompt(selectNetwork)

	if (network) {
		//logger.debug('Selected network: ', logger.chalk.bold(network))
	} else {
		logger.warning('No network was selected')
	}

	return network
}

/*

what promptFile does:
0. list all files inside a directory
1. prompt you to select a file
2. return the file name

*/

export async function promptFile(directory: string, question?: string) {
	const dir = path.join(process.cwd(), directory)

	const files = await fse
		.readdir(dir)
		.then((files) => files.filter((file) => file.endsWith('.ts')))

	const filesNames = files.map((file) => file.split('.'))

	const selectFile: Prompts.PromptObject = {
		type: 'select',
		name: 'fileName',
		message: question || 'Which file?',
		choices: filesNames.map((file) => ({
			title: file[0],
			description: file[1],
			value: file.join('.'),
		})),
	}

	const { fileName } = await logger.prompt(selectFile)

	if (fileName) {
		//logger.debug('Selected file: ', logger.chalk.bold(fileName))
	} else {
		logger.warning('No file was selected')
	}

	return fileName
}

/*

what promptContract does:
0. list all contracts (filtered)
1. prompt you to select a contract
2. return the name of contract

*/

type ParsedContract = {
	sourceName?: string
	contractName: string
}

async function description(contract: ParsedContract) {
	try {
		const contractAddress = await getAddress(
			contract.contractName,
			network.name,
		)

		if (contractAddress) {
			return `${
				contract.sourceName
			}\npreviously deployed to ${logger.chalk.white.bold(
				network.name,
			)} @ ${logger.format.address(contractAddress)}`
		}
	} catch {
		return contract.sourceName
	}
}

export async function promptContract(question?: string) {
	const allNames = await hre.artifacts.getAllFullyQualifiedNames()

	const someNames = allNames.filter(
		(name) => !name.includes('@openzeppelin') && !name.includes('Base64'),
	)

	const contracts: ParsedContract[] = someNames.map(parseName)

	const choices = await Promise.all(
		contracts.map(async (contract: ParsedContract) => ({
			title: contract.contractName,
			description: await description(contract),
			value: contract.contractName,
		})),
	)

	const selectContract: Prompts.PromptObject = {
		type: 'select',
		name: 'contractName',
		message: question || 'Which contract?',
		choices,
	}

	const { contractName } = await logger.prompt(selectContract)

	if (contractName) {
		//logger.debug('Selected contract: ', logger.chalk.bold(contractName))
	} else {
		logger.warning('No contract was selected')
	}

	return contractName
}
