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
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// ─── Setup ─────────────────────────────────────────────

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

// ─── Execution ─────────────────────────────────────────

async function run() {
  console.log("=== Writing Audit ===");

  // FIXED payload (DO NOT CHANGE AFTER THIS)
  const reconstruction = {
    test: "attackweaver",
    fixed: true,
    id: "demo-001",
  };

  // Save EXACT payload
  fs.writeFileSync(
    "reconstruction.json",
    stringify(reconstruction, null, 2)
  );

  console.log("Saved reconstruction.json");

  // Deterministic hash
  const hash = keccak256(toBytes(stringify(reconstruction)));
  console.log("Hash:", hash);

  const tx = prepareContractCall({
    contract,
    method: "logIncident",
    params: [hash],
  });

  const result = await sendTransaction({
    account,
    transaction: tx,
  });

  console.log("SUCCESS");
  console.log("Tx:", result.transactionHash);
}

run();