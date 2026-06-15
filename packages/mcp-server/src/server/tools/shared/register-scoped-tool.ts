import { type ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  type AnySchema,
  type ShapeOutput,
  type ZodRawShapeCompat,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { requireScope, type OnbrandScope } from "@onbrand/core/auth/context";
import { toToolErrorResult, toToolResult } from "./result";
import { type ToolRegistrationContext } from "./types";

type ToolInput<InputSchema extends ZodRawShapeCompat> = ShapeOutput<InputSchema>;

type ToolConfig<InputSchema extends ZodRawShapeCompat | AnySchema> = {
  title?: string;
  description?: string;
  inputSchema: InputSchema;
  annotations?: Parameters<ToolRegistrationContext["server"]["registerTool"]>[1]["annotations"];
  _meta?: Record<string, unknown>;
};

type ToolErrorConstructor = new (message: string) => Error;

export const registerScopedTool = <InputSchema extends ZodRawShapeCompat, Result extends object>({
  context: { server, authContext },
  name,
  config,
  scope,
  handledErrors = [],
  handler,
}: {
  context: ToolRegistrationContext;
  name: string;
  config: ToolConfig<InputSchema>;
  scope: OnbrandScope;
  handledErrors?: readonly ToolErrorConstructor[];
  handler: (request: ToolInput<InputSchema>) => Result | Promise<Result>;
}): void => {
  const callback = async (request: ToolInput<InputSchema>) => {
    try {
      requireScope(authContext, scope);
      return toToolResult(await handler(request));
    } catch (error) {
      if (error instanceof Error && handledErrors.some((errorType) => error instanceof errorType)) {
        return toToolErrorResult(error);
      }
      throw error;
    }
  };

  server.registerTool(name, config, callback as unknown as ToolCallback<InputSchema>);
};
