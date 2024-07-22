import { getContext } from '@keystone-6/core/context';
import config from '../../keystone';
import * as PrismaModule from '@prisma/client'
import { updatePlayerData } from './players';
import { updateTeamData } from './teams';

(async () => {
  const { db } = getContext(config, PrismaModule).sudo();

  // Season advances July 1.
  const today = new Date();
  const season = today.getMonth() > 5 ? today.getFullYear() : today.getFullYear() - 1;
  await updateTeamData(season, db);
  await updatePlayerData(season, db);
})()
