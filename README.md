![KannaCoin.io](https://kannacoin.io/wp-content/uploads/2022/02/logo-kanna.png)

# SmartContracts Mono-Repository

---

## Local environment requirements:

- Node.js v16.x.x
- NVM (https://github.com/nvm-sh/nvm)

## How to Install:

install nodejs on v16 using NVM (if not installed):
`nvm install 16.16.0`

use project version on NVM:
`nvm use`

install dependencies:
`npm install`

compile objects:
`npm run build`

---

### Build and Export Types:

`npm run compile`

### Run Contract Tests and Generate Gas Usage Report:

Terminal 1: `npx hardhat node`\
Terminal 2 `npm run test -- --network localhost`

### Run Coverage Report for Tests:

`npm run coverage`

- [ ] TODO: Coverage Report for methods without `evm_automine`

---

### Deploy to Testnet:

Create/modify network config in `hardhat.config.ts` and add API key and private key, then run:

`npx hardhat run --network rinkeby scripts/deploy.ts`

## Goerli

- [x] Token: `0xc1fE043caB916555F2F1D49369C5Ea984A1B0085`
      https://goerli.etherscan.io/address/0xc1fe043cab916555f2f1d49369c5ea984a1b0085#code
- [x] PreSale: `0x5583125bBdD9D9aB1D39449b52c205eE91C3af2E`
      https://goerli.etherscan.io/address/0x5583125bBdD9D9aB1D39449b52c205eE91C3af2E#code
- [x] Yield: `0x96a64f8913d7B8501cd21321efEE1ddb6bC52b8e`
      https://goerli.etherscan.io/address/0x96a64f8913d7B8501cd21321efEE1ddb6bC52b8e#code
