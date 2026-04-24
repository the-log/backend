import {
  ListHooks,
  BaseListTypeInfo,
} from '@keystone-6/core/types';

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

export const contractHooks: ListHooks<BaseListTypeInfo> = {
  afterOperation: async ({operation, originalItem, item, context }) => {

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

    await context.sudo().query.ContractLogEntry.createOne({
      data,
    })
  }
}
