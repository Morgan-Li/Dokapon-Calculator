import { CharacterState, DamageResult, DefenderReaction } from '../../types';
import {
  STRIKE_GUARD_MULTIPLIERS,
  RANDOM_MIN,
  RANDOM_MAX,
  STRIKE_TOTAL_MULTIPLIER,
} from './constants';
import { getProficiencyMultiplier } from '../reference/loader';

/**
 * Calculate Strike damage
 * Formula: ((AT+MG+SP) × 2.5 - (DF+MG+SP)) × Guard × Proficiency × Random
 */
export function calculateStrikeDamage(
  attacker: CharacterState,
  defender: CharacterState,
  defenderReaction: DefenderReaction
): DamageResult {
  // Calculate totals
  const attackerTotal = attacker.at + attacker.mg + attacker.sp;
  const defenderTotal = defender.df + defender.mg + defender.sp;

  // Base damage calculation
  const baseDamage = attackerTotal * STRIKE_TOTAL_MULTIPLIER - defenderTotal;

  // Get proficiency multiplier
  const proficiencyMultiplier = getProficiencyMultiplier(
    attacker.job,
    attacker.weapon
  );

  // Get guard multiplier
  const guardMultiplier = STRIKE_GUARD_MULTIPLIERS[defenderReaction];

  // Special case: Counter on Strike
  // Formula: (Defender * 4 + Attacker * 2) * Proficiency * Random
  // Where: Attacker = AttackerAT - AttackerDF
  //        Defender = DefenderAT + DefenderMG + DefenderSP
  // Note: Uses the ATTACKER's proficiency (the one who struck and is now getting hit)
  if (defenderReaction === 'Counter') {
    const attackerComponent = attacker.at - attacker.df;
    const defenderComponent = defender.at + defender.mg + defender.sp;
    const counterBaseDamage = defenderComponent * 4 + attackerComponent * 2;

    const minDamage = Math.max(
      0,
      Math.round(counterBaseDamage * proficiencyMultiplier * RANDOM_MIN)
    );
    const maxDamage = Math.max(
      0,
      Math.round(counterBaseDamage * proficiencyMultiplier * RANDOM_MAX)
    );

    return {
      action: 'Counter Returned',
      defenderReaction,
      minDamage,
      maxDamage,
      koMin: minDamage >= attacker.hpCurrent, // Check attacker HP (reversed)
      koMax: maxDamage >= attacker.hpCurrent,
      notes: 'Attacker takes damage',
    };
  }

  // Normal Strike calculation (only round the final value)
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
    action: 'Strike',
    defenderReaction,
    minDamage,
    maxDamage,
    koMin,
    koMax,
  };
}

/**
 * Calculate Strike damage for all defender reactions
 */
export function calculateAllStrikeDamage(
  attacker: CharacterState,
  defender: CharacterState
): DamageResult[] {
  const reactions: DefenderReaction[] = ['Defend', 'Magic Defend', 'Counter', 'None'];
  return reactions.map(reaction => calculateStrikeDamage(attacker, defender, reaction));
}
