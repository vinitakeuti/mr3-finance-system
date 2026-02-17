'use client';

interface SectionHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
}

export function SectionHeader({ title, rightSlot }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-3xl font-bold text-black dark:text-white">
        {title}
      </h2>
      {rightSlot && <div>{rightSlot}</div>}
    </div>
  );
}

