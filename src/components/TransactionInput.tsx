'use client';

import { useState } from 'react';
import { SuiNetwork } from '@/utils/suiClient';

interface TransactionInputProps {
    onSearch: (digest: string, network: SuiNetwork) => void;
    loading: boolean;
}

export default function TransactionInput({ onSearch, loading }: TransactionInputProps) {
    const [digest, setDigest] = useState('');
    const [network, setNetwork] = useState<SuiNetwork>('mainnet');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        const cleanDigest = digest.trim();

        // Basic Base58 validation (Sui digests are typically Base58)
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanDigest)) {
            setLocalError('Invalid format. Sui digests are 32-44 characters in Base58.');
            return;
        }

        if (cleanDigest) {
            onSearch(cleanDigest, network);
        }
    };

    return (
        <div className="glass-card">
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Enter Sui Transaction Digest (e.g., 7vG...)"
                        value={digest}
                        onChange={(e) => {
                            setDigest(e.target.value);
                            if (localError) setLocalError(null);
                        }}
                        disabled={loading}
                        style={{ borderColor: localError ? 'var(--failure)' : undefined }}
                    />
                    <select
                        value={network}
                        onChange={(e) => setNetwork(e.target.value as SuiNetwork)}
                        disabled={loading}
                        className="network-select"
                    >
                        <option value="mainnet">Mainnet</option>
                        <option value="testnet">Testnet</option>
                        <option value="devnet">Devnet</option>
                    </select>
                    <button type="submit" disabled={loading || !digest.trim()}>
                        {loading ? 'Analyzing...' : 'Explain'}
                    </button>
                </div>
                {localError ? (
                    <p className="label" style={{ color: 'var(--failure)', marginBottom: 0 }}>
                        {localError}
                    </p>
                ) : (
                    <p className="label" style={{ marginBottom: 0 }}>
                        Enter any valid transaction digest to get a plain language explanation.
                    </p>
                )}
            </form>
        </div>
    );
}
