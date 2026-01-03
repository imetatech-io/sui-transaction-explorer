import { SuiTransactionBlockResponse } from '@mysten/sui/client';

export interface ParsedTransaction {
    digest: string;
    status: 'success' | 'failure';
    timestamp?: string;
    gasUsed: string;
    sender: string;
    senderName?: string | null;
    summary: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;
    securityInsights: string[];
    transfers: { recipient: string; amount: string; coinType: string }[];
    objects: {
        created: string[];
        mutated: string[];
        deleted: string[];
    };
    moveCalls: { package: string; module: string; function: string }[];
}

const PROTOCOLS: Record<string, string> = {
    '0x1ee0f96..': 'Cetus', // Common Cetus package prefix (shortened for logic)
    '0x714a63..': 'Cetus',
    '0x1eabed7..': 'Cetus',
    '0xbc3afb2..': 'Scallop',
    '0xbb45dcd..': 'Scallop',
    '0xdee9': 'DeepBook',
    '0x2c26c6..': 'Aftermath',
    '0x5ad425..': 'BlueMove',
    '0x3c2e68..': 'Turbos',
};

// Helper to find protocol by package ID
const getProtocolName = (pkgId: string) => {
    // Check if the package ID starts with any of our known prefixes
    for (const [prefix, name] of Object.entries(PROTOCOLS)) {
        if (pkgId.startsWith(prefix)) return name;
    }
    // Also check for common keywords in modules/functions if needed, 
    // but package ID is more reliable.
    return null;
};

export const parseTransaction = (
    tx: SuiTransactionBlockResponse,
    senderName?: string | null
): ParsedTransaction => {
    const { digest, effects, timestampMs, transaction } = tx;
    const status = effects?.status?.status === 'success' ? 'success' : 'failure';

    // Convert MIST to SUI (9 decimals)
    const totalGasMist = effects?.gasUsed
        ? BigInt(effects.gasUsed.computationCost) + BigInt(effects.gasUsed.storageCost) - BigInt(effects.gasUsed.storageRebate)
        : BigInt(0);
    const gasUsed = (Number(totalGasMist) / 1_000_000_000).toFixed(4);

    const sender = transaction?.data.sender || 'Unknown';

    const objectChanges = tx.objectChanges || [];
    const created = objectChanges.filter(c => c.type === 'created').map((c: any) => c.objectId);
    const mutated = objectChanges.filter(c => c.type === 'mutated').map((c: any) => c.objectId);
    const deleted = objectChanges.filter(c => c.type === 'deleted').map((c: any) => c.objectId);

    const objects = { created, mutated, deleted };

    // Move Calls extraction
    const moveCalls: { package: string; module: string; function: string }[] = [];
    if (transaction?.data?.transaction?.kind === 'ProgrammableTransaction') {
        transaction.data.transaction.transactions.forEach((tx_cmd: any) => {
            if (tx_cmd.MoveCall) {
                moveCalls.push({
                    package: tx_cmd.MoveCall.package,
                    module: tx_cmd.MoveCall.module,
                    function: tx_cmd.MoveCall.function,
                });
            }
        });
    }

    // Identify Protocol
    const protocolsFound = new Set<string>();
    moveCalls.forEach(call => {
        const name = getProtocolName(call.package);
        if (name) protocolsFound.add(name);
        // Fallback: check for keywords in module names
        if (call.module.includes('cetus')) protocolsFound.add('Cetus');
        if (call.module.includes('scallop')) protocolsFound.add('Scallop');
        if (call.module.includes('kriya')) protocolsFound.add('Kriya');
    });

    // Enhanced Plain Language Summary
    let summaryParts: string[] = [];

    // status and sender prefix
    const statusText = status === 'success' ? 'successfully' : 'unsuccessfully';
    const displayName = senderName || `${sender.slice(0, 6)}...`;
    summaryParts.push(`${displayName} ${statusText} performed a transaction.`);

    // 2. Detect Action Type
    const normalizedSender = sender.toLowerCase();

    // Filter balance changes, subtracting gas from SUI sent amount if sender is the one who paid
    const filteredBalanceChanges = (tx.balanceChanges || []).map(bc => {
        let isSenderOwner = false;
        if (typeof bc.owner === 'string') {
            isSenderOwner = bc.owner.toLowerCase() === normalizedSender;
        } else if (typeof bc.owner === 'object' && bc.owner !== null) {
            const ownerObj = bc.owner as any;
            if (ownerObj.AddressOwner) {
                isSenderOwner = ownerObj.AddressOwner.toLowerCase() === normalizedSender;
            }
        }

        if (bc.coinType.toLowerCase() === '0x2::sui::sui' && isSenderOwner) {
            const amount = BigInt(bc.amount);
            // If it's a negative amount (sending), it includes gas. Subtract gas to see "real" transfer.
            if (amount < BigInt(0)) {
                const realAmount = amount + totalGasMist;
                return { ...bc, amount: realAmount.toString() };
            }
        }
        return bc;
    });

    const sentChanges = filteredBalanceChanges.filter(bc => {
        const amt = BigInt(bc.amount);
        // Special Case: If it's SUI and the amount is very small after gas subtraction, ignore it
        if (bc.coinType.toLowerCase() === '0x2::sui::sui' && amt > BigInt(-10000) && amt < BigInt(10000)) {
            return false;
        }
        return amt < BigInt(-1000);
    });
    const receivedChanges = filteredBalanceChanges.filter(bc => {
        const amt = BigInt(bc.amount);
        return amt > BigInt(1000);
    });

    if (sentChanges.length > 0 && receivedChanges.length > 0) {
        // likely a Swap
        const firstSent = sentChanges[0];
        const firstRecv = receivedChanges[0];
        const sentSymbol = firstSent.coinType.split('::').pop();
        const sentAmount = (Math.abs(Number(firstSent.amount)) / 1_000_000_000).toFixed(2);
        const recvSymbol = firstRecv.coinType.split('::').pop();
        const recvAmount = (Math.abs(Number(firstRecv.amount)) / 1_000_000_000).toFixed(2);

        summaryParts.push(`This appears to be a swap of ${sentAmount} ${sentSymbol} for ${recvAmount} ${recvSymbol}.`);
    } else if (sentChanges.length > 0) {
        // Report all unique coins sent
        const uniqueSent = Array.from(new Set(sentChanges.map(c => c.coinType.split('::').pop())));
        if (uniqueSent.length === 1) {
            const sym = uniqueSent[0];
            // Sum all changes for this coin
            const total = sentChanges.reduce((acc, c) => acc + Math.abs(Number(c.amount)), 0);
            summaryParts.push(`Sent ${(total / 1_000_000_000).toFixed(4)} ${sym}.`);
        } else {
            summaryParts.push(`Sent ${uniqueSent.length} types of assets.`);
        }
    } else if (receivedChanges.length > 0) {
        const uniqueRecv = Array.from(new Set(receivedChanges.map(c => c.coinType.split('::').pop())));
        if (uniqueRecv.length === 1) {
            const sym = uniqueRecv[0];
            const total = receivedChanges.reduce((acc, c) => acc + Math.abs(Number(c.amount)), 0);
            summaryParts.push(`Received ${(total / 1_000_000_000).toFixed(4)} ${sym}.`);
        } else {
            summaryParts.push(`Received ${uniqueRecv.length} types of assets.`);
        }
    }

    // 3. Protocol mention
    if (protocolsFound.size > 0) {
        summaryParts.push(`Interacted with ${Array.from(protocolsFound).join(', ')} protocol(s).`);
    } else if (moveCalls.length > 0) {
        summaryParts.push(`Interacted with ${moveCalls.length} smart contract function(s).`);
    }

    // 4. Object metrics
    if (created.length > 0 || mutated.length > 0) {
        summaryParts.push(`${created.length} new objects created and ${mutated.length} updated.`);
    }

    const summary = summaryParts.join(' ');

    // 5. Security Intelligence (Risk Score)
    let riskScore = 0;
    const securityInsights: string[] = [];

    // Rule: Known Draining Pattern (multiple outputs, no inputs)
    if (sentChanges.length > 2 && receivedChanges.length === 0) {
        riskScore += 60;
        securityInsights.push('Unusual asset outflow: Multiple assets being sent without matching receipts.');
    }

    // Rule: High Complexity
    if (moveCalls.length > 5) {
        riskScore += 20;
        securityInsights.push('High complexity: Programmable transaction with many sequential commands.');
    }

    // Rule: Interaction with multiple new/unnamed protocols
    if (protocolsFound.size === 0 && moveCalls.length > 0) {
        riskScore += 10;
        securityInsights.push('Non-standard protocol: Interacting with smart contracts not in the verified directory.');
    }

    // Rule: Phishing packages (Placeholder for real list)
    const phishingPackages = ['0xphishing_package_id_here'];
    moveCalls.forEach(call => {
        if (phishingPackages.includes(call.package)) {
            riskScore += 100;
            securityInsights.push('CRITICAL: Interaction with a known malicious package/address.');
        }
    });

    const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

    return {
        digest,
        status,
        timestamp: timestampMs ? new Date(parseInt(timestampMs)).toLocaleString() : undefined,
        gasUsed,
        sender,
        senderName,
        summary,
        riskLevel,
        riskScore,
        securityInsights,
        transfers: [], // Legacy, summary covers it
        objects,
        moveCalls,
    };
};
