import type { InsyncObjectEntry } from "./types";

export const protectedCloudAppsDevices: InsyncObjectEntry = {
  name: "Protected Cloud Apps - Devices",
  value: "protectedCloudAppsDevices",
  operations: ["list"],
  method: "GET",
  pathTemplate: "/insync/cadevice/v1/devices",
  pagination: "pageToken",
  dataKey: "devices",
};

export const insyncUsers: InsyncObjectEntry = {
  name: "inSync Users",
  value: "insyncUsers",
  operations: ["list"],
  method: "GET",
  pathTemplate: "/insync/usermanagement/v1/users",
  pagination: "pageToken",
  dataKey: "users",
};
