import { CharacterState, DamageResult, DefenderReaction } from '../../types';
import {
  MAGIC_GUARD_MULTIPLIERS,
  RANDOM_MIN,
  RANDOM_MAX,
  MAGIC_MG_MULTIPLIER,
} from './constants';
import { getOffensivePower, getDefensivePower } from '../reference/loader';

/**
 * Calculate Offensive Magic damage
 * Formula: (Attacker MG × 2.4 - Defender MG) × OffensivePower × (1 - DefensivePower) × Guard × Random
 */
export function calculateMagicDamage(
  attacker: CharacterState,
  defender: CharacterState,
  defenderReaction: DefenderReaction
): DamageResult | null {
  // Check if attacker has offensive magic selected
  if (!attacker.offensiveMagic) {
    return null; // Can't calculate without offensive magic
  }

  // Get offensive power
  const offensivePower = getOffensivePower(attacker.offensiveMagic);
  if (offensivePower === 'unknown' || offensivePower === 0) {
    return null; // Can't calculate with unknown or utility spells (0 power)
  }

  // Get defensive power (defaults to 0 if not set)
  const defensivePower = defender.defensiveMagic
    ? getDefensivePower(defender.defensiveMagic)
    : 0;

  // Base damage calculation
  const baseDamage =
    (attacker.mg * MAGIC_MG_MULTIPLIER - defender.mg) * offensivePower;

  // Apply defensive magic reduction
  const afterDefensiveMagic = baseDamage * (1 - defensivePower);

  // Get guard multiplier
  const guardMultiplier = MAGIC_GUARD_MULTIPLIERS[defenderReaction];

  // Calculate min and max damage (only round the final value)
  const minDamage = Math.max(
    0,
    Math.round(afterDefensiveMagic * guardMultiplier * RANDOM_MIN)
  );
  const maxDamage = Math.max(
    0,
    Math.round(afterDefensiveMagic * guardMultiplier * RANDOM_MAX)
  );

  // Check KO
  const koMin = minDamage >= defender.hpCurrent;
  const koMax = maxDamage >= defender.hpCurrent;

  return {
    action: 'Magic',
    defenderReaction,
    minDamage,
    maxDamage,
    koMin,
    koMax,
  };
}

/**
 * Calculate Magic damage for all defender reactions
 * Returns null if offensive magic is not set or is unknown
 */
export function calculateAllMagicDamage(
  attacker: CharacterState,
  defender: CharacterState
): DamageResult[] | null {
  // Check if we can calculate magic damage
  if (!attacker.offensiveMagic) {
    return null;
  }

  const offensivePower = getOffensivePower(attacker.offensiveMagic);
  if (offensivePower === 'unknown' || offensivePower === 0) {
    return null;
  }

  const reactions: DefenderReaction[] = ['Defend', 'Magic Defend', 'Counter', 'None'];
  const results: DamageResult[] = [];

  for (const reaction of reactions) {
    const result = calculateMagicDamage(attacker, defender, reaction);
    if (result) {
      results.push(result);
    }
  }

  return results.length > 0 ? results : null;
}
