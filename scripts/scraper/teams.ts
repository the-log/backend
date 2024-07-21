import { KeystoneDbAPI } from "@keystone-6/core/types";
import { fantasyApi, generalApi, LEAGUE_ID } from "./constants";
import { Team as FantasyTeam } from "../types/FantasyAPI";
import { Team as LOGTeam } from "../types/LogAPI";
import { positionMap, positionWeight, teamMap, statMap } from "./constants";



export const fetchTeamData = async (year: number) => {

  // Get all players in our league's fantasy system
  const {
    base,
    segments,
    team_query,
    opt
  } = fantasyApi;

  console.log(`🏟 Fetching Teams...`)
  const teamInfo = `${base}/${year}/${segments}/${LEAGUE_ID}?${team_query}`;
  // console.log(teamInfo);

  const { teams } = (await fetch(teamInfo, opt).then(res => res.json()));
  console.log(`  🗓 Found ${teams.length} teams...`);

  return (teams as FantasyTeam[]);
}

export const shapeTeamData = (rawData: FantasyTeam[]) => {

  const shapedData = [];

  for (const team of rawData) {
    const shapedTeam: LOGTeam = {
      espn_id: team.id,
      name: team.name,
      logo: team.logo,
      abbreviation: team.abbrev,
      projectedRank: team.currentProjectedRank,
      playoffSeed: team.playoffSeed,
      wins: team.record.overall.wins,
      losses: team.record.overall.losses,
      ties: team.record.overall.ties,
      pointsFor: team.record.overall.pointsFor,
      pointsAgainst: team.record.overall.pointsAgainst,
      percentage: team.record.overall.percentage,
      gamesBack: team.record.overall.gamesBack,
      streakLength: team.record.overall.streakLength,
      streakType: team.record.overall.streakType,
    }

    shapedData.push(shapedTeam);
  }

  return shapedData
}

export const updateTeamData = async (year: number, db: KeystoneDbAPI<any>) => {
  const rawData = await fetchTeamData(year);
  const existingTeams = await db.Team.findMany({
    skip: 0,
  });
  const existingIds = existingTeams.map(team => team.espn_id);

  const shapedData = shapeTeamData(rawData);

  const teamsToUpdate = shapedData.filter(team => existingIds.includes(team.espn_id))
  const teamsToInsert = shapedData.filter(team => !existingIds.includes(team.espn_id))

  await db.Team.updateMany({
    data: teamsToUpdate.map(team => ({
      where: { espn_id: team.espn_id },
      data: team
    }))
  });

  await db.Team.createMany({
    data: teamsToInsert
  })
}
