/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type {
  KnnHolderBadgeChecker,
  KnnHolderBadgeCheckerInterface,
} from "../../contracts/KnnHolderBadgeChecker";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_knnToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_creatorAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "creator",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isAccumulative",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "royaltyPercent",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60c060405234801561001057600080fd5b5060405161041b38038061041b83398101604081905261002f916100bc565b6001600160a01b0382166100895760405162461bcd60e51b815260206004820152601560248201527f496e76616c696420746f6b656e20616464726573730000000000000000000000604482015260640160405180910390fd5b6001600160a01b0390811660a052166080526100ef565b80516001600160a01b03811681146100b757600080fd5b919050565b600080604083850312156100cf57600080fd5b6100d8836100a0565b91506100e6602084016100a0565b90509250929050565b60805160a051610308610113600039600060f00152600061019301526103086000f3fe608060405234801561001057600080fd5b50600436106100675760003560e01c80638f6d3c0b116100505780638f6d3c0b1461011a5780639e5576e7146101215780639f67756d1461014257600080fd5b806301ffc9a71461006c57806302d05d3f146100d6575b600080fd5b6100c161007a366004610217565b7fffffffff00000000000000000000000000000000000000000000000000000000167f8c8f62be000000000000000000000000000000000000000000000000000000001490565b60405190151581526020015b60405180910390f35b60405173ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001681526020016100cd565b60006100c1565b61013461012f366004610260565b610149565b6040519081526020016100cd565b6000610134565b6040517f70a0823100000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff838116600483015260009182917f000000000000000000000000000000000000000000000000000000000000000016906370a0823190602401602060405180830381865afa1580156101da573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101fe91906102b9565b1161020a57600061020d565b60015b60ff169392505050565b60006020828403121561022957600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461025957600080fd5b9392505050565b6000806040838503121561027357600080fd5b823573ffffffffffffffffffffffffffffffffffffffff8116811461029757600080fd5b9150602083013561ffff811681146102ae57600080fd5b809150509250929050565b6000602082840312156102cb57600080fd5b505191905056fea2646970667358221220c1bf74611c687a3dd9bb2c9f9e269fa6f4a75a50e31ca932a8bce9d16a52beaa64736f6c63430008150033";

type KnnHolderBadgeCheckerConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: KnnHolderBadgeCheckerConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class KnnHolderBadgeChecker__factory extends ContractFactory {
  constructor(...args: KnnHolderBadgeCheckerConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _knnToken: PromiseOrValue<string>,
    _creatorAddress: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<KnnHolderBadgeChecker> {
    return super.deploy(
      _knnToken,
      _creatorAddress,
      overrides || {}
    ) as Promise<KnnHolderBadgeChecker>;
  }
  override getDeployTransaction(
    _knnToken: PromiseOrValue<string>,
    _creatorAddress: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _knnToken,
      _creatorAddress,
      overrides || {}
    );
  }
  override attach(address: string): KnnHolderBadgeChecker {
    return super.attach(address) as KnnHolderBadgeChecker;
  }
  override connect(signer: Signer): KnnHolderBadgeChecker__factory {
    return super.connect(signer) as KnnHolderBadgeChecker__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): KnnHolderBadgeCheckerInterface {
    return new utils.Interface(_abi) as KnnHolderBadgeCheckerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): KnnHolderBadgeChecker {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as KnnHolderBadgeChecker;
  }
}
