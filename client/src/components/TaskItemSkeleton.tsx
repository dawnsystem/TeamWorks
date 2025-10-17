export default function TaskItemSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Checkbox skeleton */}
        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 mt-0.5 flex-shrink-0"></div>

        <div className="flex-1 space-y-3">
          {/* Title skeleton */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>

          {/* Meta info skeleton */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}
