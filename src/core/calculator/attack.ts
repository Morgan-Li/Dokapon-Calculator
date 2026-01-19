import { CharacterState, DamageResult, DefenderReaction } from '../../types';
import {
  ATTACK_GUARD_MULTIPLIERS,
  RANDOM_MIN,
  RANDOM_MAX,
  ATTACK_AT_MULTIPLIER,
  ATTACK_DF_MULTIPLIER,
} from './constants';
import { getProficiencyMultiplier } from '../reference/loader';

/**
 * Calculate Attack damage
 * Formula: (Attacker AT × 2.8 - Defender DF × 1.2) × Guard × Proficiency × Random
 */
export function calculateAttackDamage(
  attacker: CharacterState,
  defender: CharacterState,
  defenderReaction: DefenderReaction
): DamageResult {
  // Base damage calculation
  const baseDamage =
    attacker.at * ATTACK_AT_MULTIPLIER - defender.df * ATTACK_DF_MULTIPLIER;

  // Get proficiency multiplier
  const proficiencyMultiplier = getProficiencyMultiplier(
    attacker.job,
    attacker.weapon
  );

  // Get guard multiplier
  const guardMultiplier = ATTACK_GUARD_MULTIPLIERS[defenderReaction];

  // Calculate min and max damage (only round the final value)
  const minDamage = Math.max(
    0,
    Math.round(baseDamage * guardMultiplier * proficiencyMultiplier * RANDOM_MIN)
  );
  const maxDamage = Math.max(
    0,
    Math.round(baseDamage * guardMultiplier * proficiencyMultiplier * RANDOM_MAX)
  );

  // Check KO
  const koMin = minDamage >= defender.hpCurrent;
  const koMax = maxDamage >= defender.hpCurrent;

  return {
    action: 'Attack',
    defenderReaction,
    minDamage,
    maxDamage,
    koMin,
    koMax,
  };
}

/**
 * Calculate Attack damage for all defender reactions
 */
export function calculateAllAttackDamage(
  attacker: CharacterState,
  defender: CharacterState
): DamageResult[] {
  const reactions: DefenderReaction[] = ['Defend', 'Magic Defend', 'Counter', 'None'];
  return reactions.map(reaction => calculateAttackDamage(attacker, defender, reaction));
}
