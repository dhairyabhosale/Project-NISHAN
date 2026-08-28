/* Route-level loading state. §11.9: the target user is on 2G, so a skeleton
   that reserves the right space beats a spinner that implies speed we cannot
   promise. Pulse is disabled under prefers-reduced-motion. */
export default function Loading() {
  return (
    <main className="shell py-14" aria-busy="true" aria-live="polite">
      <div className="skeleton h-9 w-3/4 max-w-xl" />
      <div className="skeleton mt-4 h-5 w-full max-w-2xl" />
      <div className="skeleton mt-2 h-5 w-5/6 max-w-xl" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    </main>
  );
}
