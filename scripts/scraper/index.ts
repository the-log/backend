import { getContext } from '@keystone-6/core/context';
import config from '../../keystone';
import * as PrismaModule from '@prisma/client'
import { updatePlayerData } from './players';
import { updateTeamData } from './teams';

(async () => {
  const { db } = getContext(config, PrismaModule).sudo();

  const settings: {season: number, phase: string} = await db.LeagueSetting.findOne({where:{id:1}});

  const {
    season,
    phase
  } = settings

  if (phase === "active") {
    await updateTeamData(season, db);
  } else {
    await updateTeamData(season - 1, db);
  }

  await updatePlayerData(season, db);

})()
