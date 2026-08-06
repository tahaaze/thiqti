"use client";

interface SkeletonProps {
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="border border-line bg-surface overflow-hidden">
      <div className="h-48 w-full animate-pulse bg-muted/20" />

      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted/20" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted/20" />

        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 animate-pulse bg-muted/20" />
          <div className="h-6 w-20 animate-pulse bg-muted/20" />
          <div className="h-6 w-14 animate-pulse bg-muted/20" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-24 animate-pulse bg-muted/20" />
          <div className="h-8 w-20 animate-pulse bg-muted/20" />
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
