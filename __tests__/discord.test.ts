import {
  postToDiscord,
  flushDiscord,
  setDiscordEnabled,
  isDiscordEnabled,
} from '../utils/discord';

const WEBHOOK = 'https://discord.test/api/webhooks/1/token';

const mockFetch = jest.fn();
const originalFetch = global.fetch;

const okResponse = () => ({ ok: true, status: 204, text: async () => '' });

const rateLimited = (retryAfter: number) => ({
  ok: false,
  status: 429,
  json: async () => ({ retry_after: retryAfter }),
  text: async () => 'rate limited',
});

describe('discord', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(okResponse());
    global.fetch = mockFetch as any;
    process.env.DISCORD_WEBHOOK_URL = WEBHOOK;
    setDiscordEnabled(true);
  });

  afterAll(async () => {
    await flushDiscord();
    global.fetch = originalFetch;
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  it('posts message content to the webhook', async () => {
    postToDiscord('a contract move');
    await flushDiscord();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(WEBHOOK);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      content: 'a contract move',
      allowed_mentions: { parse: [] },
    });
  });

  it('does nothing when no webhook is configured', async () => {
    delete process.env.DISCORD_WEBHOOK_URL;

    expect(isDiscordEnabled()).toBe(false);
    postToDiscord('a contract move');
    await flushDiscord();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does nothing while posting is disabled', async () => {
    setDiscordEnabled(false);

    expect(isDiscordEnabled()).toBe(false);
    postToDiscord('a bulk offseason change');
    await flushDiscord();

    expect(mockFetch).not.toHaveBeenCalled();

    setDiscordEnabled(true);
    postToDiscord('a contract move');
    await flushDiscord();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('sends queued messages one at a time, in order', async () => {
    const inFlight: string[] = [];
    mockFetch.mockImplementation(async (_url: string, init: any) => {
      inFlight.push(JSON.parse(init.body).content);
      expect(inFlight.length).toBe(1);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight.pop();
      return okResponse();
    });

    postToDiscord('first');
    postToDiscord('second');
    postToDiscord('third');
    await flushDiscord();

    expect(mockFetch.mock.calls.map(([, init]: any) => JSON.parse(init.body).content)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('retries once Discord reports a rate limit', async () => {
    mockFetch
      .mockResolvedValueOnce(rateLimited(0.01))
      .mockResolvedValueOnce(okResponse());

    postToDiscord('a contract move');
    await flushDiscord();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('swallows webhook failures so callers are unaffected', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });

    postToDiscord('a contract move');
    await expect(flushDiscord()).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('truncates content over the Discord limit', async () => {
    postToDiscord('x'.repeat(2500));
    await flushDiscord();

    const { content } = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(content).toHaveLength(2000);
    expect(content.endsWith('…')).toBe(true);
  });
});
