import { ethers } from 'hardhat'
import chai from 'chai'

import { Toobins, Toobins__factory } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { expect } = chai
const { constants, utils } = ethers
const { parseEther, getAddress } = utils
const { AddressZero } = constants

describe('Toobins', () => {
	let toobins: Toobins
	let owner: SignerWithAddress
	let other1: SignerWithAddress
	let other2: SignerWithAddress
	let others: SignerWithAddress[]

	before(async () => {
		;[owner, other1, other2, ...others] = await ethers.getSigners()

		// deploy Toobins contract AND pass in the address of the Edworm contract
		const toobinsFactory = (await ethers.getContractFactory(
			'Toobins',
			owner,
		)) as Toobins__factory

		// TODO: mock moonbirds contract and pass in address
		toobins = await toobinsFactory.deploy(other1.address)
		await toobins.deployed()
	})

	describe('deploying', async () => {
		it('CAN deploy with correct address', async () => {
			expect(toobins.address).to.properAddress
		})

		it('HAS the correct owner', async () => {
			expect(await toobins.owner()).to.eq(owner.address)
		})

		// this is mostly a sanity check
		it('HAS the correct name & symbol', async () => {
			const name = await toobins.name()
			const symbol = await toobins.symbol()
			expect(name).to.eq('Toobins')
			expect(symbol).to.eq('TOOBIN')
		})
	})

	describe('ADMIN', async () => {})

	describe('VISUAL', async () => {})

	describe('MINT', async () => {})

	describe('TRANSFER', async () => {})
})
