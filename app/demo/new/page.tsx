/* Build your own demo case. Server component: the blocker list comes from the
   fixtures, which stay off the client bundle. */

import { availableBlockers } from "../../../lib/demoCase";
import { NewDemoForm } from "./NewDemoForm";

export const dynamic = "force-dynamic";

export default function NewDemoPage() {
  return <NewDemoForm blockers={availableBlockers()} />;
}
