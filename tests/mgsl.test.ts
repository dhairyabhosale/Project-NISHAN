/* E1 - Mock Government Systems Layer.
 *
 * Uses the Node built-in test runner and Node's native TypeScript stripping, so
 * this adds no dependency. §16.11 bars adding libraries, and a lockfile change
 * on the final day is exactly the risk §12.6 warns about. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SYSTEM_CODES, unreachableSystems } from "../lib/types/systems";
import { parseFaultSpec, seededUnitInterval } from "../mocks/fault";
import { mNPCI, mUIDAI, readSnapshot, readSystem } from "../mocks";
import { PERSONAS, findPersonaByIdentifier } from "../mocks/fixtures";

const LAKSHMI = "P1";

describe("MGSL - seven systems", () => {
  it("exposes exactly the seven systems in §8.4", () => {
    assert.deepEqual([...SYSTEM_CODES], ["mSCHEME", "mUIDAI", "mPFMS", "mNPCI", "mLAND", "mBANK", "mITD"]);
  });

  it("assembles a snapshot with one entry per system", async () => {
    const snap = await readSnapshot(LAKSHMI);
    for (const code of SYSTEM_CODES) {
      assert.equal(snap[code].system, code, code + " entry present");
      assert.equal(snap[code].ok, true, code + " reachable");
    }
    assert.deepEqual(unreachableSystems(snap), []);
  });

  it("returns typed records, not a generic PASS/FAIL shape", async () => {
    const uidai = await mUIDAI(LAKSHMI);
    assert.ok(uidai.ok && uidai.record);
    // The signature B3 case: e-KYC pending AND no linked mobile, so an OTP can
    // never arrive. Both facts must be readable, not just a status flag.
    assert.equal(uidai.record.ekyc_state, "PENDING");
    assert.equal(uidai.record.linked_mobile, null);
  });

  it("returns a reachable-but-empty result for an unknown reference", async () => {
    const r = await readSystem("mSCHEME", "NOBODY-0000");
    assert.equal(r.ok, true, "reachable");
    assert.equal(r.ok && r.record, null, "but holds no record");
  });
});

describe("MGSL - identifier lookup (§11.7 S2)", () => {
  it("resolves by Aadhaar, by registration number, and by internal ref", () => {
    assert.ok(findPersonaByIdentifier("9999 4412 8830"), "by Aadhaar");
    assert.ok(findPersonaByIdentifier("999944128830"), "by Aadhaar, unspaced");
    assert.ok(findPersonaByIdentifier("NSHDEMO-1001"), "by registration number");
    assert.ok(findPersonaByIdentifier("p1"), "by ref, case-insensitive");
    assert.equal(findPersonaByIdentifier("9999 0000 0000"), null, "unknown resolves to null");
  });

  it("uses only §12.3 synthetic identifier formats", () => {
    for (const p of PERSONAS) {
      if (p.mUIDAI) assert.match(p.mUIDAI.aadhaar_ref, /^9999 \d{4} \d{4}$/, p.label + " Aadhaar");
      if (p.mSCHEME) assert.match(p.mSCHEME.reg_no, /^NSHDEMO-\d{4}$/, p.label + " reg no");
      if (p.mBANK) assert.match(p.mBANK.account_ref, /^MOCKACC-\d{4}$/, p.label + " account");
      if (p.mBANK) assert.match(p.mBANK.ifsc, /^MOCK\d{7}$/, p.label + " IFSC");
      if (p.mITD) assert.match(p.mITD.pan_ref, /^MOCKP\d{4}M$/, p.label + " PAN");
      if (p.mUIDAI?.linked_mobile) assert.match(p.mUIDAI.linked_mobile, /^\+91 5\d{9}$/, p.label + " mobile");
    }
  });
});

describe("MGSL - fault injection (§8.4)", () => {
  it("a timeout is unreachable, NOT an empty record", async () => {
    const r = await readSystem("mNPCI", LAKSHMI, { timeout: true });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.error, "TIMEOUT");
  });

  it("forceStatus produces a deterministic HTTP failure", async () => {
    const r = await readSystem("mLAND", LAKSHMI, { forceStatus: 503 });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.status, 503);
  });

  it("failureRate is reproducible for a given case - §8.5 determinism", async () => {
    const a = await mNPCI(LAKSHMI, { failureRate: 0.5 });
    const b = await mNPCI(LAKSHMI, { failureRate: 0.5 });
    assert.equal(a.ok, b.ok, "same case, same fault, same outcome");
    assert.equal(seededUnitInterval("x|y"), seededUnitInterval("x|y"));
    assert.notEqual(seededUnitInterval("mNPCI|P1"), seededUnitInterval("mLAND|P1"));
  });

  it("failureRate 1 always fails and 0 never fails", async () => {
    assert.equal((await mNPCI(LAKSHMI, { failureRate: 1 })).ok, false);
    assert.equal((await mNPCI(LAKSHMI, { failureRate: 0 })).ok, true);
  });

  it("staleBy marks the result as an older view", async () => {
    const fresh = await readSystem("mBANK", LAKSHMI);
    const stale = await readSystem("mBANK", LAKSHMI, { staleBy: "P7D" });
    assert.equal(stale.ok && stale.stale, true);
    assert.ok(new Date(stale.observedAt) < new Date(fresh.observedAt), "observedAt moved back");
  });

  it("a fault on one system leaves the other six reachable", async () => {
    const snap = await readSnapshot(LAKSHMI, { mNPCI: { timeout: true } });
    assert.deepEqual(unreachableSystems(snap), ["mNPCI"]);
  });
});

describe("MGSL - fault spec parsing", () => {
  it("applies a bare shorthand to all seven systems", () => {
    const m = parseFaultSpec("slow");
    assert.equal(Object.keys(m).length, 7);
    assert.equal(m.mNPCI?.latencyMs, 2500);
  });

  it("scopes a fault to one system", () => {
    const m = parseFaultSpec("mNPCI:timeout");
    assert.equal(m.mNPCI?.timeout, true);
    assert.equal(m.mLAND, undefined);
  });

  it("parses several systems and combined clauses", () => {
    const m = parseFaultSpec("mNPCI:down,mLAND:slow+stale");
    assert.equal(m.mNPCI?.forceStatus, 503);
    assert.equal(m.mLAND?.latencyMs, 2500);
    assert.equal(m.mLAND?.staleBy, "P7D");
  });

  it("accepts explicit key=value and a JSON object", () => {
    assert.equal(parseFaultSpec("mBANK:latencyMs=1200").mBANK?.latencyMs, 1200);
    assert.equal(parseFaultSpec('{"mITD":{"timeout":true}}').mITD?.timeout, true);
  });

  it("ignores unknown systems and malformed input without throwing", () => {
    assert.deepEqual(parseFaultSpec("notASystem:timeout"), {});
    assert.deepEqual(parseFaultSpec("{ broken json"), {});
    assert.deepEqual(parseFaultSpec(""), {});
    assert.deepEqual(parseFaultSpec(null), {});
  });
});

describe("MGSL - snapshots are copies, not the fixture store", () => {
  it("mutating a snapshot cannot corrupt later reads", async () => {
    const first = await readSystem("mPFMS", LAKSHMI);
    assert.ok(first.ok && first.record);
    const before = first.record.fto_state;

    // A caller does something careless.
    first.record.fto_state = "PAID";

    const second = await readSystem("mPFMS", LAKSHMI);
    assert.ok(second.ok && second.record);
    assert.equal(second.record.fto_state, before, "the store must be untouched");
  });

  it("hands out a fresh object each read", async () => {
    const a = await mUIDAI(LAKSHMI);
    const b = await mUIDAI(LAKSHMI);
    assert.ok(a.ok && b.ok && a.record && b.record);
    assert.notEqual(a.record, b.record, "different objects");
    assert.deepEqual(a.record, b.record, "identical values");
  });
});
