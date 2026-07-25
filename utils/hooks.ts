import {
  ListHooks,
  BaseListTypeInfo,
  KeystoneContext,
} from '@keystone-6/core/types';
import {
  buildContractEvent,
  formatEventForDiscord,
  ContractData,
  ContractParties,
  PlayerNames,
  TeamNames,
} from './contractMessages';
import { postToDiscord } from './discord';

const findPlayer = async (
  context: KeystoneContext,
  playerId: string | null | undefined
): Promise<PlayerNames | null> => {
  if (!playerId) return null;

  try {
    const player = await context.sudo().query.Player.findOne({
      where: { id: playerId },
      query: 'name position',
    });

    return player ? { name: player.name, position: player.position } : null;
  } catch (err) {
    console.error('contract log: player lookup failed', { playerId, err });
    return null;
  }
};

const findTeam = async (
  context: KeystoneContext,
  teamId: string | null | undefined
): Promise<TeamNames | null> => {
  if (!teamId) return null;

  try {
    const team = await context.sudo().query.Team.findOne({
      where: { id: teamId },
      query: 'name abbreviation',
    });

    return team ? { name: team.name, abbreviation: team.abbreviation } : null;
  } catch (err) {
    console.error('contract log: team lookup failed', { teamId, err });
    return null;
  }
};

/**
 * Resolves the names the log message needs. The previous team is only looked up
 * when the contract actually changed hands.
 */
const resolveParties = async (
  context: KeystoneContext,
  oldContract: ContractData | null,
  newContract: ContractData | null
): Promise<ContractParties> => {
  const current = newContract ?? oldContract;
  const teamChanged =
    Boolean(oldContract) &&
    Boolean(newContract) &&
    oldContract!.teamId !== newContract!.teamId;

  const [player, team, previousTeam] = await Promise.all([
    findPlayer(context, current?.playerId),
    findTeam(context, current?.teamId),
    teamChanged ? findTeam(context, oldContract!.teamId) : Promise.resolve(null),
  ]);

  return { player, team, previousTeam };
};

export const contractHooks: ListHooks<BaseListTypeInfo> = {
  afterOperation: async ({ operation, originalItem, item, context }) => {
    const oldContract = (originalItem as unknown as ContractData) ?? null;
    const newContract = (item as unknown as ContractData) ?? null;
    const source = newContract ?? oldContract;

    if (!source) return;

    const parties = await resolveParties(context, oldContract, newContract);
    const event = buildContractEvent(oldContract, newContract, parties);

    const contract = operation === 'delete' ? null : { connect: { id: source.id } };
    const user = context?.session?.itemId;

    const data = {
      contract,
      player: source.playerId ? { connect: { id: source.playerId } } : null,
      team: source.teamId ? { connect: { id: source.teamId } } : null,
      user: user ? { connect: { id: user } } : null,
      message: event.message,
      oldValues: originalItem,
      newValues: item,
    };

    await context.sudo().query.ContractLogEntry.createOne({ data });

    // Queued, not awaited: a slow webhook shouldn't hold up the mutation.
    postToDiscord(formatEventForDiscord(event));
  },
};
