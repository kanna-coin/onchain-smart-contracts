/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type {
  KannaDynamicPriceSale,
  KannaDynamicPriceSaleInterface,
} from "../../contracts/KannaDynamicPriceSale";

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
        name: "_priceAggregator",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "ref",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
    ],
    name: "Claim",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ref",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
    ],
    name: "Lock",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountInWEI",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "knnPriceInUSD",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "ethPriceInUSD",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
    ],
    name: "Purchase",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ref",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
    ],
    name: "Unlock",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "CLAIM_MANAGER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "KNN_DECIMALS",
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
    name: "USD_AGGREGATOR_DECIMALS",
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
    inputs: [
      {
        internalType: "address",
        name: "claimManager",
        type: "address",
      },
    ],
    name: "addClaimManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "availableSupply",
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
    inputs: [
      {
        internalType: "uint256",
        name: "knnPriceInUSD",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
      {
        internalType: "uint16",
        name: "incrementalNonce",
        type: "uint16",
      },
      {
        internalType: "uint256",
        name: "dueDate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    name: "buyTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ref",
        type: "uint256",
      },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ref",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "incrementalNonce",
        type: "uint256",
      },
    ],
    name: "claimLocked",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountInWEI",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "knnPriceInUSD",
        type: "uint256",
      },
    ],
    name: "convertToKNN",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
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
    inputs: [
      {
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "knnPriceInUSD",
        type: "uint256",
      },
    ],
    name: "convertToWEI",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
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
    inputs: [
      {
        internalType: "address",
        name: "leftoverRecipient",
        type: "address",
      },
    ],
    name: "end",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
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
  {
    inputs: [],
    name: "knnLocked",
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
    name: "knnToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ref",
        type: "uint256",
      },
    ],
    name: "lockSupply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
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
    name: "priceAggregator",
    outputs: [
      {
        internalType: "contract AggregatorV3Interface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "claimManager",
        type: "address",
      },
    ],
    name: "removeClaimManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountInKNN",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ref",
        type: "uint256",
      },
    ],
    name: "unlockSupply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "recipient",
        type: "address",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60c060405234801562000010575f80fd5b506040516200242838038062002428833981016040819052620000339162000175565b6200003e336200010a565b6001600160a01b0382166200009a5760405162461bcd60e51b815260206004820152601560248201527f496e76616c696420746f6b656e2061646472657373000000000000000000000060448201526064015b60405180910390fd5b6001600160a01b038116620000f25760405162461bcd60e51b815260206004820181905260248201527f496e76616c69642070726963652061676772656761746f722061646472657373604482015260640162000091565b6001600160a01b039182166080521660a052620001ab565b5f80546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b80516001600160a01b038116811462000170575f80fd5b919050565b5f806040838503121562000187575f80fd5b620001928362000159565b9150620001a26020840162000159565b90509250929050565b60805160a051612231620001f75f395f818161029401528181610d2a015261114901525f818161031d01528181610b9e01528181610e6701528181610f1e015261157601526122315ff3fe6080604052600436106101af575f3560e01c80638c4dd39d116100e7578063a512261c11610087578063d547741f11610062578063d547741f14610517578063e7f30a0614610536578063f2fde38b14610555578063fb1d1f7314610574575f80fd5b8063a512261c146104ae578063c9581137146104c5578063d4268433146104f8575f80fd5b80639e302a48116100c25780639e302a48146104425780639ec8539714610461578063a217fddf14610480578063a4a9380914610493575f80fd5b80638c4dd39d146103c35780638da5cb5b146103e257806391d14854146103fe575f80fd5b806351cff8d9116101525780636d22f4071161012d5780636d22f40714610354578063715018a614610367578063796596b31461037b5780637ecc2b56146103af575f80fd5b806351cff8d9146102ed57806367cff9671461030c5780636befc4661461033f575f80fd5b80632bc43fd91161018d5780632bc43fd9146102455780632f2ff15d146102645780633078fff51461028357806336568abe146102ce575f80fd5b806301ffc9a7146101b357806306892e46146101e7578063248a9ca314610208575b5f80fd5b3480156101be575f80fd5b506101d26101cd366004611d4e565b610593565b60405190151581526020015b60405180910390f35b3480156101f2575f80fd5b50610206610201366004611d8d565b61062b565b005b348015610213575f80fd5b50610237610222366004611dad565b5f908152600160208190526040909120015490565b6040519081526020016101de565b348015610250575f80fd5b5061020661025f366004611dd8565b610744565b34801561026f575f80fd5b5061020661027e366004611e0a565b6107d6565b34801561028e575f80fd5b506102b67f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016101de565b3480156102d9575f80fd5b506102066102e8366004611e0a565b610800565b3480156102f8575f80fd5b50610206610307366004611e38565b61088c565b348015610317575f80fd5b506102b67f000000000000000000000000000000000000000000000000000000000000000081565b34801561034a575f80fd5b5061023760025481565b610206610362366004611ef0565b610911565b348015610372575f80fd5b50610206610c90565b348015610386575f80fd5b5061039a610395366004611d8d565b610ca3565b604080519283526020830191909152016101de565b3480156103ba575f80fd5b50610237610e2b565b3480156103ce575f80fd5b506102066103dd366004611e38565b610edf565b3480156103ed575f80fd5b505f546001600160a01b03166102b6565b348015610409575f80fd5b506101d2610418366004611e0a565b5f9182526001602090815260408084206001600160a01b0393909316845291905290205460ff1690565b34801561044d575f80fd5b5061020661045c366004611e38565b610f88565b34801561046c575f80fd5b5061020661047b366004611d8d565b610fbd565b34801561048b575f80fd5b506102375f81565b34801561049e575f80fd5b50610237670de0b6b3a764000081565b3480156104b9575f80fd5b506102376305f5e10081565b3480156104d0575f80fd5b506102377feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec81565b348015610503575f80fd5b5061039a610512366004611d8d565b6110c2565b348015610522575f80fd5b50610206610531366004611e0a565b611233565b348015610541575f80fd5b50610206610550366004611e38565b611258565b348015610560575f80fd5b5061020661056f366004611e38565b61128a565b34801561057f575f80fd5b5061020661058e366004611f5c565b611317565b5f7fffffffff0000000000000000000000000000000000000000000000000000000082167f7965db0b00000000000000000000000000000000000000000000000000000000148061062557507f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b92915050565b7feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec61065581611451565b825f811161069b5760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b60448201526064015b60405180910390fd5b836106a4610e2b565b10156106f25760405162461bcd60e51b815260206004820152601460248201527f496e73756666696369656e7420737570706c79210000000000000000000000006044820152606401610692565b8360025f8282546107039190611fd6565b909155505060405184815283907f46d326b399b600d54f10f9cc18580fd65427ff111e1ce74350b39e244cbfbcf8906020015b60405180910390a250505050565b7feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec61076e81611451565b82610777610e2b565b10156107c55760405162461bcd60e51b815260206004820152601d60248201527f496e73756666696369656e7420617661696c61626c6520737570706c790000006044820152606401610692565b6107d084848461145b565b50505050565b5f82815260016020819052604090912001546107f181611451565b6107fb8383611646565b505050565b6001600160a01b038116331461087e5760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201527f20726f6c657320666f722073656c6600000000000000000000000000000000006064820152608401610692565b61088882826116cb565b5050565b61089461174c565b60405147906001600160a01b0383169082156108fc029083905f818181858888f193505050501580156108c9573d5f803e3d5ffd5b50816001600160a01b03167f884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a94243648260405161090591815260200190565b60405180910390a25050565b5f82421115610980576004546109289060b4611fd6565b4211156109775760405162461bcd60e51b815260206004820152601460248201527f5369676e617475726520697320657870697265640000000000000000000000006044820152606401610692565b50600354945060015b335f9081526005602052604090205461099a906001611fd6565b8461ffff16146109ec5760405162461bcd60e51b815260206004820152600d60248201527f496e76616c6964204e6f6e6365000000000000000000000000000000000000006044820152606401610692565b6305f5e1003411610a305760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b6044820152606401610692565b604080517f08e32f158778877ee2cb895e7fab95f394e2b555e6df2266655a2328d95cdd10602082015290810187905261ffff851660608201526080810184905260a081018390525f90610ae29060c0015b60408051601f1981840301815282825280516020918201207f19457468657265756d205369676e6564204d6573736167653a0a33320000000084830152603c8085019190915282518085039091018152605c909301909152815191012090565b90505f610aef82886117a5565b9050610b1b7feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec826117c7565b5f80610b27348b6110c2565b9150915081610b34610e2b565b1015610b825760405162461bcd60e51b815260206004820152601460248201527f496e73756666696369656e7420737570706c79210000000000000000000000006044820152606401610692565b60405163a9059cbb60e01b8152336004820152602481018390527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303815f875af1158015610bec573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610c109190611fe9565b5060408051348152602081018c9052908101829052829033907fd721454499cf9c37b757e03b9d675df451c229048129d6e2d552216a035e6a559060600160405180910390a3335f908152600560205260408120805491610c7083612008565b919050555084610c845760038a9055426004555b50505050505050505050565b610c9861174c565b610ca15f61183b565b565b5f80835f8111610ce65760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b6044820152606401610692565b835f8111610d275760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b6044820152606401610692565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663feaf968c6040518163ffffffff1660e01b815260040160a060405180830381865afa158015610d84573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610da8919061203e565b5050509150505f610db8826118a2565b90505f8111610e095760405162461bcd60e51b815260206004820152601460248201527f496e76616c696420726f756e6420616e737765720000000000000000000000006044820152606401610692565b80610e14888a61208a565b610e1e91906120a1565b9890975095505050505050565b6002546040517f70a082310000000000000000000000000000000000000000000000000000000081523060048201525f91906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906370a0823190602401602060405180830381865afa158015610eac573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610ed091906120c0565b610eda91906120d7565b905090565b610ee761174c565b5f610ef0610e2b565b905080156108885760405163a9059cbb60e01b81526001600160a01b038381166004830152602482018390527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303815f875af1158015610f64573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906107fb9190611fe9565b610f9061174c565b610fba7feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec826116cb565b50565b7feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec610fe781611451565b825f81116110285760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b6044820152606401610692565b83600254101561107a5760405162461bcd60e51b815260206004820152601b60248201527f496e73756666696369656e74206c6f636b656420737570706c792100000000006044820152606401610692565b8360025f82825461108b91906120d7565b909155505060405184815283907f7fd927f00badd96e701196d54745980497c47930f11f838a72a18bca71d3608f90602001610736565b5f80835f81116111055760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b6044820152606401610692565b835f81116111465760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b6044820152606401610692565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663feaf968c6040518163ffffffff1660e01b815260040160a060405180830381865afa1580156111a3573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906111c7919061203e565b5050509150505f6111d7826118a2565b90505f81116112285760405162461bcd60e51b815260206004820152601460248201527f496e76616c696420726f756e6420616e737765720000000000000000000000006044820152606401610692565b86610e14828a61208a565b5f828152600160208190526040909120015461124e81611451565b6107fb83836116cb565b61126061174c565b610fba7feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec82611646565b61129261174c565b6001600160a01b03811661130e5760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f64647265737300000000000000000000000000000000000000000000000000006064820152608401610692565b610fba8161183b565b8360025410156113695760405162461bcd60e51b815260206004820152601a60248201527f496e73756666696369656e74206c6f636b656420616d6f756e740000000000006044820152606401610692565b604080517f4d9350fc2b7ed087de86125695c2672496684490c4d91402d6595d49d193f8b760208201526001600160a01b03871691810191909152606081018590526080810184905260a081018290525f906113c79060c001610a82565b90505f6113d482856117a5565b90506114007feca77a5bbbcf8baa6d8f93054311a3e6672f982247f67ba40cb896ecf1992aec826117c7565b61140b87878761145b565b8560025f82825461141c91906120d7565b9091555061142d9050836001611fd6565b6001600160a01b039097165f90815260056020526040902096909655505050505050565b610fba81336117c7565b815f811161149c5760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a5908185b5bdd5b9d60921b6044820152606401610692565b6001600160a01b0384166114f25760405162461bcd60e51b815260206004820152600f60248201527f496e76616c6964206164647265737300000000000000000000000000000000006044820152606401610692565b5f8281526006602052604090205460ff16156115505760405162461bcd60e51b815260206004820152600f60248201527f416c726561647920636c61696d656400000000000000000000000000000000006044820152606401610692565b60405163a9059cbb60e01b81526001600160a01b038581166004830152602482018590527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303815f875af11580156115bc573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906115e09190611fe9565b505f8281526006602052604090819020805460ff191660011790555182906001600160a01b038616907f34fcbac0073d7c3d388e51312faf357774904998eeb8fca628b9e6f65ee1cbf7906116389087815260200190565b60405180910390a350505050565b5f8281526001602090815260408083206001600160a01b038516845290915290205460ff16610888575f8281526001602081815260408084206001600160a01b0386168086529252808420805460ff19169093179092559051339285917f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d9190a45050565b5f8281526001602090815260408083206001600160a01b038516845290915290205460ff1615610888575f8281526001602090815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b5f546001600160a01b03163314610ca15760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152606401610692565b5f805f6117b285856118f7565b915091506117bf81611939565b509392505050565b5f8281526001602090815260408083206001600160a01b038516845290915290205460ff16610888576117f981611a9d565b611804836020611aaf565b60405160200161181592919061210c565b60408051601f198184030181529082905262461bcd60e51b82526106929160040161218c565b5f80546001600160a01b038381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b5f808212156118f35760405162461bcd60e51b815260206004820181905260248201527f53616665436173743a2076616c7565206d75737420626520706f7369746976656044820152606401610692565b5090565b5f80825160410361192b576020830151604084015160608501515f1a61191f87828585611c91565b94509450505050611932565b505f905060025b9250929050565b5f81600481111561194c5761194c6121be565b036119545750565b6001816004811115611968576119686121be565b036119b55760405162461bcd60e51b815260206004820152601860248201527f45434453413a20696e76616c6964207369676e617475726500000000000000006044820152606401610692565b60028160048111156119c9576119c96121be565b03611a165760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e677468006044820152606401610692565b6003816004811115611a2a57611a2a6121be565b03610fba5760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c60448201527f75650000000000000000000000000000000000000000000000000000000000006064820152608401610692565b60606106256001600160a01b03831660145b60605f611abd83600261208a565b611ac8906002611fd6565b67ffffffffffffffff811115611ae057611ae0611e53565b6040519080825280601f01601f191660200182016040528015611b0a576020820181803683370190505b5090507f3000000000000000000000000000000000000000000000000000000000000000815f81518110611b4057611b406121d2565b60200101906001600160f81b03191690815f1a9053507f780000000000000000000000000000000000000000000000000000000000000081600181518110611b8a57611b8a6121d2565b60200101906001600160f81b03191690815f1a9053505f611bac84600261208a565b611bb7906001611fd6565b90505b6001811115611c3b577f303132333435363738396162636465660000000000000000000000000000000085600f1660108110611bf857611bf86121d2565b1a60f81b828281518110611c0e57611c0e6121d2565b60200101906001600160f81b03191690815f1a90535060049490941c93611c34816121e6565b9050611bba565b508315611c8a5760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610692565b9392505050565b5f807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0831115611cc657505f90506003611d45565b604080515f8082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa158015611d17573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b038116611d3f575f60019250925050611d45565b91505f90505b94509492505050565b5f60208284031215611d5e575f80fd5b81357fffffffff0000000000000000000000000000000000000000000000000000000081168114611c8a575f80fd5b5f8060408385031215611d9e575f80fd5b50508035926020909101359150565b5f60208284031215611dbd575f80fd5b5035919050565b6001600160a01b0381168114610fba575f80fd5b5f805f60608486031215611dea575f80fd5b8335611df581611dc4565b95602085013595506040909401359392505050565b5f8060408385031215611e1b575f80fd5b823591506020830135611e2d81611dc4565b809150509250929050565b5f60208284031215611e48575f80fd5b8135611c8a81611dc4565b634e487b7160e01b5f52604160045260245ffd5b5f82601f830112611e76575f80fd5b813567ffffffffffffffff80821115611e9157611e91611e53565b604051601f8301601f19908116603f01168101908282118183101715611eb957611eb9611e53565b81604052838152866020858801011115611ed1575f80fd5b836020870160208301375f602085830101528094505050505092915050565b5f805f805f60a08688031215611f04575f80fd5b85359450602086013567ffffffffffffffff811115611f21575f80fd5b611f2d88828901611e67565b945050604086013561ffff81168114611f44575f80fd5b94979396509394606081013594506080013592915050565b5f805f805f60a08688031215611f70575f80fd5b8535611f7b81611dc4565b94506020860135935060408601359250606086013567ffffffffffffffff811115611fa4575f80fd5b611fb088828901611e67565b95989497509295608001359392505050565b634e487b7160e01b5f52601160045260245ffd5b8082018082111561062557610625611fc2565b5f60208284031215611ff9575f80fd5b81518015158114611c8a575f80fd5b5f6001820161201957612019611fc2565b5060010190565b805169ffffffffffffffffffff81168114612039575f80fd5b919050565b5f805f805f60a08688031215612052575f80fd5b61205b86612020565b945060208601519350604086015192506060860151915061207e60808701612020565b90509295509295909350565b808202811582820484141761062557610625611fc2565b5f826120bb57634e487b7160e01b5f52601260045260245ffd5b500490565b5f602082840312156120d0575f80fd5b5051919050565b8181038181111561062557610625611fc2565b5f5b838110156121045781810151838201526020016120ec565b50505f910152565b7f416363657373436f6e74726f6c3a206163636f756e742000000000000000000081525f83516121438160178501602088016120ea565b7f206973206d697373696e6720726f6c652000000000000000000000000000000060179184019182015283516121808160288401602088016120ea565b01602801949350505050565b602081525f82518060208401526121aa8160408501602087016120ea565b601f01601f19169190910160400192915050565b634e487b7160e01b5f52602160045260245ffd5b634e487b7160e01b5f52603260045260245ffd5b5f816121f4576121f4611fc2565b505f19019056fea2646970667358221220d15207d6a01d1e6f743f389e23b66446849a6d3d54b7c52f13dfc218dc22cbb664736f6c63430008150033";

type KannaDynamicPriceSaleConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: KannaDynamicPriceSaleConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class KannaDynamicPriceSale__factory extends ContractFactory {
  constructor(...args: KannaDynamicPriceSaleConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _knnToken: PromiseOrValue<string>,
    _priceAggregator: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<KannaDynamicPriceSale> {
    return super.deploy(
      _knnToken,
      _priceAggregator,
      overrides || {}
    ) as Promise<KannaDynamicPriceSale>;
  }
  override getDeployTransaction(
    _knnToken: PromiseOrValue<string>,
    _priceAggregator: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _knnToken,
      _priceAggregator,
      overrides || {}
    );
  }
  override attach(address: string): KannaDynamicPriceSale {
    return super.attach(address) as KannaDynamicPriceSale;
  }
  override connect(signer: Signer): KannaDynamicPriceSale__factory {
    return super.connect(signer) as KannaDynamicPriceSale__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): KannaDynamicPriceSaleInterface {
    return new utils.Interface(_abi) as KannaDynamicPriceSaleInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): KannaDynamicPriceSale {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as KannaDynamicPriceSale;
  }
}