import { KeystoneDbAPI } from "@keystone-6/core/types";
import { fantasyApi, generalApi, LEAGUE_ID } from "./constants";
import { InjuryStatus, Player as FantasyPlayer, Rankings } from "../types/FantasyAPI";
import { GeneralPlayer } from "../types/GeneralAPI";
import { FullStats, Player as LOGPlayer, StatSet } from "../types/LogAPI";
import { positionMap, positionWeight, teamMap, statMap } from "./constants";

interface CombinedData {
  fantasy: FantasyPlayer,
  general: GeneralPlayer
}

export const fetchFantasyPlayerData = async (year: number) => {

  // Get all players in our league's fantasy system
  const {
    base,
    segments,
    player_query,
    opt
  } = fantasyApi;

  console.log(`🏈 Fetching Fantasy Players...`)
  const playerInfo = `${base}/${year}/${segments}/${LEAGUE_ID}?${player_query}`;
  // console.log(playerInfo);

  const { players } = (await fetch(playerInfo, opt).then(res => res.json()));
  console.log(`  🗓 Found ${players.length} fantasy players...`);

  return (players as FantasyPlayer[]);
}

export const fetchGeneralPlayerData = async (ids: number[]) => {
  // Get additional player data
  const {
    base: espn,
  } = generalApi;

  let curr = 0;
  const total = ids.length;
  const batchSize = 100;

  const generalData = [];

  while (ids.length) {
    const batch = await Promise.allSettled(
      ids.splice(0, batchSize)
      .map(id => (
        fetch(`${espn}/athletes/${id}`)
          .then(r => {

            return r.json()
          })
          .then((data: GeneralPlayer) => {
            curr++;
            process.stdout.write(`\r    ${curr}/${total}`);
            return data;
          })
      ))
    )


    await new Promise(resolve => setTimeout(resolve, 100));

    generalData.push(...batch);
  }
  process.stdout.write(`\n`);

  return (generalData.map(result => {
    if (result.status === "fulfilled") {
      return result.value
    } else {
      return {}
    }
  }) as GeneralPlayer[]);
}

export const shapePlayerData = (rawData: CombinedData[], year: number) => {

  const getMappedValue = (key: any, map: any) => (map[key] as any);

  const sortPlayers = (players: LOGPlayer[]) => {
    players.sort((a, b) => (b.pointsThisYearProj - a.pointsThisYearProj));

    const posRanks = new Map();

    players.forEach((player, i) => {
      let pos = player.position;

      if (["DT", "DE"].includes(pos)) {
        pos = "DL"
      }

      if (["CB", "S"].includes(pos)) {
        pos = "DB"
      }

      const posRank = posRanks.get(pos) || 1;
      posRanks.set(pos, posRank + 1)
      player.overallRankProj = i + 1;
      player.positionRankProj = posRank;
    });
  }

  const shapedData: LOGPlayer[] = [];

  for (const id in rawData) {
    if (Object.prototype.hasOwnProperty.call(rawData, id)) {

      const player = rawData[id];
      const { fantasy, general }: {fantasy: FantasyPlayer, general: GeneralPlayer} = player;

      if (fantasy && general) {
        const team = getMappedValue(fantasy.player.proTeamId, teamMap);
        const position = getMappedValue(fantasy.player.defaultPositionId, positionMap);
        const weight = getMappedValue(position, positionWeight);
        const isRookie = (general.draft?.year || general.debutYear) === year;

        // @ts-ignore
        const {0: rankings}: Rankings = fantasy.ratings || {0: {}};

        const fullStats = {
          lastYearActual: {},
          thisYearActual: {},
          thisYearProjected: {},
          thisWeekProjected: {}
        };

        for (const statSet of (fantasy.player.stats as StatSet[])) {
          const week = statSet.scoringPeriodId;
          const last = year - 1;

          switch (statSet.id) {
            case `00${last}`:
              statSet.title = "Last Year"
              fullStats.lastYearActual = statSet;
              break;

            case `00${year}`:
              statSet.title = "This Year"
              fullStats.thisYearActual = statSet;
              break;

            case `10${year}`:
              statSet.title = "This Year (Proj)"
              fullStats.thisYearProjected = statSet;
              break;

            case `11${year}${week}`:
              statSet.title = "This Week (Proj)"
              fullStats.thisWeekProjected = statSet;
              break;

            default:
              break;
          }
        }

        const shapedPlayer: LOGPlayer = {
          espn_id: fantasy.id,
          name: fantasy.player.fullName,
          age: general.age,
          height: general.height,
          weight: general.weight,
          debutYear: general.debutYear,
          draftYear: general.draft?.year || null,
          draftRound: general.draft?.round || null,
          draftSelection: general.draft?.selection || null,
          team,
          position,
          positionWeight: weight,
          isIrEligible: fantasy.player.injured,
          injuryStatus: general.status?.type as InjuryStatus,
          positionRank: rankings.positionalRanking || 9999,
          overallRank: rankings.totalRanking || 9999,
          positionRankProj: 9999,
          overallRankProj: 9999,
          seasonOutlook: fantasy.player.seasonOutlook,
          outlooksByWeek: fantasy.player.outlooks || {},
          isRookie,
          fullStats: fullStats as FullStats,
          // @ts-ignore
          pointsLastYear: fullStats?.lastYearActual?.appliedTotal || 0,
          // @ts-ignore
          pointsThisYear: fullStats?.thisYearActual?.appliedTotal || 0,
          // @ts-ignore
          pointsThisYearProj: fullStats?.thisYearProjected?.appliedTotal || 0,
          // @ts-ignore
          pointsThisWeekProj: fullStats?.thisWeekProjected?.appliedTotal || 0,
          splits: []
        }

        shapedData.push(shapedPlayer);
      }


    }
  }

  sortPlayers(shapedData);

  return shapedData;
}

export const updatePlayerData = async (year: number, db: KeystoneDbAPI<any>) => {
  const fantasyPlayerData = await fetchFantasyPlayerData(year);
  const ids = fantasyPlayerData.map(player => player.player.id);
  const generalPlayerData = await fetchGeneralPlayerData(ids);
  const existingPlayers = await db.Player.findMany();
  const existingIds = existingPlayers.map(player => player.espn_id);

  const rawPlayerData: any = {};

  for (const player of fantasyPlayerData) {
    rawPlayerData[`${player.id}`] = {
      fantasy: player
    }
  }

  for (const player of generalPlayerData) {
    const id = player.id;

    if (rawPlayerData[id]) {
      rawPlayerData[id].general = player;
    } else {
      rawPlayerData[id] = {
        general: player
      }
    }
  }

  const shapedPlayerData = shapePlayerData(rawPlayerData, year)

  const playersToUpdate = shapedPlayerData.filter(player => existingIds.includes(player.espn_id))
  const playersToInsert = shapedPlayerData.filter(player => !existingIds.includes(player.espn_id))

  await db.Player.updateMany({
    data: playersToUpdate.map(player => ({
      where: { espn_id: player.espn_id },
      data: player
    }))
  });

  await db.Player.createMany({
    data: playersToInsert
  })

  // await writeFile('./ShapedData.json', JSON.stringify(shapedPlayerData, null, 2))
}
