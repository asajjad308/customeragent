const GRAPH = 'https://graph.facebook.com/v20.0';

export async function sendFacebookMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string,
): Promise<void> {
  const res = await fetch(`${GRAPH}/me/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pageAccessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Facebook send failed: ${JSON.stringify(err)}`);
  }
}

// Instagram uses the same Graph API endpoint as Facebook Messenger
export async function sendInstagramMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string,
): Promise<void> {
  await sendFacebookMessage(pageAccessToken, recipientId, text);
}

export async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  text: string,
): Promise<void> {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WhatsApp send failed: ${JSON.stringify(err)}`);
  }
}
