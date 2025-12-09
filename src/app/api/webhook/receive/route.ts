import { sql } from '@vercel/postgres';
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ''
console.log("WEBHOOK_SECRET", WEBHOOK_SECRET)

export async function POST(req: Request) {
    console.log('Recebendo webhook')
    
    const signature = req.headers.get('x-hub-signature-256') || ""
    const body = await req.json()
    const payload = JSON.stringify(body)

    // Verifica assinatura (simples HMAC-SHA256)
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex')

    if (signature !== expectedSignature) {
        console.warn('Webhook inválido: assinatura não confere.')
        return Response.json({ error: 'Assinatura inválida.' }, { status: 401 })
    }

    console.log('Webhook recebido com sucesso: ', body)

    try {
        await sql`
            INSERT INTO webhook_events (payload)
            VALUES (${payload})
        `
        return Response.json({ status: 'Tudo certo.' })
    } catch (err) {
        console.error(err)
        return Response.json({ error: 'Falha ao salvar.' }, { status: 500 })
    }
}