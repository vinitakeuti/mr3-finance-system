'use client';

import Image from 'next/image';

interface SectionHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
}

export function SectionHeader({ title, rightSlot }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 relative">
          <Image
            src="/assets/images/logo.png"
            alt="MR3 Digital"
            fill
            className="object-contain"
            sizes="32px"
            priority
          />
        </div>
        <h2 className="text-3xl font-bold text-black dark:text-white">
          {title}
        </h2>
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </div>
  );
}
