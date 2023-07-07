# Toobins

1. Setup
   1. Install dependencies → `pnpm i`
   2. Look through `./hardhat.config.ts` for environment variables
   3. Configure environment variables → `./env`
2. Run tests → `pnpm test`
3. Run test coverage → `pnpm coverage`
   1. Open `coverage/index.html` to see 100% test coverage
4. Deploy → `pnpm hat` → `deploy` → Follow prompts
5. Verify source code → `pnpm hat` → `verify` → Follow prompts

## Important Notes

The NFT smart contract (`contracts/Toobins.sol`) and the delegate.cash
interface (`contracts/IDelegationRegistry.sol`) can be tested and deployed
from this project or you can just copy them into your preferred environment.

`contracts/MockMoonbirds.sol` only exists for the purposes of testing.

`mockend/*` only exists for making the mocked Goerli endpoint for serving
OpenSea metadata, I'm assuming you'll provide your own metadata backend.

## Deployment

If you want to deploy you'll need to set up environment variables (`./env`)
and the constructor arguments for metadata in `scripts/run/use/args.ts`.

I use alchemy API to deploy but you can configure your own provider in `hardhat.config.ts`.

## Testnet Deploys

### Addresses

- primary → `0xb0436355746155dFB1bbD4b029241D7dee168FFd`
- secondary → `0x79d17Aaf7816578C5B110d69E76C96189e747762`
- tertiary → `0x66937401467317541fDd9f5988A4AB71b92Fd423`
- quarternary → `0x61fA6bF463Eb079F52932A7ED5bA0e63505D8Ed5`
- quinary → `0x992c983C235AffA30372ee6759319f89989ad4Db`
- senary → `0x96BCC28FD42835103d2902BDae50C9B3d13F5598`

### Transaction Log (2023-06-25)

[OpenSea collection](https://testnets.opensea.io/collection/toobins) / [Etherscan contract](https://goerli.etherscan.io/address/0x0a239365bbab8dbe0df035245b905aad37b55f16)

1. primary → [deployed mock moonbirds to goerli](https://goerli.etherscan.io/tx/0x1b89ba05b526efe806943fd3f547f39c67236838d12fff31e2a274f0cebc0cc2)
2. secondary → [minted moonbird](https://goerli.etherscan.io/tx/0xc2e3b12b6fc96f2e9be6e465a16116638435e5b7dec79b67ea1d271f0610870b)
3. secondary → [made tertiary delegate for secondary](https://goerli.etherscan.io/tx/0xfb06290d97907aee1cec6ce1ea7a65004d2f2eb556ac9a19df65203b103c0b67)
4. primary → [deployed toobins](https://goerli.etherscan.io/tx/0x96f1dbc60aa3321590846127880e65f00cca9d63829c52c42041f3bc82f02503)
5. primary → [initiated with quarternary](https://goerli.etherscan.io/tx/0xdd82c847b8ffe9819236e4c520800618684491a0d444afa7cd030fa81ade5617) NOTE: I had to manually set the gas limit in Metamask
6. quarternary → [pass to tertiary](0xa3d05da39b64ed03eeac3e2b98fcc9aa870b0a049ff6fa9e2d1a67968f1f83de) NOTE: this is where the delegation is tested, because tertiary does not have a moonbird, but it is a delegate for secondary
7. tertiary → [attempt to transfer to quinary, reverted as expected because no moonbird](https://goerli.etherscan.io/tx/0xe62bd09c1e674e3250fa3108a4a25d94f635603e5d640d888bbea3302447eba6)
8. quinary → [mint moonbird](https://goerli.etherscan.io/tx/0x5445176be3f77d50a6d46e57a00725e62cc17b15d841cbab91455baba770cfff)
9. tertiary → [transfer to quinary](https://goerli.etherscan.io/tx/0x68af29e800d29df3f3d3dd48ff3e1761d77106d814bca2476bac0d768524ffe6)

### Transaction Log (2023-07-07)

[OpenSea collection](https://testnets.opensea.io/collection/toobins-1) / [Etherscan contract](https://goerli.etherscan.io/address/0xf71c3979e16f8b1ab8f2db03693c4383d636abba)

1. primary → [deployed toobins](https://goerli.etherscan.io/tx/0x8c84b4068163eaaccc948deed20b7ad77440be9cef95adf770d9eda36cfc7e7b)
2. primary → [initiated with quarternary](https://goerli.etherscan.io/tx/0xd617828c4d4c6b034611766c24adf5728819b4e18b481e2c27ee42a8faf79b43)
3. quarternary → [pass to tertiary](https://goerli.etherscan.io/tx/0xbdd86fb18fcb15fd3e230fd520c88adc71d855f2801cec267828168a6892019e)
4. tertiary → [transfer to quinary](https://goerli.etherscan.io/tx/0x8d650700ef41586633973230a6a440edefa1e4e6c1e31643136d0c8281c3fe34)
5. quinary → [attempt to pass to senary, reverted as expected because no moonbird](https://goerli.etherscan.io/tx/0x165a5577c2309c781f633a0a7efdc00fdaf51852de362f1df0d3223df21c1bc7)
6. primary → [yoinked to conclude run](https://goerli.etherscan.io/tx/0xcc4bbf52ecd11341f5dcfb24e6aa5b9761beb75bf2b2ab469ef34d04034bb035)
7. quinary → [attempt to transfer Toobins, reverted, showing fix for exploit 1](https://goerli.etherscan.io/tx/0x9b2df6b0ee764b433c4d700b32cf604c8e1d69adba2cd74fea7ab5b285d7e0f2)
