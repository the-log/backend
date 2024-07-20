import { getContext } from '@keystone-6/core/context';
import config from '../../keystone';
import * as PrismaModule from '@prisma/client'
import { Contract } from '../types/LogAPI';

const { db } = getContext(config, PrismaModule).sudo();

/**
 * Script to increment league year and do all the offseason stuff.
 */
(async () => {

// 1. Terminate all waived contracts
await deleteWaivedContracts();

// 2. Move all IR contracts back to active roster
await restoreInjuredReserve();

// 3. Decrement all active & dts contracts by 1 year
await decrementContractYears();

// 4. Change contract status for 0-year contracts to RFA
await setRFAContracts();

// 5. Increment all active contract salaries by 10%
await yearlyRaises();

// 6. Check dts contracts for top performers & 0yrs and mark contracts
await flagBadContracts();

// 7. Add rookie draft picks for 3 years in the future
await createFutureDraftPicks();

// 8. Email all users about league year cycling
})()

async function deleteWaivedContracts() {
  const contracts = await db.Contract.findMany({
    where: {
      status: {
        equals: "waived"
      }
    }
  });

  await db.Contract.deleteMany({
    where: contracts.map(({id}) => ({id}))
  })
}

async function restoreInjuredReserve() {
  const contracts = await db.Contract.findMany({
    where: {
      status: {
        equals: "ir"
      }
    }
  });

  await db.Contract.updateMany({
    data: contracts.map((contract: Contract) => ({
      where: {id: contract.id},
      data: {
        status: 'active'
      }
    }))
  })
}

async function decrementContractYears() {
  const contracts = await db.Contract.findMany({
    where: {
      status: {
        in: ["active", "dts"]
      }
    }
  });

  await db.Contract.updateMany({
    data: contracts.map((contract: Contract) => ({
      where: {id: contract.id},
      data: {
        years: Math.max(contract.years - 1, 0)
      }
    }))
  })
}

async function setRFAContracts() {
  const contracts = await db.Contract.findMany({
    where: {
      status: {
        equals: "active"
      },
      years: {
        equals: 0
      }
    }
  });

  await db.Contract.updateMany({
    data: contracts.map((contract: Contract) => ({
      where: {id: contract.id},
      data: {
        status: "rfa"
      }
    }))
  })
}

async function yearlyRaises() {
  const contracts = await db.Contract.findMany({
    where: {
      status: {
        equals: "active"
      }
    }
  });

  await db.Contract.updateMany({
    data: contracts.map((contract: Contract) => ({
      where: {id: contract.id},
      data: {
        salary: Math.round(contract.salary * 1.1)
      }
    }))
  })
}

async function flagBadContracts() {
  const contracts = await db.Contract.findMany({
    where: {
      status: {
        equals: "dts"
      }
    }
  });

  const thresholds: any = {
    QB: 32,
    RB: 40,
    WR: 50,
    TE: 20,
    K:  32,
    DL: 40,
    LB: 50,
    DB: 50
  }

  const badContracts = [];

  for (const contract of contracts) {

    // 0-year DTS contracts must be dropped/promoted
    if (contract.years < 1) {
      console.log('TOO SHORT!');

      badContracts.push(contract);
    } else {

      // Check the position rank of the contracted player
      const player = await db.Player.findOne({
        where: {
          id: contract.playerId
        }
      });

      const pos = player.position;

      // If player is equalto/better than threshold must be dropped/promoted
      if (player.positionRank <= thresholds[pos]) {
        console.log('TOO GOOD!');
        console.log(`${player.name}, #${player.positionRank} ${pos}`);
        badContracts.push(contract);
      }
    }
  }

  await db.Contract.updateMany({
    data: badContracts.map((contract: Contract) => ({
      where: {id: contract.id},
      data: {
        needsAttention: true
      }
    }))
  })
}

async function createFutureDraftPicks() {
  const year = (new Date()).getFullYear();
  const teams = await db.Team.findMany();

  const picks = []

  for (const team of teams) {
    for (let i = 1; i < 5; i++) {
      picks.push({
        year: year + 3,
        round: i,
        team: {
          connect: {
            id: team.id
          },
        },
        owner: {
          connect: {
            id: team.id
          },
        }
      });
    }
  }

  await db.DraftPick.createMany({
    data: picks
  });
}
