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

export const resolveSuiNS = async (address: string, network: SuiNetwork = 'mainnet') => {
  const client = createSuiClient(network);
  try {
    const names = await client.resolveNameServiceNames({
      address,
      limit: 1,
    });
    return names.data[0] || null;
  } catch (error) {
    console.error('SuiNS Resolution Error:', error);
    return null;
  }
};

export const getSuiPrice = async (): Promise<number | null> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd');
    const data = await response.json();
    return data?.sui?.usd || null;
  } catch (error) {
    console.error('Error fetching SUI price:', error);
    return null;
  }
};
