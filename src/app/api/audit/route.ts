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
import stringify from "fast-json-stable-stringify";
import fs from "fs";
import path from "path";

// ─── Thirdweb Setup ───────────────────────────────────

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
      name: "logIncident",
      stateMutability: "nonpayable",
      inputs: [{ name: "hash", type: "bytes32" }],
      outputs: [],
    },
  ],
});

// ─── Route ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { reconstruction } = await req.json();

    if (!reconstruction) {
      return NextResponse.json(
        { success: false, error: "Missing reconstruction" },
        { status: 400 }
      );
    }

    // ─── 1. Deterministic hash (CRITICAL FIX) ──────────
    const serialized = stringify(reconstruction);
    const hash = keccak256(toBytes(serialized));

    // ─── 2. Persist payload (for verification) ─────────
    const dir = path.join(process.cwd(), "audit-store");
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(reconstruction, null, 2));

    // ─── 3. Prepare transaction ───────────────────────
    const transaction = prepareContractCall({
      contract,
      method: "logIncident",
      params: [hash],
    });

    // ─── 4. Send transaction ──────────────────────────
    const result = await sendTransaction({
      account,
      transaction,
    });

    // ─── 5. Response ──────────────────────────────────
    return NextResponse.json({
      success: true,
      txHash: result.transactionHash,
      hash,
      explorer: `https://sepolia.etherscan.io/tx/${result.transactionHash}`,
      storedAt: filePath,
    });

  } catch (err) {
    console.error("[audit]", err);

    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}