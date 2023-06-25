/*

// v1 - hook that returns string components

export const useEtherscan = (network: string): {
	urlBase: string
	urlAddress: string
	urlTransaction: string
} => {
	let urlBase
	if (network === 'mainnet') {
		urlBase = `https://etherscan.io/`
	} else {
		urlBase = `https://${network}.etherscan.io/`
	}

	const urlAddress = `${urlBase}address/`
	const urlTransaction = `${urlBase}tx/`

	return {
		urlBase,
		urlAddress,
		urlTransaction,
	}
}

// v2 - function with multiple parameters

export const etherscan = ({
	network,
	address,
	tx,
}: {
	network: string
	address?: string
	tx?: string
}): string => {
	let base
	if (network === 'mainnet') {
		base = `https://etherscan.io/`
	} else {
		base = `https://${network}.etherscan.io/`
	}

	if (address) {
		return `${base}address/${address}`
	} else if (tx) {
		return `${base}tx/${tx}`
	} else {
		return base
	}
}
*/

// v3 - hybrid

export const etherscan = (function () {
	function main(network: string) {
		if (network === 'mainnet') {
			return `https://etherscan.io/`
		} else {
			return `https://${network}.etherscan.io/`
		}
	}

	main.address = (network: string, address: string) => {
		return `${main(network)}address/${address}`
	}

	main.tx = (network: string, tx: string) => {
		return `${main(network)}tx/${tx}`
	}

	return main
})()
