import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import fetch from 'node-fetch';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'mysecret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { targetUrl, payload } = req.body;

  if (!targetUrl || !payload) {
    return res.status(400).json({ error: 'targetUrl e payload são obrigatórios' });
  }

  const payloadString = JSON.stringify(payload);
  const signature = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature,
      },
      body: payloadString,
    });

    if (response.ok) {
      console.log('Webhook enviado com sucesso');
      return res.status(200).json({ status: 'enviado' });
    } else {
      console.error('Erro ao enviar webhook:', response.statusText);
      return res.status(500).json({ error: 'Falha ao enviar webhook' });
    }
  } catch (err) {
    console.error('Erro na requisição:', err);
    return res.status(500).json({ error: 'Erro na requisição' });
  }
}