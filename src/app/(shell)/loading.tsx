export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-4 w-32 rounded-full bg-line" />
      <div className="h-16 w-64 rounded-2xl bg-line" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 rounded-2xl bg-line" />
        <div className="h-20 rounded-2xl bg-line" />
        <div className="h-20 rounded-2xl bg-line" />
      </div>
    </div>
  );
}
