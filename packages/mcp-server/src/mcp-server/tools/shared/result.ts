type ToolResult<T extends object> = {
  structuredContent: T;
  content: [{ type: "text"; text: string }];
};

type ToolErrorResult = {
  isError: true;
  content: [{ type: "text"; text: string }];
};

export const toToolResult = <T extends object>(result: T): ToolResult<T> => ({
  structuredContent: result,
  content: [{ type: "text", text: JSON.stringify(result) }],
});

export const toToolErrorResult = (error: Error): ToolErrorResult => ({
  isError: true,
  content: [{ type: "text", text: error.message }],
});
