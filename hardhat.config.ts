import { config as dotEnvConfig } from 'dotenv'
dotEnvConfig()

import { HardhatUserConfig } from 'hardhat/types'

import '@nomicfoundation/hardhat-toolbox'

const ALCHEMY_PROD_API_KEY = process.env.ALCHEMY_PROD_API_KEY || ''
const ALCHEMY_TEST_API_KEY = process.env.ALCHEMY_TEST_API_KEY || ''
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const TESTNET_ADDRESS = process.env.TESTNET_ADDRESS || ''
const TESTNET_PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY || ''
const TESTNET_SECONDARY_PRIVATE_KEY =
	process.env.TESTNET_SECONDARY_PRIVATE_KEY || ''

const MAINNET_ADDRESS = process.env.MAINNET_ADDRESS || ''
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY || ''

const config: HardhatUserConfig = {
	defaultNetwork: 'hardhat',
	solidity: {
		compilers: [
			{
				version: '0.8.19',
				settings: {
					optimizer: {
						enabled: false,
						runs: 200,
					},
				},
			},
		],
	},
	networks: {
		hardhat: {
			// this is because of Metamask
			// https://hardhat.org/metamask-issue.html
			chainId: 1337,
			allowUnlimitedContractSize: true,
		},
		goerli: {
			url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_TEST_API_KEY}`,
			accounts: [TESTNET_PRIVATE_KEY, TESTNET_SECONDARY_PRIVATE_KEY],
			from: TESTNET_ADDRESS,
		},
		mainnet: {
			url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_PROD_API_KEY}`,
			accounts: [MAINNET_PRIVATE_KEY],
			from: MAINNET_ADDRESS,
		},
		coverage: {
			url: 'http://127.0.0.1:8555', // Coverage launches its own ganache-cli client
			allowUnlimitedContractSize: true,
		},
	},
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: ETHERSCAN_API_KEY,
	},
	contractSizer: {
		alphaSort: true,
		runOnCompile: true,
		disambiguatePaths: false,
	},
	gasReporter: {
		enabled: true,
		gasPrice: 100,
		// currency: 'USD',
		// ethPrice: 2000,
		currency: 'ETH',
		ethPrice: 1,
	},
	typechain: {
		outDir: 'typechain',
	},
}

export default config
