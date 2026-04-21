'use client';

interface SectionHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
}

export function SectionHeader({ title, rightSlot }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        {title}
      </h2>
      {rightSlot && <div>{rightSlot}</div>}
    </div>
  );
}
