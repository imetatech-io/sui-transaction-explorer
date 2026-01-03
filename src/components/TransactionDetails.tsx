'use client';

import { useState } from 'react';
import { ParsedTransaction } from '@/utils/parser';
import { SuiNetwork } from '@/utils/suiClient';
import ObjectPeek from './ObjectPeek';

interface TransactionDetailsProps {
    data: ParsedTransaction;
    network: SuiNetwork;
}

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {copied && <span className="copy-feedback">Copied!</span>}
            <button className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
        </div>
    );
};

const getExplorerUrl = (network: SuiNetwork, digest: string) => {
    const baseUrls: Record<SuiNetwork, string> = {
        mainnet: 'https://suiscan.xyz/mainnet/tx',
        testnet: 'https://suiscan.xyz/testnet/tx',
        devnet: 'https://suiscan.xyz/devnet/tx',
    };
    return `${baseUrls[network]}/${digest}`;
};

export default function TransactionDetails({ data, network }: TransactionDetailsProps) {
    const explorerUrl = getExplorerUrl(network, data.digest);

    return (
        <div className="detail-section">
            {/* Meta Card */}
            <div className="glass-card" style={{ marginBottom: '2rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="label" style={{ fontSize: '0.65rem' }}>Digest</span>
                    <CopyButton text={data.digest} />
                </div>
                <div className="meta-grid">
                    <div className="meta-item">
                        <span className="label">Status</span>
                        <span className={`status-badge ${data.status === 'success' ? 'status-success' : 'status-failure'}`}>
                            {data.status}
                        </span>
                    </div>
                    <div className="meta-item">
                        <span className="label">Gas Used</span>
                        <span className="value">{data.gasUsed} SUI</span>
                    </div>
                    <div className="meta-item">
                        <span className="label">Timestamp</span>
                        <span className="value">{data.timestamp || 'N/A'}</span>
                    </div>
                </div>

                <div className="meta-item" style={{ marginTop: '2rem' }}>
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Sender
                        <CopyButton text={data.sender} />
                    </span>
                    <span className="value" style={{ fontSize: '0.9rem' }}>{data.sender}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }} className="mobile-grid">
                <div>
                    <div className="section-title">Summary</div>
                    <div className="summary-box" style={{ minHeight: '120px' }}>
                        {data.summary}
                    </div>
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explorer-link"
                        style={{ marginTop: '1rem', display: 'inline-block' }}
                    >
                        View Full History on Sui Scan →
                    </a>
                </div>

                <div>
                    <div className="section-title">Security Intelligence</div>
                    <div className={`glass-card security-card risk-${data.riskLevel}`}>
                        <div className="risk-header">
                            <div className="risk-indicator"></div>
                            <span className="risk-label">{data.riskLevel.toUpperCase()} RISK</span>
                        </div>
                        <div className="risk-score">Score: {data.riskScore}/100</div>
                        <div className="insights-list">
                            {data.securityInsights.length > 0 ? (
                                data.securityInsights.map((insight, i) => (
                                    <div key={i} className="insight-item">• {insight}</div>
                                ))
                            ) : (
                                <div className="insight-item">• No significant security risks detected.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Visualization */}
            <div className="section-title" style={{ marginTop: '3rem' }}>Transaction Flow</div>
            <div className="glass-card visualization-box">
                <div className="flow-container">
                    <div className="flow-node">
                        <span className="label">Sender</span>
                        <div className="node-icon">👤</div>
                        <span className="value">{data.sender.slice(0, 8)}...</span>
                    </div>
                    <div className="flow-arrow">
                        <div className="arrow-line"></div>
                        <div className="arrow-head"></div>
                    </div>
                    <div className="flow-node">
                        <span className="label">Action</span>
                        <div className="node-icon">{data.moveCalls.length > 0 ? '⚙️' : '💸'}</div>
                        <span className="value">{data.moveCalls.length > 0 ? 'Smart Contract' : 'Transfer'}</span>
                    </div>
                    <div className="flow-arrow">
                        <div className="arrow-line"></div>
                        <div className="arrow-head"></div>
                    </div>
                    <div className="flow-node">
                        <span className="label">Result</span>
                        <div className="node-icon">📦</div>
                        <span className="value">{data.objects.created.length + data.objects.mutated.length} Changes</span>
                    </div>
                </div>
            </div>

            <div className="details-grid">
                <div>
                    <div className="section-title">Object Interactions (Hover to Peek)</div>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <span className="label" style={{ color: 'var(--success)' }}>Created ({data.objects.created.length})</span>
                            <div className="badge-list" style={{ marginTop: '0.5rem' }}>
                                {data.objects.created.slice(0, 10).map((id) => (
                                    <ObjectPeek key={id} id={id} network={network}>
                                        <span className="badge clickable">{id.slice(0, 10)}...</span>
                                    </ObjectPeek>
                                ))}
                                {data.objects.created.length > 10 && <span className="badge">+{data.objects.created.length - 10} more</span>}
                            </div>
                        </div>
                        <div>
                            <span className="label" style={{ color: 'var(--accent)' }}>Mutated ({data.objects.mutated.length})</span>
                            <div className="badge-list" style={{ marginTop: '0.5rem' }}>
                                {data.objects.mutated.slice(0, 10).map((id) => (
                                    <ObjectPeek key={id} id={id} network={network}>
                                        <span className="badge clickable">{id.slice(0, 10)}...</span>
                                    </ObjectPeek>
                                ))}
                                {data.objects.mutated.length > 10 && <span className="badge">+{data.objects.mutated.length - 10} more</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="section-title">Protocol Calls</div>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.moveCalls.length > 0 ? (
                            data.moveCalls.slice(0, 8).map((call, i) => (
                                <div key={i} className="move-call-item">
                                    <div className="label" style={{ fontSize: '0.65rem' }}>{call.module}</div>
                                    <div className="value-mini" style={{ color: 'var(--accent)', fontWeight: '600' }}>
                                        {call.function}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="value" style={{ color: 'var(--text-muted)' }}>No Move calls identified</span>
                        )}
                        {data.moveCalls.length > 8 && <span className="label" style={{ textAlign: 'center' }}>+ {data.moveCalls.length - 8} additional calls</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
