/* Value formatting shared by the rules and the orchestrator.
 *
 * Kept in its own module so engine/rules.ts and engine/diagnose.ts do not
 * import each other — diagnose already imports RULES, so a formatter living
 * there would close a require cycle and, under CommonJS, hand one side an
 * undefined binding depending on which module loaded first. */

/**
 * Indian digit grouping: 2000 -> "2,000", 1200000 -> "12,00,000".
 *
 * Done by hand rather than with toLocaleString, which varies by platform ICU
 * build and would make the engine's output environment-dependent. §8.5 wants
 * the same inputs to give the same output on any machine, including a judge's.
 */
export function formatRupees(n: number): string {
  const s = String(Math.trunc(Math.abs(n)));
  if (s.length <= 3) return (n < 0 ? "-" : "") + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return (n < 0 ? "-" : "") + rest + "," + last3;
}
