import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from '@vercel/postgres';
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'mysecret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Método não permitido.'})
    }

    const signature = req.headers['x-hub-signature-256'] as string
    const payload = JSON.stringify(req.body)

    //Verifica assinatura (simples HMAC-SHA256)
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex')

    if (signature !== expectedSignature) {
        console.warn('Webhook inválido: assinatura não confere.')
        return res.status(401).json({error: 'Assinatura inválida.'})
    }

    console.log('Webhook recebido com sucesso: ', req.body)

    // return res.status(200).json({status: 'Tudo certo.'})
    try {
        await sql`
        INSERT INTO webhook_events (payload)
        VALUES (${JSON.stringify(req.body)})
        `;
        res.status(200).json({ status: 'Tudo certo.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Falha ao salvar.' });
    }
}