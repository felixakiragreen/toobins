import path from 'path'
import fs from 'fs-extra'

import { logger } from './log'

export async function copyToFrontend() {
	const contractsDir = path.join(process.cwd(), 'frontend/src/lib/ether')
	const artifactsDir = path.join(process.cwd(), 'artifacts/contracts/')
	const typechainDir = path.join(process.cwd(), 'typechain')
	const addressFile = path.join(process.cwd(), 'address.json')

	await fs.ensureDir(contractsDir)
	await fs.ensureDir(artifactsDir)
	await fs.ensureDir(typechainDir)
	await fs.ensureFile(addressFile)

	try {
		// copy artifacts
		await fs.copy(artifactsDir, contractsDir + '/artifacts')
		// copy typechain
		await fs.copy(typechainDir, contractsDir + '/typechain')
		// copy address
		await fs.copyFile(addressFile, contractsDir + '/address.json')

		logger.success('Copied files for /frontend')
	} catch (e) {
		logger.error('Failed to copy files for /frontend', e)
	}
}
