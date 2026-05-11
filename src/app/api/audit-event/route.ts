import { NextRequest, NextResponse } from "next/server";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { sepolia } from "thirdweb/chains";
import { keccak256, toBytes } from "viem";

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

const account = privateKeyToAccount({
  client,
  privateKey: process.env.PRIVATE_KEY!,
});

const contract = getContract({
  client,
  chain: sepolia,
  address: process.env.AUDIT_CONTRACT_ADDRESS!,
  abi: [
    {
      type: "function",
      name: "logEvent",
      stateMutability: "nonpayable",
      inputs: [{ name: "hash", type: "bytes32" }],
      outputs: [],
    },
  ],
});

export async function POST(req: NextRequest) {
  try {
    const { event } = await req.json();

    const hash = keccak256(toBytes(JSON.stringify(event)));

    const tx = prepareContractCall({
      contract,
      method: "logEvent",
      params: [hash],
    });

    const result = await sendTransaction({
      account,
      transaction: tx,
    });

    return NextResponse.json({
      success: true,
      hash,
      txHash: result.transactionHash,
      explorer: `https://sepolia.etherscan.io/tx/${result.transactionHash}`,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 }
    );
  }
}