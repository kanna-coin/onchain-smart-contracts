/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type {
  KannaYield,
  KannaYieldInterface,
} from "../../contracts/KannaYield";

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
        name: "_feeRecipient",
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
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "returnAccount",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "Collect",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "finalAmount",
        type: "uint256",
      },
    ],
    name: "Fee",
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
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    name: "Reward",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    name: "RewardAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "subscriptionAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "finalAmount",
        type: "uint256",
      },
    ],
    name: "Subscription",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
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
    name: "FEE_BASIS_POINT",
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
        name: "reward",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "rewardsDuration",
        type: "uint256",
      },
    ],
    name: "addReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "holder",
        type: "address",
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
    inputs: [
      {
        internalType: "address",
        name: "holder",
        type: "address",
      },
    ],
    name: "calculateReward",
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
    name: "collectFees",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "earned",
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
    name: "endDate",
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
    name: "exit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRecipient",
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
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "fees",
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
        name: "",
        type: "address",
      },
    ],
    name: "holderRewardPerTokenPaid",
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
    inputs: [],
    name: "knnYieldPool",
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
    name: "knnYieldTotalFee",
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
    name: "lastPaymentEvent",
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
    name: "lastUpdateTime",
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
    name: "poolStartDate",
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
        name: "",
        type: "address",
      },
    ],
    name: "rawBalances",
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
    name: "reducedFee",
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
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardPerToken",
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
    name: "rewardPerTokenStored",
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
    name: "rewardRate",
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
        name: "",
        type: "address",
      },
    ],
    name: "started",
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
        name: "subscriptionAmount",
        type: "uint256",
      },
    ],
    name: "subscribe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "subscriptionFee",
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
        name: "",
        type: "uint256",
      },
    ],
    name: "tier",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60c06040526040518060a001604052806201518062ffffff16815260200162093a8062ffffff16815260200162278d0062ffffff168152602001624f1a0062ffffff1681526020016276a70062ffffff16815250600890600562000065929190620003d5565b503480156200007357600080fd5b5060405162002ed638038062002ed68339818101604052810190620000999190620004aa565b620000b9620000ad6200030960201b60201c565b6200031160201b60201c565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036200012b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620001229062000552565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036200019d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016200019490620005c4565b60405180910390fd5b8173ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff16815250508073ffffffffffffffffffffffffffffffffffffffff1660a08173ffffffffffffffffffffffffffffffffffffffff1681525050610bb8601160006008600060058110620002245762000223620005e6565b5b01548152602001908152602001600020819055506101f4601160006008600160058110620002575762000256620005e6565b5b015481526020019081526020016000208190555060fa601160006008600260058110620002895762000288620005e6565b5b01548152602001908152602001600020819055506096601160006008600360058110620002bb57620002ba620005e6565b5b01548152602001908152602001600020819055506064601160006008600460058110620002ed57620002ec620005e6565b5b0154815260200190815260200160002081905550505062000615565b600033905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b82600581019282156200040e579160200282015b828111156200040d578251829062ffffff16905591602001919060010190620003e9565b5b5090506200041d919062000421565b5090565b5b808211156200043c57600081600090555060010162000422565b5090565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620004728262000445565b9050919050565b620004848162000465565b81146200049057600080fd5b50565b600081519050620004a48162000479565b92915050565b60008060408385031215620004c457620004c362000440565b5b6000620004d48582860162000493565b9250506020620004e78582860162000493565b9150509250929050565b600082825260208201905092915050565b7f496e76616c696420746f6b656e20616464726573730000000000000000000000600082015250565b60006200053a601583620004f1565b9150620005478262000502565b602082019050919050565b600060208201905081810360008301526200056d816200052b565b9050919050565b7f496e76616c69642066656520726563697069656e742061646472657373000000600082015250565b6000620005ac601d83620004f1565b9150620005b98262000574565b602082019050919050565b60006020820190508181036000830152620005df816200059d565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60805160a05161286a6200066c60003960008181610f61015281816114eb015261156e0152600081816108460152818161092101528181610fb7015281816112fc015281816114af0152611cb7015261286a6000f3fe608060405234801561001057600080fd5b50600436106101d95760003560e01c806375c93bb911610104578063c8f33c91116100a2578063e9fad8ee11610071578063e9fad8ee14610560578063ee1df50d1461056a578063ee2dd59814610588578063f2fde38b146105a6576101d9565b8063c8f33c91146104d6578063cd3daf9d146104f4578063d82e396214610512578063df136d6514610542576101d9565b80639f1b6c93116100de5780639f1b6c931461045e578063c24a0f8b1461047c578063c5fbf02d1461049a578063c8796572146104b8576101d9565b806375c93bb9146104065780637b0a47ee146104225780638da5cb5b14610440576101d9565b80634a865b261161017c5780636dda34db1161014b5780636dda34db1461037e57806370a08231146103ae578063715018a6146103de578063728ae4b7146103e8576101d9565b80634a865b26146102e25780634acc79ed1461030057806367cff967146103305780636cf5a31f1461034e576101d9565b80630f574ba7116101b85780630f574ba71461025c57806312f9f52d146102785780632e1a7d4d146102a857806346904840146102c4576101d9565b80628cc262146101de5780630aa0a1751461020e5780630cfcfd1e1461022c575b600080fd5b6101f860048036038101906101f39190611feb565b6105c2565b6040516102059190612031565b60405180910390f35b6102166105da565b6040516102239190612031565b60405180910390f35b61024660048036038101906102419190611feb565b6105df565b6040516102539190612031565b60405180910390f35b61027660048036038101906102719190612078565b6105f7565b005b610292600480360381019061028d9190611feb565b610b6e565b60405161029f9190612031565b60405180910390f35b6102c260048036038101906102bd9190612078565b610b86565b005b6102cc610f5f565b6040516102d991906120b4565b60405180910390f35b6102ea610f83565b6040516102f79190612031565b60405180910390f35b61031a60048036038101906103159190612078565b610f9d565b6040516103279190612031565b60405180910390f35b610338610fb5565b604051610345919061212e565b60405180910390f35b61036860048036038101906103639190611feb565b610fd9565b6040516103759190612031565b60405180910390f35b61039860048036038101906103939190612078565b610ff1565b6040516103a59190612031565b60405180910390f35b6103c860048036038101906103c39190611feb565b61100c565b6040516103d59190612031565b60405180910390f35b6103e6611055565b005b6103f0611069565b6040516103fd9190612031565b60405180910390f35b610420600480360381019061041b9190612149565b61106f565b005b61042a611453565b6040516104379190612031565b60405180910390f35b610448611459565b60405161045591906120b4565b60405180910390f35b610466611482565b6040516104739190612031565b60405180910390f35b610484611488565b6040516104919190612031565b60405180910390f35b6104a261148e565b6040516104af9190612031565b60405180910390f35b6104c0611494565b6040516104cd9190612031565b60405180910390f35b6104de6115f8565b6040516104eb9190612031565b60405180910390f35b6104fc6115fe565b6040516105099190612031565b60405180910390f35b61052c60048036038101906105279190611feb565b611668565b6040516105399190612031565b60405180910390f35b61054a61176a565b6040516105579190612031565b60405180910390f35b610568611770565b005b610572611af0565b60405161057f9190612031565b60405180910390f35b610590611af6565b60405161059d9190612031565b60405180910390f35b6105c060048036038101906105bb9190611feb565b611afb565b005b600e6020528060005260406000206000915090505481565b601481565b60106020528060005260406000206000915090505481565b336106006115fe565b60078190555061060e610f83565b600681905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146107bc576000601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600354811080156106dc57506000600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054115b1561072857600354601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b61073182611668565b600e60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600754600d60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b4260045411610800576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107f7906121e6565b60405180910390fd5b60008211610843576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161083a90612252565b60405180910390fd5b817f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166370a08231336040518263ffffffff1660e01b815260040161089d91906120b4565b602060405180830381865afa1580156108ba573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108de9190612287565b101561091f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161091690612300565b60405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd3330856040518463ffffffff1660e01b815260040161097c93929190612320565b6020604051808303816000875af115801561099b573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109bf919061238f565b5081600160008282546109d291906123eb565b925050819055506000601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000811480610a2d575060035481105b80610a765750600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205483115b15610ac05742601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b82600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610b0f91906123eb565b925050819055503373ffffffffffffffffffffffffffffffffffffffff167f30c692cd4cbc8cdb1c2478f9202c4f0fe0a2bb212b22d3952c722de5abb62b2184601486604051610b619392919061241f565b60405180910390a2505050565b600f6020528060005260406000206000915090505481565b33610b8f6115fe565b600781905550610b9d610f83565b600681905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610d4b576000601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905060035481108015610c6b57506000600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054115b15610cb757600354601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b610cc082611668565b600e60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600754600d60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b60008211610d8e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d85906124a2565b60405180910390fd5b81600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610e10576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e0790612300565b60405180910390fd5b8160016000828254610e2291906124c2565b9250508190555081600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610e7891906124c2565b92505081905550610ec833600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054611b7e565b5042601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055503373ffffffffffffffffffffffffffffffffffffffff167f884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a942436483604051610f539190612031565b60405180910390a25050565b7f000000000000000000000000000000000000000000000000000000000000000081565b60006004544210610f9657600454610f98565b425b905090565b60116020528060005260406000206000915090505481565b7f000000000000000000000000000000000000000000000000000000000000000081565b600d6020528060005260406000206000915090505481565b6008816005811061100157600080fd5b016000915090505481565b6000600f60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b61105d611db2565b6110676000611e30565b565b60015481565b611077611db2565b60006110816115fe565b60078190555061108f610f83565b600681905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461123d576000601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506003548110801561115d57506000600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054115b156111a957600354601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b6111b282611668565b600e60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600754600d60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b600454824261124c91906123eb565b101561128d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161128490612568565b60405180910390fd5b60045442106112b45781836112a291906125b7565b600581905550426003819055506112f8565b6000426004546112c491906124c2565b90506000600554826112d691906125e8565b90508381866112e591906123eb565b6112ef91906125b7565b60058190555050505b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b815260040161135391906120b4565b602060405180830381865afa158015611370573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906113949190612287565b905082816113a291906125b7565b60055411156113e6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016113dd90612300565b60405180910390fd5b4260068190555082426113f991906123eb565b6004819055503373ffffffffffffffffffffffffffffffffffffffff167fac24935fd910bc682b5ccb1a07b718cadf8cf2f6d1404c4f3ddc3662dae40e29856040516114459190612031565b60405180910390a250505050565b60055481565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b60025481565b60045481565b61271081565b600061149e611db2565b6000600254905060006002819055507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb7f0000000000000000000000000000000000000000000000000000000000000000836040518363ffffffff1660e01b815260040161152892919061262a565b6020604051808303816000875af1158015611547573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061156b919061238f565b507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f1314fd112a381beea61539dbd21ec04afcff2662ac7d1b83273aade1f53d1b97836040516115e99190612031565b60405180910390a38091505090565b60065481565b60008060015403611613576007549050611665565b600154670de0b6b3a764000060055460065461162d610f83565b61163791906124c2565b61164191906125e8565b61164b91906125e8565b61165591906125b7565b60075461166291906123eb565b90505b90565b6000600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054670de0b6b3a7640000600d60008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546116fb6115fe565b61170591906124c2565b600f60008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461174f91906125e8565b61175991906125b7565b61176391906123eb565b9050919050565b60075481565b336117796115fe565b600781905550611787610f83565b600681905550600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614611935576000601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506003548110801561185557506000600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054115b156118a157600354601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b6118aa82611668565b600e60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550600754600d60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505b6000600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000821115611a25576000600f60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508160016000828254611a1d91906124c2565b925050819055505b6000811115611a82576000600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508082611a7f91906123eb565b91505b60008203611a91575050611aed565b611a9b3383611b7e565b503373ffffffffffffffffffffffffffffffffffffffff167f619caafabdd75649b302ba8419e48cccf64f37f1983ac4727cfb38b57703ffc982604051611ae29190612031565b60405180910390a250505b50565b60035481565b600a81565b611b03611db2565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603611b72576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611b69906126c5565b60405180910390fd5b611b7b81611e30565b50565b600080601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205411611c01576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611bf890612731565b60405180910390fd5b6000601060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205442611c4e91906124c2565b905060006014611c5d83611ef4565b611c6791906123eb565b905060006127108286611c7a91906125e8565b611c8491906125b7565b85611c8f91906124c2565b90508085611c9d91906124c2565b60026000828254611cae91906123eb565b925050819055507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb87836040518363ffffffff1660e01b8152600401611d1092919061262a565b6020604051808303816000875af1158015611d2f573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611d53919061238f565b508573ffffffffffffffffffffffffffffffffffffffff167f18fa25e22e0f1f39ef2130081363ba86a1259e598e669558683dabfc15bfe731868484604051611d9e9392919061241f565b60405180910390a281935050505092915050565b611dba611f80565b73ffffffffffffffffffffffffffffffffffffffff16611dd8611459565b73ffffffffffffffffffffffffffffffffffffffff1614611e2e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611e259061279d565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60006004544210611f0857600a9050611f7b565b60005b6005811015611f755760088160058110611f2857611f276127bd565b5b0154831015611f62576011600060088360058110611f4957611f486127bd565b5b0154815260200190815260200160002054915050611f7b565b8080611f6d906127ec565b915050611f0b565b50600a90505b919050565b600033905090565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611fb882611f8d565b9050919050565b611fc881611fad565b8114611fd357600080fd5b50565b600081359050611fe581611fbf565b92915050565b60006020828403121561200157612000611f88565b5b600061200f84828501611fd6565b91505092915050565b6000819050919050565b61202b81612018565b82525050565b60006020820190506120466000830184612022565b92915050565b61205581612018565b811461206057600080fd5b50565b6000813590506120728161204c565b92915050565b60006020828403121561208e5761208d611f88565b5b600061209c84828501612063565b91505092915050565b6120ae81611fad565b82525050565b60006020820190506120c960008301846120a5565b92915050565b6000819050919050565b60006120f46120ef6120ea84611f8d565b6120cf565b611f8d565b9050919050565b6000612106826120d9565b9050919050565b6000612118826120fb565b9050919050565b6121288161210d565b82525050565b6000602082019050612143600083018461211f565b92915050565b600080604083850312156121605761215f611f88565b5b600061216e85828601612063565b925050602061217f85828601612063565b9150509250929050565b600082825260208201905092915050565b7f4e6f2072657761726420617661696c61626c6500000000000000000000000000600082015250565b60006121d0601383612189565b91506121db8261219a565b602082019050919050565b600060208201905081810360008301526121ff816121c3565b9050919050565b7f43616e6e6f74207375627363726962652030204b4e4e00000000000000000000600082015250565b600061223c601683612189565b915061224782612206565b602082019050919050565b6000602082019050818103600083015261226b8161222f565b9050919050565b6000815190506122818161204c565b92915050565b60006020828403121561229d5761229c611f88565b5b60006122ab84828501612272565b91505092915050565b7f496e73756666696369656e742062616c616e6365000000000000000000000000600082015250565b60006122ea601483612189565b91506122f5826122b4565b602082019050919050565b60006020820190508181036000830152612319816122dd565b9050919050565b600060608201905061233560008301866120a5565b61234260208301856120a5565b61234f6040830184612022565b949350505050565b60008115159050919050565b61236c81612357565b811461237757600080fd5b50565b60008151905061238981612363565b92915050565b6000602082840312156123a5576123a4611f88565b5b60006123b38482850161237a565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006123f682612018565b915061240183612018565b9250828201905080821115612419576124186123bc565b5b92915050565b60006060820190506124346000830186612022565b6124416020830185612022565b61244e6040830184612022565b949350505050565b7f496e76616c696420616d6f756e74000000000000000000000000000000000000600082015250565b600061248c600e83612189565b915061249782612456565b602082019050919050565b600060208201905081810360008301526124bb8161247f565b9050919050565b60006124cd82612018565b91506124d883612018565b92508282039050818111156124f0576124ef6123bc565b5b92915050565b7f43616e6e6f74207265647563652063757272656e74207969656c6420636f6e7460008201527f72616374206475726174696f6e00000000000000000000000000000000000000602082015250565b6000612552602d83612189565b915061255d826124f6565b604082019050919050565b6000602082019050818103600083015261258181612545565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b60006125c282612018565b91506125cd83612018565b9250826125dd576125dc612588565b5b828204905092915050565b60006125f382612018565b91506125fe83612018565b925082820261260c81612018565b91508282048414831517612623576126226123bc565b5b5092915050565b600060408201905061263f60008301856120a5565b61264c6020830184612022565b9392505050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b60006126af602683612189565b91506126ba82612653565b604082019050919050565b600060208201905081810360008301526126de816126a2565b9050919050565b7f4e6f7420696e20706f6f6c000000000000000000000000000000000000000000600082015250565b600061271b600b83612189565b9150612726826126e5565b602082019050919050565b6000602082019050818103600083015261274a8161270e565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b6000612787602083612189565b915061279282612751565b602082019050919050565b600060208201905081810360008301526127b68161277a565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60006127f782612018565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203612829576128286123bc565b5b60018201905091905056fea264697066735822122016917fc56f435a31ede50d7ccd91da4dd0f66f96a02cde3568d29e1a2835255864736f6c63430008110033";

type KannaYieldConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: KannaYieldConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class KannaYield__factory extends ContractFactory {
  constructor(...args: KannaYieldConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _knnToken: PromiseOrValue<string>,
    _feeRecipient: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<KannaYield> {
    return super.deploy(
      _knnToken,
      _feeRecipient,
      overrides || {}
    ) as Promise<KannaYield>;
  }
  override getDeployTransaction(
    _knnToken: PromiseOrValue<string>,
    _feeRecipient: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _knnToken,
      _feeRecipient,
      overrides || {}
    );
  }
  override attach(address: string): KannaYield {
    return super.attach(address) as KannaYield;
  }
  override connect(signer: Signer): KannaYield__factory {
    return super.connect(signer) as KannaYield__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): KannaYieldInterface {
    return new utils.Interface(_abi) as KannaYieldInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): KannaYield {
    return new Contract(address, _abi, signerOrProvider) as KannaYield;
  }
}