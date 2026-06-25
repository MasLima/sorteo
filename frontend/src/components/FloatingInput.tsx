import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  step?: string;
}

export default function FloatingInput({ label, value, onChange, type = 'text', required, placeholder, rows, step }: Props) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  if (rows) {
    return (
      <div className="relative mb-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder={placeholder}
          rows={rows}
          className={`peer w-full bg-transparent border-0 border-b-2 px-0 pb-1 pt-5 text-sm dark:text-white outline-none transition-all resize-none ${focused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        <span className={`absolute left-0 transition-all pointer-events-none ${active ? 'text-xs top-0 text-blue-500' : 'text-sm top-3 text-gray-400 dark:text-gray-500'}`}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative mb-3">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        placeholder={placeholder}
        step={step}
        className={`peer w-full bg-transparent border-0 border-b-2 px-0 pb-1 pt-5 text-sm dark:text-white outline-none transition-all ${focused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
      />
      <span className={`absolute left-0 transition-all pointer-events-none ${active ? 'text-xs top-0 text-blue-500' : 'text-sm top-3 text-gray-400 dark:text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}