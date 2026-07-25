/**
 * Posts league activity to a Discord channel via an incoming webhook.
 *
 * DISCORD_WEBHOOK_URL is read at call time; keystone.ts loads the env file, and
 * an unset URL disables posting (which is what the test harness relies on).
 *
 * Posts are queued and sent one at a time so a burst (e.g. free agency awarding
 * a dozen contracts) can't trip Discord's per-webhook rate limit. Sending never
 * throws into the caller: a webhook outage should not fail a contract mutation.
 *
 * Bulk jobs that would spam the channel can turn posting off around their run
 * with setDiscordEnabled(false) / setDiscordEnabled(true).
 */

const MAX_ATTEMPTS = 3;
const MAX_RETRY_WAIT_MS = 10_000;
/** Discord rejects message content over 2000 characters. */
const MAX_CONTENT_LENGTH = 2000;

let enabled = true;
let queue: Promise<void> = Promise.resolve();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const webhookUrl = () => process.env.DISCORD_WEBHOOK_URL || '';

export const setDiscordEnabled = (value: boolean): void => {
  enabled = value;
};

/** True when posts will actually be delivered (not muted, webhook configured). */
export const isDiscordEnabled = (): boolean => enabled && Boolean(webhookUrl());

const truncate = (content: string): string =>
  content.length > MAX_CONTENT_LENGTH
    ? `${content.slice(0, MAX_CONTENT_LENGTH - 1)}…`
    : content;

const send = async (content: string): Promise<void> => {
  const url = webhookUrl();
  if (!url) return;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: truncate(content),
        // Player and team names should never ping anyone.
        allowed_mentions: { parse: [] },
      }),
    });

    if (response.ok) return;

    if (response.status === 429 && attempt < MAX_ATTEMPTS) {
      const body: any = await response.json().catch(() => ({}));
      const waitMs = Math.min((Number(body?.retry_after) || 1) * 1000, MAX_RETRY_WAIT_MS);
      await sleep(waitMs);
      continue;
    }

    const detail = await response.text().catch(() => '');
    throw new Error(`Discord webhook responded ${response.status}: ${detail}`);
  }
};

/**
 * Queues a message for delivery. Returns immediately; use flushDiscord() to wait
 * for the queue to drain (scripts should do this before exiting).
 */
export const postToDiscord = (content: string): void => {
  if (!enabled || !content) return;
  if (!webhookUrl()) return;

  queue = queue
    .then(() => send(content))
    .catch((err) => {
      console.error('discord post failed', { content, err });
    });
};

export const flushDiscord = (): Promise<void> => queue;
