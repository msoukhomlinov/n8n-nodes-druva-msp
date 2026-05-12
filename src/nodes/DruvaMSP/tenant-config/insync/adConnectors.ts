import type { InsyncObjectEntry } from "./types";

export const adConnector: InsyncObjectEntry = {
  name: "AD Connector",
  value: "adConnector",
  operations: ["list"],
  method: "GET",
  pathTemplate: "/admanagement/v1/adConnectors",
  pagination: "pageToken",
  dataKey: "adConnectorList",
};
