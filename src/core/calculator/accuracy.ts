import { CharacterState } from '../../types';
import { ACCURACY_BASELINE } from './constants';

/**
 * Calculate battle accuracy (hit chance) for Attack or Strike
 * Formula: (Attacker SP / (Attacker SP + Defender SP)) * 100 + 25
 *
 * - Equal speed: 75% hit rate
 * - 3x attacker speed: ~100% hit rate
 * - 1/3 attacker speed: ~50% hit rate
 *
 * Note: Magic attacks cannot miss (unless defender uses Decoy)
 */
export function calculateAccuracy(
  attacker: CharacterState,
  defender: CharacterState
): number {
  const totalSpeed = attacker.sp + defender.sp;

  // Avoid division by zero
  if (totalSpeed === 0) {
    return ACCURACY_BASELINE;
  }

  const accuracy = (attacker.sp / totalSpeed) * 100 + ACCURACY_BASELINE;

  // Clamp between 0 and 99
  return Math.min(99, Math.max(0, Math.round(accuracy)));
}
