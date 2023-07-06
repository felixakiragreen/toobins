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
	let other5: SignerWithAddress
	let otherDeleHot1: SignerWithAddress
	let otherDeleCold1: SignerWithAddress
	let otherDeleHot2: SignerWithAddress
	let otherDeleCold2: SignerWithAddress
	let others: SignerWithAddress[]

	before(async () => {
		;[
			//
			owner,
			other1,
			other2,
			other3,
			other4,
			other5,
			otherDeleHot1,
			otherDeleCold1,
			otherDeleHot2,
			otherDeleCold2,
			...others
		] = await ethers.getSigners()

		// deploy fake DelegationRegistry
		fakeDelegationRegistry = await smock.fake<IDelegationRegistry>(
			'IDelegationRegistry',
		)

		fakeDelegationRegistry.getDelegationsByDelegate.returns((params: any[]) => {
			const delegateAddress: string = params[0]

			if (delegateAddress === otherDeleHot1.address) {
				return [
					[
						1,
						otherDeleCold1.address,
						otherDeleHot1.address,
						'0x0000000000000000000000000000000000000000',
						BigNumber.from(0),
					],
				] as IDelegationRegistry.DelegationInfoStructOutput[]
			}

			if (delegateAddress === otherDeleHot2.address) {
				return [
					[
						1,
						otherDeleCold2.address,
						otherDeleHot2.address,
						'0x0000000000000000000000000000000000000000',
						BigNumber.from(0),
					],
				] as IDelegationRegistry.DelegationInfoStructOutput[]
			}

			return []
		})

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
			await moonbirds.connect(other4).mint()
			await moonbirds.connect(otherDeleCold1).mint()
			await moonbirds.connect(otherDeleCold2).mint()

			expect(await moonbirds.balanceOf(other1.address)).to.eq(1)
			expect(await moonbirds.balanceOf(other2.address)).to.eq(1)
			expect(await moonbirds.balanceOf(other3.address)).to.eq(1)
			expect(await moonbirds.balanceOf(other4.address)).to.eq(1)
			expect(await moonbirds.balanceOf(other5.address)).to.eq(0)
			expect(await moonbirds.balanceOf(otherDeleCold1.address)).to.eq(1)
			expect(await moonbirds.balanceOf(otherDeleHot1.address)).to.eq(0)
			expect(await moonbirds.balanceOf(otherDeleCold2.address)).to.eq(1)
			expect(await moonbirds.balanceOf(otherDeleHot2.address)).to.eq(0)
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
			).to.be.revertedWith('ERC721: transfer to the zero address')
		})

		it('should prevent transfers from non-holders', async () => {
			await expect(
				toobins.connect(other5).transferFrom(other1.address, other5.address, 0),
			).to.be.revertedWith('ERC721: caller is not token owner or approved')
		})

		it('should prevent transfers to addresses without a Moonbird', async () => {
			await expect(
				toobins.connect(other1).pass(other5.address),
			).to.be.revertedWith(
				'Toobins can only be transferred to an address with a Moonbird',
			)
		})

		it('should transfer the Toobin to a valid address', async () => {
			expect(await toobins.balanceOf(other1.address)).to.eq(1)
			expect(await toobins.balanceOf(other2.address)).to.eq(0)

			await toobins.connect(other1).pass(other2.address)

			expect(await toobins.balanceOf(other1.address)).to.eq(1)
			expect(await toobins.balanceOf(other2.address)).to.eq(1)

			expect(await toobins.ownerOf(0)).to.eq(other2.address)
			expect(await toobins.ownerOf(1)).to.eq(other1.address)
		})

		it('should prevent transfers to addresses that already had the Toobin', async () => {
			await expect(
				toobins.connect(other2).pass(other1.address),
			).to.be.revertedWith('This address already receieved Toobins')

			// TODO: also need to test for delegates
		})

		it('should prevent transfers of souldbound Charms', async () => {
			await expect(
				toobins.connect(other1).transferFrom(other1.address, other3.address, 1),
			).to.be.revertedWith('Charms are soulbound and cannot be transferred')
		})

		it('should transfer the Toobins to an address with a Moonbird delegate', async () => {
			const o2_balanceBefore = await toobins.balanceOf(other2.address)
			expect(o2_balanceBefore).to.eq(1)
			const oDH_balanceBefore = await toobins.balanceOf(otherDeleHot1.address)
			expect(oDH_balanceBefore).to.eq(0)

			await toobins
				.connect(other2)
				['safeTransferFrom(address,address,uint256)'](
					other2.address,
					otherDeleHot1.address,
					0,
				)

			const o2_balanceAfter = await toobins.balanceOf(other2.address)
			expect(o2_balanceAfter).to.eq(1)

			const oDH_balanceAfter = await toobins.balanceOf(otherDeleHot1.address)
			expect(oDH_balanceAfter).to.eq(1)
		})

		it('should let a delegate transfer the Toobin to a delegate', async () => {
			expect(await toobins.balanceOf(otherDeleHot1.address)).to.eq(1)
			expect(await toobins.balanceOf(otherDeleHot2.address)).to.eq(0)

			await toobins
				.connect(otherDeleHot1)
				['safeTransferFrom(address,address,uint256)'](
					otherDeleHot1.address,
					otherDeleHot2.address,
					0,
				)

			expect(await toobins.balanceOf(otherDeleHot1.address)).to.eq(0) // should no longer have a Toobin
			expect(await toobins.balanceOf(otherDeleCold1.address)).to.eq(1) // should have a Charm
			expect(await toobins.balanceOf(otherDeleHot2.address)).to.eq(1) // has Toobin now
		})

		it('should let a delegate transfer the Toobin to a normal wallet', async () => {
			expect(await toobins.balanceOf(otherDeleHot2.address)).to.eq(1)
			expect(await toobins.balanceOf(other4.address)).to.eq(0)

			await toobins
				.connect(otherDeleHot2)
				['safeTransferFrom(address,address,uint256)'](
					otherDeleHot2.address,
					other4.address,
					0,
				)

			expect(await toobins.balanceOf(otherDeleHot2.address)).to.eq(0) // should no longer has Toobin
			expect(await toobins.balanceOf(otherDeleCold2.address)).to.eq(1) // should have a Charm
			expect(await toobins.balanceOf(other4.address)).to.eq(1) // has Toobin now
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
