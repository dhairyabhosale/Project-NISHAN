import type { GovernmentSystemRecord, SystemName } from "../lib/types/systems";

export function readMockSystem(_system: SystemName, _referenceId: string): GovernmentSystemRecord | null {
  // TODO(mock): Return typed offline fixture data for each government system.
  return null;
}

export const mSCHEME = () => readMockSystem("mSCHEME", "");
export const mUIDAI = () => readMockSystem("mUIDAI", "");
export const mPFMS = () => readMockSystem("mPFMS", "");
export const mNPCI = () => readMockSystem("mNPCI", "");
export const mLAND = () => readMockSystem("mLAND", "");
export const mBANK = () => readMockSystem("mBANK", "");
export const mITD = () => readMockSystem("mITD", "");
