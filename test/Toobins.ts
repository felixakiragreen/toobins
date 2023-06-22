import { ethers } from 'hardhat'
import chai from 'chai'

import {
	Toobins,
	Toobins__factory,
	MockMoonbirds,
	MockMoonbirds__factory,
	IDelegationRegistry,
} from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import {
	impersonateAccount,
	stopImpersonatingAccount,
	setBalance,
} from '@nomicfoundation/hardhat-network-helpers'

import { FakeContract, smock } from '@defi-wonderland/smock'
import { BigNumber } from 'ethers'

const { expect } = chai
const { constants, utils } = ethers
const { parseEther, getAddress } = utils
const { AddressZero } = constants

chai.should() // if you like should syntax
chai.use(smock.matchers)

const BASE_TOKEN_URI = 'https://metadata.proof.xyz/toobins/'
const DELEGATION_REGISTRY = '0x00000000000076A84feF008CDAbe6409d2FE638B'

describe('Toobins', () => {
	let toobins: Toobins
	let moonbirds: MockMoonbirds
	let fakeDelegationRegistry: FakeContract<IDelegationRegistry>
	let owner: SignerWithAddress
	let other1: SignerWithAddress
	let other2: SignerWithAddress
	let other3: SignerWithAddress
	let other4: SignerWithAddress
	let otherDeleHot: SignerWithAddress
	let otherDeleCold: SignerWithAddress
	let others: SignerWithAddress[]

	before(async () => {
		;[
			//
			owner,
			other1,
			other2,
			other3,
			other4,
			otherDeleHot,
			otherDeleCold,
			...others
		] = await ethers.getSigners()

		// deploy fake DelegationRegistry
		fakeDelegationRegistry = await smock.fake<IDelegationRegistry>(
			'IDelegationRegistry',
		)

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

		toobins = await toobinsFactory.deploy(
			moonbirds.address,
			'',
			fakeDelegationRegistry.address,
		)
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
			expect(symbol).to.eq('TOOBINS')
		})

		it('should let the owner update the baseTokenURI', async () => {
			await toobins.setBaseTokenURI(BASE_TOKEN_URI)
			expect(await toobins.baseTokenURI()).to.eq(BASE_TOKEN_URI)
		})

		it('should mint some Moonbirds tokens', async () => {
			expect(await moonbirds.balanceOf(other1.address)).to.eq(0)

			await moonbirds.connect(other1).mint()
			await moonbirds.connect(other2).mint()
			await moonbirds.connect(other3).mint()
			// await moonbirds.connect(otherDeleCold).mint()

			expect(await moonbirds.balanceOf(other1.address)).to.eq(1)
			expect(await moonbirds.balanceOf(other2.address)).to.eq(1)
			expect(await moonbirds.balanceOf(other3.address)).to.eq(1)
			expect(await moonbirds.balanceOf(other4.address)).to.eq(0)
			// expect(await moonbirds.balanceOf(otherDeleCold.address)).to.eq(1)
			expect(await moonbirds.balanceOf(otherDeleHot.address)).to.eq(0)
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

			await expect(
				toobins.connect(other1).canTransfer(AddressZero, 0),
			).to.be.revertedWith('ERC721: address zero is not a valid owner')
		})

		it('should prevent transfers to addresses without a Moonbird', async () => {
			fakeDelegationRegistry.getDelegationsByDelegate.returns([
				[
					1,
					// '0x588672a61Fb89f2dcD9a70001F06E8B692567755',
					otherDeleCold.address,
					// '0xBA19BA5233b49794c33f01654e99A60E579E6f29',
					otherDeleHot.address,
					'0x0000000000000000000000000000000000000000',
					BigNumber.from(0),
				],
			] as IDelegationRegistry.DelegationInfoStructOutput[])

			// fakeDelegationRegistry.getDelegationsByDelegate.returns([])
			// fakeDelegationRegistry.checkDelegateForAll.returns(true)

			console.log('inside here')

			const testMockDelegates = await toobins.getDelegates(other4.address)

			console.log('testMockDelegates', testMockDelegates)

			await expect(
				toobins.connect(other1).pass(other4.address),
			).to.be.revertedWith(
				'Toobins can only be transferred to an address with a Moonbird',
			)

			await expect(
				toobins.connect(other1).canTransfer(other4.address, 0),
			).to.be.revertedWith(
				'Toobins can only be transferred to an address with a Moonbird',
			)
		})

		it('should transfer the Toobin to a valid address', async () => {
			const o1_balanceBefore = await toobins.balanceOf(other1.address)
			expect(o1_balanceBefore).to.eq(1)
			const o2_balanceBefore = await toobins.balanceOf(other2.address)
			expect(o2_balanceBefore).to.eq(0)

			expect(
				await toobins.connect(other1).canTransfer(other2.address, 0),
			).to.eq(true)

			await toobins.connect(other1).pass(other2.address)

			const o1_balanceAfter = await toobins.balanceOf(other1.address)
			expect(o1_balanceAfter).to.eq(1)

			const o2_balanceAfter = await toobins.balanceOf(other2.address)
			expect(o2_balanceAfter).to.eq(1)
		})

		it('should prevent transfers to addresses that already had the Toobin', async () => {
			await expect(
				toobins.connect(other2).pass(other1.address),
			).to.be.revertedWith('This address already receieved Toobins')

			await expect(
				toobins.connect(other2).canTransfer(other1.address, 0),
			).to.be.revertedWith('This address already receieved Toobins')
		})

		it('should prevents transfers of souldbound Charms', async () => {
			await expect(
				toobins.connect(other1).transferFrom(other2.address, other3.address, 1),
			).to.be.revertedWith('Charms are soulbound and cannot be transferred')

			await expect(
				toobins.connect(other1).canTransfer(other3.address, 1),
			).to.be.revertedWith('Charms are soulbound and cannot be transferred')
		})
	})

	describe('VISUAL', async () => {
		it('should return the token URI for a token', async () => {
			const tokenURI_0 = await toobins.tokenURI(0)
			expect(tokenURI_0).to.eq(`${BASE_TOKEN_URI}0`)

			const tokenURI_1 = await toobins.tokenURI(1)
			expect(tokenURI_1).to.eq(`${BASE_TOKEN_URI}1`)
		})

		it('should not return token URI for an invalid token', async () => {
			await expect(toobins.tokenURI(999)).to.be.revertedWith(
				'ERC721: invalid token ID',
			)
		})
	})

	describe('ADMIN', async () => {
		it('should let the owner yoink the Toobin', async () => {
			const owner_balanceBefore = await toobins.balanceOf(owner.address)
			expect(owner_balanceBefore).to.eq(0)
			const o2_balanceBefore = await toobins.balanceOf(other2.address)
			expect(o2_balanceBefore).to.eq(1)

			await toobins.yoink()

			const owner_balanceAfter = await toobins.balanceOf(owner.address)
			expect(owner_balanceAfter).to.eq(1)

			const o2_balanceAfter = await toobins.balanceOf(other2.address)
			expect(o2_balanceAfter).to.eq(1)
		})

		it('should not leave behind a Charm for the owner', async () => {
			const owner_balanceBefore = await toobins.balanceOf(owner.address)
			expect(owner_balanceBefore).to.eq(1)

			await toobins.pass(other3.address)

			const owner_balanceAfter = await toobins.balanceOf(owner.address)
			expect(owner_balanceAfter).to.eq(0)
		})

		it('should allow the owner to conclude the run', async () => {
			const balanceBefore = await toobins.balanceOf(owner.address)
			expect(balanceBefore).to.eq(0)

			await toobins.conclude()

			const balanceAfter = await toobins.balanceOf(owner.address)
			expect(balanceAfter).to.eq(1)
		})
	})
})
