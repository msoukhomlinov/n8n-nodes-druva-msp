import type { InsyncObjectEntry } from "./types";
import { profile } from "./profiles";
import { adConnector } from "./adConnectors";
import { auditSettings } from "./auditSettings";
import { legalHoldPolicy, legalHoldClient } from "./legalHolds";
import {
  m365AppStatus,
  m365RestorePoints,
  sharePointSiteCollections,
  sharePointSiteRestorePoints,
} from "./m365";
import { gmailAppStatus } from "./gmail";
import { protectedCloudAppsDevices, insyncUsers } from "./cloudApps";

export const INSYNC_OBJECTS: InsyncObjectEntry[] = [
  adConnector,
  auditSettings,
  gmailAppStatus,
  insyncUsers,
  legalHoldClient,
  legalHoldPolicy,
  m365AppStatus,
  m365RestorePoints,
  profile,
  protectedCloudAppsDevices,
  sharePointSiteCollections,
  sharePointSiteRestorePoints,
];

export function findInsyncObject(value: string): InsyncObjectEntry | undefined {
  return INSYNC_OBJECTS.find((o) => o.value === value);
}
