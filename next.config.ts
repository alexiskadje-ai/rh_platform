import { builtinModules } from "node:module";
import type { NextConfig } from "next";

type ResolveRequest = { request?: string } | null | undefined;

type CompilerWithModuleFactory = {
  hooks: {
    normalModuleFactory: {
      tap: (
        name: string,
        fn: (factory: {
          hooks: {
            beforeResolve: {
              tap: (name: string, fn: (result: ResolveRequest) => void) => void;
            };
          };
        }) => void,
      ) => void;
    };
  };
};

const nodeBuiltins = new Set(builtinModules);

const nodeOnlyPackages = [
  "pdf-parse",
  "pdfjs-dist",
  "openai",
  "@mistralai/mistralai",
  "@react-pdf/renderer",
  "stripe",
  "bullmq",
  "ioredis",
  "nodemailer",
];

const nextConfig: NextConfig = {
  serverExternalPackages: nodeOnlyPackages,
  // Webpack (used when Windows blocks Next's native SWC/Turbopack binary)
  // otherwise tries to bundle Node-only packages into instrumentation.
  webpack: (config, { isServer }) => {
    // WASM fallback (native SWC blocked by Windows) does not understand `node:` URIs.
    config.plugins.push({
      apply(compiler: CompilerWithModuleFactory) {
        compiler.hooks.normalModuleFactory.tap("strip-node-scheme", (factory) => {
          factory.hooks.beforeResolve.tap("strip-node-scheme", (result) => {
            if (result?.request?.startsWith("node:")) {
              result.request = result.request.slice("node:".length);
            }
          });
        });
      },
    });

    if (isServer) {
      config.externalsPresets = { ...(config.externalsPresets ?? {}), node: true };
      const previous = config.externals;
      config.externals = [
        ...(Array.isArray(previous) ? previous : previous ? [previous] : []),
        ({ request }: { request?: string }, callback: (error?: Error, result?: string) => void) => {
          const bare = request?.startsWith("node:") ? request.slice("node:".length) : request;
          if (bare && (nodeBuiltins.has(bare) || nodeOnlyPackages.includes(bare))) {
            callback(undefined, `commonjs ${bare}`);
            return;
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
