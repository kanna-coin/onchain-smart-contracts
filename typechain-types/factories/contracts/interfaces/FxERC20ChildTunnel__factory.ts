/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  FxERC20ChildTunnel,
  FxERC20ChildTunnelInterface,
} from "../../../contracts/interfaces/FxERC20ChildTunnel";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "childToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "childToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class FxERC20ChildTunnel__factory {
  static readonly abi = _abi;
  static createInterface(): FxERC20ChildTunnelInterface {
    return new utils.Interface(_abi) as FxERC20ChildTunnelInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FxERC20ChildTunnel {
    return new Contract(address, _abi, signerOrProvider) as FxERC20ChildTunnel;
  }
}