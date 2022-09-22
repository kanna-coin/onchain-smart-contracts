![KannaCoin.io](https://kannacoin.io/wp-content/uploads/2022/02/logo-kanna.png)

# Smart Contracts MONO Repository

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

`npx hardhat run --network rinkeby scripts/deploy.ts`

### Verify on Etherscan

Using the [hardhat-etherscan plugin](https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html), add Etherscan API key to `hardhat.config.ts`, then run:

`npx hardhat verify --network rinkeby <DEPLOYED ADDRESS>`

---

`// TODO: work in progress`
