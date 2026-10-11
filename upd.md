diff --git a/.changeset/simplify-internals.md b/.changeset/simplify-internals.md
new file mode 100644
index 0000000..69158c0
--- /dev/null
+++ b/.changeset/simplify-internals.md
@@ -0,0 +1,5 @@
+---
+'@llazyemail/generate-template': patch
+---
+
+Simplify internals with no API change: serialize dates with a `JSON.stringify` replacer, share one `errorMessage` helper, reuse `wantsAll` in `requestsFromArgs`, and have `write`/`run` share one persist path. The file-template renderer now passes the payload over stdin instead of writing two temp files.
diff --git a/src/adapters/file-renderer.ts b/src/adapters/file-renderer.ts
index 1ba10aa..6bc04ba 100644
--- a/src/adapters/file-renderer.ts
+++ b/src/adapters/file-renderer.ts
@@ -1,9 +1,7 @@
 import { spawnSync } from 'node:child_process';
-import fs from 'node:fs';
-import os from 'node:os';
 import path from 'node:path';
 import { pathExists } from 'markup-generator';
-import { GenerateTemplateError } from '../engine/errors';
+import { GenerateTemplateError, errorMessage } from '../engine/errors';
 import { serializePayload } from '../engine/payload';
 import type { RenderContext } from '../engine/types';
 
@@ -35,8 +33,7 @@ export function renderFromFile(ctx: RenderContext): string {
     );
   } catch (error) {
     if (error instanceof GenerateTemplateError) throw error;
-    const message = error instanceof Error ? error.message : String(error);
-    throw new GenerateTemplateError('RENDER_FAILED', message, ctx.templateId);
+    throw new GenerateTemplateError('RENDER_FAILED', errorMessage(error), ctx.templateId);
   }
 }
 
@@ -46,11 +43,7 @@ function spawnTemplateModule(
   payload: unknown,
   root: string,
 ): string {
-  const payloadPath = path.join(
-    os.tmpdir(),
-    `generate-template-payload-${process.pid}-${Date.now()}.json`,
-  );
-  fs.writeFileSync(payloadPath, serializePayload(payload), 'utf8');
+  // The payload goes over stdin and the script over `-e`, so no temp files are written.
   const source = `
 import { readFileSync } from 'node:fs';
 import { pathToFileURL } from 'node:url';
@@ -66,35 +59,26 @@ function revive(value) {
   }
   return value;
 }
-const raw = JSON.parse(readFileSync(${JSON.stringify(payloadPath)}, 'utf8'));
+const raw = JSON.parse(readFileSync(0, 'utf8'));
 const mod = await import(pathToFileURL(${JSON.stringify(modulePath)}).href);
 const exported = mod[${JSON.stringify(exportName)}] ?? mod.default;
 if (!exported) throw new Error('Export missing');
 const html = typeof exported === 'function' ? exported(revive(raw)) : exported.render(revive(raw));
 process.stdout.write(html);
 `;
-  try {
-    return runStripTypes(source, root);
-  } finally {
-    fs.rmSync(payloadPath, { force: true });
-  }
-}
-
-function runStripTypes(source: string, root: string): string {
-  const tmpFile = path.join(os.tmpdir(), `generate-template-${process.pid}-${Date.now()}.mts`);
-  fs.writeFileSync(tmpFile, source, 'utf8');
-  try {
-    const result = spawnSync(
-      process.execPath,
-      ['--experimental-strip-types', '--no-warnings', tmpFile],
-      { encoding: 'utf8', cwd: root, maxBuffer: 10 * 1024 * 1024 },
-    );
-    if (result.status !== 0) {
-      const err = (result.stderr || result.stdout || '').trim();
-      throw new Error(err || `node exited ${result.status}`);
-    }
-    return result.stdout;
-  } finally {
-    fs.rmSync(tmpFile, { force: true });
+  const result = spawnSync(
+    process.execPath,
+    ['--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', source],
+    {
+      input: serializePayload(payload),
+      encoding: 'utf8',
+      cwd: root,
+      maxBuffer: 10 * 1024 * 1024,
+    },
+  );
+  if (result.status !== 0) {
+    const err = (result.stderr || result.stdout || '').trim();
+    throw new Error(err || `node exited ${result.status}`);
   }
+  return result.stdout;
 }
diff --git a/src/adapters/payload-files.ts b/src/adapters/payload-files.ts
index c6b121b..8bfc7dd 100644
--- a/src/adapters/payload-files.ts
+++ b/src/adapters/payload-files.ts
@@ -1,6 +1,6 @@
 import path from 'node:path';
 import { loadData, pathExists } from 'markup-generator';
-import { GenerateTemplateError } from '../engine/errors';
+import { GenerateTemplateError, errorMessage } from '../engine/errors';
 import type { TemplateCatalogEntry } from '../engine/types';
 import { slugFromId } from '../catalog';
 
@@ -16,8 +16,7 @@ export async function loadPayloadFromFiles(options: {
     try {
       return await loadData(path.resolve(process.cwd(), dataPath));
     } catch (error) {
-      const message = error instanceof Error ? error.message : String(error);
-      throw new GenerateTemplateError('NO_PAYLOAD', message, templateId);
+      throw new GenerateTemplateError('NO_PAYLOAD', errorMessage(error), templateId);
     }
   }
 
diff --git a/src/cli.ts b/src/cli.ts
index c846e8b..ff9fd09 100644
--- a/src/cli.ts
+++ b/src/cli.ts
@@ -37,7 +37,7 @@ export function parseArgs(argv: string[]): CliArgs {
 }
 
 export function requestsFromArgs(args: CliArgs, generator: TemplateGenerator): GenerateRequest[] {
-  const wantAll = args.all === true || !args.template || args.template === 'all';
+  const wantAll = wantsAll(args);
   const targets = wantAll
     ? generator.catalog.map((entry) => entry.ids[0])
     : [args.template as string];
diff --git a/src/config/load.ts b/src/config/load.ts
index be3142f..0c9f5f9 100644
--- a/src/config/load.ts
+++ b/src/config/load.ts
@@ -1,7 +1,7 @@
 import { existsSync } from 'node:fs';
 import { pathToFileURL } from 'node:url';
 import type { TemplateGenerator } from '../engine';
-import { GenerateTemplateError } from '../engine/errors';
+import { GenerateTemplateError, errorMessage } from '../engine/errors';
 import { findConfigPath } from './find-config';
 import { generatorFromModule } from './module';
 
@@ -34,13 +34,15 @@ async function loadFromModule(
   try {
     return await generatorFromModule(mod);
   } catch (error) {
-    const message = error instanceof Error ? error.message : String(error);
-    throw new GenerateTemplateError('CONFIG_INVALID', `Invalid config ${file}: ${message}`);
+    throw new GenerateTemplateError(
+      'CONFIG_INVALID',
+      `Invalid config ${file}: ${errorMessage(error)}`,
+    );
   }
 }
 
 function describeConfigError(file: string, error: unknown): GenerateTemplateError {
-  const message = error instanceof Error ? error.message : String(error);
+  const message = errorMessage(error);
   if (file.endsWith('.ts') && /unknown file extension|ERR_UNKNOWN_FILE_EXTENSION/i.test(message)) {
     return new GenerateTemplateError(
       'CONFIG_IMPORT_FAILED',
diff --git a/src/engine/errors.ts b/src/engine/errors.ts
index 07ec520..baa521d 100644
--- a/src/engine/errors.ts
+++ b/src/engine/errors.ts
@@ -23,3 +23,8 @@ export class GenerateTemplateError extends Error {
 export function isGenerateTemplateError(error: unknown): error is GenerateTemplateError {
   return error instanceof GenerateTemplateError;
 }
+
+/** Message of anything that was thrown. Internal; not part of the public API. */
+export function errorMessage(error: unknown): string {
+  return error instanceof Error ? error.message : String(error);
+}
diff --git a/src/engine/generator.ts b/src/engine/generator.ts
index 89d84e2..8b11ec1 100644
--- a/src/engine/generator.ts
+++ b/src/engine/generator.ts
@@ -7,6 +7,7 @@ import type {
   FileRenderer,
   GenerateRequest,
   GenerateResult,
+  GenerateWriteOptions,
   GeneratorConfig,
   RenderOptions,
   TemplateCatalogEntry,
@@ -92,8 +93,11 @@ export class TemplateGenerator {
     return this.writer.writeFile(outPath, html, templateId);
   }
 
-  async write(templateId: string, options: WriteOptions = {}): Promise<string> {
-    const html = await this.render(templateId, options);
+  private persist(
+    templateId: string,
+    html: string,
+    options: GenerateWriteOptions,
+  ): Promise<string> {
     return this.writer.writeNamed({
       templateId,
       html,
@@ -103,6 +107,11 @@ export class TemplateGenerator {
     });
   }
 
+  async write(templateId: string, options: WriteOptions = {}): Promise<string> {
+    const html = await this.render(templateId, options);
+    return this.persist(templateId, html, options);
+  }
+
   async writeAll(outDir = this.outDir): Promise<string[]> {
     const paths: string[] = [];
     for (const entry of this.catalog) {
@@ -126,14 +135,11 @@ export class TemplateGenerator {
       html,
     };
     if (request.write) {
-      const writeOpts = request.write === true ? {} : request.write;
-      result.path = await this.writer.writeNamed({
-        templateId: request.templateId,
+      result.path = await this.persist(
+        request.templateId,
         html,
-        slug: this.slug(request.templateId),
-        out: writeOpts.out,
-        uniqueName: writeOpts.uniqueName,
-      });
+        request.write === true ? {} : request.write,
+      );
     }
     return result;
   }
diff --git a/src/engine/payload.ts b/src/engine/payload.ts
index f428949..9ab8254 100644
--- a/src/engine/payload.ts
+++ b/src/engine/payload.ts
@@ -2,21 +2,14 @@ import { slugFromId } from '../catalog';
 import { GenerateTemplateError } from './errors';
 import type { PayloadFromFiles, PayloadLoader, TemplateCatalogEntry } from './types';
 
+/**
+ * `Date#toJSON` runs before a replacer sees the value, so the raw value is read from `this`.
+ */
 export function serializePayload(payload: unknown): string {
-  return JSON.stringify(replaceDates(payload));
-}
-
-function replaceDates(value: unknown): unknown {
-  if (value instanceof Date) return { __date: value.toISOString() };
-  if (Array.isArray(value)) return value.map(replaceDates);
-  if (value && typeof value === 'object') {
-    const next: Record<string, unknown> = {};
-    for (const [key, current] of Object.entries(value as Record<string, unknown>)) {
-      next[key] = replaceDates(current);
-    }
-    return next;
-  }
-  return value;
+  return JSON.stringify(payload, function (this: Record<string, unknown>, key, value) {
+    const raw = this[key];
+    return raw instanceof Date ? { __date: raw.toISOString() } : value;
+  });
 }
 
 export function reviveDates(value: unknown): unknown {
diff --git a/src/persist/writer.ts b/src/persist/writer.ts
index d66f0f4..e7630ec 100644
--- a/src/persist/writer.ts
+++ b/src/persist/writer.ts
@@ -5,7 +5,7 @@ import {
   writeGeneratedEmail,
   writeGeneratedFile,
 } from 'markup-generator';
-import { GenerateTemplateError } from '../engine/errors';
+import { GenerateTemplateError, errorMessage } from '../engine/errors';
 
 export class Writer {
   constructor(readonly outDir: string) {}
@@ -68,6 +68,5 @@ export function wrapWriteError(error: unknown, templateId?: string): GenerateTem
   if (error instanceof MarkupGeneratorError) {
     return new GenerateTemplateError('WRITE_FAILED', `${error.code}: ${error.message}`, templateId);
   }
-  const message = error instanceof Error ? error.message : String(error);
-  return new GenerateTemplateError('WRITE_FAILED', message, templateId);
+  return new GenerateTemplateError('WRITE_FAILED', errorMessage(error), templateId);
 }
