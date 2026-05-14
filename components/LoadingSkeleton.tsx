import React from 'react';

interface SkeletonBoxProps {
  className?: string;
}
const SkeletonBox: React.FC<SkeletonBoxProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

interface LoadingSkeletonProps {
  variant: 'metrics' | 'toolbar' | 'calendar' | 'panel' | 'card';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant }) => {
  if (variant === 'metrics') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <SkeletonBox className="w-8 h-8 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <SkeletonBox className="w-12 h-4" />
              <SkeletonBox className="w-16 h-2.5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'toolbar') {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl px-3 sm:px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-8 h-8" />
          <SkeletonBox className="w-28 h-8" />
          <SkeletonBox className="w-8 h-8" />
          <SkeletonBox className="w-12 h-8" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-24 h-8" />
          <SkeletonBox className="w-20 h-8" />
          <SkeletonBox className="w-20 h-8" />
        </div>
      </div>
    );
  }

  if (variant === 'calendar') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="hidden md:grid md:grid-cols-7 bg-gray-50 border-b border-gray-200">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-center py-2.5 border-r border-gray-200 last:border-r-0">
              <SkeletonBox className="w-8 h-3 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hidden md:block border-b border-r border-gray-100 p-3">
              <SkeletonBox className="w-6 h-4 mb-2" />
              <SkeletonBox className="w-full h-5 mb-1" />
              <SkeletonBox className="w-3/4 h-5 mb-1" />
            </div>
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`m${i}`} className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-gray-100">
              <SkeletonBox className="w-6 h-6 rounded-full" />
              <SkeletonBox className="w-16 h-3" />
              <SkeletonBox className="w-20 h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'panel') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <SkeletonBox className="w-32 h-4 mb-3" />
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <SkeletonBox className="w-10 h-10 rounded-full" />
          <SkeletonBox className="w-44 h-3" />
        </div>
      </div>
    );
  }

  return null;
};
