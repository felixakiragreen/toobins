import { ethers } from 'hardhat'
import chai from 'chai'

import {
	Toobins,
	Toobins__factory,
	MockMoonbirds,
	MockMoonbirds__factory,
} from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { expect } = chai
const { constants, utils } = ethers
const { parseEther, getAddress } = utils
const { AddressZero } = constants

const BASE_TOKEN_URI = 'https://metadata.proof.xyz/toobins/'

describe('Toobins', () => {
	let toobins: Toobins
	let moonbirds: MockMoonbirds
	let owner: SignerWithAddress
	let other1: SignerWithAddress
	let other2: SignerWithAddress
	let other3: SignerWithAddress
	let other4: SignerWithAddress
	let others: SignerWithAddress[]

	before(async () => {
		;[
			//
			owner,
			other1,
			other2,
			other3,
			other4,
			...others
		] = await ethers.getSigners()

		// deploy Moonbirds contract
		const moonbirdsFactory = (await ethers.getContractFactory(
			'MockMoonbirds',
			owner,
		)) as MockMoonbirds__factory
		moonbirds = await moonbirdsFactory.deploy()

		// deploy Toobins contract AND pass in the address of the Edworm contract
		const toobinsFactory = (await ethers.getContractFactory(
			'Toobins',
			owner,
		)) as Toobins__factory

		toobins = await toobinsFactory.deploy(moonbirds.address, BASE_TOKEN_URI)
		await toobins.deployed()
	})

	describe('DEPLOY', async () => {
		it('should deploy with correct address', async () => {
			expect(toobins.address).to.properAddress
		})

		it('should have the correct owner', async () => {
			expect(await toobins.owner()).to.eq(owner.address)
		})

		// this is mostly a sanity check
		it('should have the correct name & symbol', async () => {
			const name = await toobins.name()
			const symbol = await toobins.symbol()
			expect(name).to.eq('Toobins')
			expect(symbol).to.eq('TOOBIN')
		})

		it('should mint some Moonbirds tokens', async () => {
			const balanceBefore = await moonbirds.balanceOf(other1.address)
			expect(balanceBefore).to.eq(0)

			await moonbirds.connect(other1).mint()

			const balanceAfter = await moonbirds.balanceOf(other1.address)
			expect(balanceAfter).to.eq(1)

			await moonbirds.connect(other2).mint()
		})
	})

	describe('ADMIN', async () => {
		it('should prevents others from initiating the run', async () => {
			await expect(
				toobins.connect(other1).initiate(other1.address),
			).to.be.revertedWith('Ownable: caller is not the owner')
		})

		it('should allow owner to initiate the run', async () => {
			const balanceBefore = await toobins.balanceOf(other1.address)
			expect(balanceBefore).to.eq(0)

			await toobins.initiate(other1.address)

			const balanceAfter = await toobins.balanceOf(other1.address)
			expect(balanceAfter).to.eq(1)
		})
	})

	describe('VISUAL', async () => {
		it('should return the token URI for a token', async () => {
			const tokenURI = await toobins.tokenURI(0)
			// console.log(tokenURI)
			expect(tokenURI).to.eq(`${BASE_TOKEN_URI}0`)
		})
	})

	describe('MINT', async () => {})

	describe('TRANSFER', async () => {
		it('should prevent transfers to the zero address', async () => {
			await expect(
				toobins.connect(other1).transferFrom(
					//
					other1.address,
					AddressZero,
					0,
				),
			).to.be.revertedWith('ERC721: address zero is not a valid owner')
		})

		it('should prevent transfers to addresses without a Moonbird', async () => {
			await expect(
				toobins.connect(other1).pass(other3.address),
			).to.be.revertedWith(
				'Toobins can only be transferred to an address with a  Moonbirds',
			)
		})

		it('should transfer the Toobin to a valid address', async () => {
			const o1_balanceBefore = await toobins.balanceOf(other1.address)
			expect(o1_balanceBefore).to.eq(1)
			const o2_balanceBefore = await toobins.balanceOf(other2.address)
			expect(o2_balanceBefore).to.eq(0)

			await toobins.connect(other1).pass(other2.address)

			const o1_balanceAfter = await toobins.balanceOf(other1.address)
			expect(o1_balanceAfter).to.eq(1)

			const o2_balanceAfter = await toobins.balanceOf(other2.address)
			expect(o2_balanceAfter).to.eq(1)
		})

		it('should prevent transfers to addresses that already had the Toobin', async () => {
			await expect(
				toobins.connect(other2).pass(other1.address),
			).to.be.revertedWith('This address already receieved Toobin')
		})
	})
})
