import type { Contract } from 'ethers'

import fs from 'fs-extra'
import path from 'path'
import { merge, get } from 'lodash'

import { logger } from './log'

type AddressCurrentFileJson = {
	// networkName
	[key: string]: {
		// contractName : address
		[key: string]: string
	}
}

type AddressHistoryFileJson = {
	// networkName
	[key: string]: {
		// contractName
		[key: string]: {
			// contract address
			[key: string]: {
				created: string // ISO date string
				updated: string // ISO date string
			}
		}
	}
}

export async function saveAddress(
	contract: Contract,
	contractName: string,
	networkName: string,
) {
	logger.autoMoji('Saving contract address …')

	try {
		await saveAdddressCurrent(contract, contractName, networkName)
		await saveAdddressHistory(contract, contractName, networkName)

		logger.success('Saved contract addresses')
	} catch (e) {
		logger.error('Failed to save contract addresses:', e)
	}
}

async function getAddressCurrent(): Promise<[string, AddressCurrentFileJson]> {
	const addressFilePath = path.join(process.cwd(), 'address.json')
	await fs.ensureFile(addressFilePath)

	let addressFileJson: AddressCurrentFileJson = {}
	addressFileJson = await fs.readJson(addressFilePath)

	return [addressFilePath, addressFileJson]
}

export async function getAddress(
	contractName: string,
	networkName: string,
): Promise<string> {
	const [, addressFileJson] = await getAddressCurrent()

	const address = get(addressFileJson, [networkName, contractName])

	if (address) {
		return address
	} else {
		logger.warning(`No address found for ${contractName} on ${networkName}`)
		throw new Error(`No address found for ${contractName} on ${networkName}`)
	}
}

async function getAddressHistory(): Promise<[string, AddressHistoryFileJson]> {
	const addressFilePath = path.join(process.cwd(), 'addressHistory.json')
	await fs.ensureFile(addressFilePath)

	let addressFileJson: AddressHistoryFileJson = {}
	addressFileJson = await fs.readJson(addressFilePath)

	return [addressFilePath, addressFileJson]
}

async function saveAdddressCurrent(
	contract: Contract,
	contractName: string,
	networkName: string,
) {
	logger(logger._info('Saving CURRENT contract address …'))

	try {
		const [addressFilePath, addressFileJson] = await getAddressCurrent()

		const mergedJson = merge(addressFileJson, {
			[networkName]: {
				[contractName]: contract.address,
			},
		})

		await fs.outputJson(addressFilePath, mergedJson, { spaces: '\t' })

		logger.success('Saved CURRENT contract address')
	} catch (e) {
		logger.error('Failed to save CURRENT contract addresses: ', e)
	}
}

async function saveAdddressHistory(
	contract: Contract,
	contractName: string,
	networkName: string,
) {
	logger(logger._info('Saving HISTORY contract address …'))

	try {
		const [addressFilePath, addressFileJson] = await getAddressHistory()

		const entry = get(
			addressFileJson,
			[networkName, contractName, contract.address],
			{
				created: new Date().toISOString(),
			},
		)

		const mergedJson = merge(addressFileJson, {
			[networkName]: {
				[contractName]: {
					[contract.address]: {
						...entry,
						updated: new Date().toISOString(),
					},
				},
			},
		})

		await fs.outputJson(addressFilePath, mergedJson, { spaces: '\t' })

		logger.success('Saved HISTORY contract address')
	} catch (e) {
		logger.error('Failed to save HISTORY contract addresses: ', e)
	}
}
