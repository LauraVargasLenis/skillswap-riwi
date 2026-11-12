import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Action } from "./engine";

export const startTestSpace = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => { const { startTest } = await import("./testing.server"); return startTest(data.userId); });
export const readTestSpace = createServerFn({ method: "GET" })
  .handler(async () => { const { readTest } = await import("./testing.server"); return readTest(); });
export const applyTestAction = createServerFn({ method: "POST" })
  .inputValidator((input: Action) => input)
  .handler(async ({ data }) => { const { changeTest } = await import("./testing.server"); return changeTest(data); });