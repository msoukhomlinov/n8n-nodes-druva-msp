import type { InsyncObjectEntry } from "./types";

export const legalHoldPolicy: InsyncObjectEntry = {
  name: "Legal Hold Policy",
  value: "legalHoldPolicy",
  operations: ["list", "get"],
  method: "GET",
  pathTemplate: "/legalholds/v4/policies",
  getPathTemplate: "/legalholds/v4/policies/{policyId}",
  pagination: "pageToken",
  dataKey: "results",
  getIdParam: "policyId",
};

export const legalHoldClient: InsyncObjectEntry = {
  name: "Legal Hold Client",
  value: "legalHoldClient",
  operations: ["list", "get"],
  method: "GET",
  pathTemplate: "/legalholds/v4/clients",
  getPathTemplate: "/legalholds/v4/clients/{clientId}",
  pagination: "pageToken",
  dataKey: "clients",
  getIdParam: "clientId",
};
