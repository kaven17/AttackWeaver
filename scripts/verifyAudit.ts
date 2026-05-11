import { createPublicClient, http, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";
import { keccak256, toBytes } from "viem";
import stringify from "fast-json-stable-stringify";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// ─── Setup ─────────────────────────────────────────────

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL!),
});

const contractAddress = process.env.AUDIT_CONTRACT_ADDRESS!;

// ─── Load EXACT original reconstruction ───────────────

const reconstruction = JSON.parse(
  fs.readFileSync("reconstruction.json", "utf-8")
);

// ─── Event ABI ────────────────────────────────────────

const eventAbi = parseAbiItem(
  "event IncidentLogged(bytes32 indexed hash, uint256 timestamp)"
);

// ─── Verification ─────────────────────────────────────

async function verify() {
  console.log("=== Verifying On-Chain Audit ===");

  // 1. Deterministic hash (CRITICAL FIX)
  const localHash = keccak256(toBytes(stringify(reconstruction)));
  console.log("Local Hash:", localHash);

  // 2. Fetch logs (FULL RANGE)
  const logs = await client.getLogs({
    address: contractAddress as `0x${string}`,
    event: eventAbi,
    fromBlock: BigInt(0),
  });

  console.log("Logs fetched:", logs.length);

  if (logs.length === 0) {
    console.log("No events found");
    return;
  }

  // 3. Debug print all hashes
  logs.forEach((log, i) => {
    console.log(`Log[${i}] hash:`, log.args.hash);
  });

  // 4. Match hash
  const match = logs.find(
    (log) =>
      log.args.hash?.toLowerCase() === localHash.toLowerCase()
  );

  if (match) {
    console.log("VERIFIED");
    console.log("Tx:", match.transactionHash);
    console.log("Block:", match.blockNumber?.toString());
  } else {
    console.log("NOT VERIFIED");
  }
}

verify();