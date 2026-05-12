import type { WorkloadEntry } from "./types";
import { vmware } from "./vmware";

export const ENTERPRISE_WORKLOADS: WorkloadEntry[] = [vmware];

export function findWorkload(value: string): WorkloadEntry | undefined {
  return ENTERPRISE_WORKLOADS.find((w) => w.value === value);
}

export function findObject(workload: WorkloadEntry, value: string) {
  return workload.objects.find((o) => o.value === value);
}
