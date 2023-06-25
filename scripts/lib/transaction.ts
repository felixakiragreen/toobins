import hre from 'hardhat'
const { ethers, network } = hre

import type {
	ContractTransaction,
	ContractReceipt,
} from '@ethersproject/contracts'

import { logger } from './log'
import { etherscan } from './etherscan'

// TODO: consider making the etherscan link optional

export async function transaction(
	tx: ContractTransaction,
): Promise<ContractReceipt> {
	logger.debug('Transaction sent: ')
	const link = etherscan.tx(network.name, tx.hash)
	logger.log(logger.tab, logger.chalk.dim(link), logger.nl)

	logger(logger._emoji('wait'), 'Waiting for transaction to be mined …')

	const receipt = await tx.wait()

	logger.emoji('check', logger.chalk.green('Confirmed!'))

	return receipt
}

function txsProgress(
	txs: ContractTransaction[],
	progressCallback: (confirmed: number) => void,
): Promise<ContractReceipt[]> {
	let confirmed = 0
	progressCallback(0)
	const waitedTxs: Promise<ContractReceipt>[] = []
	for (const tx of txs) {
		const waitTx = tx.wait()
		waitedTxs.push(waitTx)

		waitTx.then(() => {
			confirmed++
			progressCallback(confirmed)
		})
	}

	return Promise.all(waitedTxs)
}

// TODO: consider adding the link to Etherscan for the last one?

export async function transactions(
	txs: ContractTransaction[],
): Promise<ContractReceipt[]> {
	logger(
		logger._emoji('wait'),
		`Waiting for ${txs.length} transactions to be mined`,
	)

	const receipts = await txsProgress(txs, (confirmed) => {
		if (confirmed) {
			logger(logger._separator, `${confirmed}`)
		}
	})

	logger(logger._separator, logger._done, logger.nl)

	logger.emoji(
		'check',
		logger.chalk.green(`${txs.length} transactions confirmed!`),
	)

	return receipts
}
