/**
 * Template catalog types and utilities.
 * This library does not include a default catalog - consumers must provide their own.
 * 
 * For example usage, see sandbox/example-catalog.ts
 * 
 * @deprecated This file is kept for backward compatibility with the compatibility layer.
 * New code should provide their own catalog and sample payloads via createGenerator().
 */
import type { TemplateCatalogEntry } from './types';

/**
 * Empty default catalog - consumers should provide their own via createGenerator()
 * @deprecated Provide your own catalog via createGenerator({ catalog: [...] })
 */
export const CATALOG: TemplateCatalogEntry[] = [];

/**
 * Empty default sample payloads - consumers should provide their own via createGenerator()
 * @deprecated Provide your own sample payloads via createGenerator({ samplePayloads: {...} })
 */
export const SAMPLE_PAYLOADS: Record<string, unknown> = {};
