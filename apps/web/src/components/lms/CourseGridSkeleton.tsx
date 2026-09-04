/** Matches the three-column course grid used across the learning dashboard. */
export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-3">
        <div className="h-7 w-52 rounded bg-gold-light/30" />
        <div className="h-4 w-80 rounded bg-gold-light/20" />
      </div>
      <div className="grid animate-pulse gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="h-72 rounded-xl bg-gold-light/30" />
        ))}
      </div>
    </div>
  );
}
