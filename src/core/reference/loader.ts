import { JobData, DefensiveMagicData, OffensiveMagicData } from '../../types';
import jobsData from '../../data/jobs.json';
import weaponsData from '../../data/weapons.json';
import defensiveMagicData from '../../data/defensive-magic.json';
import offensiveMagicData from '../../data/offensive-magic.json';

// Load all reference data
export const JOBS: Record<string, JobData> = jobsData as Record<string, JobData>;
export const WEAPONS: string[] = weaponsData as string[];
export const DEFENSIVE_MAGIC: Record<string, DefensiveMagicData> = defensiveMagicData as Record<string, DefensiveMagicData>;
export const OFFENSIVE_MAGIC: Record<string, OffensiveMagicData> = offensiveMagicData as Record<string, OffensiveMagicData>;

// Helper: Get all job names
export function getJobNames(): string[] {
  return Object.keys(JOBS);
}

// Helper: Get all weapon names
export function getWeaponNames(): string[] {
  return WEAPONS;
}

// Helper: Get all defensive magic names
export function getDefensiveMagicNames(): string[] {
  return Object.keys(DEFENSIVE_MAGIC);
}

// Helper: Get all offensive magic names
export function getOffensiveMagicNames(): string[] {
  return Object.keys(OFFENSIVE_MAGIC);
}

// Check if a job is proficient with a weapon
export function isProficient(jobName: string, weaponName: string): boolean | 'unknown' {
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
  const proficient = isProficient(jobName, weaponName);
  if (proficient === 'unknown' || proficient === false) return 1.0;
  return 1.3; // 30% bonus
}
