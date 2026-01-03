import { Metadata } from 'next';
import TransactionDetails from '@/components/TransactionDetails';
import { fetchTransactionBlock, resolveSuiNS } from '@/utils/suiClient';
import { parseTransaction } from '@/utils/parser';
import Link from 'next/link';

interface Props {
    params: { digest: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const digest = params.digest;
    try {
        const tx = await fetchTransactionBlock(digest);
        const sender = tx.transaction?.data.sender;
        let senderName = null;
        if (sender) {
            senderName = await resolveSuiNS(sender);
        }
        const parsed = parseTransaction(tx, senderName);
        return {
            title: `Sui Transaction ${digest.slice(0, 8)}... | Explainer`,
            description: parsed.summary,
            openGraph: {
                title: `Decoded: Sui Transaction ${digest.slice(0, 8)}...`,
                description: parsed.summary,
                type: 'website',
            },
        };
    } catch (e) {
        return {
            title: 'Transaction Not Found',
            description: 'The requested Sui transaction could not be found.',
        };
    }
}

export default async function TransactionPage({ params }: Props) {
    const digest = params.digest;
    let data = null;
    let error = null;

    try {
        const tx = await fetchTransactionBlock(digest);
        const sender = tx.transaction?.data.sender;
        let senderName = null;
        if (sender) {
            senderName = await resolveSuiNS(sender);
        }
        data = parseTransaction(tx, senderName);
    } catch (err: any) {
        error = err.message || 'Failed to fetch transaction';
    }

    return (
        <main style={{ marginTop: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                    &larr; Back to Search
                </Link>
            </div>

            <h1>Transaction Details</h1>
            <p className="subtitle" style={{ wordBreak: 'break-all' }}>
                Digest: {digest}
            </p>

            {error && (
                <div className="glass-card" style={{ borderLeft: '4px solid var(--failure)' }}>
                    <p style={{ color: 'var(--failure)' }}>{error}</p>
                </div>
            )}

            {data && <TransactionDetails data={data} network="mainnet" />}
        </main>
    );
}
