import hre from 'hardhat'
const { ethers, network } = hre

import type { TransactionResponse } from '@ethersproject/abstract-provider'
import type {
	ContractTransaction,
	ContractReceipt,
} from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'

import { logger } from './log'

export async function fetchGasUsed(
	tx: TransactionResponse,
): Promise<BigNumber> {
	logger.debug(`fetchGasUsed(${tx.hash})`)

	const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
	const { gasUsed } = receipt || {}

	if (gasUsed) {
		return gasUsed
	} else {
		logger.warning('Gas used not found')
		throw new Error('Gas used not found')
	}
}

// export async function getGasUsed(
// 	tx: ContractReceipt,
// ): Promise<BigNumber> {
// 	logger.debug(`getGasUsed(${tx.hash})`)

// 	const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
// 	const { gasUsed } = receipt || {}

// 	if (gasUsed) {
// 		return gasUsed
// 	} else {
// 		logger.warning('Gas used not found')
// 		throw new Error('Gas used not found')
// 	}
// }

export async function getGasPrice(tx: TransactionResponse): Promise<BigNumber> {
	logger.debug(`getGasPrice(${tx.hash})`)

	const { gasPrice } = tx || {}

	if (gasPrice) {
		return gasPrice
	} else {
		logger.warning('Gas price not found')
		throw new Error('Gas price not found')
	}
}

export async function calculateGas(
	tx: TransactionResponse,
): Promise<BigNumber> {
	logger.debug(`calculateGas(${tx.hash})`)

	const receipt = await ethers.provider.getTransactionReceipt(tx.hash)

	const { gasPrice } = tx || {}
	const { gasUsed } = receipt || {}

	if (gasPrice && gasUsed) {
		const gasCost = gasPrice.mul(gasUsed)
		const ethCost = ethers.utils.formatEther(gasCost)

		logger.debug('Gas cost in ETH: ', ethCost)

		return gasCost
	} else {
		logger.warning('Gas price or gas used not found')
		throw new Error('Gas price or gas used not found')
	}
}

export async function calculateTotalGas(
	txs: TransactionResponse[],
): Promise<BigNumber> {
	logger.debug(`calculateTotalGas(${txs.length})`)

	let totalGasCost = ethers.BigNumber.from(0)

	for (const tx of txs) {
		const gasCost = await calculateGas(tx)
		totalGasCost = totalGasCost.add(gasCost)
	}

	const ethCost = ethers.utils.formatEther(totalGasCost)

	logger.debug('Total gas cost in ETH: ', ethCost)

	return totalGasCost
}

export async function calculateTotalGasUsed(
	txs: ContractReceipt[],
): Promise<BigNumber> {
	logger.debug(`calculateTotalGas(${txs.length})`)

	let totalGasUsed: BigNumber = ethers.BigNumber.from('0')

	for (const tx of txs) {
		totalGasUsed = totalGasUsed.add(tx.gasUsed)
		// logger.debug('so gar ... gas used: ', totalGasUsed.toHexString())
	}

	logger.debug(
		'Total wei used: ',
		ethers.utils.formatUnits(totalGasUsed, 'wei'),
	)

	// const gasPrice = ethers.utils.parseUnits('50', 'gwei')

	// const ethCost = ethers.utils.formatEther(totalGasUsed.mul(gasPrice))
	// logger.debug('Total gas cost in ETH: ', ethCost)

	return totalGasUsed
}
