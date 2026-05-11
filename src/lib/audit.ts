import { keccak256, toBytes } from 'viem';

import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
} from 'thirdweb';

import { privateKeyToAccount } from 'thirdweb/wallets';
import { sepolia } from 'thirdweb/chains';

/* ====================================================== */

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

/* ====================================================== */

export async function writeAudit(reconstruction: any) {
  try {
    // 1. Create deterministic hash
    const hash = keccak256(
      toBytes(JSON.stringify(reconstruction))
    );

    // 2. Prepare transaction
    const transaction = prepareContractCall({
      contract,
      method: "logIncident",
      params: [hash],
    });

    // 3. Send transaction
    const result = await sendTransaction({
      account,
      transaction,
    });

    return {
      hash,
      txHash: result.transactionHash,
      explorer: `https://sepolia.etherscan.io/tx/${result.transactionHash}`,
    };

  } catch (err) {
    console.error('[audit]', err);
    throw err;
  }
}