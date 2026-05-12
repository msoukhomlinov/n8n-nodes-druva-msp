import type { InsyncObjectEntry } from "./types";

export const profile: InsyncObjectEntry = {
  name: "Profile",
  value: "profile",
  operations: ["list", "get"],
  method: "GET",
  pathTemplate: "/profilemanagement/v1/profiles",
  getPathTemplate: "/profilemanagement/v1/profiles/{profileID}",
  pagination: "pageToken",
  dataKey: "profiles",
  getIdParam: "profileID",
};
