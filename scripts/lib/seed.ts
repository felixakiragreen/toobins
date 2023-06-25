import type { BytesLike } from '@ethersproject/bytes'
import type { BigNumberish } from '@ethersproject/bignumber'
import type { ContractTransaction } from '@ethersproject/contracts'

import { logger } from './log'
import { bytes16 } from './bytes'

interface IVariables {
	[key: string]: string
}
interface ISequences {
	[key: string]: string[]
}

interface ITemplates {
	[key: string]: ITemplate
}

interface ITemplate {
	[key: string]: string | number
}

export interface TemplateStructure {
	key: string
	type: 'bytes' | 'uint'
	// subtype: '8' | '16' | '32' | '64' | '128' | '256'
}

type TemplateArg = BytesLike | BigNumberish

interface SeedableContract {
	addVariables: (
		keys: BytesLike[],
		vals: string[],
	) => Promise<ContractTransaction>
	addSequence?: (
		key: BytesLike,
		vals: BytesLike[],
	) => Promise<ContractTransaction>
	addSequences?: (
		keys: BytesLike[],
		vals: BytesLike[][],
	) => Promise<ContractTransaction>
	addTemplate: (...args: any[]) => Promise<ContractTransaction>
}

export async function addVariables(
	variables: IVariables,
	contract: SeedableContract,
): Promise<ContractTransaction[]> {
	logger.info('Adding variables')

	const { keys: vKeys, vals: vVals } = partitionStrings(variables)

	logger(logger._debug(`addVariables(${vKeys.length})`))

	const txs: ContractTransaction[] = []

	for (let i = 0; i < vKeys.length; i++) {
		const tx = await contract.addVariables(vKeys[i], vVals[i])
		txs.push(tx)

		logger(logger._separator, `${i + 1}`)
	}

	logger(logger._separator, logger._done, logger.nl)

	logger.success(`Added ${Object.keys(variables).length} variables`)

	return txs
}

export async function addSequences(
	sequences: ISequences,
	contract: SeedableContract,
): Promise<ContractTransaction[]> {
	if (typeof contract.addSequence === 'undefined') {
		throw new Error('Contract does not support addSequence()')
	}

	logger.info('Adding sequences')

	const {
		keys: sKeys,
		vals: sVals,
		labels: sLabels,
	} = partitionArrays(sequences)

	logger(logger._debug(`addSequence(${sKeys.length})`))

	const txs: ContractTransaction[] = []

	for (let i = 0; i < sKeys.length; i++) {
		const tx = await contract.addSequence(sKeys[i], sVals[i])
		txs.push(tx)

		logger(
			logger._separator,
			`${i + 1}`,
			logger.chalk.dim(' ('),
			`${sLabels[i]}`,
			logger.chalk.grey(')'),
		)
	}

	logger(logger._separator, logger._done, logger.nl)

	logger.success(`Added ${Object.keys(sequences).length} sequences`)

	return txs
}

export async function addSequences2(
	sequences: ISequences,
	contract: SeedableContract,
): Promise<ContractTransaction[]> {
	if (typeof contract.addSequences === 'undefined') {
		throw new Error('Contract does not support addSequences()')
	}

	logger.info('Adding sequences v2')

	const {
		keys: sKeys,
		vals: sVals,
		labels: sLabels,
	} = partitionArrays2(sequences)

	logger(logger._debug(`addSequences(${sKeys.length})`))

	const txs: ContractTransaction[] = []

	for (let i = 0; i < sKeys.length; i++) {
		const tx = await contract.addSequences(sKeys[i], sVals[i])
		txs.push(tx)

		logger(
			logger._separator,
			`${i + 1}`,
			logger.chalk.dim(' ('),
			`${sLabels[i]}`,
			logger.chalk.grey(')'),
		)
	}

	logger(logger._separator, logger._done, logger.nl)

	logger.success(`Added ${Object.keys(sequences).length} sequences`)

	return txs
}

export async function addTemplate(
	templates: ITemplates,
	structure: TemplateStructure[],
	contract: SeedableContract,
): Promise<ContractTransaction[]> {
	logger.info('Adding templates')

	logger(logger._debug(`addTemplates(${Object.keys(templates).length})`))

	const txs: ContractTransaction[] = []

	for (const tKey in templates) {
		const tVal: ITemplate = templates[tKey]

		const args = argumentMapper(tVal, structure)

		const tx = await contract.addTemplate(...args)

		txs.push(tx)

		logger(logger._separator, `${tKey}`)
	}

	logger(logger._separator, logger._done, logger.nl)

	logger.success(`Added ${Object.keys(templates).length} templates`)

	return txs
}

// helpers

function partitionStrings(object: IVariables) {
	let keys: BytesLike[][] = []
	let vals: string[][] = []
	let i = 0
	let j = 0
	let l = 20

	for (const prop in object) {
		if (i > l) {
			i = 0
			j++
		}

		if (typeof keys[j] === 'undefined') {
			keys[j] = []
			vals[j] = []
		}

		keys[j].push(bytes16(prop))
		vals[j].push(object[prop])

		i++
	}

	return {
		keys,
		vals,
	}
}

function partitionArrays(object: ISequences) {
	let keys: BytesLike[] = []
	let vals: BytesLike[][] = []
	let labels: string[] = []
	let i = 0

	for (const prop in object) {
		// if (typeof vals[i] === 'undefined') {
		// 	vals[i] = []
		// }

		keys.push(bytes16(prop))
		vals.push(object[prop].map(bytes16))
		labels.push(prop)

		i++
	}

	return {
		keys,
		vals,
		labels,
	}
}

function partitionArrays2(object: ISequences) {
	let keys: BytesLike[][] = []
	let vals: BytesLike[][][] = []
	let labels: string[][] = []
	let i = 0
	let j = 0
	let l = 0 // limit the number of sequences
	let p = 0 // sequences per transaction
	let t = 0 // total sequences

	for (const prop in object) {
		if (p > 275) {
			i = 0
			j++
			console.log('Sequences per transaction: ', p, 'total: ', t)
			p = 0
		}

		// if (i > l) {
		// 	i = 0
		// 	j++
		// 	console.log('Sequences per transaction: ', p, 'total: ', t)
		// 	p = 0
		// }

		if (typeof keys[j] === 'undefined') {
			keys[j] = []
			vals[j] = []
			labels[j] = []
		}

		keys[j].push(bytes16(prop))
		vals[j].push(object[prop].map(bytes16))
		labels[j].push(prop)

		i++
		// keys
		p++
		t++
		// vals
		p += object[prop].length
		t += object[prop].length
	}

	console.log('End total: ', t)

	return {
		keys,
		vals,
		labels,
	}
}

function argumentMapper(
	template: ITemplate,
	structure: TemplateStructure[],
): TemplateArg[] {
	let args: TemplateArg[] = []

	for (let i = 0; i < structure.length; i++) {
		const arg = structure[i]
		const val = template[arg.key]

		if (arg.type === 'bytes' && typeof val === 'string') {
			args.push(bytes16(val))
		} else if (arg.type === 'uint' && typeof val === 'number') {
			args.push(val)
		}
	}

	return args
}
