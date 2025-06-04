import {
  ListHooks,
  KeystoneContextFromListTypeInfo,
} from '@keystone-6/core/types';

// ORIGINAL ITEM
// {
//   "id": "cl8hgti2g0159bq2vt0rhftra",
//   "node_id": 0,
//   "salary": 1300,
//   "years": 2,
//   "status": "active",
//   "teamId": "cl6e4l8g201225n2vv508t5ja",
//   "playerId": "cl6e4lb4406625n2v0yxplfoy",
//   "needsAttention": false,
//   "isFranchiseTagged": false
// }

// ITEM
// {
//   "id": "cl8hgti2g0159bq2vt0rhftra",
//   "node_id": 0,
//   "salary": 1300,
//   "years": 2,
//   "status": "active",
//   "teamId": "cl6e4l8g201225n2vv508t5ja",
//   "playerId": "cl6e4lb4406625n2v0yxplfoy",
//   "needsAttention": false,
//   "isFranchiseTagged": false
// }

interface ContractData {
  id: string;
  node_id: number;
  salary: number;
  years: number;
  status: "active" | "dts" | "ir" | "waived" | "rfa";
  teamId: string;
  playerId: string;
  needsAttention: boolean;
  isFranchiseTagged: boolean;
}

const getLogMessage = (oldContract: ContractData, newContract: ContractData) => {
  if (!oldContract) return 'New Contract';
  if (!newContract) return 'Contract Terminated';

  if (oldContract.status !== newContract.status) {
    const statusLabels = {
      active: 'Active Roster',
      dts: 'DTS',
      waived: 'Waivers',
      ir: 'Injured Reserve',
      rfa: 'Restricted Free Agent',
    }

    return `To ${statusLabels[newContract.status]}`
  }

  return 'See Details';
};

export const contractHooks: ListHooks<any> = {
  afterOperation: ({operation, originalItem, item, context }) => {
    // Dont make log messages in test runs.
    if (process.env.TESTING === 'true') return;

    const message = getLogMessage(
      (originalItem as unknown as ContractData),
      (item as unknown as ContractData)
    );

    const source = operation === 'create' ? item : originalItem;
    const contract = operation === 'delete' ? null : {
      connect: {
        id: source.id
      }
    }

    const user = context?.session?.itemId

    const data = {
      contract,
      player: source.playerId ? {connect: {id: source.playerId}} : null,
      team: source?.teamId ? {connect: {id: source.teamId}} : null,
      user: user ? {connect: {id: user || null}} : null,
      message,
      oldValues: originalItem,
      newValues: item,
    };

    context.sudo().query.ContractLogEntry.createOne({
      data,
    })
  },

  beforeOperation: async ({operation, item, context}) => {
    if (operation === 'delete') {
      // 1. Find all log entries referencing this contract
      const logEntries = await context.sudo().db.ContractLogEntry.findMany({
        where: { contract: { id: { equals: item.id } } },
      });

      // 2. Nullify the contract field for each
      await context.sudo().query.ContractLogEntry.updateMany({
        data: logEntries.map(entry => ({
          where: { id: entry.id },
          data: { contract: null }
        }))
      });
    }
  }
}

export const playerHooks: ListHooks<any> = {
  beforeOperation: async ({operation, item, context}) => {
    if (operation === 'delete') {
      // 1. Find all log entries referencing this player
      const logEntries = await context.sudo().db.ContractLogEntry.findMany({
        where: { player: { id: { equals: item.id } } },
      });

      // 2. Nullify the player field for each
      await context.sudo().query.ContractLogEntry.updateMany({
        data: logEntries.map(entry => ({
          where: { id: entry.id },
          data: { player: null }
        }))
      });
    }
  }
}

export const teamHooks: ListHooks<any> = {
  beforeOperation: async ({operation, item, context}) => {
    if (operation === 'delete') {
      // 1. Find all log entries referencing this team
      const logEntries = await context.sudo().db.ContractLogEntry.findMany({
        where: { team: { id: { equals: item.id } } },
      });

      // 2. Nullify the team field for each
      await context.sudo().query.ContractLogEntry.updateMany({
        data: logEntries.map(entry => ({
          where: { id: entry.id },
          data: { team: null }
        }))
      });
    }
  }
}

export const userHooks: ListHooks<any> = {
  resolveInput: async ({ resolvedData, context }) => {
    // If making first user, make them an admin.
    const count = await context.query.User.count();
    if (count === 0) {
      resolvedData.isAdmin = true;
    }
    return resolvedData;
  },
  beforeOperation: async ({operation, item, context}) => {
    if (operation === 'delete') {
      // 1. Find all log entries referencing this user
      const logEntries = await context.sudo().db.ContractLogEntry.findMany({
        where: { user: { id: { equals: item.id } } },
      });

      // 2. Nullify the user field for each
      await context.sudo().query.ContractLogEntry.updateMany({
        data: logEntries.map(entry => ({
          where: { id: entry.id },
          data: { user: null }
        }))
      });
    }
  }
}

