/* Completable actions - P10. CLAUDE.md §10.4, §12.3.
 *
 * The rule these tests exist to protect is the ruled-out one. An action offered
 * where it cannot work sends someone to spend a morning achieving nothing; an
 * action hidden where it cannot work leaves them wondering. Both are worse than
 * a sentence saying why. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACTIONS, ACTION_IDS, actionFor, availableActions, ruledOutActions, officeOnly, nothingToDo
} from "../lib/actions";
import { readActionsFrom, writeActionTo, ACTION_KEY_PREFIX } from "../lib/actionStore";
import { getCase, referenceFor } from "../lib/store";
import { PERSONAS, CURRENT_CYCLE } from "../mocks/fixtures";
import type { Diagnosis } from "../lib/types/diagnosis";

const NOW = "2026-09-03T10:00:00.000Z";
const caseFor = (ref: string) => getCase(referenceFor(ref, CURRENT_CYCLE), NOW);

describe("actions - the shape of the set", () => {
  it("has four, each resolvable by id", () => {
    assert.equal(ACTION_IDS.length, 4);
    for (const id of ACTION_IDS) assert.equal(actionFor(id)?.id, id);
  });

  it("rejects an unknown id rather than guessing", () => {
    for (const bad of ["", "NOPE", "../../etc", "ekyc_face"]) assert.equal(actionFor(bad), null, bad);
  });

  it("gives every action a disclosure, because every one is simulated", () => {
    // §12.7. An action without this is the one that misleads someone.
    for (const id of ACTION_IDS) {
      assert.ok(ACTIONS[id].disclosureKey.startsWith("act."), id + " has no disclosure");
      assert.ok(ACTIONS[id].effectDays > 0, id + " has no expected-by window");
      assert.ok(ACTIONS[id].clears.length > 0, id + " clears nothing");
    }
  });
});

describe("actions - who can finish what, per persona", () => {
  it("lets Lakshmi finish her identity check without a phone number", async () => {
    // P7: the OTP route is dead for her, which is exactly why the camera is here.
    const c = await caseFor("P1");
    assert.equal(c!.diagnosis.reason, "MOBILE_NOT_LINKED");
    assert.deepEqual(availableActions(c!.diagnosis).map((a) => a.id), ["EKYC_FACE", "UPDATE_MOBILE"]);
    assert.equal(officeOnly(c!.diagnosis), false, "she was told to go to an office");
  });

  it("lets Ramesh re-link his account without a bank trip", async () => {
    const c = await caseFor("P2");
    assert.deepEqual(availableActions(c!.diagnosis).map((a) => a.id), ["RESEED_AADHAAR"]);
  });

  it("refuses to fake a fix for Sarala, and says exactly why", async () => {
    /* The most important assertion in this file. Her land record names a
       DIFFERENT PERSON, not a different spelling. A form that let her confirm a
       spelling would achieve nothing and cost her the belief that it had. */
    const c = await caseFor("P3");
    assert.equal(c!.diagnosis.reason, "LAND_NAME_MISMATCH");
    assert.deepEqual(availableActions(c!.diagnosis), []);
    assert.equal(officeOnly(c!.diagnosis), true);

    const ruled = ruledOutActions(c!.diagnosis);
    assert.equal(ruled.length, 1);
    assert.equal(ruled[0].spec.id, "CONFIRM_NAME");
    assert.equal(ruled[0].becauseKey, "act.ruled_out.different_person");
  });

  it("does not tell a waiting or a paid case to visit an office", async () => {
    // §7.2: "not broken, just waiting" is an answer. So is "already paid".
    for (const ref of ["P4", "P6"]) {
      const c = await caseFor(ref);
      assert.equal(nothingToDo(c!.diagnosis), true, ref + " should need nothing");
      assert.equal(officeOnly(c!.diagnosis), false, ref + " was sent to an office for nothing");
    }
  });

  it("keeps the Visit Slip for the blockers only an office can clear", async () => {
    for (const ref of ["P3", "P5", "P7", "P8"]) {
      const c = await caseFor(ref);
      assert.equal(officeOnly(c!.diagnosis), true, ref + " claims an in-browser fix it does not have");
    }
  });

  it("never offers an action for a blocker it does not clear", async () => {
    for (const p of PERSONAS) {
      const c = await caseFor(p.ref);
      for (const a of availableActions(c!.diagnosis)) {
        assert.ok(a.clears.includes(c!.diagnosis.reason),
          p.label + " was offered " + a.id + " for " + c!.diagnosis.reason);
      }
    }
  });

  it("only lists a ruled-out action that is about THIS blocker", async () => {
    // Otherwise the screen becomes the six-flag status grid §11.10 cut.
    for (const p of PERSONAS) {
      const c = await caseFor(p.ref);
      for (const { spec } of ruledOutActions(c!.diagnosis)) {
        assert.ok(spec.clears.includes(c!.diagnosis.reason),
          p.label + " was shown an irrelevant ruled-out action: " + spec.id);
      }
      assert.ok(ruledOutActions(c!.diagnosis).length <= 2, p.label + " lists too many ruled-out actions");
    }
  });

  it("gives a reason with every ruled-out action, never a bare refusal", async () => {
    for (const p of PERSONAS) {
      const c = await caseFor(p.ref);
      for (const r of ruledOutActions(c!.diagnosis)) {
        assert.ok(r.becauseKey && r.becauseKey.length > 0, p.label + " " + r.spec.id + " refused with no reason");
      }
    }
  });
});

describe("actions - the name rule agrees with the engine", () => {
  const base = { reason: "LAND_NAME_MISMATCH", facts: {}, portalStatus: null } as unknown as Diagnosis;
  const withNames = (aadhaar: string, land: string) =>
    ({ ...base, facts: { aadhaar_name: aadhaar, land_owner_name: land } }) as unknown as Diagnosis;

  it("offers the fix for a spelling variance", () => {
    // Fatima / Fathima is the seeded transliteration variance the engine
    // deliberately does NOT flag, so this action must accept it.
    assert.equal(ACTIONS.CONFIRM_NAME.availability(withNames("Fatima Begum", "Fathima Begum")).available, true);
    assert.equal(ACTIONS.CONFIRM_NAME.availability(withNames("Ramesh Pandian", "Ramesh P.")).available, true);
  });

  it("refuses it for a different person", () => {
    const a = ACTIONS.CONFIRM_NAME.availability(withNames("Sarala Murugesan", "Murugesan Kandasamy"));
    assert.equal(a.available, false);
    assert.equal(a.becauseKey, "act.ruled_out.different_person");
  });

  it("refuses it when a name is missing rather than guessing", () => {
    const a = ACTIONS.CONFIRM_NAME.availability({ ...base, facts: { aadhaar_name: "X" } } as unknown as Diagnosis);
    assert.equal(a.available, false);
    assert.equal(a.becauseKey, "act.ruled_out.no_names");
  });
});

describe("actionStore - completions on the device", () => {
  const store = () => {
    const map = new Map<string, string>();
    return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); }, map };
  };
  const AT = "2026-09-03T10:00:00.000Z";

  it("round-trips a completion", () => {
    const s = store();
    writeActionTo(s, "NSH-D33F", "EKYC_FACE", AT);
    assert.deepEqual(readActionsFrom(s, "NSH-D33F"), [{ id: "EKYC_FACE", at: AT }]);
    assert.ok(s.map.has(ACTION_KEY_PREFIX + "NSH-D33F"));
  });

  it("§8.7: repeating an action does not add a row or move its date", () => {
    // The expected-by date the reader was given must not slide under them.
    const s = store();
    writeActionTo(s, "NSH-D33F", "EKYC_FACE", AT);
    writeActionTo(s, "NSH-D33F", "EKYC_FACE", "2026-09-20T10:00:00.000Z");
    const rows = readActionsFrom(s, "NSH-D33F");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].at, AT, "the completion date moved");
  });

  it("keeps different actions and different cases apart", () => {
    const s = store();
    writeActionTo(s, "NSH-D33F", "EKYC_FACE", AT);
    writeActionTo(s, "NSH-D33F", "UPDATE_MOBILE", AT);
    writeActionTo(s, "NSH-B676", "RESEED_AADHAAR", AT);
    assert.equal(readActionsFrom(s, "NSH-D33F").length, 2);
    assert.equal(readActionsFrom(s, "NSH-B676").length, 1);
  });

  it("drops tampered or half-written entries instead of rendering them", () => {
    const junk = [
      "not json", "{}", "\"x\"",
      "[{\"id\":\"NOPE\",\"at\":\"2026-09-03T10:00:00.000Z\"}]",
      "[{\"id\":\"EKYC_FACE\",\"at\":\"tomorrow\"}]",
      "[{\"id\":\"EKYC_FACE\"}]",
      "[null]"
    ];
    for (const j of junk) {
      const s = store();
      s.setItem(ACTION_KEY_PREFIX + "NSH-D33F", j);
      assert.deepEqual(readActionsFrom(s, "NSH-D33F"), [], j);
    }
  });

  it("never throws when storage is hostile or absent", () => {
    const hostile = {
      getItem() { throw new Error("SecurityError"); },
      setItem() { throw new Error("SecurityError"); }
    };
    assert.deepEqual(readActionsFrom(hostile, "NSH-D33F"), []);
    assert.doesNotThrow(() => writeActionTo(hostile, "NSH-D33F", "EKYC_FACE", AT));
    assert.deepEqual(readActionsFrom(null, "NSH-D33F"), []);
  });
});
