import { DefenderReaction } from '../../types';

// Attack damage formula: (AT × 2.8 - DF × 1.2) × Guard × Proficiency × Random
export const ATTACK_GUARD_MULTIPLIERS: Record<DefenderReaction, number> = {
  'Defend': 1.0,
  'Magic Defend': 1.4,
  'Counter': 1.8,
  'None': 2.0,
};

// Strike damage formula: ((AT+MG+SP) × 2.5 - (DF+MG+SP)) × Guard × Proficiency × Random
export const STRIKE_GUARD_MULTIPLIERS: Record<DefenderReaction, number> = {
  'Defend': 1.6,
  'Magic Defend': 1.7,
  'Counter': 0, // Special calculation (attacker takes damage)
  'None': 2.5,
};

// Magic damage formula: (MG × 2.4 - MG) × OffensivePower × (1 - DefensivePower) × Guard × Random
export const MAGIC_GUARD_MULTIPLIERS: Record<DefenderReaction, number> = {
  'Defend': 1.4,
  'Magic Defend': 1.0,
  'Counter': 1.8,
  'None': 2.0,
};

// Random damage range (either 95% or 105%)
export const RANDOM_MIN = 0.95;
export const RANDOM_MAX = 1.05;

// Proficiency bonus (30% more damage if job matches weapon)
export const PROFICIENCY_MULTIPLIER = 1.3;
export const NO_PROFICIENCY_MULTIPLIER = 1.0;

// Formula-specific multipliers
export const ATTACK_AT_MULTIPLIER = 2.8;
export const ATTACK_DF_MULTIPLIER = 1.2;
export const STRIKE_TOTAL_MULTIPLIER = 2.5;
export const MAGIC_MG_MULTIPLIER = 2.4;
