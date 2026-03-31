export async function sendDiscordWebhook(input: { content: string; embeds?: any[] }) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true as const };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: input.content,
        embeds: input.embeds ?? []
      })
    });
    return { ok: res.ok, skipped: false as const, status: res.status };
  } catch (e) {
    return { ok: false, skipped: false as const, error: e instanceof Error ? e.message : 'unknown' };
  }
}

