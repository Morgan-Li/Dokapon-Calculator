interface DropdownProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  badge?: string;
  badgeColor?: string;
}

export function Dropdown({ label, value, onChange, options, placeholder, badge, badgeColor }: DropdownProps) {
  return (
    <div>
      <label className="text-gray-400 text-xs flex items-center justify-between">
        <span>{label}</span>
        {badge && (
          <span className={`text-xs ${badgeColor || 'text-gray-400'}`}>{badge}</span>
        )}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
