#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "src");

require("dotenv").config({ path: path.join(root, ".env.local"), quiet: true });
registerTypeScriptRuntime();

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const smokeRequired = process.env.LLM_SMOKE_REQUIRED === "1";

  if (!apiKey) {
    const message = "Gemini smoke skipped: GEMINI_API_KEY is not set.";

    if (smokeRequired) {
      throw new Error(message);
    }

    console.log(message);
    return;
  }

  process.env.LLM_PROVIDER = "gemini";
  process.env.GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  const { generateLlmJson } = require("../src/lib/llm");
  const result = await generateLlmJson({
    fallbackValue: {
      label: "fallback",
      ok: false,
    },
    input: "Return exactly this JSON object with no markdown: {\"ok\":true,\"label\":\"gemini-smoke\"}",
    instructions: "You are a JSON API. Return only a valid JSON object.",
    maxOutputTokens: 80,
    temperature: 0,
    validate: (value) => {
      if (value.ok !== true || value.label !== "gemini-smoke") {
        return {
          code: "LLM_SMOKE_SCHEMA_MISMATCH",
          message: "Gemini smoke JSON contract did not match.",
          ok: false,
        };
      }

      return {
        ok: true,
        value: {
          label: "gemini-smoke",
          ok: true,
        },
      };
    },
  });

  if (result.status !== "generated" || result.provider !== "gemini") {
    throw new Error(`Gemini smoke failed: ${result.fallbackReason ?? "provider did not generate"}`);
  }

  console.log(
    JSON.stringify({
      model: result.model,
      provider: result.provider,
      status: result.status,
      value: result.value,
    }),
  );
}

function registerTypeScriptRuntime() {
  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      const mapped = path.join(srcRoot, request.slice(2));
      const candidates = [
        mapped,
        `${mapped}.ts`,
        `${mapped}.tsx`,
        path.join(mapped, "index.ts"),
        path.join(mapped, "index.tsx"),
      ];
      const matched = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());

      if (matched) {
        return matched;
      }
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  require.extensions[".ts"] = compileTypeScript;
  require.extensions[".tsx"] = compileTypeScript;
}

function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
}
