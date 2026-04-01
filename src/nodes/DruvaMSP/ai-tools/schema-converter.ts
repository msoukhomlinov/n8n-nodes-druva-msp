// ---------------------------------------------------------------------------
// Runtime Zod schema conversion — converts compile-time Zod schemas to
// runtime instances resolved from n8n's module tree.
// Handles Zod v3/v4 dual compatibility.
// ---------------------------------------------------------------------------

import type { RuntimeZod } from "./runtime";
import { buildUnifiedSchema } from "./schema-generator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRuntimeZodSchema(schema: any, runtimeZ: RuntimeZod): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = schema?._def as any;
  // Zod v4 uses _def.type (e.g. 'string'); Zod v3 uses _def.typeName (e.g. 'ZodString')
  const typeName = (def?.type ?? def?.typeName) as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let converted: unknown;

  switch (typeName) {
    // ── String ──────────────────────────────────────────────────────────
    case "string": // Zod v4
    case "ZodString": {
      // Zod v3
      let s = runtimeZ.string();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const check of (def.checks ?? []) as Array<any>) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cd = (check?._zod?.def ?? check) as any;
        const kind = (cd?.check ?? cd?.kind) as string | undefined;
        switch (kind) {
          case "min_length":
            s = s.min(cd.minimum);
            break; // Zod v4
          case "max_length":
            s = s.max(cd.maximum);
            break; // Zod v4
          case "min":
            s = s.min(cd.value);
            break; // Zod v3
          case "max":
            s = s.max(cd.value);
            break; // Zod v3
          case "email":
            s = s.email();
            break;
          case "url":
            s = s.url();
            break;
          case "uuid":
            s = s.uuid();
            break;
          default:
            break;
        }
      }
      converted = s;
      break;
    }
    // ── Number ──────────────────────────────────────────────────────────
    case "number": // Zod v4
    case "ZodNumber": {
      // Zod v3
      let n = runtimeZ.number();
      let needsInt = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const check of (def.checks ?? []) as Array<any>) {
        // Zod v4 int: ZodNumberFormat check has .isInt === true
        if (check?.isInt === true) {
          needsInt = true;
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cd = (check?._zod?.def ?? check) as any;
        const kind = (cd?.check ?? cd?.kind) as string | undefined;
        switch (kind) {
          case "int":
            needsInt = true;
            break; // Zod v3
          case "greater_than": // Zod v4
            n = cd.inclusive ? n.min(cd.value) : n.gt(cd.value);
            break;
          case "less_than": // Zod v4
            n = cd.inclusive ? n.max(cd.value) : n.lt(cd.value);
            break;
          case "min":
            n = cd.inclusive === false ? n.gt(cd.value) : n.min(cd.value);
            break; // Zod v3
          case "max":
            n = cd.inclusive === false ? n.lt(cd.value) : n.max(cd.value);
            break; // Zod v3
          default:
            break;
        }
      }
      if (needsInt) n = n.int();
      converted = n;
      break;
    }
    // ── Simple types ────────────────────────────────────────────────────
    case "boolean":
    case "ZodBoolean":
      converted = runtimeZ.boolean();
      break;
    case "unknown":
    case "ZodUnknown":
      converted = runtimeZ.unknown();
      break;
    // ── Array ───────────────────────────────────────────────────────────
    // Zod v4: element at _def.element | Zod v3: element at _def.type (a schema)
    case "array":
    case "ZodArray":
      converted = runtimeZ.array(
        toRuntimeZodSchema(def.element ?? def.type, runtimeZ),
      );
      break;
    // ── Enum ────────────────────────────────────────────────────────────
    // Zod v4: values at schema.options or _def.entries | Zod v3: _def.values
    case "enum":
    case "ZodEnum": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enumVals: string[] =
        schema.options ??
        (def.entries
          ? Object.values(def.entries as Record<string, string>)
          : undefined) ??
        def.values ??
        [];
      converted = runtimeZ.enum(enumVals as [string, ...string[]]);
      break;
    }
    // ── Record ──────────────────────────────────────────────────────────
    case "record":
    case "ZodRecord":
      converted = runtimeZ.record(
        toRuntimeZodSchema(def.keyType ?? runtimeZ.string(), runtimeZ),
        toRuntimeZodSchema(def.valueType, runtimeZ),
      );
      break;
    // ── Object ──────────────────────────────────────────────────────────
    case "object":
    case "ZodObject": {
      // Zod v4: shape is plain object | Zod v3: shape is a function
      const shape = typeof def.shape === "function" ? def.shape() : def.shape;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runtimeShape: Record<string, any> = {};
      for (const [key, value] of Object.entries(shape ?? {})) {
        runtimeShape[key] = toRuntimeZodSchema(value, runtimeZ);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = runtimeZ.object(runtimeShape);
      if (def.unknownKeys === "passthrough") obj = obj.passthrough();
      if (def.unknownKeys === "strict") obj = obj.strict();
      converted = obj;
      break;
    }
    // ── Wrappers ────────────────────────────────────────────────────────
    case "optional":
    case "ZodOptional":
      converted = toRuntimeZodSchema(def.innerType, runtimeZ).optional();
      break;
    case "nullable":
    case "ZodNullable":
      converted = toRuntimeZodSchema(def.innerType, runtimeZ).nullable();
      break;
    case "default":
    case "ZodDefault":
      // Zod v4: defaultValue is raw | Zod v3: defaultValue is a function
      converted = toRuntimeZodSchema(def.innerType, runtimeZ).default(
        typeof def.defaultValue === "function"
          ? def.defaultValue()
          : def.defaultValue,
      );
      break;
    // ── Literal ─────────────────────────────────────────────────────────
    // Zod v4: values at _def.values (array) | Zod v3: value at _def.value
    case "literal":
    case "ZodLiteral":
      converted = runtimeZ.literal(
        Array.isArray(def.values) ? def.values[0] : def.value,
      );
      break;
    // ── Union ───────────────────────────────────────────────────────────
    case "union":
    case "ZodUnion":
      converted = runtimeZ.union(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (def.options ?? []).map((o: unknown) =>
          toRuntimeZodSchema(o, runtimeZ),
        ),
      );
      break;
    default:
      console.warn(
        `[DruvaMspAiTools] schema-converter: unrecognized Zod type "${typeName ?? "undefined"}". ` +
          `Falling back to z.unknown(). This may indicate a Zod version incompatibility.`,
      );
      converted = runtimeZ.unknown();
      break;
  }

  const description =
    typeof schema?.description === "string" ? schema.description : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (description && typeof (converted as any).describe === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (converted as any).describe(description);
  }
  return converted;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withRuntimeZod<T>(schemaBuilder: () => T, runtimeZ: RuntimeZod): any {
  return toRuntimeZodSchema(schemaBuilder(), runtimeZ);
}

export function getRuntimeSchemaBuilders(runtimeZ: RuntimeZod) {
  return {
    buildUnifiedSchema: (resource: string, operations: string[]) =>
      withRuntimeZod(() => buildUnifiedSchema(resource, operations), runtimeZ),
  };
}
