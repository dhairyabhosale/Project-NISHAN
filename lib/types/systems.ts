export type SystemName = "mSCHEME" | "mUIDAI" | "mPFMS" | "mNPCI" | "mLAND" | "mBANK" | "mITD";
export interface GovernmentSystemRecord { system: SystemName; referenceId: string; status: "PASS" | "FAIL" | "UNKNOWN"; code?: string; }
export interface MSchemeRecord extends GovernmentSystemRecord { system: "mSCHEME"; }
export interface MUidaiRecord extends GovernmentSystemRecord { system: "mUIDAI"; }
export interface MPfmsRecord extends GovernmentSystemRecord { system: "mPFMS"; }
export interface MNpciRecord extends GovernmentSystemRecord { system: "mNPCI"; }
export interface MLandRecord extends GovernmentSystemRecord { system: "mLAND"; }
export interface MBankRecord extends GovernmentSystemRecord { system: "mBANK"; }
export interface MItdRecord extends GovernmentSystemRecord { system: "mITD"; }
