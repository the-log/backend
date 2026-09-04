import { getContext } from '@keystone-6/core/context';
import config from '../../keystone';
import * as PrismaModule from '@prisma/client';
import { scheduleApi } from '../scraper/constants';

const { db } = getContext(config, PrismaModule).sudo();

const ET = 'America/New_York';

// League rules, in one place so a change is a one-line edit:
//
//   - Week 1 bids are due the Monday before the opener, end of day. (The
//     opener is not always a Thursday — 2026 starts on a Wednesday.)
//   - Every other week's bids are due at 6pm ET on the day of that week's
//     first game, which is normally the Thursday nighter.
//   - Week 18 has no Thursday game and lands after the fantasy season, so it
//     gets no deadline at all.
const FIRST_DEADLINE = { hour: 23, minute: 59, second: 59 };
const WEEKLY_DEADLINE = { hour: 18, minute: 0, second: 0 };
const LAST_WEEK = 17;

// Weeks whose first game falls outside this window get a warning so the
// schedule quirk is a decision instead of a surprise.
const NORMAL_KICKOFF = { weekday: 'Thu', earliest: 20 * 60, latest: 20 * 60 + 30 };

interface WeekOpener {
  week: number;
  kickoff: Date;
}

/**
 * Calendar fields for an instant, as read in Eastern time.
 */
function etParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ET,
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );

  return {
    weekday: parts.weekday,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // hour24 reads "24" at midnight in this locale.
    minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
  };
}

/**
 * Epoch ms for a wall-clock time in Eastern, DST included. Guess an offset,
 * ask what offset actually applies at that instant, then use it. Only breaks
 * within an hour of a DST transition, and no deadline lands near 2am.
 */
function etTimestamp(
  { year, month, day }: { year: number; month: number; day: number },
  { hour, minute, second }: { hour: number; minute: number; second: number }
) {
  const guess = Date.UTC(year, month - 1, day, hour + 4, minute, second);
  const shortOffset = new Intl.DateTimeFormat('en-US', { timeZone: ET, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(guess))
    .find(({ type }) => type === 'timeZoneName')!.value; // e.g. "GMT-4"

  return Date.UTC(year, month - 1, day, hour - Number(shortOffset.slice(3)), minute, second);
}

/**
 * Kickoff of the earliest game in each regular season week.
 */
export async function fetchWeekOpeners(season: number, weeks: number): Promise<WeekOpener[]> {
  const openers = [];

  for (let week = 1; week <= weeks; week++) {
    const url = `${scheduleApi.base}?dates=${season}&seasontype=2&week=${week}`;
    const { events } = await fetch(url).then((res) => res.json());

    if (!events?.length) {
      throw new Error(`No games found for ${season} week ${week} (${url})`);
    }

    const kickoff = events
      .map(({ date }: { date: string }) => new Date(date))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];

    openers.push({ week, kickoff });
  }

  return openers;
}

/**
 * Turn week openers into the bid_deadlines array. Exported separately from the
 * fetch so the rules can be tested without hitting ESPN.
 */
export function buildDeadlines(openers: WeekOpener[]) {
  const deadlines = [];

  for (const { week, kickoff } of openers) {
    if (week > LAST_WEEK) continue;

    const opener = etParts(kickoff);

    if (
      opener.weekday !== NORMAL_KICKOFF.weekday ||
      opener.minutes < NORMAL_KICKOFF.earliest ||
      opener.minutes > NORMAL_KICKOFF.latest
    ) {
      console.warn(
        `  ⚠️  Week ${week} opens ${opener.weekday} ${opener.month}/${opener.day} — not the usual Thursday night. Confirm the deadline below.`
      );
    }

    if (week === 1) {
      // Back up to the Monday before the opener.
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysBack = (weekdays.indexOf(opener.weekday) - 1 + 7) % 7 || 7;
      const monday = etParts(new Date(kickoff.getTime() - daysBack * 24 * 60 * 60 * 1000));

      deadlines.push(etTimestamp(monday, FIRST_DEADLINE));
    } else {
      deadlines.push(etTimestamp(opener, WEEKLY_DEADLINE));
    }
  }

  return deadlines;
}

export async function createBidDeadlines(seasonOverride?: number) {
  const season = seasonOverride ?? (await db.LeagueSetting.findOne({ where: { id: 1 } })).season;

  console.log(`  🗓 Building bid deadlines for the ${season} season...`);

  const openers = await fetchWeekOpeners(season, 18);
  const deadlines = buildDeadlines(openers);

  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: ET,
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  deadlines.forEach((ts, i) => console.log(`    Week ${i + 1}: ${format.format(new Date(ts))}`));

  await db.LeagueSetting.updateOne({
    where: { id: 1 },
    data: {
      bid_deadlines: deadlines,
    },
  });

  return deadlines;
}

if (require.main === module) {
  (async () => {
    await createBidDeadlines(Number(process.argv[2]) || undefined);
  })();
}
