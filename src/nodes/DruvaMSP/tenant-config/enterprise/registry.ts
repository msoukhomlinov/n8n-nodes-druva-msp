import type { ObjectEntry, WorkloadEntry } from "./types";
import { vmware } from "./vmware";
import { sqlServer } from "./sqlserver";
import { nas } from "./nas";
import { fileServer } from "./fileserver";
import { hyperV } from "./hyperv";
import { ahv } from "./ahv";
import { oracleSbt } from "./oraclesbt";
import { phoenixBackupStore } from "./pbs";
import { crossWorkload } from "./shared";

export const ENTERPRISE_WORKLOADS: WorkloadEntry[] = [
  ahv,
  crossWorkload,
  fileServer,
  hyperV,
  nas,
  oracleSbt,
  phoenixBackupStore,
  sqlServer,
  vmware,
];

export function findWorkload(value: string): WorkloadEntry | undefined {
  return ENTERPRISE_WORKLOADS.find((w) => w.value === value);
}

export function findObject(
  workload: WorkloadEntry,
  value: string,
): ObjectEntry | undefined {
  return workload.objects.find((o) => o.value === value);
}
