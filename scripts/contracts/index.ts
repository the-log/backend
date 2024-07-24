import { getContext } from '@keystone-6/core/context';
import config from '../../keystone';
import * as PrismaModule from '@prisma/client';
import { records } from './contracts';

const { db } = getContext(config, PrismaModule).sudo();

(async () => {
  // Delete all contracts.
  const contracts = await db.Contract.findMany();
  await db.Contract.deleteMany({
    where: contracts.map(c => ({
      id: c.id
    }))
  });


  // Delete all log entries
  const entries = await db.ContractLogEntry.findMany();
  await db.ContractLogEntry.deleteMany({
    where: entries.map(e => ({
      id: e.id
    }))
  });

  // Import contracts from JSON
  for (const contract of records) {
    await db.Contract.createOne({
      data: {
        salary: Math.round(contract.salary * 100),
        years: contract.years,
        status: contract.status,
        team: {
          connect: {
            espn_id: parseInt(contract.team)
          }
        },
        player: {
          connect: {
            espn_id: parseInt(contract.player)
          }
        }
      },
    })
  }
})()
