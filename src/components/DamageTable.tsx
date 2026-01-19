import { DamageResult, DefenderReaction } from '../types';

interface DamageTableProps {
  title: string;
  color: string;
  results: DamageResult[] | null;
  disabled?: boolean;
  accuracy?: number;
}

// Display-friendly names for defender reactions
const REACTION_DISPLAY_NAMES: Record<DefenderReaction, string> = {
  'Defend': 'Defend',
  'Magic Defend': 'Magic Defend',
  'Counter': 'Counter',
  'None': "Can't React",
};

export function DamageTable({ title, color, results, disabled, accuracy }: DamageTableProps) {
  if (disabled || !results) {
    return (
      <div className="bg-gray-700 rounded p-4 opacity-50">
        <h3 className={`font-semibold mb-3 ${color}`}>{title}</h3>
        <p className="text-sm text-gray-400 text-center py-4">
          {disabled ? 'Set offensive magic to calculate' : 'Enter character stats to calculate'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded p-4">
      <h3 className={`font-semibold mb-3 ${color}`}>
        {title}
        {accuracy !== undefined && (
          <span className="text-gray-400 font-normal text-sm ml-2">
            (Accuracy: {accuracy}%)
          </span>
        )}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs">
            <th className="text-left pb-2">Defender Action</th>
            <th className="text-right pb-2">Min</th>
            <th className="text-right pb-2">Max</th>
            <th className="text-right pb-2">KO?</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          {results.map((result, idx) => (
            <tr key={idx} className="border-t border-gray-600">
              <td className="py-2">
                {REACTION_DISPLAY_NAMES[result.defenderReaction]}
                {result.notes && (
                  <span className="text-xs text-yellow-400 ml-1">*</span>
                )}
              </td>
              <td className="text-right">{result.minDamage}</td>
              <td className="text-right">{result.maxDamage}</td>
              <td className="text-right">
                {result.koMin && result.koMax ? (
                  <span className="text-green-400">✓ Both</span>
                ) : result.koMax ? (
                  <span className="text-yellow-400">✓ Max</span>
                ) : (
                  <span className="text-gray-500">✗</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {results.some(r => r.notes) && (
        <p className="text-xs text-yellow-400 mt-2">
          * {results.find(r => r.notes)?.notes}
        </p>
      )}
    </div>
  );
}
