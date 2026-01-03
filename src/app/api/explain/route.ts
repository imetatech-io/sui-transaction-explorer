import { NextRequest, NextResponse } from 'next/server';
import { fetchTransactionBlock } from '@/utils/suiClient';
import { parseTransaction } from '@/utils/parser';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const digest = searchParams.get('digest');

    if (!digest) {
        return NextResponse.json({ error: 'Missing digest' }, { status: 400 });
    }

    try {
        const tx = await fetchTransactionBlock(digest);
        const parsed = parseTransaction(tx);
        return NextResponse.json(parsed);
    } catch (error: any) {
        const errorMsg = error.message || '';
        const errorStr = String(error) || '';
        const fullMessage = (errorMsg + ' ' + errorStr).toLowerCase();

        console.error('DEBUG: Sui Error:', { errorMsg, errorStr, code: error.code });

        let message = 'An unexpected error occurred while fetching the transaction.';

        if (fullMessage.includes('could not find')) {
            message = "Transaction not found. The digest might be incorrect, or the transaction may be on a different network (like Testnet).";
        } else if (error.code === -32602 || fullMessage.includes('invalidparams') || fullMessage.includes('invalid format')) {
            message = "The transaction digest format is invalid. Please double-check for typos or missing characters.";
        } else if (errorMsg) {
            message = errorMsg;
        } else if (errorStr && errorStr !== '[object Object]') {
            message = errorStr;
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
