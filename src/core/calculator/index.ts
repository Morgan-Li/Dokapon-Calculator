// Main calculator module - exports all calculation functions

export {
  calculateAttackDamage,
  calculateAllAttackDamage,
} from './attack';

export {
  calculateStrikeDamage,
  calculateAllStrikeDamage,
} from './strike';

export {
  calculateMagicDamage,
  calculateAllMagicDamage,
} from './magic';

export { calculateAccuracy } from './accuracy';

export * from './constants';
