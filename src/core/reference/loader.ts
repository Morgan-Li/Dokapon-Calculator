import { JobData, DefensiveMagicData, OffensiveMagicData, BattleSkillData } from '../../types';
import jobsData from '../../data/jobs.json';
import weaponsData from '../../data/weapons.json';
import defensiveMagicData from '../../data/defensive-magic.json';
import offensiveMagicData from '../../data/offensive-magic.json';
import battleSkillsData from '../../data/battle-skills.json';

// Load all reference data
export const JOBS: Record<string, JobData> = jobsData as Record<string, JobData>;
export const WEAPONS: string[] = weaponsData as string[];
export const DEFENSIVE_MAGIC: Record<string, DefensiveMagicData> = defensiveMagicData as Record<string, DefensiveMagicData>;
export const OFFENSIVE_MAGIC: Record<string, OffensiveMagicData> = offensiveMagicData as Record<string, OffensiveMagicData>;
export const BATTLE_SKILLS: Record<string, BattleSkillData> = battleSkillsData as Record<string, BattleSkillData>;

// Helper: Get all job names (sorted alphabetically)
export function getJobNames(): string[] {
  return Object.keys(JOBS).sort();
}

// Helper: Get all weapon names (sorted alphabetically, with 'None' option)
export function getWeaponNames(): string[] {
  return ['None', ...WEAPONS.sort()];
}

// Helper: Get all defensive magic names (sorted alphabetically)
export function getDefensiveMagicNames(): string[] {
  return Object.keys(DEFENSIVE_MAGIC).sort();
}

// Helper: Get all offensive magic names (sorted alphabetically)
export function getOffensiveMagicNames(): string[] {
  return Object.keys(OFFENSIVE_MAGIC).sort();
}

// Helper: Get all battle skill names (sorted alphabetically)
export function getBattleSkillNames(): string[] {
  return Object.keys(BATTLE_SKILLS).sort();
}

// Check if a job is proficient with a weapon
export function isProficient(jobName: string, weaponName: string): boolean | 'unknown' {
  // No weapon means no proficiency
  if (weaponName === 'None') return false;

  const job = JOBS[jobName];
  if (!job) return 'unknown';

  return job.weapons.includes(weaponName);
}

// Get defensive magic power
export function getDefensivePower(magicName: string): number {
  const magic = DEFENSIVE_MAGIC[magicName];
  return magic ? magic.power : 0; // Default to 0 if unknown
}

// Get offensive magic power
export function getOffensivePower(magicName: string): number | 'unknown' {
  const magic = OFFENSIVE_MAGIC[magicName];
  return magic ? magic.power : 'unknown';
}

// Get proficiency multiplier
export function getProficiencyMultiplier(jobName: string, weaponName: string): number {
  // No weapon means 1.0 multiplier (no bonus or penalty)
  if (weaponName === 'None') return 1.0;

  const proficient = isProficient(jobName, weaponName);
  if (proficient === 'unknown' || proficient === false) return 1.0;
  return 1.3; // 30% bonus
}

// Get defensive magic description
export function getDefensiveMagicDescription(magicName: string): string | undefined {
  const magic = DEFENSIVE_MAGIC[magicName];
  return magic?.description;
}

// Get offensive magic description
export function getOffensiveMagicDescription(magicName: string): string | undefined {
  const magic = OFFENSIVE_MAGIC[magicName];
  return magic?.description;
}

// Get battle skill description
export function getBattleSkillDescription(skillName: string): string | undefined {
  const skill = BATTLE_SKILLS[skillName];
  return skill?.description;
}
