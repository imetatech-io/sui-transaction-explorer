'use client';

import { useState, useEffect } from 'react';
import { getObject, SuiNetwork } from '@/utils/suiClient';

interface ObjectPeekProps {
    id: string;
    network: SuiNetwork;
    children: React.ReactNode;
}

export default function ObjectPeek({ id, network, children }: ObjectPeekProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (visible && !data && !loading) {
            setLoading(true);
            getObject(id, network)
                .then(res => setData(res.data))
                .catch(err => console.error('Peek error:', err))
                .finally(() => setLoading(false));
        }
    }, [visible, id, network, data, loading]);

    return (
        <span
            className="peek-trigger"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            style={{ position: 'relative', display: 'inline-block' }}
        >
            {children}
            {visible && (
                <div className="peek-popover glass-card">
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100px', height: '10px' }}></div>
                    ) : data ? (
                        <div className="peek-content">
                            <div className="label" style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>Object Details</div>
                            <div className="peek-row">
                                <span className="label">Type:</span>
                                <span className="value-mini">{data.type?.split('::').pop() || 'Unknown'}</span>
                            </div>
                            <div className="peek-row">
                                <span className="label">Owner:</span>
                                <span className="value-mini">
                                    {typeof data.owner === 'object' ? 'Address' : 'Immutable'}
                                </span>
                            </div>
                            <div className="peek-row" style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.25rem' }}>
                                <span className="value-mini" style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>{data.objectId.slice(0, 20)}...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="value-mini">Not found on {network}</div>
                    )}
                </div>
            )}
        </span>
    );
}
