import {
  ListHooks,
  BaseListTypeInfo,
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

export const contractHooks: ListHooks<BaseListTypeInfo> = {
  afterOperation: ({operation, originalItem, item, context }) => {

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
      player: {connect: {id: source.playerId}},
      team: {connect: {id: source.teamId}},
      user: user ? {connect: {id: user}} : null,
      message,
      oldValues: originalItem,
      newValues: item,
    };

    context.sudo().query.ContractLogEntry.createOne({
      data,
    })
  }
}
