# SmartContracts Mono-Repository
<p align="center">
    <img src="https://kannacoin.wpenginepowered.com/wp-content/uploads/2023/01/knn-green@2x.png" width="60%" alt="Kanna">
</p>

<p align="center">
<img src="https://img.shields.io/badge/language-solidity-blueviolet.svg?style=flat" alt="Solidity">
<img src="https://img.shields.io/badge/compiler%20version-0.8.17-blueviolet.svg?style=flat" alt="SolcVersion_8_17">
<br/>
<img src="https://img.shields.io/badge/hardhat-2.2.1-yellow.svg?style=flat" alt="SolcVersion_8_17">
<img src="https://img.shields.io/badge/v5.7.2-ethers-purple.svg?style=flat" alt="Ethers">
<img src="https://img.shields.io/badge/testing%20lang-typescript-blue.svg?style=flat" alt="Typescript">
<img src="https://img.shields.io/badge/powered%20by-chainlink-darkblue.svg?style=flat" alt="Powered by Chainlink">
<br/>
</p>
<hr/>

## Kanna Multisig Wallet

[0x51F9298d8C9DAD2105c99cee8429430a15381C3E](https://etherscan.io/address/0x51F9298d8C9DAD2105c99cee8429430a15381C3E)

## Tests Coverage

[Coverage report](COVERAGE.md)

## Local environment requirements

- Node.js v16.x.x
- NVM (<https://github.com/nvm-sh/nvm>)

## How to Install

install nodejs on v16 using NVM (if not installed):
`nvm install 16.16.0`

use project version on NVM:
`nvm use`

install dependencies:
`npm install`

compile objects:
`npm run build`

---

### Build and Export Types

`npm run compile`

### Run Contract Tests and Generate Gas Usage Report

Terminal 1: `npx hardhat node`\
Terminal 2 `npm run test -- --network localhost`

### Run Coverage Report for Tests

`npm run coverage`

---

### Deploy to Testnet

Create/modify network config in `hardhat.config.ts` and add API key and private key, then run:

`npm run deploy`

## Goerli

- [x] Token: `0x1947D41D65F9Dcc86f509CEe7721DaEBAA102170`
      <https://goerli.etherscan.io/address/0x1947D41D65F9Dcc86f509CEe7721DaEBAA102170#code>
- [x] PreSale: `0x07d973db1799A43fe94B4e0E5C12F1bdc830319f`
      <https://goerli.etherscan.io/address/0x07d973db1799A43fe94B4e0E5C12F1bdc830319f#code>
- [x] Yield: `0x735C67CF90c9c1b64d9e9bd46F58ab2f3Ba0181d`
      <https://goerli.etherscan.io/address/0x735C67CF90c9c1b64d9e9bd46F58ab2f3Ba0181d#code>

## Mumbai

- [x] fxKNN: `0x8Dcb54DdD4dd25a74a9e35d0cF5A45273952eA2c`
      <https://mumbai.polygonscan.com/address/0x8Dcb54DdD4dd25a74a9e35d0cF5A45273952eA2c#code>
- [x] SaleL2: `0x6F5543F31950b69188CE35E05120BACa47f64518`
      <https://mumbai.polygonscan.com/address/0x6F5543F31950b69188CE35E05120BACa47f64518#code>
