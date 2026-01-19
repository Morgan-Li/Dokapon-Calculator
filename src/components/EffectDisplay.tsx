import { getDefensiveMagicDescription, getOffensiveMagicDescription, getBattleSkillDescription } from '../core/reference/loader';

interface EffectDisplayProps {
  defensiveMagic?: string;
  offensiveMagic?: string;
  battleSkill?: string;
  color?: string;
}

export function EffectDisplay({ defensiveMagic, offensiveMagic, battleSkill, color = 'text-blue-400' }: EffectDisplayProps) {
  const defensiveDesc = defensiveMagic ? getDefensiveMagicDescription(defensiveMagic) : undefined;
  const offensiveDesc = offensiveMagic ? getOffensiveMagicDescription(offensiveMagic) : undefined;
  const skillDesc = battleSkill ? getBattleSkillDescription(battleSkill) : undefined;

  const hasAnyEffect = defensiveDesc || offensiveDesc || skillDesc;

  if (!hasAnyEffect) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
      <h4 className={`text-xs font-semibold ${color} uppercase tracking-wide`}>Effects</h4>

      {defensiveMagic && defensiveDesc && (
        <div className="text-xs">
          <span className="text-green-400 font-medium">{defensiveMagic}:</span>{' '}
          <span className="text-gray-300">{defensiveDesc}</span>
        </div>
      )}

      {offensiveMagic && offensiveDesc && (
        <div className="text-xs">
          <span className="text-red-400 font-medium">{offensiveMagic}:</span>{' '}
          <span className="text-gray-300">{offensiveDesc}</span>
        </div>
      )}

      {battleSkill && skillDesc && (
        <div className="text-xs">
          <span className="text-purple-400 font-medium">{battleSkill}:</span>{' '}
          <span className="text-gray-300">{skillDesc}</span>
        </div>
      )}
    </div>
  );
}
