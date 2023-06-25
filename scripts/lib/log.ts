import chalk from 'chalk'
import prompts from 'prompts'

import type PromptsType from 'prompts'
export type { PromptsType as Prompts }

const { stdout } = process

/*

logger()

What this does:
0. utils
  - newLine
  - clearLine
  etc
1. wraps chalk, prompts
2. easy log levels:
  - error
  - warning
  - success
  - info
  - debug
  - trace
3. emojis
  - key
  - auto-moji (search)
  - prepending
4. colors
5. recipes
6. encapsulations



logger.success()

logger._success = returns the string

Logger.recipes. ABC

get the nose emoji library too `node-emoji-new`


encapsulate...



RULES:

top level functions like: .success(), .emoji(), ...
call the main logger function



*/

/*
type Logger = Function & {
  chalk: typeof chalk
  prompt: typeof prompts
}


let logger: Logger = function(...messages: any[]) {
  messages.forEach((message) => {
		if (typeof message === 'string') {
			writeLine(message)
		} else if (typeof message === 'function') {
			message()
		}
	})
}

logger.chalk = chalk
logger.prompt = prompts
*/

const writeLine = (message: string) => {
	stdout.write(message)
}
const clearLine = () => {
	stdout.clearLine(0)
	stdout.cursorTo(0)
}
const goToPrevLine = () => {
	// stdout.clearLine(0)
	// stdout.cursorTo(0, -1)
	// stdout.cursorTo(0)
	stdout.moveCursor(0, -1)
	// stdout.clearLine(1)
}
const clearLastLine = () => {
	stdout.moveCursor(0, -1) // up one line
	stdout.clearLine(1) // from cursor to end
}
const newLine = () => writeLine('\n')

// ???
// const _newLine = () => '\n'
// const _nl = '\n'

// const _log = (...messages: any[]) => {
// 	_clearLine()
// 	_writeLine(...messages)
// }

enum LogCategory {
	Error = 'error',
	Warning = 'warning',
	Success = 'success',
	Info = 'info',
	Debug = 'debug',
	Trace = 'trace',
}

const LogColors = {
	[LogCategory.Error]: chalk.red,
	[LogCategory.Warning]: chalk.yellow,
	[LogCategory.Success]: chalk.green,
	[LogCategory.Info]: chalk.blue,
	[LogCategory.Debug]: chalk.magenta,
	[LogCategory.Trace]: chalk.grey,
}

// const _success = (...messages: any[]) => {
//   // _clearLine()
//   // _writeLine(chalk.green(...messages))
// }

function _category(category: LogCategory) {
	return [LogColors[category](category), ' ']
}

// LOG-LEVELS

// Valid:
//logger.success('This successfully went')
//logger.success(logger.chalk.red('This successfully went'), 'asdf')

// EMOJIS

const _emoji = (str: string) => {
	const emoji = findEmoji(str)
	return [emoji, '  ']
}

// MAIN

export const logger = (function () {
	// 0. utils

	function main(...messages: any[]) {
		messages.forEach((message) => {
			if (typeof message === 'string') {
				writeLine(message)
			} else if (typeof message === 'function') {
				message()
			} else if (Array.isArray(message)) {
				main(...message)
			}
		})
	}

	function log(...messages: any[]) {
		clearLine()
		main(...messages, '\n')
	}

	main.log = log

	main.writeLine = writeLine
	main.clearLine = clearLine
	main.newLine = newLine
	main.nl = '\n'
	main.tab = '  '

	// 1. wraps chalk, prompts

	main.chalk = chalk
	main.prompt = prompts

	// 2. log levels:

	main._error = (...messages: any[]) => {
		return [..._category(LogCategory.Error), ...messages]
	}

	main.error = (...messages: any[]) => {
		log(main._error(...messages))
	}

	main._warning = (...messages: any[]) => {
		return [..._category(LogCategory.Warning), ...messages]
	}

	main.warning = (...messages: any[]) => {
		log(main._warning(...messages))
	}

	main._success = (...messages: any[]) => {
		return [..._category(LogCategory.Success), ...messages]
	}

	main.success = (...messages: any[]) => {
		log(main._success(...messages))
	}

	main._info = (...messages: any[]) => {
		return [..._category(LogCategory.Info), ...messages]
	}

	main.info = (...messages: any[]) => {
		log(main._info(...messages))
	}

	main._debug = (...messages: any[]) => {
		return [..._category(LogCategory.Debug), ...messages]
	}

	main.debug = (...messages: any[]) => {
		log(main._debug(...messages))
	}

	main._trace = (...messages: any[]) => {
		return [..._category(LogCategory.Trace), ...messages]
	}

	main.trace = (...messages: any[]) => {
		log(main._trace(...messages))
	}

	// 3. emojis

	main._emoji = _emoji

	main.emoji = (function () {
		function emoji(emojiString: string, ...messages: any[]) {
			log(_emoji(emojiString), messages)
		}

		emoji.get = getEmoji
		emoji.find = findEmoji

		return emoji
	})()

	function autoMoji(...messages: any[]) {
		main.emoji(messages[0], messages)
	}

	main.autoMoji = autoMoji

	// 4. colors

	// 5. recipes

	// 6. encapsulations

	// main.encapsulate = (function () {

	// })

	// TODO: figure out a better way to encapsulate

	// main.encapsulate = (...messages: any[]) => {
	// 	goToPrevLine()
	// 	// clearLine()
	// 	// newLine()
	// 	// newLine()
	// 	//log(...messages)
	// 	// log('#')
	// 	// clearLastLine()
	// }

	main.recipe = {
		// separator: chalk.dim(' … '),
	}
	main._separator = chalk.dim(' … ')
	main._done = chalk.green('done')

	main._check = chalk.green('✔')
	main._cross = chalk.red('✖')

	// ✓
	// ×

	main.colors = {
		felix: chalk.hex('#adff2f'),
		red: chalk.hex('#ed3467'),
		orange: chalk.hex('#f1901d'),
		yellow: chalk.hex('#f7dd4b'),
		green: chalk.hex('#a5e22c'),
		blue: chalk.hex('#38bce6'),
		purple: chalk.hex('#9f7af2'),
	}

	main.format = {
		address: main.colors.felix.bgBlack,
	}

	return main
})()

//

//

//

//

const emojiKey: { [key: string]: string } = {
	skull: '💀',
	emergency: '🚨',
	warning: '⚠️',
	check: '✅',
	bulb: '💡',
	bug: '🐛',
	ladybug: '🐞',
	magnify: '🔍',
	pickaxe: '⛏ ',
	crane: '🏗',
	rocket: '🚀',
	computer: '💻',
	grimace: '😬',
	hourglass: '⏳',
	spark: '✨',
	abacus: '🧮',
	floppy: '💾',
	universe: '🌌',
	sprout: '🌱',
	shrug: '🤷',
	moneybag: '💰',
	clipboard: '📋',
	hat: '🎩',
	test: '🧪',
	construction: '🚧',
	levitate: '🕴 ',
	missing: '⬜️',
	bomb: '💣',
	euro: '💶',
	worm: '🪱',
	mint: '🍬',
	robot: '🤖',
}

const emojiSearch: { [key: string]: string } = {
	fatal: 'skull',
	error: 'emergency',
	warning: 'warning',
	success: 'check',
	info: 'bulb',
	debug: 'bug',
	ladybug: 'ladybug',
	trace: 'magnify',
	mine: 'pickaxe',
	transaction: 'crane',
	deploy: 'rocket',
	compile: 'computer',
	wait: 'hourglass',
	added: 'spark',
	adding: 'abacus',
	saving: 'floppy',
	populating: 'universe',
	seeding: 'sprout',
	testing: 'shrug',
	wallet: 'moneybag',
	checklist: 'clipboard',
	hat: 'hat',
	test: 'test',
	build: 'construction',
	orchestra: 'levitate',
	balance: 'euro',
	preparing: 'grimace',
	copy: 'robot',
}

function getEmoji(key: string): string {
	if (emojiKey[key]) {
		return emojiKey[key]
	}
	return emojiKey.missing
}

// function to return emojiKey if string contains key in emojiKey OR emojiSearch
const findEmojiKey = (str: string) => {
	const foundKey = Object.keys(emojiSearch).find((key) =>
		str.toLowerCase().includes(key),
	)

	if (foundKey) {
		return emojiSearch[foundKey]
	}

	const getKey = Object.keys(emojiKey).find((key) =>
		str.toLowerCase().includes(key),
	)

	if (getKey) {
		return getKey
	}
}

// function to return emoji if string contains key in emojiKey
function findEmoji(str: string) {
	const key = findEmojiKey(str)
	if (key) {
		return emojiKey[key]
	}
	return emojiKey.missing
}
