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

---

### Deploy to Testnet:

Create/modify network config in `hardhat.config.ts` and add API key and private key, then run:

`npm run deploy`

## Goerli

- [x] Token: `0x356426E973a377b058Da8DC6999aD4f91bC8b218`
      https://goerli.etherscan.io/address/0x356426E973a377b058Da8DC6999aD4f91bC8b218#code
- [x] PreSale: `0x5583125bBdD9D9aB1D39449b52c205eE91C3af2E`
      https://goerli.etherscan.io/address/0x5583125bBdD9D9aB1D39449b52c205eE91C3af2E#code
- [x] Yield: `0x0756C30f249765fcFB6db8FC88189FbC0F239dad`
      https://goerli.etherscan.io/address/0x0756C30f249765fcFB6db8FC88189FbC0F239dad#code
