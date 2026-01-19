// Core type definitions for the Dokapon Calculator

export type DefenderReaction = 'Defend' | 'Magic Defend' | 'Counter' | 'None';

export interface CharacterState {
  // Raw stats
  hpCurrent: number;
  hpMax: number;
  at: number;
  df: number;
  mg: number;
  sp: number;

  // Text fields (normalized names)
  job: string;
  weapon: string;
  defensiveMagic?: string;
  offensiveMagic?: string;

  // Derived values (auto-computed from reference data)
  isProficient: boolean | 'unknown';
  proficiencyMultiplier: number;  // 1.3 if proficient, 1.0 otherwise
  offensivePower: number | 'unknown';  // spell multiplier
  defensivePower: number;  // spell defense value, defaults to 0
}

export interface DamageResult {
  action: 'Attack' | 'Strike' | 'Magic' | 'Counter Returned';
  defenderReaction: DefenderReaction;
  minDamage: number;
  maxDamage: number;
  koMin: boolean;  // min damage >= defender HP
  koMax: boolean;  // max damage >= defender HP
  notes?: string;  // e.g., "Attacker takes damage"
}

export interface ROI {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface FuzzyMatch {
  match: string;
  confidence: number;
  alternatives?: string[];
}

// Reference data types
export interface JobData {
  name: string;
  weapons: string[];  // list of proficient weapons
}

export interface WeaponData {
  name: string;
}

export interface DefensiveMagicData {
  name: string;
  power: number;  // defensive power value
}

export interface OffensiveMagicData {
  name: string;
  power: number;  // offensive power multiplier
}
