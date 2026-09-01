"use client";

interface SkeletonProps {
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(13,18,48,0.08)] backdrop-blur-xl backdrop-saturate-150">
      <div className="h-48 w-full animate-pulse rounded-t-[18px] bg-gradient-to-br from-muted/15 to-muted/10" />

      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded-full bg-gradient-to-r from-muted/18 to-muted/10" />
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-gradient-to-r from-muted/15 to-muted/8" />

        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gradient-to-r from-brand/10 to-cyan/8" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gradient-to-r from-brand/10 to-cyan/8" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-gradient-to-r from-brand/10 to-cyan/8" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-gradient-to-r from-muted/18 to-muted/10" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-gradient-to-r from-brand/15 to-brand/10" />
        </div>
      </div>
    </div>
  );
}

export default function Skeleton({ count = 6 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
