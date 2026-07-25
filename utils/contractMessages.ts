/**
 * Builds human-readable descriptions of contract changes.
 *
 * These are pure functions so both the ContractLogEntry `message` field and the
 * Discord post can be rendered from the same description without either side
 * having to re-read the raw before/after JSON.
 */

export type ContractStatus = 'active' | 'dts' | 'ir' | 'waived' | 'rfa';

export interface ContractData {
  id: string;
  salary: number;
  years: number;
  status: ContractStatus;
  teamId: string | null;
  playerId: string | null;
  needsAttention?: boolean;
  isFranchiseTagged?: boolean;
}

export interface PlayerNames {
  name: string | null;
  position: string | null;
}

export interface TeamNames {
  name: string | null;
  abbreviation: string | null;
}

export interface ContractParties {
  player: PlayerNames | null;
  team: TeamNames | null;
  previousTeam: TeamNames | null;
}

export type ContractEventType =
  | 'signed'
  | 'terminated'
  | 'team_change'
  | 'status_change'
  | 'franchise_tag'
  | 'salary_change'
  | 'term_change'
  | 'flagged'
  | 'updated';

export interface ContractEvent {
  type: ContractEventType;
  message: string;
}

export const statusLabels: Record<ContractStatus, string> = {
  active: 'Active Roster',
  dts: 'DTS',
  ir: 'Injured Reserve',
  waived: 'Waivers',
  rfa: 'Restricted Free Agent',
};

/** Salaries are stored in cents, matching the frontend's formatMoney(). */
export const formatMoney = (cents: number | null | undefined): string => {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const formatYears = (years: number | null | undefined): string => {
  const value = typeof years === 'number' && !Number.isNaN(years) ? years : 0;
  return `${value} ${value === 1 ? 'yr' : 'yrs'}`;
};

const statusLabel = (status: ContractStatus | null | undefined): string =>
  (status && statusLabels[status]) || 'Unknown Status';

/** Phrasing for arriving at a status, e.g. "placed on Injured Reserve". */
const statusChangeClause = (status: ContractStatus | null | undefined): string => {
  switch (status) {
    case 'active':
      return 'activated to the Active Roster';
    case 'dts':
      return 'moved to DTS';
    case 'ir':
      return 'placed on Injured Reserve';
    case 'waived':
      return 'placed on Waivers';
    case 'rfa':
      return 'became a Restricted Free Agent';
    default:
      return `moved to ${statusLabel(status)}`;
  }
};

const teamLabel = (team: TeamNames | null | undefined): string =>
  team?.name || team?.abbreviation || 'an unknown team';

const playerLabel = (player: PlayerNames | null | undefined): string => {
  const name = player?.name || 'An unknown player';
  return player?.position ? `${name} (${player.position})` : name;
};

/** e.g. "Justin Jefferson (WR, Bills)" */
const playerAndTeamLabel = (
  player: PlayerNames | null | undefined,
  team: TeamNames | null | undefined
): string => {
  const name = player?.name || 'An unknown player';
  const details = [player?.position, team?.name || team?.abbreviation].filter(Boolean);

  return details.length ? `${name} (${details.join(', ')})` : name;
};

/** e.g. "$45.00 / 3 yrs" */
export const contractTerms = (contract: ContractData): string =>
  `${formatMoney(contract.salary)} / ${formatYears(contract.years)}`;

const signedMessage = (contract: ContractData, parties: ContractParties): string => {
  const terms = contractTerms(contract);
  const suffix = contract.status === 'active' ? '' : ` (${statusLabel(contract.status)})`;

  if (!parties.team) {
    return `${playerLabel(parties.player)} signed a ${terms} contract${suffix}`;
  }

  return `${teamLabel(parties.team)} signed ${playerLabel(parties.player)} to a ${terms} contract${suffix}`;
};

const terminatedMessage = (contract: ContractData, parties: ContractParties): string => {
  const terms = contractTerms(contract);

  if (!parties.team) {
    return `${playerLabel(parties.player)} had their ${terms} contract terminated`;
  }

  return `${teamLabel(parties.team)} terminated ${playerLabel(parties.player)}'s ${terms} contract`;
};

interface Change {
  type: ContractEventType;
  clause: string;
}

const collectChanges = (
  oldContract: ContractData,
  newContract: ContractData,
  parties: ContractParties
): Change[] => {
  const changes: Change[] = [];

  if (oldContract.teamId !== newContract.teamId) {
    changes.push({
      type: 'team_change',
      clause: `moved from ${teamLabel(parties.previousTeam)} to ${teamLabel(parties.team)}`,
    });
  }

  if (oldContract.status !== newContract.status) {
    changes.push({
      type: 'status_change',
      clause: `${statusChangeClause(newContract.status)} (from ${statusLabel(oldContract.status)})`,
    });
  }

  if (Boolean(oldContract.isFranchiseTagged) !== Boolean(newContract.isFranchiseTagged)) {
    changes.push({
      type: 'franchise_tag',
      clause: newContract.isFranchiseTagged ? 'franchise tagged' : 'no longer franchise tagged',
    });
  }

  if (oldContract.salary !== newContract.salary) {
    const direction = newContract.salary > oldContract.salary ? 'raised' : 'reduced';
    changes.push({
      type: 'salary_change',
      clause: `salary ${direction} from ${formatMoney(oldContract.salary)} to ${formatMoney(newContract.salary)}`,
    });
  }

  if (oldContract.years !== newContract.years) {
    changes.push({
      type: 'term_change',
      clause: `contract length changed from ${formatYears(oldContract.years)} to ${formatYears(newContract.years)}`,
    });
  }

  if (Boolean(oldContract.needsAttention) !== Boolean(newContract.needsAttention)) {
    changes.push({
      type: 'flagged',
      clause: newContract.needsAttention
        ? 'flagged as needing attention'
        : 'needs-attention flag cleared',
    });
  }

  return changes;
};

const updatedMessage = (
  oldContract: ContractData,
  newContract: ContractData,
  parties: ContractParties
): ContractEvent => {
  const changes = collectChanges(oldContract, newContract, parties);

  if (!changes.length) {
    return {
      type: 'updated',
      message: `${playerAndTeamLabel(parties.player, parties.team)} contract was saved with no field changes`,
    };
  }

  const clauses = changes.map(({ clause }) => clause).join('; ');

  // A team change already names both teams, so don't repeat the new team up front.
  const subject =
    changes[0].type === 'team_change'
      ? playerLabel(parties.player)
      : playerAndTeamLabel(parties.player, parties.team);

  // Roster moves don't state the money, so spell out where the contract stands.
  const statesTerms = changes.some(
    ({ type }) => type === 'salary_change' || type === 'term_change'
  );
  const terms = statesTerms ? '' : `. Contract: ${contractTerms(newContract)}`;

  return {
    type: changes[0].type,
    message: `${subject}: ${clauses}${terms}`,
  };
};

/**
 * Describes what happened to a contract. Pass the before/after items from the
 * Keystone hook; `oldContract` is null on create, `newContract` is null on delete.
 */
export const buildContractEvent = (
  oldContract: ContractData | null,
  newContract: ContractData | null,
  parties: ContractParties
): ContractEvent => {
  if (!oldContract && newContract) {
    return { type: 'signed', message: signedMessage(newContract, parties) };
  }

  if (oldContract && !newContract) {
    return { type: 'terminated', message: terminatedMessage(oldContract, parties) };
  }

  if (oldContract && newContract) {
    return updatedMessage(oldContract, newContract, parties);
  }

  return { type: 'updated', message: 'Contract changed' };
};

const eventEmoji: Record<ContractEventType, string> = {
  signed: '✍️',
  terminated: '✂️',
  team_change: '🔄',
  status_change: '🔀',
  franchise_tag: '🏷️',
  salary_change: '💰',
  term_change: '📅',
  flagged: '⚠️',
  updated: '📝',
};

export const formatEventForDiscord = ({ type, message }: ContractEvent): string =>
  `${eventEmoji[type]} ${message}`;
