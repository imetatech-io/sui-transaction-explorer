'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TransactionInput from '@/components/TransactionInput';
import TransactionDetails from '@/components/TransactionDetails';
import { ParsedTransaction, parseTransaction } from '@/utils/parser';
import { fetchTransactionBlock, SuiNetwork, resolveSuiNS } from '@/utils/suiClient';

function HomeContent() {
  const [data, setData] = useState<ParsedTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<SuiNetwork>('mainnet');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = async (digest: string, network: SuiNetwork) => {
    setLoading(true);
    setError(null);
    setData(null);
    setCurrentNetwork(network);

    // Update URL
    router.push(`/?digest=${digest}&network=${network}`, { scroll: false });

    try {
      const tx = await fetchTransactionBlock(digest, network);

      // Resolve SuiNS for sender
      const sender = tx.transaction?.data.sender;
      let senderName = null;
      if (sender) {
        senderName = await resolveSuiNS(sender, network);
      }

      const result = parseTransaction(tx, senderName);
      setData(result);
    } catch (err: any) {
      console.error('Search error:', err);
      let message = err.message || 'Failed to analyze transaction';

      // User-friendly mapping
      if (message.includes('Could not find')) {
        message = `Transaction not found on ${network}. Please verify the digest and network.`;
      } else if (message.includes('InvalidParams')) {
        message = "Invalid transaction digest format.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Sync state with URL on initial load and navigation
  useEffect(() => {
    const digest = searchParams.get('digest');
    const network = searchParams.get('network') as SuiNetwork | null;

    if (digest && !data && !loading) {
      handleSearch(digest, network || 'mainnet');
    }
  }, [searchParams]);

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1>Sui Transaction Explainer</h1>
        <p className="subtitle">
          Decode complex blockchain transactions into clear, actionable insights.
        </p>
      </div>

      <TransactionInput onSearch={handleSearch} loading={loading} />

      {loading && (
        <div className="glass-card skeleton-container" style={{ marginTop: '2rem' }}>
          <div className="skeleton skeleton-header"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text short"></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="skeleton skeleton-box"></div>
            <div className="skeleton skeleton-box"></div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ marginTop: '2rem', borderLeft: '4px solid var(--failure)', background: 'rgba(255, 69, 69, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <div className="label" style={{ color: 'var(--failure)', marginBottom: '0.25rem' }}>Search Error</div>
              <p style={{ color: 'white', opacity: 0.9 }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div style={{ marginTop: '2rem' }}>
          <TransactionDetails data={data} network={currentNetwork} />
          <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '4rem' }}>
            <button
              onClick={() => { setData(null); setError(null); router.push('/', { scroll: false }); }}
              style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            >
              Explain Another Transaction
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
