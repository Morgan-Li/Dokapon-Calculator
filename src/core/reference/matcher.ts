import Fuse from 'fuse.js';
import { FuzzyMatch } from '../../types';
import { getJobNames, getWeaponNames, getDefensiveMagicNames, getOffensiveMagicNames, getBattleSkillNames } from './loader';

// Fuzzy matching configuration
const FUSE_OPTIONS = {
  threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
  distance: 100,
  includeScore: true,
  keys: ['name'],
};

// Create Fuse instances for each data type
let jobFuse: Fuse<{ name: string }> | null = null;
let weaponFuse: Fuse<{ name: string }> | null = null;
let defensiveMagicFuse: Fuse<{ name: string }> | null = null;
let offensiveMagicFuse: Fuse<{ name: string }> | null = null;
let battleSkillFuse: Fuse<{ name: string }> | null = null;

function initFuseInstances() {
  if (!jobFuse) {
    jobFuse = new Fuse(
      getJobNames().map(name => ({ name })),
      FUSE_OPTIONS
    );
  }
  if (!weaponFuse) {
    weaponFuse = new Fuse(
      getWeaponNames().map(name => ({ name })),
      FUSE_OPTIONS
    );
  }
  if (!defensiveMagicFuse) {
    defensiveMagicFuse = new Fuse(
      getDefensiveMagicNames().map(name => ({ name })),
      FUSE_OPTIONS
    );
  }
  if (!offensiveMagicFuse) {
    offensiveMagicFuse = new Fuse(
      getOffensiveMagicNames().map(name => ({ name })),
      FUSE_OPTIONS
    );
  }
  if (!battleSkillFuse) {
    battleSkillFuse = new Fuse(
      getBattleSkillNames().map(name => ({ name })),
      FUSE_OPTIONS
    );
  }
}

// Normalize OCR text
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .replace(/[^\w\s+-]/g, ''); // remove special chars except +, -
}

// Generic fuzzy matcher
function fuzzyMatch(
  ocrText: string,
  fuse: Fuse<{ name: string }>,
  maxResults = 3
): FuzzyMatch | null {
  const normalized = normalizeText(ocrText);
  const results = fuse.search(normalized);

  if (results.length === 0) return null;

  const topResult = results[0];
  const confidence = 1 - (topResult.score || 0); // Convert Fuse score to confidence

  return {
    match: topResult.item.name,
    confidence,
    alternatives: results.slice(1, maxResults).map(r => r.item.name),
  };
}

// Match job name
export function matchJob(ocrText: string): FuzzyMatch | null {
  initFuseInstances();
  return fuzzyMatch(ocrText, jobFuse!);
}

// Match weapon name
export function matchWeapon(ocrText: string): FuzzyMatch | null {
  initFuseInstances();
  return fuzzyMatch(ocrText, weaponFuse!);
}

// Match defensive magic name
export function matchDefensiveMagic(ocrText: string): FuzzyMatch | null {
  initFuseInstances();
  return fuzzyMatch(ocrText, defensiveMagicFuse!);
}

// Match offensive magic name
export function matchOffensiveMagic(ocrText: string): FuzzyMatch | null {
  initFuseInstances();
  return fuzzyMatch(ocrText, offensiveMagicFuse!);
}

// Match battle skill name
export function matchBattleSkill(ocrText: string): FuzzyMatch | null {
  initFuseInstances();
  return fuzzyMatch(ocrText, battleSkillFuse!);
}
