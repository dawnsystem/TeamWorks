export default function TaskItemSkeleton() {
  return (
    <div className="glass-card rounded-xl p-5 skeleton">
      <div className="flex items-start gap-4">
        <div className="w-6 h-6 rounded-full bg-white/60 dark:bg-slate-700/70 shadow-inner" />

        <div className="flex-1 space-y-3">
          <div className="h-5 rounded-full bg-white/70 dark:bg-slate-700/60 w-3/4" />
          <div className="h-4 rounded-full bg-white/60 dark:bg-slate-700/60 w-1/2" />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-4 rounded-full bg-white/55 dark:bg-slate-700/55 w-24" />
            <div className="h-4 rounded-full bg-white/55 dark:bg-slate-700/55 w-20" />
            <div className="h-4 rounded-full bg-white/55 dark:bg-slate-700/55 w-16" />
          </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-white/60 dark:bg-slate-700/60" />
      </div>
    </div>
  );
}
