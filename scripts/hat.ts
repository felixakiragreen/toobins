import path from 'path'
import { spawn } from 'child_process'

import { logger } from './lib'

import { promptFile } from './lib/prompts'

/*

what MAIN does:
1. get a list of all the files inside './scripts/run'
2. prompt you to select one
3. run the selected file

*/

export async function main() {
	logger.newLine()
	logger.autoMoji(logger.colors.purple.bold('Magic Hat'))
	logger.newLine()

	const rel = './scripts/run'
	const dir = path.join(process.cwd(), rel)
	const file = await promptFile(rel, `Which script shall we run?`)

	if (file) {
		spawn('pnpm', ['esr', `${dir}/${file}`], { stdio: 'inherit' })
	} else {
		logger.warning('Magic Hat cancelled')
	}
}

main()
