import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet';

// Create a new client for the specified network
export const createSuiClient = (network: SuiNetwork = 'mainnet') => {
  const url = getFullnodeUrl(network);
  return new SuiClient({ url });
};

// Default client for backward compatibility
export const suiClient = createSuiClient('mainnet');

export const fetchTransactionBlock = async (digest: string, network: SuiNetwork = 'mainnet') => {
  const client = createSuiClient(network);
  return await client.getTransactionBlock({
    digest,
    options: {
      showInput: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    },
  });
};

export const getObject = async (objectId: string, network: SuiNetwork = 'mainnet') => {
  const client = createSuiClient(network);
  return await client.getObject({
    id: objectId,
    options: {
      showType: true,
      showOwner: true,
      showContent: true,
    },
  });
};
