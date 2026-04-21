'use client';

import { useState, useRef, useEffect } from 'react';

const COLORS = [
  '#737373', '#525252', '#a3a3a3',
  '#dc2626', '#ea580c', '#d97706',
  '#65a30d', '#16a34a', '#0d9488',
  '#0284c7', '#2563eb', '#7c3aed',
  '#c026d3', '#e11d48',
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex-shrink-0 transition-transform hover:scale-110"
        style={{ backgroundColor: value }}
      />
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg p-2 grid grid-cols-7 gap-1 w-max">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className={`w-5 h-5 rounded-md transition-all ${value === c ? 'ring-2 ring-offset-1 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-900' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
