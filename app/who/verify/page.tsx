/* S3 - Verify. AUDIT.md F6.
 *
 * This page used to be a client component reading the case reference with
 * useSearchParams, wrapped in <Suspense fallback={null}>. useSearchParams opts
 * a component out of server rendering, so the fallback is what went into the
 * HTML - and the fallback was nothing. The server sent an empty page for a
 * primary-path screen, which on a slow connection is a blank screen until the
 * JavaScript arrives, and a permanently blank one if it never does.
 *
 * The fix is not a nicer fallback. Next hands `searchParams` to a page as a
 * prop, so the reference can be read on the server and passed down. Nothing
 * suspends, no Suspense boundary is needed, and the whole screen - heading,
 * disclosure, the "did not get the code" route out - is in the first response.
 *
 * The form stays a client component because the code entry is interactive; it
 * simply receives the reference instead of looking it up. */

import { VerifyForm } from "./VerifyForm";

export default function VerifyPage({ searchParams }: { searchParams: { ref?: string } }) {
  return <VerifyForm reference={searchParams.ref ?? ""} />;
}
