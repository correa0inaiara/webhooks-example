import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'mysecret';

export async function POST(req: Request) {
  const { targetUrl, payload } = await req.json();

  if (!targetUrl || !payload) {
    return Response.json({ error: 'targetUrl e payload são obrigatórios' }, { status: 400 });
  }

  const payloadString = JSON.stringify(payload);
  const signature = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');

  console.log('signature', signature)
  console.log('payloadString', payloadString)

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
      return Response.json({ status: 'enviado' });
    } else {
      console.error('Erro ao enviar webhook:', response.statusText);
      return Response.json({ error: 'Falha ao enviar webhook' }, { status: 500 });
    }
  } catch (err) {
    console.error('Erro na requisição:', err);
    return Response.json({ error: 'Erro na requisição' }, { status: 500 });
  }
}