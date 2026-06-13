import { positiveIntegerSchema } from "@onbrand/number";

export type Environment = Readonly<Record<string, string | undefined>>;

export type EnvRequirement = "REQUIRED" | "OPTIONAL";

export type EnvDefinition<T> = Readonly<{
  name: string;
  requirement: EnvRequirement;
  defaultValue?: T;
  read: (env?: Environment) => T;
}>;

export type EnvStatus = "PRESENT" | "MISSING" | "DEFAULT" | "UNSET";

type EnvReportRow = Readonly<{
  name: string;
  requirement: EnvRequirement;
  status: EnvStatus;
  value: string;
}>;

type EnvRegistryShape = Readonly<Record<string, EnvDefinition<unknown>>>;

type EnvRegistryValues<Shape extends EnvRegistryShape> = {
  readonly [Key in keyof Shape]: Shape[Key] extends EnvDefinition<infer Value> ? Value : never;
};

type EnvRegistry<Shape extends EnvRegistryShape> = Readonly<
  EnvRegistryValues<Shape> & {
    validate: (env?: Environment) => void;
    formatReport: (env?: Environment) => string;
  }
>;

export const requiredString = (name: string, defaultValue?: string): EnvDefinition<string> => ({
  name,
  requirement: "REQUIRED",
  defaultValue,
  read: (env = process.env) => {
    const value = env[name];
    if (value !== undefined && value !== "") return value;
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${name}`);
  },
});

export const optionalString = (name: string): EnvDefinition<string | undefined> => ({
  name,
  requirement: "OPTIONAL",
  read: (env = process.env) => {
    const value = env[name];
    return value === "" ? undefined : value;
  },
});

export const requiredPositiveInteger = (
  name: string,
  defaultValue?: number,
): EnvDefinition<number> => ({
  name,
  requirement: "REQUIRED",
  defaultValue,
  read: (env = process.env) => {
    const rawValue = env[name];
    if ((rawValue === undefined || rawValue === "") && defaultValue !== undefined)
      return defaultValue;
    if (rawValue === undefined || rawValue === "")
      throw new Error(`Missing required environment variable: ${name}`);
    const value = Number(rawValue);
    const result = positiveIntegerSchema.safeParse(value);
    if (!result.success) throw new Error(`${name} must be a positive integer`);
    return result.data;
  },
});

export const createEnvRegistry = <const Shape extends EnvRegistryShape>(
  shape: Shape,
): EnvRegistry<Shape> => {
  const definitions = Object.values(shape);
  const registry = {
    validate: (env?: Environment) => validateEnvRegistry(definitions, env),
    formatReport: (env?: Environment) => formatEnvReport(definitions, env),
  } as Record<string, unknown>;

  for (const [key, definition] of Object.entries(shape)) {
    Object.defineProperty(registry, key, {
      enumerable: true,
      get: () => definition.read(),
    });
  }

  return Object.freeze(registry) as EnvRegistry<Shape>;
};

export const validateEnvRegistry = (
  definitions: readonly EnvDefinition<unknown>[],
  env: Environment = process.env,
): void => {
  const errors = definitions.flatMap((definition) => {
    try {
      definition.read(env);
      return [];
    } catch (error) {
      return [error instanceof Error ? error.message : String(error)];
    }
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n${errors.map((e) => `- ${e}`).join("\n")}`);
  }
};

export const formatEnvReport = (
  definitions: readonly EnvDefinition<unknown>[],
  env: Environment = process.env,
): string => {
  const rows = definitions.map((definition) => reportRow(definition, env));
  const nameWidth = Math.max(
    displayWidth("Variable"),
    ...rows.map((row) => displayWidth(row.name)),
  );
  const reqWidth = Math.max(
    displayWidth("Kind"),
    ...rows.map((row) => displayWidth(row.requirement)),
  );
  const statusWidth = Math.max(
    displayWidth("Status"),
    ...rows.map((row) => displayWidth(row.status)),
  );
  const valueWidth = Math.max(displayWidth("Value"), ...rows.map((row) => displayWidth(row.value)));
  const missingCount = rows.filter((row) => row.status === "MISSING").length;
  const presentCount = rows.filter((row) => row.status === "PRESENT").length;
  const defaultCount = rows.filter((row) => row.status === "DEFAULT").length;
  const optionalUnsetCount = rows.filter((row) => row.status === "UNSET").length;
  const separator = tableSeparator([nameWidth, reqWidth, statusWidth, valueWidth]);
  const lines = [
    "",
    "Environment registry",
    `PRESENT=${presentCount} DEFAULTED=${defaultCount} OPTIONAL_UNSET=${optionalUnsetCount} MISSING=${missingCount}`,
    separator,
    tableRow(
      ["Variable", "Kind", "Status", "Value"],
      [nameWidth, reqWidth, statusWidth, valueWidth],
    ),
    separator,
    ...rows.map((row) =>
      tableRow(
        [row.name, row.requirement, row.status, row.value],
        [nameWidth, reqWidth, statusWidth, valueWidth],
      ),
    ),
    separator,
    "",
  ];
  return lines.join("\n");
};

const reportRow = (definition: EnvDefinition<unknown>, env: Environment): EnvReportRow => {
  const rawValue = env[definition.name];
  const isPresent = rawValue !== undefined && rawValue !== "";
  if (
    !isPresent &&
    definition.requirement === "REQUIRED" &&
    definition.defaultValue === undefined
  ) {
    return {
      name: definition.name,
      requirement: definition.requirement,
      status: "MISSING",
      value: "MISSING",
    };
  }
  if (!isPresent && definition.defaultValue !== undefined) {
    return {
      name: definition.name,
      requirement: definition.requirement,
      status: "DEFAULT",
      value: `DEFAULT(${maskIfSensitive(definition.name, formatEnvValue(definition.defaultValue))})`,
    };
  }
  if (!isPresent && definition.requirement === "OPTIONAL") {
    return {
      name: definition.name,
      requirement: definition.requirement,
      status: "UNSET",
      value: "UNSET",
    };
  }
  const value = definition.read(env);
  return {
    name: definition.name,
    requirement: definition.requirement,
    status: "PRESENT",
    value: maskIfSensitive(definition.name, String(value)),
  };
};

const formatEnvValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint")
    return value.toString();
  if (value === undefined) return "UNSET";
  if (value === null) return "NULL";
  return JSON.stringify(value);
};

const maskIfSensitive = (name: string, value: string): string => {
  if (!/(TOKEN|SECRET|PASSWORD|KEY|DATABASE_URL)/i.test(name)) return value;
  return value === "" ? "UNSET" : "********";
};

const tableSeparator = (widths: readonly number[]): string =>
  `+${widths.map((width) => "-".repeat(width + 2)).join("+")}+`;

const tableRow = (values: readonly string[], widths: readonly number[]): string =>
  `| ${values.map((value, index) => pad(value, widths[index] ?? 0)).join(" | ")} |`;

const pad = (value: string, width: number): string =>
  value + " ".repeat(Math.max(0, width - displayWidth(value)));

const displayWidth = (value: string): number =>
  Array.from(value).reduce((width, character) => width + characterWidth(character), 0);

const characterWidth = (character: string): number => {
  const codePoint = character.codePointAt(0) ?? 0;
  if (codePoint === 0) return 0;
  if (codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
  if (codePoint >= 0x300 && codePoint <= 0x36f) return 0;
  if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) return 0;
  if (codePoint >= 0x1f000 && codePoint <= 0x1faff) return 2;
  if (codePoint >= 0x2600 && codePoint <= 0x27bf) return 2;
  return 1;
};
