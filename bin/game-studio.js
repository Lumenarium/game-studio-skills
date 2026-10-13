#!/usr/bin/env node

// apps/cli/src/run.ts
import { basename as basename3, dirname as dirname7, resolve as resolve6 } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";

// packages/contracts/src/activity.ts
import { z as z9 } from "zod/v4";

// packages/contracts/src/common.ts
import { z } from "zod/v4";
var UuidSchema = z.uuid();
var LocaleSchema = z.enum(["ru", "en"]);
var IsoDateTimeSchema = z.iso.datetime({ offset: true });
var ProblemCodeSchema = z.enum([
  "validation_failed",
  "not_found",
  "conflict",
  "unauthorized",
  "forbidden",
  "registration_disabled",
  "email_already_registered",
  "invalid_credentials",
  "invitation_unavailable",
  "invitation_changed",
  "mail_unavailable",
  "project_in_trash",
  "project_archived",
  "art_settings_required",
  "rate_limit_exceeded",
  "generation_limit_reached",
  "content_has_dependencies",
  "content_not_trashed",
  "content_purge_irreversible",
  "regeneration_unavailable",
  "regeneration_active",
  "regeneration_lineage_missing",
  "dependency_unavailable",
  "palette_decode_failed",
  "palette_empty",
  "palette_insufficient_contrast",
  "palette_structural_roles_missing",
  "recipe_unsupported",
  "snapshot_unsupported",
  "model_capability_unsupported",
  "catalog_not_configured",
  "catalog_upstream_failed",
  "catalog_source_changed",
  "catalog_preview_invalid",
  "catalog_preview_expired",
  "catalog_preview_stale",
  "catalog_binding_ineligible",
  "catalog_pin_unavailable",
  "model_not_eligible",
  "model_benchmark_blocked",
  "model_unverified_ack_required",
  "model_provider_native_size_ack_required",
  "snapshot_reference_unavailable",
  "source_unavailable",
  "raw_checksum_mismatch",
  "anchor_unavailable",
  "processing_dimensions_invalid",
  "processing_subject_empty",
  "processing_subject_clipped",
  "processing_antialiasing_detected",
  "internal_error"
]);
var ProblemSchema = z.object({
  type: z.string().default("about:blank"),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string(),
  code: ProblemCodeSchema,
  correlationId: z.string().optional(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  missingSections: z.array(z.enum(["camera", "canvas", "tiles"])).min(1).max(3).optional()
});
var ArtSettingsRequiredProblemSchema = ProblemSchema.extend({
  code: z.literal("art_settings_required"),
  missingSections: z.array(z.enum(["camera", "canvas", "tiles"])).min(1).max(3).refine(
    (sections) => new Set(sections).size === sections.length,
    "Missing sections must be unique."
  )
}).strict();

// packages/contracts/src/generation.ts
import { z as z8 } from "zod/v4";

// packages/contracts/src/generation-candidates.ts
import { z as z4 } from "zod/v4";

// packages/contracts/src/generation-style.ts
import { z as z3 } from "zod/v4";

// packages/contracts/src/styles.ts
import { z as z2 } from "zod/v4";
var BuiltInStyleCodeSchema = z2.enum([
  "pixel-8bit-arcade",
  "pixel-16bit-rpg",
  "pixel-modern",
  "pixel-3d",
  "pixel-isometric",
  "cartoon-simple",
  "clay",
  "painted-cozy",
  "render-low-poly",
  "fantasy-dark"
]);
var StyleModeSchema = z2.enum(["pixel", "raster"]);
var ProvenanceSchema = z2.enum(["algorithm", "ai", "manual"]);
var MAX_STYLE_INTENT_CODE_POINTS = 1e3;
function normalizeStyleIntent(value) {
  return value.replace(/\r\n/g, "\n").trim();
}
var StyleIntentSchema = z2.string().superRefine((value, context) => {
  if (Array.from(value).length > MAX_STYLE_INTENT_CODE_POINTS) {
    context.addIssue({
      code: "too_big",
      maximum: MAX_STYLE_INTENT_CODE_POINTS,
      inclusive: true,
      origin: "string",
      message: `Style intent must be at most ${MAX_STYLE_INTENT_CODE_POINTS} code points.`
    });
  }
});
var StyleIntentInputSchema = z2.string().transform(normalizeStyleIntent).pipe(StyleIntentSchema);
var field = (value) => z2.object({
  value,
  provenance: ProvenanceSchema,
  confidence: z2.number().min(0).max(1).nullable(),
  sourceReferenceIds: z2.array(UuidSchema),
  rule: z2.string().nullable()
});
var range = z2.object({ min: z2.number().min(0).max(1), max: z2.number().min(0).max(1) });
var StyleFieldsSchema = z2.object({
  palette: field(
    z2.array(z2.string().regex(/^#[0-9a-f]{6}$/i)).min(1).max(32)
  ),
  contrast: field(range),
  saturation: field(range),
  detailDensity: field(z2.number().min(0).max(1)),
  outlineWidth: field(z2.number().int().min(0).max(8)),
  outlineColor: field(z2.string().regex(/^#[0-9a-f]{6}$/i)),
  tileSize: field(z2.number().int().min(8).max(256)),
  antiAliasing: field(z2.boolean())
});
var StyleProfileRecipeSourceSchema = z2.discriminatedUnion("kind", [
  z2.object({
    kind: z2.literal("builtin"),
    styleCode: BuiltInStyleCodeSchema
  }).strict(),
  z2.object({
    kind: z2.literal("custom"),
    recipeId: UuidSchema,
    techniqueReferenceId: UuidSchema,
    acceptedPreviewId: UuidSchema
  }).strict()
]);
var CustomStyleProfileSummarySchema = z2.object({
  sourceStatus: z2.enum(["pending", "ready", "failed"]),
  comparisonSceneVersion: z2.string().trim().min(1).max(80),
  previewUrl: z2.url().nullable()
}).strict();
var StyleProfileBaseSchema = z2.object({
  projectId: UuidSchema,
  recipeSource: StyleProfileRecipeSourceSchema,
  selectedTechniqueStyleReferenceId: UuidSchema.nullable(),
  mode: StyleModeSchema,
  fields: StyleFieldsSchema,
  fingerprint: z2.string().regex(/^[0-9a-f]{64}$/),
  customSummary: CustomStyleProfileSummarySchema.optional(),
  effectivePalette: z2.object({
    source: z2.enum(["references", "manual", "builtin"]),
    colors: z2.array(z2.string().regex(/^#[0-9a-f]{6}$/)).max(32),
    referenceCount: z2.number().int().min(0).max(32),
    algorithmVersion: z2.literal("reference-palette-lab-v2").nullable(),
    status: z2.enum(["ready", "analyzing", "error"]),
    fallbackActive: z2.boolean(),
    errorCode: z2.string().trim().min(1).max(100).nullable()
  }).optional()
});
var enforceTechniqueSelectionRole = (value, context) => {
  if (value.recipeSource.kind === "custom" && value.selectedTechniqueStyleReferenceId !== null) {
    context.addIssue({
      code: "custom",
      path: ["selectedTechniqueStyleReferenceId"],
      message: "Custom Style Profiles cannot retain an ordinary technique selection."
    });
  }
};
var StyleProfileSchema = StyleProfileBaseSchema.superRefine(enforceTechniqueSelectionRole);
var StyleProfileUpdateSchema = StyleProfileBaseSchema.omit({
  projectId: true,
  fingerprint: true,
  effectivePalette: true,
  customSummary: true
}).extend({ selectedTechniqueStyleReferenceId: UuidSchema.nullable().default(null) }).superRefine(enforceTechniqueSelectionRole);
var StyleProfileSaveInputSchema = StyleProfileUpdateSchema.extend({
  expectedFingerprint: z2.string().regex(/^[0-9a-f]{64}$/)
}).strict();
var StyleProfileTechniqueSelectionSchema = z2.object({ referenceId: UuidSchema }).strict();
var BuiltInStyleSchema = z2.object({
  code: BuiltInStyleCodeSchema,
  mode: StyleModeSchema,
  fields: StyleFieldsSchema,
  nameKey: z2.string().trim().min(1).max(120),
  descriptionKey: z2.string().trim().min(1).max(160),
  previewManifestKey: z2.string().trim().min(1).max(160),
  traits: z2.array(z2.string().trim().min(1).max(80)).min(1).max(8)
});
var BuiltInStyleListSchema = z2.object({ styles: z2.array(BuiltInStyleSchema) }).superRefine(({ styles }, context) => {
  if (new Set(styles.map(({ code }) => code)).size !== styles.length) {
    context.addIssue({ code: "custom", message: "Built-in style codes must be unique." });
  }
});
var StyleCatalogFilterSchema = z2.enum(["all", "pixel", "raster"]);
var BuiltInStylePreviewManifestEntrySchema = z2.object({
  key: z2.string().trim().min(1).max(160),
  styleCode: BuiltInStyleCodeSchema,
  path: z2.string().trim().min(1).max(255).refine(
    (path) => path.startsWith("/") && !path.startsWith("//"),
    "Preview path must be local."
  ),
  width: z2.number().int().positive().max(4096),
  height: z2.number().int().positive().max(4096),
  provenance: z2.string().trim().min(1).max(255),
  usagePermission: z2.string().trim().min(1).max(255)
}).strict();
var BuiltInStylePreviewManifestSchema = z2.object({ version: z2.literal(1), entries: z2.array(BuiltInStylePreviewManifestEntrySchema) }).strict().superRefine(({ entries }, context) => {
  if (new Set(entries.map(({ key: key3 }) => key3)).size !== entries.length) {
    context.addIssue({ code: "custom", message: "Preview manifest keys must be unique." });
  }
  if (new Set(entries.map(({ styleCode }) => styleCode)).size !== entries.length) {
    context.addIssue({ code: "custom", message: "Preview manifest style codes must be unique." });
  }
});

// packages/contracts/src/generation-style.ts
var HexColorSchema = z3.string().regex(/^#[0-9a-f]{6}$/);
var ChecksumSchema = z3.string().regex(/^[0-9a-f]{64}$/);
var PaletteSourceSchema = z3.enum(["references", "manual", "builtin"]);
var PaletteRoleSchema = z3.enum(["dark", "light", "primary", "accent"]);
var GenerationImageRoleSchema = z3.enum([
  "rendering-technique",
  "palette",
  "world-identity",
  "composition",
  "character-identity"
]);
var StableGenerationErrorCodeSchema = z3.enum([
  "palette_decode_failed",
  "palette_empty",
  "palette_insufficient_contrast",
  "palette_structural_roles_missing",
  "recipe_unsupported",
  "snapshot_unsupported",
  "model_capability_unsupported",
  "snapshot_reference_unavailable",
  "anchor_unavailable",
  "processing_dimensions_invalid",
  "processing_subject_empty",
  "processing_subject_clipped",
  "processing_antialiasing_detected"
]);
var QualityFindingCodeSchema = z3.enum([
  "palette_drift",
  "palette_exact",
  "alpha_invalid",
  "subject_empty",
  "subject_clipped",
  "antialiasing_detected",
  "semi_transparent_halo",
  "provider_aspect_deviation",
  "outline_invalid",
  "dimensions_invalid",
  "contrast_out_of_range",
  "saturation_out_of_range",
  "safe_area_invalid",
  "background_not_removed",
  "subject_not_viable",
  "pixel_noise_excessive"
]);
var PaletteColorSchema = z3.object({
  hex: HexColorSchema,
  role: PaletteRoleSchema,
  weight: z3.number().min(0).max(1)
}).strict();
var ReferenceVisualAnalysisSchema = z3.object({
  version: z3.literal("reference-palette-lab-v2"),
  referenceId: UuidSchema,
  checksum: ChecksumSchema,
  colors: z3.array(PaletteColorSchema).min(2).max(32),
  contrast: z3.object({ min: z3.number().min(0).max(1), max: z3.number().min(0).max(1) }),
  saturation: z3.object({ min: z3.number().min(0).max(1), max: z3.number().min(0).max(1) }),
  detailDensity: z3.number().min(0).max(1),
  sampledPixels: z3.number().int().positive().max(2e4)
}).strict();
var ResolvedPaletteSchema = z3.object({
  source: PaletteSourceSchema,
  colors: z3.array(PaletteColorSchema).min(2).max(32),
  referenceIds: z3.array(UuidSchema).max(32),
  referenceChecksums: z3.array(ChecksumSchema).max(32),
  algorithmVersion: z3.literal("reference-palette-lab-v2").nullable()
}).strict().superRefine((value, context) => {
  const usesReferences = value.source === "references";
  if (usesReferences !== (value.referenceIds.length > 0 && value.referenceChecksums.length === value.referenceIds.length)) {
    context.addIssue({
      code: "custom",
      message: "Reference palette provenance must contain matching IDs and checksums."
    });
  }
  if (usesReferences !== (value.algorithmVersion !== null)) {
    context.addIssue({
      code: "custom",
      message: "Only reference palettes declare the analysis algorithm."
    });
  }
  if (new Set(value.colors.map(({ hex }) => hex)).size !== value.colors.length) {
    context.addIssue({ code: "custom", message: "Resolved palette colors must be unique." });
  }
});
var GenerationReferenceSchema = z3.object({
  id: UuidSchema,
  checksum: ChecksumSchema,
  order: z3.number().int().min(0).max(31),
  purpose: z3.enum(["technique-reference", "style-reference", "moodboard-screen"]),
  roles: z3.array(GenerationImageRoleSchema).min(1).max(2)
}).strict().superRefine((value, context) => {
  const roles = new Set(value.roles);
  if (roles.size !== value.roles.length)
    context.addIssue({ code: "custom", message: "Reference roles must be unique." });
  const expectedRoles = value.purpose === "technique-reference" ? ["rendering-technique"] : value.purpose === "style-reference" ? value.roles.includes("rendering-technique") ? ["rendering-technique", "palette"] : ["palette"] : ["world-identity"];
  if (roles.size !== expectedRoles.length || expectedRoles.some((role) => !roles.has(role)))
    context.addIssue({
      code: "custom",
      message: "Reference purpose and roles are inconsistent."
    });
});
var GenerationAnchorSchema = z3.object({
  key: z3.string().trim().min(1).max(120),
  checksum: ChecksumSchema,
  width: z3.number().int().positive().max(4096),
  height: z3.number().int().positive().max(4096),
  role: z3.literal("rendering-technique"),
  enabled: z3.boolean(),
  decision: z3.enum(["benchmark-passed", "text-only", "unsupported-capability"])
}).strict();
var TechniqueRecipeContentSchema = z3.object({
  id: z3.string().trim().min(1).max(100),
  version: z3.string().regex(/^\d+\.\d+\.\d+$/),
  supportedOperations: z3.array(
    z3.enum(["gameplay-moodboard", "character", "prop", "background", "ui-icon", "ui-surface"])
  ).min(6).max(6),
  shape: z3.array(z3.string().trim().min(1).max(300)).min(1).max(8),
  geometry: z3.array(z3.string().trim().min(1).max(300)).min(1).max(8),
  materials: z3.array(z3.string().trim().min(1).max(300)).min(1).max(8),
  lighting: z3.array(z3.string().trim().min(1).max(300)).min(1).max(8),
  detail: z3.array(z3.string().trim().min(1).max(300)).min(1).max(8),
  forbidden: z3.array(z3.string().trim().min(1).max(300)).min(1).max(12)
}).strict();
var TechniqueExtractionResponseSchema = TechniqueRecipeContentSchema.pick({
  shape: true,
  geometry: true,
  materials: true,
  lighting: true,
  detail: true,
  forbidden: true
}).strict();
var TechniqueRecipeSchema = TechniqueRecipeContentSchema.extend({
  styleCode: BuiltInStyleCodeSchema,
  anchorKey: z3.string().trim().min(1).max(120)
}).strict();
var ProcessingPolicySchema = z3.object({
  version: z3.literal("generation-processing-v4"),
  mode: StyleModeSchema,
  resize: z3.enum(["nearest", "lanczos3"]),
  exactPalette: z3.boolean(),
  rasterColorTransfer: z3.boolean(),
  dithering: z3.literal("off"),
  alphaThreshold: z3.number().int().min(0).max(255),
  outline: z3.object({
    width: z3.number().int().min(0).max(8),
    color: HexColorSchema,
    connectivity: z3.union([z3.literal(4), z3.literal(8)])
  })
}).strict();
var QualityPolicySchema = z3.object({
  version: z3.literal("generation-quality-v4"),
  mode: StyleModeSchema,
  paletteAdherenceMinimum: z3.number().min(0).max(1),
  paletteDistanceMeanMaximum: z3.number().finite().min(0).max(200).optional(),
  paletteDistanceP95Maximum: z3.number().finite().min(0).max(200).optional(),
  blockOnPaletteDrift: z3.boolean(),
  requireAlpha: z3.boolean(),
  blockOnClipping: z3.boolean(),
  blockOnAntialiasing: z3.boolean(),
  pixelNoiseMaximum: z3.number().min(0).max(1).optional()
}).strict().superRefine((value, context) => {
  if (value.paletteDistanceMeanMaximum === void 0 || value.paletteDistanceP95Maximum === void 0)
    context.addIssue({
      code: "custom",
      message: "Quality policy v4 requires palette-distance limits."
    });
});
var GenerationQualityReportSchema = z3.object({
  version: z3.literal("generation-quality-v4"),
  effectiveFingerprint: ChecksumSchema,
  paletteSource: PaletteSourceSchema,
  paletteAdherenceBefore: z3.number().min(0).max(1),
  paletteAdherenceAfter: z3.number().min(0).max(1),
  outOfPaletteRatioBefore: z3.number().min(0).max(1),
  outOfPaletteRatioAfter: z3.number().min(0).max(1),
  paletteDistanceMeanBefore: z3.number().finite().min(0).max(200).optional(),
  paletteDistanceP95Before: z3.number().finite().min(0).max(200).optional(),
  width: z3.number().int().positive(),
  height: z3.number().int().positive(),
  sourceCanvas: z3.object({ width: z3.number().int().positive(), height: z3.number().int().positive() }).strict(),
  targetCanvas: z3.object({ width: z3.number().int().positive(), height: z3.number().int().positive() }).strict(),
  processedCanvas: z3.object({ width: z3.number().int().positive(), height: z3.number().int().positive() }).strict(),
  requestedAspectDeviation: z3.number().finite().min(0).max(100).nullable(),
  targetAspectDeviation: z3.number().finite().min(0).max(100).nullable(),
  upscaled: z3.boolean(),
  upscaleFactor: z3.number().finite().min(1).max(100),
  appliedFit: z3.enum(["cover_attention", "isolated_subject", "ui_icon_safe_area"]),
  hasAlpha: z3.boolean(),
  subjectEmpty: z3.boolean(),
  subjectClipped: z3.boolean(),
  antialiasingDetected: z3.boolean(),
  semiTransparentHalo: z3.boolean(),
  outlineValid: z3.boolean(),
  stages: z3.object({
    raw: z3.object({ opaqueRatio: z3.number().min(0).max(1), placeholderDetected: z3.boolean() }).strict(),
    fitted: z3.object({ opaqueRatio: z3.number().min(0).max(1), subjectViable: z3.boolean().nullable() }).strict(),
    final: z3.object({
      opaqueRatio: z3.number().min(0).max(1),
      smallComponentRatio: z3.number().min(0).max(1).nullable()
    }).strict()
  }).strict(),
  findings: z3.array(
    z3.object({
      code: QualityFindingCodeSchema,
      severity: z3.enum(["warning", "blocker"])
    })
  ).max(32)
}).strict().superRefine((value, context) => {
  if (value.paletteDistanceMeanBefore === void 0 || value.paletteDistanceP95Before === void 0)
    context.addIssue({
      code: "custom",
      message: "Quality report v4 requires pre-quantization palette distances."
    });
  if (value.width !== value.processedCanvas.width || value.height !== value.processedCanvas.height)
    context.addIssue({
      code: "custom",
      message: "Processed canvas must match report dimensions."
    });
  if (value.targetCanvas.width !== value.processedCanvas.width || value.targetCanvas.height !== value.processedCanvas.height)
    context.addIssue({
      code: "custom",
      message: "Processed canvas must match the exact target canvas."
    });
});
var UiIconQualityReportSchema = GenerationQualityReportSchema.safeExtend({
  appliedFit: z3.literal("ui_icon_safe_area"),
  safeAreaInset: z3.number().int().min(1).max(8),
  alphaBounds: z3.object({
    left: z3.number().int().nonnegative(),
    top: z3.number().int().nonnegative(),
    width: z3.number().int().nonnegative(),
    height: z3.number().int().nonnegative()
  }).strict().nullable()
}).strict();
var EffectiveStyleSchema = z3.object({
  baseStyleCode: BuiltInStyleCodeSchema,
  mode: StyleModeSchema,
  fields: StyleFieldsSchema,
  savedFingerprint: ChecksumSchema,
  recipe: TechniqueRecipeSchema.pick({ id: true, styleCode: true, version: true }),
  customRecipe: TechniqueRecipeContentSchema.nullable(),
  anchor: GenerationAnchorSchema
}).strict();

// packages/contracts/src/generation-candidates.ts
var MAX_GENERATION_VARIANTS = 4;
var MAX_GENERATION_CANVAS_EDGE = 8192;
var CandidateModelSelectionSchema = z4.array(z4.string().trim().min(1).max(160)).min(1).max(MAX_GENERATION_VARIANTS).superRefine((models, context) => {
  if (new Set(models).size !== models.length) {
    context.addIssue({ code: "custom", message: "Selected models must be distinct." });
  }
});
var CandidatePlanEntrySchema = z4.object({
  index: z4.number().int().min(0).max(MAX_GENERATION_VARIANTS - 1),
  modelId: z4.string().trim().min(1).max(160),
  provider: z4.literal("openrouter"),
  targetWidth: z4.number().int().positive().max(MAX_GENERATION_CANVAS_EDGE),
  targetHeight: z4.number().int().positive().max(MAX_GENERATION_CANVAS_EDGE),
  endpoint: z4.object({
    providerSlug: z4.string().trim().min(1).max(120),
    providerTag: z4.string().trim().min(1).max(120).nullable(),
    catalogChecksum: ChecksumSchema,
    capabilityFingerprint: ChecksumSchema
  }).strict(),
  targetCanvas: z4.object({
    width: z4.number().int().positive().max(MAX_GENERATION_CANVAS_EDGE),
    height: z4.number().int().positive().max(MAX_GENERATION_CANVAS_EDGE)
  }).strict(),
  plannedProviderCanvas: z4.object({
    width: z4.number().int().positive().max(MAX_GENERATION_CANVAS_EDGE),
    height: z4.number().int().positive().max(MAX_GENERATION_CANVAS_EDGE)
  }).strict().nullable(),
  providerRequest: z4.discriminatedUnion("mode", [
    z4.object({
      mode: z4.literal("exact_size"),
      size: z4.string().trim().regex(/^\d+x\d+$/i).max(40)
    }).strict(),
    z4.object({
      mode: z4.literal("resolution_aspect"),
      resolution: z4.string().trim().min(2).max(40),
      aspectRatio: z4.string().trim().regex(/^\d+:\d+$/).max(20)
    }).strict(),
    z4.object({
      mode: z4.literal("aspect_only"),
      aspectRatio: z4.string().trim().regex(/^\d+:\d+$/).max(20)
    }).strict(),
    z4.object({ mode: z4.literal("uncontrolled") }).strict()
  ])
}).strict().superRefine((value, context) => {
  if (value.targetCanvas.width !== value.targetWidth || value.targetCanvas.height !== value.targetHeight) {
    context.addIssue({
      code: "custom",
      path: ["targetCanvas"],
      message: "Target canvas must match target dimensions."
    });
  }
  if ((value.providerRequest.mode === "aspect_only" || value.providerRequest.mode === "uncontrolled") && value.plannedProviderCanvas !== null) {
    context.addIssue({
      code: "custom",
      path: ["plannedProviderCanvas"],
      message: "Aspect-only requests cannot invent a provider canvas."
    });
  }
  if (value.providerRequest.mode !== "aspect_only" && value.providerRequest.mode !== "uncontrolled" && value.plannedProviderCanvas === null) {
    context.addIssue({
      code: "custom",
      path: ["plannedProviderCanvas"],
      message: "Controlled requests require a planned provider canvas."
    });
  }
});
var GenerationCandidateStatusSchema = z4.enum([
  "planned",
  "generating",
  "draft",
  "processing",
  "ready",
  "rejected",
  "generation_failed",
  "processing_failed"
]);
var CandidateProcessingRunStatusSchema = z4.enum([
  "queued",
  "running",
  "ready",
  "failed",
  "cancelled"
]);
var CandidateSafeErrorCodeSchema = z4.enum([
  "asset_processing_input_invalid",
  "dependency_unavailable",
  "generation_failed",
  "invalid_provider_response",
  "model_capability_unsupported",
  "processing_failed",
  "processing_cancelled",
  "processing_quality_blocked",
  "provider_attempt_prompt_conflict",
  "provider_prompt_too_long",
  "provider_rejected",
  "provider_unavailable",
  "raw_checksum_mismatch",
  "snapshot_unsupported",
  "source_unavailable",
  "style_profile_conflict",
  ...QualityFindingCodeSchema.options
]);
var GenerationCandidateSchema = z4.object({
  id: UuidSchema,
  jobId: UuidSchema,
  index: z4.number().int().min(0),
  modelId: z4.string(),
  status: GenerationCandidateStatusSchema,
  width: z4.number().int().positive().nullable(),
  height: z4.number().int().positive().nullable(),
  mimeType: z4.enum(["image/jpeg", "image/png", "image/webp"]).nullable(),
  byteSize: z4.number().int().positive().nullable(),
  rawChecksum: ChecksumSchema.nullable(),
  processedWidth: z4.number().int().positive().nullable(),
  processedHeight: z4.number().int().positive().nullable(),
  processedEditorType: z4.enum(["pixel", "raster"]).nullable(),
  previewUrl: z4.url().nullable(),
  processingRunId: UuidSchema.nullable(),
  outputKind: z4.enum(["asset-revision", "reference", "profile-preview"]).nullable(),
  outputEntityId: UuidSchema.nullable(),
  outputRevisionId: UuidSchema.nullable(),
  safeErrorCode: CandidateSafeErrorCodeSchema.nullable(),
  qualityReport: GenerationQualityReportSchema.nullable().optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
}).strict();
var CandidateProcessingRunSchema = z4.object({
  id: UuidSchema,
  candidateId: UuidSchema,
  status: CandidateProcessingRunStatusSchema,
  policyFingerprint: ChecksumSchema,
  safeErrorCode: CandidateSafeErrorCodeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
}).strict();
var CandidateProcessingParamsSchema = z4.object({ projectId: UuidSchema, jobId: UuidSchema, candidateId: UuidSchema }).strict();
var GenerationCandidatePreviewSchema = z4.object({ previewUrl: z4.url(), expiresAt: IsoDateTimeSchema }).strict();
var ApproveCandidateRequestSchema = z4.object({ idempotencyKey: z4.string().trim().min(1).max(120) }).strict();
var ApproveCandidateResponseSchema = z4.object({ candidate: GenerationCandidateSchema, run: CandidateProcessingRunSchema }).strict();
var RestoreCandidateRequestSchema = z4.object({}).strict();

// packages/contracts/src/generation-reference-selection.ts
import { z as z6 } from "zod/v4";

// packages/contracts/src/catalog.ts
import { z as z5 } from "zod/v4";

// packages/contracts/src/document-markdown.ts
import MarkdownIt from "markdown-it";
var parser = new MarkdownIt({ html: true, linkify: false, typographer: false });
parser.validateLink = () => true;
var DocumentMarkdownPolicyError = class extends Error {
};
function validateDocumentMarkdown(markdown2) {
  parseMarkdown(markdown2);
}
function isSafeMarkdown(markdown2) {
  try {
    validateDocumentMarkdown(markdown2);
    return true;
  } catch {
    return false;
  }
}
function markdownHasText(markdown2) {
  const hasText = (tokens) => tokens.some(
    (token) => token.children ? hasText(token.children) : ["text", "code_inline", "fence", "code_block"].includes(token.type) && token.content.trim().length > 0
  );
  try {
    return hasText(parseMarkdown(markdown2));
  } catch {
    return false;
  }
}
function parseMarkdown(markdown2) {
  if (markdown2.includes("\0") || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(markdown2))
    throw new DocumentMarkdownPolicyError("Invalid text encoding.");
  const environment = { references: {} };
  const tokens = parser.parse(markdown2, environment);
  validateTokens(tokens);
  for (const reference of Object.values(environment.references)) {
    if (!isHttpLink(reference.href))
      throw new DocumentMarkdownPolicyError("Only HTTP(S) links are allowed.");
  }
  return tokens;
}
function validateTokens(tokens) {
  for (const token of tokens) {
    if (token.type === "html_block" || token.type === "html_inline")
      throw new DocumentMarkdownPolicyError("Raw HTML is not allowed.");
    if (token.type === "image") throw new DocumentMarkdownPolicyError("Images are not allowed.");
    if (token.type === "link_open") {
      const href = token.attrGet("href") ?? "";
      if (typeof href !== "string" || !isHttpLink(href))
        throw new DocumentMarkdownPolicyError("Only HTTP(S) links are allowed.");
    }
    if (token.children) validateTokens(token.children);
  }
}
function isHttpLink(value) {
  let decoded = value.trim();
  for (let index = 0; index < 3; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return false;
    }
  }
  return /^https?:\/\/[^/\s?#]+(?:[/?#][^\s]*)?$/i.test(decoded);
}

// packages/contracts/src/catalog.ts
function catalogText(limit) {
  return z5.string().refine(
    (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
    "Text must contain well-formed Unicode without NUL."
  ).overwrite((value) => value.replace(/\r\n?/g, "\n").trim()).refine(
    (value) => Array.from(value).length <= limit,
    `Text must not exceed ${limit} code points.`
  );
}
function utf8ByteLength(value) {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    bytes += point <= 127 ? 1 : point <= 2047 ? 2 : point <= 65535 ? 3 : 4;
  }
  return bytes;
}
var nullableText = (limit) => catalogText(limit).nullable();
var proseText = (limit) => catalogText(limit).refine(isSafeMarkdown, "Invalid Markdown.");
var nullableProse = (limit) => proseText(limit).nullable();
var inputProse = (limit) => proseText(limit).transform((value) => value || null).nullable().default(null);
var nullableInputText = (limit) => catalogText(limit).transform((value) => value || null).nullable().default(null);
var requiredName = catalogText(120).min(1);
var CatalogRevisionSchema = z5.number().int().positive().max(Number.MAX_SAFE_INTEGER);
var CatalogExpectedRevisionSchema = CatalogRevisionSchema.max(Number.MAX_SAFE_INTEGER - 1);
var parameterBase = {
  key: z5.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
  label: catalogText(120).min(1),
  unit: nullableInputText(40)
};
var CatalogScalarParameterSchema = z5.discriminatedUnion("type", [
  z5.strictObject({ ...parameterBase, type: z5.literal("string"), value: catalogText(2e3) }),
  z5.strictObject({
    ...parameterBase,
    type: z5.literal("number"),
    value: z5.number().refine(
      (value) => !Number.isInteger(value) || Number.isSafeInteger(value),
      "Integer parameters must be safe integers."
    )
  }),
  z5.strictObject({ ...parameterBase, type: z5.literal("boolean"), value: z5.boolean() })
]);
var CatalogParametersSchema = z5.array(CatalogScalarParameterSchema).max(64).superRefine((parameters, context) => {
  const keys = /* @__PURE__ */ new Set();
  for (const [index, parameter] of parameters.entries()) {
    if (keys.has(parameter.key))
      context.addIssue({
        code: "custom",
        path: [index, "key"],
        message: "Parameter keys must be unique."
      });
    keys.add(parameter.key);
  }
  if (utf8ByteLength(JSON.stringify(parameters)) > 32 * 1024)
    context.addIssue({
      code: "custom",
      message: "Parameters must not exceed 32 KiB UTF-8."
    });
});
var CatalogProfileInputSchema = z5.strictObject({
  name: requiredName,
  summary: inputProse(1e3),
  description: inputProse(16e3),
  visualBrief: nullableInputText(4e3),
  parameters: CatalogParametersSchema.default([])
});
var ItemProfileInputSchema = CatalogProfileInputSchema.extend({
  category: nullableInputText(80)
}).strict();
var CatalogProfileSchema = z5.strictObject({
  name: requiredName,
  summary: nullableProse(1e3),
  description: nullableProse(16e3),
  visualBrief: nullableText(4e3),
  parameters: CatalogParametersSchema
});
var ItemProfileSchema = CatalogProfileSchema.extend({
  category: nullableText(80)
}).strict();
var recordFields = {
  id: UuidSchema,
  projectId: UuidSchema,
  revision: CatalogRevisionSchema,
  archivedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
};
var WorldSchema = CatalogProfileSchema.extend(recordFields).strict();
var LocationSchema = CatalogProfileSchema.extend({
  ...recordFields,
  worldId: UuidSchema.nullable()
}).strict();
var ItemSchema = ItemProfileSchema.extend(recordFields).strict();
var CatalogEntityKindSchema = z5.enum(["world", "location", "item"]);
var WorldCreateRequestSchema = CatalogProfileInputSchema.pick({ name: true }).strict();
var LocationCreateRequestSchema = CatalogProfileInputSchema.pick({ name: true }).strict();
var ItemCreateRequestSchema = ItemProfileInputSchema.pick({ name: true }).strict();
var WorldReplaceRequestSchema = z5.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema,
  profile: CatalogProfileInputSchema
});
var LocationReplaceRequestSchema = WorldReplaceRequestSchema;
var ItemReplaceRequestSchema = z5.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema,
  profile: ItemProfileInputSchema
});
var CatalogLifecycleRequestSchema = z5.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema
});
var LocationPlacementRequestSchema = z5.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema,
  worldId: UuidSchema.nullable()
});
var page = {
  cursor: z5.string().trim().min(1).max(500).optional(),
  limit: z5.coerce.number().int().min(1).max(100).default(25)
};
var WorldListQuerySchema = z5.strictObject({
  state: z5.enum(["active", "archived"]).default("active"),
  search: catalogText(120).min(1).optional(),
  ...page
});
var LocationListQuerySchema = z5.strictObject({
  state: z5.enum(["active", "archived"]).default("active"),
  search: catalogText(120).min(1).optional(),
  worldId: z5.preprocess(
    (value) => value === "null" ? null : value,
    UuidSchema.nullable().optional()
  ),
  ...page
});
var ItemListQuerySchema = z5.strictObject({
  state: z5.enum(["active", "archived"]).default("active"),
  search: catalogText(120).min(1).optional(),
  locationId: UuidSchema.optional(),
  ...page
});
var WorldParamsSchema = z5.strictObject({ projectId: UuidSchema, worldId: UuidSchema });
var LocationParamsSchema = z5.strictObject({
  projectId: UuidSchema,
  locationId: UuidSchema
});
var ItemParamsSchema = z5.strictObject({ projectId: UuidSchema, itemId: UuidSchema });
var LocationItemParamsSchema = z5.strictObject({
  projectId: UuidSchema,
  locationId: UuidSchema,
  linkId: UuidSchema
});
var LocationItemLinkCreateRequestSchema = z5.strictObject({
  expectedLocationRevision: CatalogExpectedRevisionSchema,
  itemId: UuidSchema,
  notes: inputProse(2e3)
});
var LocationItemLinkReplaceRequestSchema = z5.strictObject({
  expectedLocationRevision: CatalogExpectedRevisionSchema,
  notes: inputProse(2e3)
});
var LocationItemLinkRemoveRequestSchema = z5.strictObject({
  expectedLocationRevision: CatalogExpectedRevisionSchema
});
var CatalogLinkListQuerySchema = z5.strictObject({
  cursor: UuidSchema.optional(),
  limit: z5.coerce.number().int().min(1).max(100).default(25)
});
var CatalogEndpointSchema = z5.strictObject({
  id: UuidSchema,
  name: requiredName,
  archivedAt: IsoDateTimeSchema.nullable()
});
var LocationItemLinkSchema = z5.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  location: CatalogEndpointSchema,
  item: CatalogEndpointSchema,
  notes: nullableProse(2e3),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var CatalogCommandReceiptSchema = z5.strictObject({
  operation: z5.string().min(1).max(32),
  targetKind: z5.enum(["world", "location", "item", "location-item", "slot"]),
  targetId: UuidSchema,
  targetRevision: z5.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  catalogRevision: z5.number().int().positive().max(Number.MAX_SAFE_INTEGER)
});
var catalogPage = (entry) => z5.strictObject({
  entries: z5.array(entry).max(100),
  nextCursor: z5.string().max(500).nullable(),
  total: z5.number().int().nonnegative()
});
var WorldListResponseSchema = catalogPage(WorldSchema);
var LocationListResponseSchema = catalogPage(LocationSchema);
var ItemListResponseSchema = catalogPage(ItemSchema);
var LocationItemLinkListResponseSchema = catalogPage(LocationItemLinkSchema);
var LocationSceneBacklinkListResponseSchema = catalogPage(CatalogEndpointSchema);
var LocationQuestBacklinkListResponseSchema = catalogPage(CatalogEndpointSchema);
var CatalogIdResponseSchema = z5.strictObject({ id: UuidSchema });

// packages/contracts/src/generation-reference-selection.ts
var SelectedReferenceIdsSchema = z6.array(UuidSchema).max(32).refine((ids) => new Set(ids).size === ids.length, "Selected references must be unique.");
var GenerationSelectionSchema = z6.strictObject({
  selectedReferenceIds: SelectedReferenceIdsSchema,
  contextFingerprint: ChecksumSchema
});
var MoodboardMetadataSchema = z6.strictObject({
  displayName: catalogText(160).min(1),
  locationId: UuidSchema.nullable().default(null)
});
var GenerationContextRequestSchema = z6.strictObject({
  operation: z6.enum([
    "gameplay-moodboard",
    "character",
    "prop",
    "background",
    "ui-icon",
    "ui-surface"
  ]),
  selectedReferenceIds: SelectedReferenceIdsSchema
});
var GenerationContextSchema = z6.strictObject({
  fingerprint: ChecksumSchema,
  selectedReferenceIds: SelectedReferenceIdsSchema,
  imageInputCount: z6.number().int().min(0).max(32),
  styleCode: BuiltInStyleCodeSchema,
  techniqueSource: z6.enum(["style-reference", "text-recipe", "custom"]),
  mandatoryTechniqueReferenceId: UuidSchema.nullable(),
  palette: z6.strictObject({
    source: PaletteSourceSchema,
    colors: z6.array(HexColorSchema).min(1).max(32),
    referenceCount: z6.number().int().min(0).max(32)
  }),
  moodboardWorldCount: z6.number().int().min(0).max(32)
});

// packages/contracts/src/projects.ts
import { z as z7 } from "zod/v4";
var CameraSchema = z7.enum(["side", "top-down", "isometric", "three-quarter", "front"]);
var TargetEngineSchema = z7.enum(["generic", "unity", "godot", "tiled"]);
var RuntimePlatformSchema = z7.enum([
  "windows",
  "macos",
  "linux",
  "web",
  "ios",
  "android",
  "console"
]);
var ProjectDescriptionSchema = z7.string().trim().max(2e3).refine((value) => !value.includes("\0"), "Project brief cannot contain a null character.").refine(
  (value) => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
  "Project brief must contain well-formed Unicode."
).refine(isSafeMarkdown, "Invalid Markdown.");
var ProjectPublishingContextFields = {
  description: ProjectDescriptionSchema.min(1).nullable(),
  targetPlatforms: z7.array(RuntimePlatformSchema).max(RuntimePlatformSchema.options.length).superRefine((value, context) => {
    if (new Set(value).size !== value.length) {
      context.addIssue({ code: "custom", message: "Runtime platforms must be unique." });
    }
  })
};
var ProjectSettingsSchema = z7.object(ProjectPublishingContextFields).strict();
var ProjectPublishingContextInputFields = {
  description: ProjectDescriptionSchema.transform((value) => value || null).nullable().default(null),
  targetPlatforms: ProjectPublishingContextFields.targetPlatforms.default([])
};
var ProjectGenreSchema = z7.string().trim().min(1).refine(
  (value) => Array.from(value).length <= 120 && !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
  "Genre must be valid text of at most 120 code points."
);
var ProjectEditableFieldsSchema = z7.strictObject({
  name: z7.string().trim().min(1).max(160),
  genre: ProjectGenreSchema.nullable().default(null),
  status: z7.enum(["active", "archived"]).default("active"),
  ...ProjectPublishingContextInputFields
});
var ProjectCreateRequestSchema = ProjectEditableFieldsSchema.extend({
  studioId: UuidSchema
});
var ProjectUpdateRequestSchema = z7.strictObject({
  name: ProjectEditableFieldsSchema.shape.name.optional(),
  genre: ProjectEditableFieldsSchema.shape.genre.removeDefault().optional(),
  status: z7.enum(["active", "archived"]).optional(),
  description: ProjectEditableFieldsSchema.shape.description.removeDefault().optional(),
  targetPlatforms: ProjectEditableFieldsSchema.shape.targetPlatforms.removeDefault().optional()
});
var ProjectSchema = z7.strictObject({
  id: UuidSchema,
  studioId: UuidSchema,
  name: z7.string(),
  slug: z7.string(),
  genre: ProjectGenreSchema.nullable(),
  ...ProjectPublishingContextFields,
  status: z7.enum(["active", "archived"]),
  deletedAt: z7.string().nullable(),
  purgeAfter: z7.string().nullable(),
  createdAt: z7.string(),
  updatedAt: z7.string()
});
var ProjectListResponseSchema = z7.object({ projects: z7.array(ProjectSchema) });
var ProjectParamsSchema = z7.object({ projectId: UuidSchema });
var ProjectQuerySchema = z7.object({
  studioId: UuidSchema,
  trash: z7.enum(["true", "false"]).optional().transform((value) => value === "true")
});

// packages/contracts/src/generation.ts
var ScreenPresetSchema = z8.enum(["gameplay", "menu", "inventory", "location-overview"]);
var MoodboardCreateRequestSchema = z8.strictObject({
  ...GenerationSelectionSchema.shape,
  ...MoodboardMetadataSchema.shape,
  brief: z8.string().trim().min(10).max(4e3),
  screenPreset: ScreenPresetSchema,
  candidateCount: z8.number().int().min(1).max(MAX_GENERATION_VARIANTS).default(4),
  modelIds: CandidateModelSelectionSchema,
  camera: CameraSchema.optional(),
  sourceGenerationId: UuidSchema.optional()
});
var GenerationJobStatusSchema = z8.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled"
]);
var GenerationKindSchema = z8.enum([
  "gameplay-moodboard",
  "character",
  "prop",
  "background",
  "ui-icon",
  "ui-surface",
  "style-preview"
]);
var StylePreviewCreateRequestSchema = z8.object({
  techniqueReferenceId: UuidSchema,
  mode: StyleModeSchema,
  authoringDescription: StyleIntentInputSchema,
  previewModelId: z8.string().trim().min(1).max(160)
}).strict();
var StylePreviewEndpointSchema = z8.object({
  modelId: z8.string().trim().min(1).max(160),
  providerSlug: z8.string().trim().min(1).max(120),
  providerTag: z8.string().trim().min(1).max(120).nullable(),
  catalogChecksum: z8.string().regex(/^[0-9a-f]{64}$/),
  capabilityFingerprint: z8.string().regex(/^[0-9a-f]{64}$/)
}).strict();
var StylePreviewPlanSchema = z8.object({
  extractionPolicyVersion: z8.string().trim().min(1).max(80),
  extractionEndpoint: StylePreviewEndpointSchema,
  previewEndpoint: StylePreviewEndpointSchema,
  comparisonSceneVersion: z8.literal("style-comparison-scene-v1")
}).strict().superRefine((value, context) => {
  if (value.extractionEndpoint.modelId === value.previewEndpoint.modelId) {
    context.addIssue({
      code: "custom",
      path: ["previewEndpoint", "modelId"],
      message: "Extraction and preview endpoints must be separately pinned."
    });
  }
});
var SnapshottedGenerationContextSchema = z8.object({
  techniqueSource: z8.enum(["style-reference", "text-recipe", "custom"]),
  paletteSource: z8.enum(["references", "manual", "builtin"]),
  paletteReferenceCount: z8.number().int().min(0).max(32),
  moodboardWorldCount: z8.number().int().min(0).max(32)
}).strict();
var GenerationJobBaseSchema = z8.object({
  id: UuidSchema,
  projectId: UuidSchema,
  characterId: UuidSchema.nullable().default(null),
  status: GenerationJobStatusSchema,
  stage: z8.string(),
  progress: z8.number().int().min(0).max(100),
  screenPreset: ScreenPresetSchema.nullable(),
  brief: z8.string(),
  candidateCount: z8.number().int(),
  errorMessage: z8.string().nullable(),
  modelIds: z8.array(z8.string()).default([]),
  snapshottedContext: SnapshottedGenerationContextSchema.nullable(),
  moodboard: MoodboardMetadataSchema.nullable().default(null),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var WorldGenerationJobSchema = GenerationJobBaseSchema.extend({
  kind: GenerationKindSchema.extract(["gameplay-moodboard", "prop", "background"]),
  camera: CameraSchema
}).strict();
var CharacterGenerationJobSchema = GenerationJobBaseSchema.extend({
  kind: z8.literal("character"),
  characterId: UuidSchema,
  camera: CameraSchema
}).strict();
var UiIconGenerationJobSchema = GenerationJobBaseSchema.extend({
  kind: GenerationKindSchema.extract(["ui-icon", "ui-surface"])
}).strict();
var StylePreviewGenerationJobSchema = GenerationJobBaseSchema.extend({
  kind: z8.literal("style-preview"),
  mode: StyleModeSchema,
  comparisonSceneVersion: z8.literal("style-comparison-scene-v1")
}).strict().superRefine((value, context) => {
  if (value.candidateCount !== 1 || value.modelIds.length !== 1) {
    context.addIssue({
      code: "custom",
      message: "Style previews require exactly one candidate and preview model."
    });
  }
});
var GenerationJobSchema = z8.discriminatedUnion("kind", [
  WorldGenerationJobSchema,
  CharacterGenerationJobSchema,
  UiIconGenerationJobSchema,
  StylePreviewGenerationJobSchema
]);
var GenerationHistoryItemBaseSchema = GenerationJobBaseSchema.extend({
  reportedCostUsd: z8.number().finite().nonnegative(),
  displayName: z8.string().trim().min(1).max(160).nullable().optional(),
  representativeCandidateId: UuidSchema.nullable()
});
var WorldGenerationHistoryItemSchema = GenerationHistoryItemBaseSchema.extend({
  kind: GenerationKindSchema.extract(["gameplay-moodboard", "prop", "background"]),
  camera: CameraSchema
}).strict();
var CharacterGenerationHistoryItemSchema = GenerationHistoryItemBaseSchema.extend({
  kind: z8.literal("character"),
  characterId: UuidSchema,
  camera: CameraSchema
}).strict();
var UiIconGenerationHistoryItemSchema = GenerationHistoryItemBaseSchema.extend({
  kind: z8.literal("ui-icon")
}).strict();
var UiSurfaceGenerationHistoryItemSchema = GenerationHistoryItemBaseSchema.extend({
  kind: z8.literal("ui-surface"),
  surfaceKind: z8.enum(["button", "panel", "frame", "slot", "progress-track", "progress-fill"])
}).strict();
var StylePreviewGenerationHistoryItemSchema = GenerationHistoryItemBaseSchema.extend({
  kind: z8.literal("style-preview"),
  mode: StyleModeSchema,
  comparisonSceneVersion: z8.literal("style-comparison-scene-v1")
}).strict().superRefine((value, context) => {
  if (value.candidateCount !== 1 || value.modelIds.length !== 1) {
    context.addIssue({
      code: "custom",
      message: "Style previews require exactly one candidate and preview model."
    });
  }
});
var GenerationHistoryItemSchema = z8.discriminatedUnion("kind", [
  WorldGenerationHistoryItemSchema,
  CharacterGenerationHistoryItemSchema,
  UiIconGenerationHistoryItemSchema,
  UiSurfaceGenerationHistoryItemSchema,
  StylePreviewGenerationHistoryItemSchema
]);
var GenerationJobListSchema = z8.object({
  jobs: z8.array(GenerationHistoryItemSchema),
  nextCursor: z8.string().datetime({ offset: true }).nullable().default(null)
}).strict();
var StylePreviewDetailSummarySchema = z8.object({
  paletteSource: z8.enum(["references", "manual", "builtin"]),
  paletteReferenceCount: z8.number().int().min(0).max(32),
  comparisonSceneVersion: z8.literal("style-comparison-scene-v1"),
  techniqueTraits: z8.array(z8.string().trim().min(1).max(300)).max(4)
}).strict();
var GenerationDetailSchema = z8.object({
  job: GenerationJobSchema,
  candidates: z8.array(GenerationCandidateSchema),
  stylePreviewSummary: StylePreviewDetailSummarySchema.nullable()
}).strict();
var GenerationJobParamsSchema = z8.object({ projectId: UuidSchema, jobId: UuidSchema });
var GenerationContinuationRequestSchema = z8.object({ modelId: z8.string().trim().min(1).max(160).optional() }).strict();
var GenerationContinuationResponseSchema = z8.object({ job: GenerationJobSchema }).strict();

// packages/contracts/src/activity.ts
var StudioActivityActionSchema = z9.enum(["cancel", "retry", "clone", "open-project-jobs"]);
var StudioActivityProjectSchema = z9.object({ id: UuidSchema, name: z9.string().trim().min(1).max(160) }).strict();
var StudioActivityJobSchema = z9.object({
  id: UuidSchema,
  project: StudioActivityProjectSchema,
  kind: GenerationKindSchema,
  displayName: z9.string().trim().min(1).max(160).nullable().optional(),
  representativeCandidateId: UuidSchema.nullable().optional(),
  status: GenerationJobStatusSchema,
  stage: z9.string().trim().min(1).max(80),
  progress: z9.number().int().min(0).max(100),
  permittedActions: z9.array(StudioActivityActionSchema).max(4),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  completedAt: IsoDateTimeSchema.nullable()
}).strict();
var StudioActivityQuerySchema = z9.object({ studioId: UuidSchema, recentLimit: z9.coerce.number().int().min(0).max(20).default(10) }).strict();
var StudioActivityFeedSchema = z9.object({
  studioId: UuidSchema,
  active: z9.array(StudioActivityJobSchema).max(20),
  recent: z9.array(StudioActivityJobSchema).max(20),
  reconciledAt: IsoDateTimeSchema
}).strict();

// packages/contracts/src/admin.ts
import { z as z10 } from "zod/v4";
var ADMIN_DEFAULT_PAGE_SIZE = 25;
var ADMIN_MAX_PAGE_SIZE = 100;
var ADMIN_MAX_SEARCH_LENGTH = 120;
var AdminSortDirectionSchema = z10.enum(["asc", "desc"]);
var AdminPageRequestSchema = z10.object({
  page: z10.coerce.number().int().min(1).default(1),
  pageSize: z10.coerce.number().int().min(1).max(ADMIN_MAX_PAGE_SIZE).default(ADMIN_DEFAULT_PAGE_SIZE),
  direction: AdminSortDirectionSchema.default("desc")
}).strict();
var AdminSearchSchema = z10.string().trim().min(1).max(ADMIN_MAX_SEARCH_LENGTH);
var AdminDateTimeFilterSchema = IsoDateTimeSchema;
function AdminPageSchema(item) {
  return z10.object({
    items: z10.array(item).max(ADMIN_MAX_PAGE_SIZE),
    page: z10.number().int().min(1),
    pageSize: z10.number().int().min(1).max(ADMIN_MAX_PAGE_SIZE),
    rowCount: z10.number().int().nonnegative()
  }).strict();
}
var AdminDashboardSchema = z10.object({
  users: z10.number().int().nonnegative(),
  studios: z10.number().int().nonnegative(),
  projects: z10.number().int().nonnegative(),
  jobs: z10.object({
    queued: z10.number().int().nonnegative(),
    running: z10.number().int().nonnegative(),
    succeeded: z10.number().int().nonnegative(),
    failed: z10.number().int().nonnegative(),
    cancelled: z10.number().int().nonnegative()
  }).strict(),
  usage: z10.object({ attempts: z10.number().int().nonnegative(), costUsd: z10.number().nonnegative() }).strict(),
  registrationEnabled: z10.boolean()
}).strict();
var RegistrationToggleSchema = z10.object({ enabled: z10.boolean() }).strict();

// packages/contracts/src/admin-generations.ts
import { z as z11 } from "zod/v4";
var GenerationAttemptStatusSchema = z11.enum(["running", "succeeded", "failed"]);
var GenerationAttemptPhaseSchema = z11.enum(["generation", "style-extraction", "style-preview"]);
var PaletteSourceSchema2 = z11.enum(["references", "manual", "builtin"]);
var AdminGenerationInputBase = {
  candidateCount: z11.number().int().min(1).max(4),
  modelIds: z11.array(z11.string().trim().min(3).max(160)).min(1).max(4)
};
var AdminWorldGenerationInputSchema = z11.object({
  kind: GenerationKindSchema.extract(["gameplay-moodboard", "character", "prop", "background"]),
  camera: z11.string().trim().min(1).max(40),
  ...AdminGenerationInputBase
}).strict();
var AdminUiGenerationInputSchema = z11.object({
  kind: GenerationKindSchema.extract(["ui-icon", "ui-surface"]),
  ...AdminGenerationInputBase
}).strict();
var AdminStylePreviewGenerationInputSchema = z11.object({
  kind: z11.literal("style-preview"),
  mode: z11.enum(["pixel", "raster"]),
  candidateCount: z11.literal(1),
  modelIds: z11.array(z11.string().trim().min(3).max(160)).length(1),
  comparisonSceneVersion: z11.literal("style-comparison-scene-v1")
}).strict();
var BoundedUsageSchema = z11.record(z11.string().regex(/^[a-z][a-z0-9_]{0,63}$/i), z11.number().finite().nonnegative()).superRefine((usage, context) => {
  if (Object.keys(usage).length > 20) {
    context.addIssue({ code: "custom", message: "Usage must contain at most 20 fields." });
  }
});
var AdminGenerationSortSchema = z11.enum([
  "createdAt",
  "startedAt",
  "completedAt",
  "status",
  "costUsd",
  "durationMs"
]);
var AdminGenerationSummarySchema = z11.object({
  id: UuidSchema,
  userId: UuidSchema,
  userEmail: z11.string().trim().toLowerCase().email().max(320),
  studioId: UuidSchema,
  studioName: z11.string().trim().min(1).max(160),
  projectId: UuidSchema,
  projectName: z11.string().trim().min(1).max(160),
  kind: GenerationKindSchema,
  status: GenerationJobStatusSchema,
  stage: z11.string().trim().min(1).max(80),
  models: z11.array(z11.string().trim().min(1).max(160)).max(16),
  candidateCount: z11.number().int().nonnegative(),
  attemptCount: z11.number().int().nonnegative(),
  durationMs: z11.number().int().nonnegative().nullable(),
  costUsd: z11.number().finite().nonnegative(),
  failureCode: z11.string().trim().min(1).max(100).nullable(),
  createdAt: IsoDateTimeSchema,
  startedAt: IsoDateTimeSchema.nullable(),
  completedAt: IsoDateTimeSchema.nullable()
}).strict();
var AdminGenerationQuerySchema = AdminPageRequestSchema.extend({
  sort: AdminGenerationSortSchema.default("createdAt"),
  search: AdminSearchSchema.optional(),
  studioId: UuidSchema.optional(),
  projectId: UuidSchema.optional(),
  kind: GenerationKindSchema.optional(),
  status: GenerationJobStatusSchema.optional(),
  model: z11.string().trim().min(3).max(160).optional(),
  hasFailure: z11.enum(["true", "false"]).transform((value) => value === "true").optional(),
  createdAfter: AdminDateTimeFilterSchema.optional(),
  createdBefore: AdminDateTimeFilterSchema.optional()
}).strict();
var AdminGenerationPageSchema = AdminPageSchema(AdminGenerationSummarySchema);
var AdminResultMediaSchema = z11.strictObject({
  candidateId: UuidSchema,
  source: z11.enum(["raw", "promoted"]),
  revisionId: UuidSchema.nullable(),
  width: z11.number().int().positive().max(16384),
  height: z11.number().int().positive().max(16384),
  mimeType: z11.enum(["image/png", "image/webp"])
});
var AdminRecentResultSchema = z11.strictObject({
  generationId: UuidSchema,
  projectId: UuidSchema,
  kind: GenerationKindSchema,
  completedAt: IsoDateTimeSchema,
  media: AdminResultMediaSchema
});
var AdminRecentResultsSchema = z11.strictObject({
  items: z11.array(AdminRecentResultSchema).max(12)
});
var AdminGenerationTraceSchema = z11.object({
  recipeId: z11.string().trim().min(1).max(100),
  recipeVersion: z11.string().trim().min(1).max(30),
  compilerVersion: z11.string().trim().min(1).max(80),
  effectiveFingerprint: z11.string().regex(/^[0-9a-f]{64}$/),
  camera: z11.string().trim().min(1).max(40),
  paletteSource: PaletteSourceSchema2,
  anchorDecision: z11.string().trim().min(1).max(80),
  referenceChecksums: z11.array(z11.string().regex(/^[0-9a-f]{64}$/)).max(16),
  references: z11.array(
    z11.object({
      order: z11.number().int().min(0).max(31),
      purpose: z11.enum(["technique-reference", "style-reference", "moodboard-screen"]),
      roles: z11.array(z11.string().trim().min(1).max(80)).min(1).max(4),
      checksum: z11.string().regex(/^[0-9a-f]{64}$/)
    }).strict()
  ).max(16),
  benchmarkStatuses: z11.array(
    z11.object({
      modelId: z11.string().trim().min(1).max(160),
      status: z11.enum(["unverified", "eligible", "blocked"])
    }).strict()
  ).max(4),
  normalizedInput: z11.discriminatedUnion("kind", [
    AdminWorldGenerationInputSchema,
    AdminUiGenerationInputSchema,
    AdminStylePreviewGenerationInputSchema
  ])
}).strict();
var AdminGenerationAttemptSchema = z11.object({
  id: UuidSchema.optional(),
  candidateIndex: z11.number().int().nonnegative(),
  phase: GenerationAttemptPhaseSchema,
  attemptNumber: z11.number().int().positive(),
  provider: z11.string().trim().min(1).max(40),
  model: z11.string().trim().min(1).max(160),
  status: GenerationAttemptStatusSchema,
  latencyMs: z11.number().int().nonnegative().nullable(),
  usage: BoundedUsageSchema,
  reportedCostUsd: z11.number().finite().nonnegative().nullable(),
  errorCode: z11.string().trim().min(1).max(100).nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  media: AdminResultMediaSchema.nullable().optional(),
  promotedMedia: AdminResultMediaSchema.nullable().optional()
}).strict();
var AdminGenerationAttemptPageSchema = AdminPageSchema(AdminGenerationAttemptSchema);
var AdminGenerationDetailSchema = z11.object({
  generation: AdminGenerationSummarySchema,
  userInput: z11.object({
    brief: z11.string().trim().min(10).max(4e3),
    screenPreset: ScreenPresetSchema
  }).strict(),
  trace: AdminGenerationTraceSchema,
  attempts: z11.array(AdminGenerationAttemptSchema).max(16)
}).strict();

// packages/contracts/src/admin-users.ts
import { z as z12 } from "zod/v4";
var UserStatusSchema = z12.enum(["active", "disabled"]);
var StudioKindSchema = z12.enum(["personal", "team"]);
var StudioRoleSchema = z12.enum(["owner", "admin", "member"]);
var AdminUserSortSchema = z12.enum(["email", "createdAt", "status", "membershipCount"]);
var AdminUserMembershipSummarySchema = z12.object({
  studioId: UuidSchema,
  name: z12.string().trim().min(1).max(160),
  slug: z12.string().trim().min(1).max(180),
  kind: StudioKindSchema,
  role: StudioRoleSchema
}).strict();
var AdminUserSummarySchema = z12.object({
  id: UuidSchema,
  email: z12.string().trim().toLowerCase().email().max(320),
  status: UserStatusSchema,
  locale: LocaleSchema,
  isPlatformAdmin: z12.boolean(),
  createdAt: IsoDateTimeSchema,
  membershipCount: z12.number().int().nonnegative(),
  memberships: z12.array(AdminUserMembershipSummarySchema).max(3)
}).strict();
var AdminUserQuerySchema = AdminPageRequestSchema.extend({
  sort: AdminUserSortSchema.default("createdAt"),
  search: AdminSearchSchema.optional(),
  status: UserStatusSchema.optional(),
  locale: LocaleSchema.optional(),
  isPlatformAdmin: z12.enum(["true", "false"]).transform((value) => value === "true").optional(),
  studioId: UuidSchema.optional(),
  createdAfter: AdminDateTimeFilterSchema.optional(),
  createdBefore: AdminDateTimeFilterSchema.optional()
}).strict();
var AdminUserPageSchema = AdminPageSchema(AdminUserSummarySchema);

// packages/contracts/src/agent-access.ts
import { z as z13 } from "zod/v4";
var AgentTokenScopeSchema = z13.enum([
  "projects:read",
  "projects:write",
  "references:read",
  "references:write",
  "generations:read",
  "generations:write",
  "assets:read",
  "assets:export"
]);
var AgentTokenScopesSchema = z13.array(AgentTokenScopeSchema).min(1).max(AgentTokenScopeSchema.options.length).superRefine((scopes, context) => {
  if (new Set(scopes).size !== scopes.length) {
    context.addIssue({ code: "custom", message: "Agent token scopes must be unique." });
  }
});
var AgentTokenCreateRequestSchema = z13.strictObject({
  studioId: UuidSchema,
  label: z13.string().trim().min(1).max(120),
  expiresAt: IsoDateTimeSchema,
  scopes: AgentTokenScopesSchema
}).superRefine((value, context) => {
  const expiry = Date.parse(value.expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    context.addIssue({
      code: "custom",
      path: ["expiresAt"],
      message: "Token expiry must be in the future."
    });
    return;
  }
  if (expiry > Date.now() + 90 * 864e5) {
    context.addIssue({
      code: "custom",
      path: ["expiresAt"],
      message: "Token expiry must be no more than 90 days away."
    });
  }
});
var AgentTokenMetadataSchema = z13.strictObject({
  id: UuidSchema,
  studioId: UuidSchema,
  label: z13.string().min(1).max(120),
  prefix: z13.string().regex(/^sfat_[A-Za-z0-9_-]{6,24}$/),
  scopes: AgentTokenScopesSchema,
  expiresAt: IsoDateTimeSchema,
  createdAt: IsoDateTimeSchema,
  lastUsedAt: IsoDateTimeSchema.nullable(),
  revokedAt: IsoDateTimeSchema.nullable()
});
var AgentTokenListResponseSchema = z13.strictObject({
  tokens: z13.array(AgentTokenMetadataSchema)
});
var AgentTokenListQuerySchema = z13.strictObject({ studioId: UuidSchema });
var AgentTokenCreateResponseSchema = z13.strictObject({
  token: z13.string().regex(/^sfat_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{32,}$/),
  metadata: AgentTokenMetadataSchema
});
var AgentTokenParamsSchema = z13.strictObject({ tokenId: UuidSchema });
var AgentTokenRevokeResponseSchema = z13.strictObject({ token: AgentTokenMetadataSchema });

// packages/contracts/src/assets.ts
import { z as z14 } from "zod/v4";
var AssetKindSchema = z14.enum([
  "character",
  "prop",
  "background",
  "ui-icon",
  "ui-surface",
  "ui-indicator"
]);
var UiSurfaceKindSchema = z14.enum([
  "button",
  "panel",
  "frame",
  "slot",
  "progress-track",
  "progress-fill"
]);
var UiIconTargetSizeSchema = z14.union([
  z14.literal(32),
  z14.literal(48),
  z14.literal(64),
  z14.literal(96),
  z14.literal(128)
]);
var AssetAnchorGeometrySchema = z14.object({
  pivotX: z14.number().finite().min(0).max(1),
  pivotY: z14.number().finite().min(0).max(1),
  baselineY: z14.number().finite().min(0).max(1)
}).strict();
var AssetCreateRequestBaseSchema = z14.object({
  ...GenerationSelectionSchema.shape,
  name: z14.string().trim().min(1).max(160),
  brief: z14.string().trim().min(10).max(4e3),
  width: z14.number().int().min(8).max(2048),
  height: z14.number().int().min(8).max(2048),
  direction: z14.enum(["none", "front", "left", "right", "back"]),
  geometry: AssetAnchorGeometrySchema.default({ pivotX: 0.5, pivotY: 1, baselineY: 0.9 }),
  candidateCount: z14.number().int().min(1).max(MAX_GENERATION_VARIANTS).default(2),
  modelIds: CandidateModelSelectionSchema,
  camera: CameraSchema.optional(),
  targetAssetId: UuidSchema.optional(),
  sourceGenerationId: UuidSchema.optional()
});
var CharacterAssetCreateRequestSchema = AssetCreateRequestBaseSchema.extend({
  kind: z14.literal("character"),
  characterId: UuidSchema,
  silhouette: z14.string().trim().max(500).default("")
}).strict();
var PropAssetCreateRequestSchema = AssetCreateRequestBaseSchema.extend({
  kind: z14.literal("prop")
}).strict();
var BackgroundAssetCreateRequestSchema = z14.object({
  ...GenerationSelectionSchema.shape,
  kind: z14.literal("background"),
  name: z14.string().trim().min(1).max(160),
  brief: z14.string().trim().min(10).max(4e3),
  candidateCount: z14.number().int().min(1).max(MAX_GENERATION_VARIANTS).default(2),
  modelIds: CandidateModelSelectionSchema,
  camera: CameraSchema.optional(),
  targetAssetId: UuidSchema.optional(),
  sourceGenerationId: UuidSchema.optional()
}).strict();
var UiIconAssetCreateRequestSchema = z14.object({
  ...GenerationSelectionSchema.shape,
  kind: z14.literal("ui-icon"),
  name: z14.string().trim().min(1).max(160),
  brief: z14.string().trim().min(10).max(4e3),
  size: UiIconTargetSizeSchema,
  candidateCount: z14.number().int().min(1).max(MAX_GENERATION_VARIANTS).default(2),
  modelIds: CandidateModelSelectionSchema,
  targetAssetId: UuidSchema.optional(),
  sourceGenerationId: UuidSchema.optional()
}).strict();
var UiSurfaceAssetCreateRequestSchema = z14.strictObject({
  ...GenerationSelectionSchema.shape,
  kind: z14.literal("ui-surface"),
  name: z14.string().trim().min(1).max(160),
  surfaceKind: UiSurfaceKindSchema,
  description: z14.string().trim().min(10).max(4e3),
  width: z14.number().int().min(16).max(512),
  height: z14.number().int().min(16).max(512),
  candidateCount: z14.number().int().min(1).max(MAX_GENERATION_VARIANTS).default(2),
  modelIds: CandidateModelSelectionSchema,
  targetAssetId: UuidSchema.optional(),
  sourceGenerationId: UuidSchema.optional()
}).superRefine((value, context) => {
  if (value.width % 8 || value.height % 8 || Math.max(value.width, value.height) / Math.min(value.width, value.height) > 8) {
    context.addIssue({ code: "custom", message: "UI surface target is unsupported." });
  }
});
var AssetCreateRequestSchema = z14.discriminatedUnion("kind", [
  CharacterAssetCreateRequestSchema,
  PropAssetCreateRequestSchema,
  BackgroundAssetCreateRequestSchema,
  UiIconAssetCreateRequestSchema,
  UiSurfaceAssetCreateRequestSchema
]);
var BackgroundRevisionMetadataSchema = z14.object({
  topology: z14.literal("static"),
  viewportWidth: z14.number().int().min(64).max(8192),
  viewportHeight: z14.number().int().min(64).max(8192)
}).strict();
var UiIconRevisionMetadataSchema = z14.object({
  policyVersion: z14.literal("ui-icon-processing-v1"),
  safeAreaInset: z14.number().int().min(1).max(8)
}).strict();
var UiSurfaceInsetsSchema = z14.strictObject({
  left: z14.number().int().min(0).max(512),
  right: z14.number().int().min(0).max(512),
  top: z14.number().int().min(0).max(512),
  bottom: z14.number().int().min(0).max(512)
});
var UiSurfaceGeometrySchema = z14.discriminatedUnion("sliceMode", [
  z14.strictObject({
    sliceMode: z14.literal("none"),
    contentInsets: UiSurfaceInsetsSchema
  }),
  z14.strictObject({
    sliceMode: z14.literal("nine-slice"),
    sliceMargins: UiSurfaceInsetsSchema,
    contentInsets: UiSurfaceInsetsSchema
  })
]);
function validateUiSurfaceGeometry(input2) {
  return UiSurfaceGeometrySchema.safeParse(input2.geometry).success ? (() => {
    const geometry = UiSurfaceGeometrySchema.parse(input2.geometry);
    const validInsets = (insets) => insets.left + insets.right < input2.width && insets.top + insets.bottom < input2.height;
    if (!Number.isInteger(input2.width) || !Number.isInteger(input2.height) || input2.width < 1 || input2.height < 1 || !validInsets(geometry.contentInsets)) {
      return { success: false };
    }
    if (geometry.sliceMode === "nine-slice" && (!validInsets(geometry.sliceMargins) || geometry.contentInsets.left < geometry.sliceMargins.left || geometry.contentInsets.right < geometry.sliceMargins.right || geometry.contentInsets.top < geometry.sliceMargins.top || geometry.contentInsets.bottom < geometry.sliceMargins.bottom)) {
      return { success: false };
    }
    return { success: true, data: geometry };
  })() : { success: false };
}
var UiSurfaceRevisionMetadataSchema = z14.strictObject({
  surfaceKind: UiSurfaceKindSchema,
  processingVersion: z14.enum(["ui-surface-processing-v2", "ui-surface-processing-v3", "ui-surface-processing-v4"]).optional(),
  geometry: UiSurfaceGeometrySchema,
  statePolicyVersion: z14.literal("ui-surface-states-v1").nullable()
}).superRefine((value, context) => {
  if (value.surfaceKind === "button" !== (value.statePolicyVersion !== null)) {
    context.addIssue({ code: "custom", message: "Only button revisions have a state policy." });
  }
});
var UiSurfaceGeometrySaveRequestSchema = z14.strictObject({
  geometry: UiSurfaceGeometrySchema
});
var UiIndicatorSourcePinSchema = z14.strictObject({
  assetId: UuidSchema,
  revisionId: UuidSchema,
  checksum: ChecksumSchema,
  width: z14.number().int().positive(),
  height: z14.number().int().positive()
});
var UiIndicatorBoundsSchema = z14.strictObject({
  x: z14.number().finite().min(0).max(1),
  y: z14.number().finite().min(0).max(1),
  width: z14.number().finite().positive().max(1),
  height: z14.number().finite().positive().max(1)
}).superRefine((value, context) => {
  if (value.x + value.width > 1 || value.y + value.height > 1)
    context.addIssue({ code: "custom", message: "Indicator bounds exceed the source canvas." });
});
var UiIndicatorIconSchema = z14.strictObject({
  source: UiIndicatorSourcePinSchema,
  x: z14.number().finite().min(0).max(1),
  y: z14.number().finite().min(0).max(1),
  size: z14.number().finite().positive().max(1),
  sampling: z14.enum(["nearest-v1", "bilinear-v1"])
});
var UiIndicatorLinearCompositionSchema = z14.strictObject({
  kind: z14.literal("linear"),
  track: UiIndicatorSourcePinSchema,
  fill: UiIndicatorSourcePinSchema,
  bounds: UiIndicatorBoundsSchema,
  direction: z14.enum(["left-to-right", "right-to-left", "bottom-to-top", "top-to-bottom"]),
  icon: UiIndicatorIconSchema.optional()
});
var UiIndicatorRadialCompositionSchema = z14.strictObject({
  kind: z14.literal("radial"),
  track: UiIndicatorSourcePinSchema,
  fill: UiIndicatorSourcePinSchema,
  startAngle: z14.number().int().min(0).max(359),
  rotation: z14.enum(["clockwise", "counter-clockwise"]),
  maskPolicy: z14.enum(["pixel-v1", "raster-v1"]).default("pixel-v1"),
  icon: UiIndicatorIconSchema.optional()
});
var UiIndicatorSegmentedCompositionSchema = z14.strictObject({
  kind: z14.literal("segmented"),
  inactive: UiIndicatorSourcePinSchema,
  active: UiIndicatorSourcePinSchema,
  segmentCount: z14.number().int().min(2).max(20),
  orientation: z14.enum(["horizontal", "vertical"]),
  spacing: z14.number().int().min(0).max(64),
  icon: UiIndicatorIconSchema.optional()
});
var UiIndicatorCompositionSchema = z14.discriminatedUnion("kind", [
  UiIndicatorLinearCompositionSchema,
  UiIndicatorRadialCompositionSchema,
  UiIndicatorSegmentedCompositionSchema
]);
var UiIndicatorRevisionMetadataSchema = z14.strictObject({
  policyVersion: z14.literal("ui-indicator-composition-v2"),
  composition: UiIndicatorCompositionSchema
});
var UiIndicatorCreateRequestSchema = z14.strictObject({
  name: z14.string().trim().min(1).max(160),
  composition: UiIndicatorCompositionSchema
});
var UiIndicatorSourceOptionSchema = z14.strictObject({
  kind: z14.enum(["ui-surface", "ui-icon"]),
  editorType: z14.enum(["pixel", "raster"]),
  name: z14.string().min(1).max(160),
  previewUrl: z14.url().nullable(),
  surfaceKind: UiSurfaceKindSchema.nullable(),
  pin: UiIndicatorSourcePinSchema
});
var UiIndicatorSourceListSchema = z14.strictObject({
  sources: z14.array(UiIndicatorSourceOptionSchema).max(100),
  hasMore: z14.boolean()
});
var UiIndicatorSourceQuerySchema = z14.strictObject({
  search: z14.string().trim().max(160).default(""),
  offset: z14.coerce.number().int().min(0).max(1e5).default(0)
});
var UiIndicatorCreateResponseSchema = z14.strictObject({
  assetId: UuidSchema,
  revisionId: UuidSchema
});
var UiIndicatorEditRequestSchema = z14.strictObject({
  composition: UiIndicatorCompositionSchema
});
var UiIndicatorPreviewRequestSchema = z14.strictObject({
  composition: UiIndicatorCompositionSchema,
  value: z14.number().finite().min(0).max(1)
});
var UiIndicatorDuplicateRequestSchema = z14.strictObject({
  name: z14.string().trim().min(1).max(160)
});
var AssetRevisionBaseSchema = z14.object({
  id: UuidSchema,
  assetId: UuidSchema,
  sourceJobId: UuidSchema.nullable(),
  width: z14.number().int().positive(),
  height: z14.number().int().positive(),
  mimeType: z14.enum(["image/png", "image/webp"]),
  editorType: z14.enum(["pixel", "raster"]),
  styleFingerprint: z14.string().regex(/^[0-9a-f]{64}$/).nullable().optional(),
  effectiveFingerprint: ChecksumSchema.nullable().optional(),
  qualityFindings: z14.array(
    z14.object({
      code: QualityFindingCodeSchema,
      severity: z14.enum(["warning", "blocker"])
    })
  ).max(32).optional(),
  previewUrl: z14.url(),
  createdAt: IsoDateTimeSchema,
  nativePixelDocument: z14.boolean().optional()
});
var AnchoredAssetRevisionSchema = AssetRevisionBaseSchema.extend({
  kind: z14.union([z14.literal("character"), z14.literal("prop")]),
  geometry: AssetAnchorGeometrySchema
});
var BackgroundAssetRevisionSchema = AssetRevisionBaseSchema.extend({
  kind: z14.literal("background"),
  staticMetadata: BackgroundRevisionMetadataSchema
});
var UiIconAssetRevisionSchema = AssetRevisionBaseSchema.extend({
  kind: z14.literal("ui-icon"),
  iconMetadata: UiIconRevisionMetadataSchema
});
var UiSurfaceAssetRevisionSchema = AssetRevisionBaseSchema.extend({
  kind: z14.literal("ui-surface"),
  surfaceMetadata: UiSurfaceRevisionMetadataSchema
}).superRefine((value, context) => {
  if (!validateUiSurfaceGeometry({
    width: value.width,
    height: value.height,
    geometry: value.surfaceMetadata.geometry
  }).success) {
    context.addIssue({
      code: "custom",
      message: "UI surface geometry is invalid for the source canvas."
    });
  }
});
var UiIndicatorAssetRevisionSchema = AssetRevisionBaseSchema.omit({ previewUrl: true }).extend({
  kind: z14.literal("ui-indicator"),
  previewUrl: z14.string().regex(
    /^\/api\/projects\/[0-9a-f-]+\/ui-indicators\/[0-9a-f-]+\/revisions\/[0-9a-f-]+\/preview\?value=1$/
  ),
  indicatorMetadata: UiIndicatorRevisionMetadataSchema
});
var AssetRevisionSchema = z14.discriminatedUnion("kind", [
  AnchoredAssetRevisionSchema,
  BackgroundAssetRevisionSchema,
  UiIconAssetRevisionSchema,
  UiSurfaceAssetRevisionSchema,
  UiIndicatorAssetRevisionSchema
]);
var AssetSchema = z14.object({
  id: UuidSchema,
  projectId: UuidSchema,
  characterId: UuidSchema.nullable().default(null),
  kind: z14.enum([
    "character",
    "prop",
    "background",
    "ui-icon",
    "ui-surface",
    "ui-indicator",
    "tileset"
  ]),
  name: z14.string(),
  status: z14.enum(["draft", "accepted"]),
  acceptedRevisionId: UuidSchema.nullable(),
  revisions: z14.array(AssetRevisionSchema),
  currentStyleFingerprint: z14.string().regex(/^[0-9a-f]{64}$/).optional(),
  latestGenerationStyleFingerprint: z14.string().regex(/^[0-9a-f]{64}$/).nullable().optional(),
  styleState: z14.enum(["current", "stale", "unknown"]).optional(),
  regenerationReady: z14.boolean().optional(),
  activeRegenerationJobId: UuidSchema.nullable().optional(),
  sourceGenerationId: UuidSchema.nullable().optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var AssetListSchema = z14.object({ assets: z14.array(AssetSchema) });
var AssetGenerationResponseSchema = z14.object({
  job: GenerationJobSchema
});
var BackgroundExportSchema = z14.object({
  downloadUrl: z14.url(),
  mimeType: z14.enum(["image/png", "image/webp"]),
  metadata: BackgroundRevisionMetadataSchema.extend({
    width: z14.number().int().positive(),
    height: z14.number().int().positive()
  })
}).strict();
var UiIconExportSchema = z14.object({
  downloadUrl: z14.url(),
  mimeType: z14.enum(["image/png", "image/webp"]),
  metadata: UiIconRevisionMetadataSchema.extend({
    kind: z14.literal("ui-icon"),
    assetId: UuidSchema,
    revisionId: UuidSchema,
    sourceJobId: UuidSchema.nullable(),
    width: UiIconTargetSizeSchema,
    height: UiIconTargetSizeSchema,
    checksum: ChecksumSchema,
    editorType: z14.enum(["pixel", "raster"]),
    styleFingerprint: ChecksumSchema.nullable(),
    effectiveFingerprint: ChecksumSchema.nullable()
  }).superRefine((value, context) => {
    if (value.width !== value.height) {
      context.addIssue({ code: "custom", message: "UI icon export must remain square." });
    }
    if (value.safeAreaInset !== value.width / 16) {
      context.addIssue({ code: "custom", message: "UI icon export safe area is invalid." });
    }
  })
}).strict();
var UiSurfaceExportSchema = z14.strictObject({
  downloadUrl: z14.url(),
  mimeType: z14.enum(["image/png", "image/webp"]),
  stateDownloads: z14.strictObject({
    normal: z14.url(),
    hover: z14.url(),
    pressed: z14.url(),
    disabled: z14.url()
  }).nullable(),
  metadata: z14.strictObject({
    kind: z14.literal("ui-surface"),
    width: z14.number().int().min(16).max(512),
    height: z14.number().int().min(16).max(512),
    checksum: ChecksumSchema,
    surfaceKind: UiSurfaceKindSchema,
    processingVersion: z14.enum(["ui-surface-processing-v2", "ui-surface-processing-v3", "ui-surface-processing-v4"]).optional(),
    geometry: UiSurfaceGeometrySchema,
    statePolicyVersion: z14.literal("ui-surface-states-v1").nullable()
  }).superRefine((value, context) => {
    if (!validateUiSurfaceGeometry({
      width: value.width,
      height: value.height,
      geometry: value.geometry
    }).success) {
      context.addIssue({ code: "custom", message: "UI surface export geometry is invalid." });
    }
    if (value.surfaceKind === "button" !== (value.statePolicyVersion !== null)) {
      context.addIssue({ code: "custom", message: "UI surface export state policy is invalid." });
    }
  })
});
var UiIndicatorExportSchema = z14.strictObject({
  layers: z14.array(
    z14.strictObject({
      role: z14.enum(["track", "fill", "inactive", "active", "icon"]),
      geometry: UiSurfaceGeometrySchema.nullable(),
      downloadUrl: z14.url(),
      ...UiIndicatorSourcePinSchema.shape
    })
  ).min(2).max(3),
  manifest: z14.strictObject({
    family: z14.literal("ui-indicator"),
    policyVersion: z14.literal("ui-indicator-composition-v2"),
    composition: UiIndicatorCompositionSchema,
    sourceGeometry: z14.partialRecord(
      z14.enum(["track", "fill", "inactive", "active", "icon"]).or(z14.never()),
      UiSurfaceGeometrySchema.nullable()
    )
  })
});
var AssetParamsSchema = z14.object({
  projectId: UuidSchema,
  assetId: UuidSchema,
  revisionId: UuidSchema
});
var RevisionUploadInitRequestSchema = z14.strictObject({
  saveId: UuidSchema,
  parentRevisionId: UuidSchema.nullable(),
  checksum: ChecksumSchema,
  mimeType: z14.enum(["image/png", "image/webp"]),
  byteSize: z14.number().int().positive().max(25 * 1024 * 1024)
});
var RevisionUploadInitResponseSchema = z14.discriminatedUnion("complete", [
  z14.strictObject({
    revisionId: UuidSchema,
    complete: z14.literal(false),
    uploadUrl: z14.url(),
    requiredHeaders: z14.record(z14.string(), z14.string())
  }),
  z14.strictObject({ revisionId: UuidSchema, complete: z14.literal(true) })
]);
var RevisionUploadFileSchema = RevisionUploadInitRequestSchema.omit({
  byteSize: true
}).extend({ parentRevisionId: UuidSchema, path: z14.string().min(1).max(1024) });
var RevisionUploadCompleteRequestSchema = z14.object({
  parentRevisionId: UuidSchema.nullable()
});

// packages/contracts/src/auth.ts
import { z as z16 } from "zod/v4";

// packages/contracts/src/studio-identity.ts
import { z as z15 } from "zod/v4";
var StudioRevisionSchema = z15.number().int().positive().max(Number.MAX_SAFE_INTEGER);
var StudioLogoSchema = z15.strictObject({ id: UuidSchema, revision: StudioRevisionSchema });
var StudioSetupProgressSchema = z15.strictObject({
  studioId: UuidSchema,
  state: z15.enum(["pending", "completed", "deferred"]),
  revision: StudioRevisionSchema
});

// packages/contracts/src/auth.ts
var EmailSchema = z16.string().trim().toLowerCase().email().max(320);
var PasswordSchema = z16.string().min(10).max(256);
var SignUpRequestSchema = z16.object({
  email: EmailSchema,
  password: PasswordSchema,
  locale: LocaleSchema.default("en"),
  entryContext: z16.enum(["standalone", "invitation"]).optional()
});
var SignInRequestSchema = z16.object({
  email: EmailSchema,
  password: PasswordSchema
});
var StudioRoleSchema2 = z16.enum(["owner", "admin", "member"]);
var StudioSummarySchema = z16.object({
  id: UuidSchema,
  name: z16.string(),
  slug: z16.string(),
  kind: z16.enum(["personal", "team"]),
  role: StudioRoleSchema2,
  profileRevision: StudioRevisionSchema,
  logo: StudioLogoSchema.nullable()
});
var SessionUserSchema = z16.object({
  id: UuidSchema,
  email: EmailSchema,
  locale: LocaleSchema,
  isPlatformAdmin: z16.boolean()
});
var SessionResponseSchema = z16.object({
  user: SessionUserSchema,
  studios: z16.array(StudioSummarySchema).min(1),
  setup: StudioSetupProgressSchema.nullable()
});
var SignOutResponseSchema = z16.object({ ok: z16.literal(true) });

// packages/contracts/src/authoring-discovery.ts
import { z as z17 } from "zod/v4";
var TAG_LIMIT = 20;
var TAG_LENGTH = 40;
var SUMMARY_LENGTH = 240;
var AuthoringTagSchema = z17.string().refine(
  (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
  "Tags must contain well-formed Unicode without NUL."
).overwrite((value) => value.trim()).refine((value) => {
  const length = Array.from(value).length;
  return length >= 1 && length <= TAG_LENGTH;
}, `Tags must contain 1 to ${TAG_LENGTH} code points.`);
var AuthoringTagsSchema = z17.array(AuthoringTagSchema).max(TAG_LIMIT).superRefine((tags, context) => {
  const identities = /* @__PURE__ */ new Set();
  for (const [index, tag] of tags.entries()) {
    const identity = tag.normalize("NFC").toLocaleLowerCase("und");
    if (identities.has(identity))
      context.addIssue({
        code: "custom",
        path: [index],
        message: "Tags must be unique after Unicode normalization."
      });
    identities.add(identity);
  }
});
var ListSummaryProjectionSchema = z17.strictObject({
  text: z17.string().refine(
    (value) => Array.from(value).length <= SUMMARY_LENGTH,
    `Summaries must not exceed ${SUMMARY_LENGTH} code points.`
  ),
  truncated: z17.boolean()
});

// packages/contracts/src/automation.ts
import { z as z21 } from "zod/v4";

// packages/contracts/src/characters.ts
import { z as z18 } from "zod/v4";
function characterText(limit) {
  return z18.string().refine(
    (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
    "Text must contain well-formed Unicode without NUL."
  ).overwrite((value) => value.replace(/\r\n?/g, "\n").trim()).refine(
    (value) => Array.from(value).length <= limit,
    `Text must not exceed ${limit} code points.`
  );
}
var optionalProfileText = (limit) => characterText(limit).refine(isSafeMarkdown, "Invalid Markdown.").default("");
var CharacterProfileSchema = z18.strictObject({
  name: characterText(160).min(1),
  role: characterText(160).default(""),
  summary: optionalProfileText(2e3),
  biography: optionalProfileText(1e4),
  personality: optionalProfileText(4e3),
  goals: optionalProfileText(4e3),
  fears: optionalProfileText(4e3),
  conflicts: optionalProfileText(4e3),
  notes: optionalProfileText(4e3),
  tags: AuthoringTagsSchema.default([])
});
var CharacterRelationshipInputSchema = z18.strictObject({
  targetCharacterId: UuidSchema,
  type: characterText(80).min(1),
  description: optionalProfileText(2e3)
});
var CharacterRelationshipSchema = CharacterRelationshipInputSchema.extend({
  targetName: characterText(160).min(1),
  targetArchivedAt: IsoDateTimeSchema.nullable()
}).strict();
var CharacterSchema = CharacterProfileSchema.extend({
  id: UuidSchema,
  projectId: UuidSchema,
  revision: z18.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  archivedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
}).strict();
var CharacterListItemSchema = CharacterSchema.pick({
  id: true,
  projectId: true,
  name: true,
  revision: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  role: characterText(160),
  summary: ListSummaryProjectionSchema,
  tags: AuthoringTagsSchema
}).strict();
var CharacterListQuerySchema = z18.strictObject({
  state: z18.enum(["active", "archived"]).default("active"),
  cursor: z18.string().trim().min(1).max(500).optional(),
  limit: z18.coerce.number().int().min(1).max(100).default(50)
});
var CharacterListResponseSchema = z18.strictObject({
  characters: z18.array(CharacterListItemSchema).max(100),
  nextCursor: z18.string().nullable(),
  total: z18.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});
var CharacterDetailSchema = z18.strictObject({
  character: CharacterSchema,
  relationships: z18.array(CharacterRelationshipSchema).max(100)
});
var CharacterCreateRequestSchema = CharacterProfileSchema;
var CharacterReplaceRequestSchema = z18.strictObject({
  expectedRevision: z18.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1),
  profile: CharacterProfileSchema,
  relationships: z18.array(CharacterRelationshipInputSchema).max(100)
});
var CharacterLifecycleRequestSchema = z18.strictObject({
  expectedRevision: z18.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1)
});
var CharacterParamsSchema = z18.strictObject({
  projectId: UuidSchema,
  characterId: UuidSchema
});

// packages/contracts/src/project-art-settings.ts
import { z as z19 } from "zod/v4";
var ArtCameraSchema = z19.strictObject({
  primaryCamera: CameraSchema,
  cameraModes: z19.array(CameraSchema).min(1).max(CameraSchema.options.length)
}).superRefine((value, context) => {
  if (new Set(value.cameraModes).size !== value.cameraModes.length || !value.cameraModes.includes(value.primaryCamera)) {
    context.addIssue({
      code: "custom",
      path: ["cameraModes"],
      message: "Camera modes must be unique and contain the primary camera."
    });
  }
});
var ArtCanvasSchema = z19.strictObject({
  width: z19.number().int().min(64).max(8192),
  height: z19.number().int().min(64).max(8192)
});
var ArtTilesSchema = z19.strictObject({
  width: z19.number().int().min(8).max(256),
  height: z19.number().int().min(8).max(256)
});
var ProjectArtSettingsContentSchema = z19.strictObject({
  camera: ArtCameraSchema.nullable(),
  canvas: ArtCanvasSchema.nullable(),
  tiles: ArtTilesSchema.nullable(),
  targetEngine: TargetEngineSchema.nullable()
});
var ProjectArtSettingsSaveRequestSchema = z19.strictObject({
  expectedRevision: z19.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  content: ProjectArtSettingsContentSchema
});
var ProjectArtSettingsSchema = z19.strictObject({
  projectId: UuidSchema,
  revision: z19.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  content: ProjectArtSettingsContentSchema
}).refine(
  (value) => value.revision !== 0 || Object.values(value.content).every((section) => section === null),
  "Revision zero cannot contain configured sections."
);
var requiredSections = {
  character: ["camera"],
  prop: ["camera"],
  "gameplay-moodboard": ["camera", "canvas"],
  background: ["camera", "canvas"],
  "tileset-detection": ["tiles"],
  "ui-icon": [],
  "ui-surface": [],
  "style-extraction": [],
  "style-preview": [],
  "ui-indicator": [],
  "reference-intake": [],
  "retained-output": [],
  "metadata-edit": [],
  "existing-grid-edit": []
};
function missingArtSections(operation, content) {
  return requiredSections[operation].filter((section) => content[section] === null);
}

// packages/contracts/src/uploads.ts
import { z as z20 } from "zod/v4";
var ImageMimeSchema = z20.enum(["image/png", "image/jpeg", "image/webp"]);
var UploadInitRequestSchema = z20.object({
  fileName: z20.string().trim().min(1).max(255),
  mimeType: ImageMimeSchema,
  byteSize: z20.number().int().positive().max(25 * 1024 * 1024)
});
var AutomationReferenceUploadInitRequestSchema = UploadInitRequestSchema.extend({
  purpose: z20.literal("style-reference"),
  checksum: z20.string().regex(/^[0-9a-f]{64}$/)
}).strict();
var AutomationTechniqueUploadInitRequestSchema = AutomationReferenceUploadInitRequestSchema.extend({
  purpose: z20.literal("technique-reference")
}).strict();
var AutomationIdempotencyKeySchema = z20.string().regex(/^[A-Za-z0-9_.:-]{1,120}$/);
var UploadInitResponseSchema = z20.object({
  referenceId: UuidSchema,
  uploadUrl: z20.url(),
  expiresInSeconds: z20.number().int().positive(),
  requiredHeaders: z20.record(z20.string(), z20.string())
});
var AutomationUploadInitResponseSchema = z20.discriminatedUnion("status", [
  UploadInitResponseSchema.extend({ status: z20.literal("pending") }).strict(),
  z20.strictObject({ referenceId: UuidSchema, status: z20.literal("ready") })
]);
var AutomationUploadAbortResponseSchema = z20.strictObject({
  referenceId: UuidSchema,
  status: z20.enum(["pending", "ready"])
});
var ReferenceParamsSchema = z20.object({ projectId: UuidSchema, referenceId: UuidSchema });
var ReferencePurposeSchema = z20.enum(["style-reference", "moodboard-screen"]);
var ReferenceListQuerySchema = z20.object({ purpose: ReferencePurposeSchema.optional() }).strict();
var UploadCompleteResponseSchema = z20.object({
  id: UuidSchema,
  projectId: UuidSchema,
  status: z20.literal("ready"),
  mimeType: ImageMimeSchema,
  byteSize: z20.number().int().positive(),
  width: z20.number().int().positive(),
  height: z20.number().int().positive(),
  checksum: z20.string().length(64),
  previewUrl: z20.url()
});
var ReferenceAssetSchema = UploadCompleteResponseSchema.extend({
  source: z20.enum(["upload", "generation"]),
  purpose: z20.enum(["style-reference", "moodboard-screen"]),
  originalName: z20.string(),
  moodboard: MoodboardMetadataSchema.nullable().default(null),
  screenPreset: z20.enum(["gameplay", "menu", "inventory", "location-overview"]).nullable(),
  approved: z20.boolean(),
  sortOrder: z20.number().int(),
  analysisStatus: z20.enum(["pending", "ready", "failed"]),
  analysisVersion: z20.literal("reference-palette-lab-v2").nullable(),
  analysisErrorCode: z20.string().nullable(),
  createdAt: z20.iso.datetime()
}).superRefine(({ purpose, source }, context) => {
  if (source === "upload" && purpose !== "style-reference" || source === "generation" && purpose !== "moodboard-screen") {
    context.addIssue({
      code: "custom",
      path: ["purpose"],
      message: "Reference purpose must match its immutable source."
    });
  }
});
var ReferenceListResponseSchema = z20.object({
  references: z20.array(ReferenceAssetSchema)
});
var ReferenceUpdateRequestSchema = z20.object({
  approved: z20.boolean().optional(),
  sortOrder: z20.number().int().min(0).optional()
}).refine((value) => value.approved !== void 0 || value.sortOrder !== void 0, {
  message: "At least one field is required."
});

// packages/contracts/src/automation.ts
var AutomationProtocolVersionSchema = z21.literal("game-studio-automation/v1");
var AutomationAssetSchema = AssetSchema.omit({ revisions: true }).strict();
var AutomationCandidatePreviewSchema = z21.strictObject({
  previewUrl: z21.url(),
  expiresAt: z21.iso.datetime(),
  checksum: ChecksumSchema,
  byteSize: z21.number().int().positive().max(100 * 1024 * 1024),
  mimeType: ImageMimeSchema
});
var AutomationExitCategorySchema = z21.enum([
  "success",
  "input",
  "authorization",
  "conflict",
  "transient",
  "partial"
]);
var AutomationExitCode = {
  success: 0,
  input: 2,
  authorization: 3,
  conflict: 4,
  transient: 5,
  partial: 6
};
var AutomationVersionResponseSchema = z21.strictObject({
  version: AutomationProtocolVersionSchema
});
var AutomationWhoAmIResponseSchema = z21.strictObject({
  principal: z21.strictObject({
    kind: z21.literal("agent"),
    userId: UuidSchema,
    studioId: UuidSchema,
    tokenId: UuidSchema,
    scopes: z21.array(z21.string()).min(1)
  })
});
var AutomationProblemDetailSchema = z21.strictObject({
  title: z21.string().min(1).max(200),
  detail: z21.string().min(1).max(1e3),
  code: ProblemCodeSchema,
  correlationId: z21.string().min(1).max(160).optional(),
  errors: z21.array(z21.strictObject({ path: z21.string().max(200), message: z21.string().max(500) })).max(32).optional()
});
function AutomationSuccessSchema(data) {
  return z21.strictObject({
    version: AutomationProtocolVersionSchema,
    ok: z21.literal(true),
    data
  });
}
var AutomationProblemSchema = z21.strictObject({
  version: AutomationProtocolVersionSchema,
  ok: z21.literal(false),
  category: AutomationExitCategorySchema.exclude(["success"]),
  problem: AutomationProblemDetailSchema
});
var AcceptedAnchoredExportSchema = z21.strictObject({
  metadata: z21.strictObject({
    assetId: UuidSchema,
    revisionId: UuidSchema,
    kind: z21.union([z21.literal("character"), z21.literal("prop")]),
    sourceJobId: UuidSchema.nullable(),
    width: z21.number().int().positive(),
    height: z21.number().int().positive(),
    checksum: ChecksumSchema,
    mimeType: z21.enum(["image/png", "image/webp"]),
    editorType: z21.enum(["pixel", "raster"]),
    styleFingerprint: ChecksumSchema.nullable(),
    effectiveFingerprint: ChecksumSchema.nullable(),
    geometry: AssetAnchorGeometrySchema
  })
});
var AutomationExportQuerySchema = z21.strictObject({
  expectedRevisionId: UuidSchema.optional()
});
var AutomationExportFileSchema = z21.strictObject({
  role: z21.enum(["normal", "hover", "pressed", "disabled"]),
  mimeType: z21.enum(["image/png", "image/webp"]),
  byteSize: z21.number().int().positive().max(100 * 1024 * 1024),
  checksum: ChecksumSchema,
  downloadUrl: z21.url()
});
var exportIdentity = {
  assetId: UuidSchema,
  revisionId: UuidSchema,
  files: z21.array(AutomationExportFileSchema).min(1).max(4)
};
var AutomationAcceptedExportSchema = z21.discriminatedUnion("kind", [
  z21.strictObject({
    ...exportIdentity,
    kind: z21.literal("character"),
    characterId: UuidSchema,
    export: AcceptedAnchoredExportSchema
  }),
  z21.strictObject({
    ...exportIdentity,
    kind: z21.literal("prop"),
    export: AcceptedAnchoredExportSchema
  }),
  z21.strictObject({
    ...exportIdentity,
    kind: z21.literal("background"),
    export: BackgroundExportSchema.pick({ metadata: true })
  }),
  z21.strictObject({
    ...exportIdentity,
    kind: z21.literal("ui-icon"),
    export: UiIconExportSchema.pick({ metadata: true })
  }),
  z21.strictObject({
    ...exportIdentity,
    kind: z21.literal("ui-surface"),
    export: UiSurfaceExportSchema.pick({ metadata: true })
  })
]).superRefine((value, context) => {
  if ((value.kind === "character" || value.kind === "prop") && value.export.metadata.kind !== value.kind) {
    context.addIssue({
      code: "custom",
      path: ["export", "metadata", "kind"],
      message: "Export kind must match."
    });
  }
  const metadata = value.export.metadata;
  const expectedRoles = value.kind === "ui-surface" && value.export.metadata.surfaceKind === "button" ? ["disabled", "hover", "normal", "pressed"] : ["normal"];
  if (JSON.stringify(value.files.map((file) => file.role).sort()) !== JSON.stringify(expectedRoles))
    context.addIssue({
      code: "custom",
      path: ["files"],
      message: "Export file roles must match the family."
    });
  if ("assetId" in metadata && (metadata.assetId !== value.assetId || metadata.revisionId !== value.revisionId))
    context.addIssue({ code: "custom", message: "Export identity must match metadata." });
  if ("checksum" in metadata && metadata.checksum !== value.files.find((file) => file.role === "normal")?.checksum)
    context.addIssue({ code: "custom", message: "Normal file checksum must match metadata." });
});
var RelativePathSchema = z21.string().trim().min(1).max(500).refine(
  (value) => !/^(?:[\\/]|[A-Za-z]:[\\/])/.test(value) && !value.split(/[\\/]+/).some((segment) => segment === "..") && !value.includes("\0"),
  "Path must be a non-traversing relative path."
);
var ExternalIdSchema = z21.string().trim().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
var BatchUiSurfaceInputSchema = z21.strictObject({
  selectedReferenceIds: SelectedReferenceIdsSchema,
  kind: z21.literal("ui-surface"),
  name: z21.string().trim().min(1).max(160),
  surfaceKind: UiSurfaceKindSchema,
  width: z21.number().int().min(16).max(512),
  height: z21.number().int().min(16).max(512),
  candidateCount: z21.number().int().min(1).max(MAX_GENERATION_VARIANTS),
  modelIds: CandidateModelSelectionSchema,
  targetAssetId: UuidSchema.optional(),
  sourceGenerationId: UuidSchema.optional()
}).superRefine((value, context) => {
  if (value.width % 8 || value.height % 8 || Math.max(value.width, value.height) / Math.min(value.width, value.height) > 8) {
    context.addIssue({ code: "custom", message: "UI surface target is unsupported." });
  }
});
var BatchAssetInputSchema = z21.discriminatedUnion("kind", [
  CharacterAssetCreateRequestSchema.omit({
    brief: true,
    characterId: true,
    contextFingerprint: true
  }).extend({ characterRef: ExternalIdSchema }).strict(),
  PropAssetCreateRequestSchema.omit({ brief: true, contextFingerprint: true }),
  BackgroundAssetCreateRequestSchema.omit({ brief: true, contextFingerprint: true }),
  UiIconAssetCreateRequestSchema.omit({ brief: true, contextFingerprint: true }),
  BatchUiSurfaceInputSchema
]);
var BatchPromptSourceSchema = z21.discriminatedUnion("kind", [
  z21.strictObject({ kind: z21.literal("inline"), brief: z21.string().trim().min(10).max(4e3) }),
  z21.strictObject({ kind: z21.literal("file"), path: RelativePathSchema })
]);
var BatchProjectCreateInputSchema = ProjectCreateRequestSchema.omit({ studioId: true });
var BatchProjectIntentSchema = z21.discriminatedUnion("mode", [
  z21.strictObject({ mode: z21.literal("reuse"), projectId: UuidSchema }),
  z21.strictObject({
    mode: z21.literal("create"),
    externalId: ExternalIdSchema,
    input: BatchProjectCreateInputSchema
  })
]);
var BatchEntrySchema = z21.strictObject({
  externalId: ExternalIdSchema,
  input: BatchAssetInputSchema,
  prompt: BatchPromptSourceSchema,
  candidatePlan: z21.strictObject({ mode: z21.literal("explicit-review") }),
  output: z21.strictObject({
    previewPath: RelativePathSchema.optional(),
    imagePath: RelativePathSchema,
    metadataPath: RelativePathSchema
  })
});
var BatchCharacterSetupSchema = z21.strictObject({
  externalId: ExternalIdSchema,
  definition: z21.discriminatedUnion("mode", [
    z21.strictObject({ mode: z21.literal("create"), input: CharacterCreateRequestSchema }),
    z21.strictObject({ mode: z21.literal("reuse"), characterId: UuidSchema })
  ])
});
var AutomationBatchManifestSchema = z21.strictObject({
  version: z21.literal("game-studio-batch/v3"),
  outputRoot: RelativePathSchema,
  concurrency: z21.number().int().min(1).max(2),
  project: BatchProjectIntentSchema,
  artSettings: ProjectArtSettingsSaveRequestSchema.optional(),
  characters: z21.array(BatchCharacterSetupSchema).max(500).optional(),
  bootstrap: z21.strictObject({
    references: z21.array(
      z21.strictObject({
        externalId: ExternalIdSchema,
        path: RelativePathSchema,
        mimeType: ImageMimeSchema,
        approve: z21.boolean()
      })
    ).max(32),
    technique: z21.discriminatedUnion("mode", [
      z21.strictObject({ mode: z21.literal("select"), externalId: ExternalIdSchema }),
      z21.strictObject({ mode: z21.literal("reuse"), referenceId: UuidSchema }),
      z21.strictObject({ mode: z21.literal("clear") })
    ]).optional()
  }).optional(),
  entries: z21.array(BatchEntrySchema).min(1).max(500)
}).superRefine((value, context) => {
  if (value.project.mode === "create" && value.artSettings && value.artSettings.expectedRevision !== 0)
    context.addIssue({
      code: "custom",
      path: ["artSettings", "expectedRevision"],
      message: "New Project Art setup must expect revision zero."
    });
  const references = value.bootstrap?.references ?? [];
  if (new Set(references.map((item) => item.externalId)).size !== references.length)
    context.addIssue({ code: "custom", message: "Reference external IDs must be unique." });
  const technique = value.bootstrap?.technique;
  if (technique?.mode === "select" && !references.some((item) => item.externalId === technique.externalId && item.approve))
    context.addIssue({
      code: "custom",
      message: "Selected bootstrap reference must be explicitly approved."
    });
  const externalIds = value.entries.map((entry) => entry.externalId);
  if (new Set(externalIds).size !== externalIds.length) {
    context.addIssue({
      code: "custom",
      path: ["entries"],
      message: "Entry external IDs must be unique."
    });
  }
  const characters = value.characters ?? [];
  if (new Set(characters.map((item) => item.externalId)).size !== characters.length)
    context.addIssue({
      code: "custom",
      path: ["characters"],
      message: "Character keys must be unique."
    });
  if (value.project.mode === "create" && characters.some((item) => item.definition.mode === "reuse"))
    context.addIssue({
      code: "custom",
      path: ["characters"],
      message: "Project create cannot reuse an existing Character."
    });
  const characterRefs = value.entries.flatMap(
    (entry) => entry.input.kind === "character" ? [entry.input.characterRef] : []
  );
  if (characterRefs.some((ref) => !characters.some((item) => item.externalId === ref)))
    context.addIssue({
      code: "custom",
      message: "Character entry references an unknown setup key."
    });
  if (characters.some((item) => !characterRefs.includes(item.externalId)))
    context.addIssue({ code: "custom", message: "Character setup keys must be referenced." });
  const paths = value.entries.flatMap((entry) => [
    entry.output.imagePath,
    entry.output.metadataPath
  ]);
  if (new Set(paths).size !== paths.length) {
    context.addIssue({
      code: "custom",
      path: ["entries"],
      message: "Output paths must be unique."
    });
  }
});
var BatchReceiptStateSchema = z21.enum([
  "planned",
  "submitted",
  "awaiting-candidates",
  "awaiting-review",
  "processing",
  "ready",
  "exported",
  "failed",
  "blocked"
]);
var AutomationBatchReceiptSchema = z21.strictObject({
  version: z21.literal("game-studio-batch/v3"),
  manifestFingerprint: ChecksumSchema,
  manifestIdentity: ChecksumSchema,
  serverFingerprint: ChecksumSchema,
  project: z21.strictObject({
    externalId: ExternalIdSchema.optional(),
    projectId: UuidSchema.nullable()
  }),
  artSettings: z21.strictObject({
    commandKey: AutomationIdempotencyKeySchema,
    fingerprint: ChecksumSchema,
    revision: z21.number().int().positive().nullable()
  }).optional(),
  characters: z21.array(
    z21.strictObject({
      externalId: ExternalIdSchema,
      fingerprint: ChecksumSchema,
      mode: z21.enum(["create", "reuse"]),
      commandKey: AutomationIdempotencyKeySchema.nullable(),
      characterId: UuidSchema.nullable()
    })
  ).max(500),
  references: z21.array(
    z21.strictObject({
      externalId: ExternalIdSchema,
      fingerprint: ChecksumSchema,
      referenceId: UuidSchema.nullable(),
      state: z21.enum(["planned", "ready", "approved"])
    })
  ).max(32),
  techniqueApplied: z21.boolean(),
  entries: z21.array(
    z21.strictObject({
      externalId: ExternalIdSchema,
      fingerprint: ChecksumSchema,
      state: BatchReceiptStateSchema,
      contextFingerprint: ChecksumSchema.nullable(),
      jobId: UuidSchema.nullable(),
      candidateId: UuidSchema.nullable(),
      assetId: UuidSchema.nullable(),
      revisionId: UuidSchema.nullable(),
      outputs: z21.array(
        z21.strictObject({
          path: RelativePathSchema,
          checksum: ChecksumSchema,
          byteSize: z21.number().int().positive().max(100 * 1024 * 1024),
          mimeType: z21.enum(["image/png", "image/webp", "image/jpeg", "application/json"]),
          role: z21.enum(["normal", "hover", "pressed", "disabled", "metadata", "preview"]),
          candidateId: UuidSchema.optional()
        })
      ).max(16),
      error: z21.strictObject({
        category: AutomationExitCategorySchema.exclude(["success"]),
        code: ProblemCodeSchema
      }).nullable()
    })
  ).min(1)
});

// packages/contracts/src/automation-graphics.ts
import { z as z25 } from "zod/v4";

// packages/contracts/src/automation-inspection.ts
import { z as z23 } from "zod/v4";

// packages/contracts/src/catalog-art.ts
import { z as z22 } from "zod/v4";
var CatalogProductionKindSchema = z22.enum(["prop", "background", "ui-icon"]);
var CatalogArtOwnerSchema = z22.discriminatedUnion("kind", [
  z22.strictObject({ kind: z22.literal("world"), worldId: UuidSchema }),
  z22.strictObject({ kind: z22.literal("location"), locationId: UuidSchema }),
  z22.strictObject({ kind: z22.literal("item"), itemId: UuidSchema })
]);
var CatalogRevisionPinSchema = z22.strictObject({
  assetId: UuidSchema,
  revisionId: UuidSchema,
  checksum: z22.string().regex(/^[a-f0-9]{64}$/)
});
var CatalogPinnedRevisionSchema = z22.strictObject({
  name: catalogText(160).min(1),
  width: z22.number().int().positive().max(16384),
  height: z22.number().int().positive().max(16384),
  mimeType: z22.enum(["image/png", "image/webp"])
});
var CatalogArtSlotDefinitionInputSchema = z22.strictObject({
  title: catalogText(120).min(1),
  brief: catalogText(4e3).transform((value) => value || null).nullable().default(null),
  productionKind: CatalogProductionKindSchema.nullable().default(null)
});
var CatalogArtSlotSchema = z22.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  owner: CatalogArtOwnerSchema,
  title: catalogText(120).min(1),
  brief: catalogText(4e3).nullable(),
  productionKind: CatalogProductionKindSchema.nullable(),
  pin: CatalogRevisionPinSchema.nullable(),
  pinnedRevision: CatalogPinnedRevisionSchema.nullable().optional(),
  fulfillment: z22.enum(["unassigned", "ready", "unavailable"]),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var CatalogArtSlotCreateRequestSchema = z22.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema,
  slot: CatalogArtSlotDefinitionInputSchema
});
var CatalogArtSlotReplaceRequestSchema = CatalogArtSlotCreateRequestSchema;
var CatalogArtSlotRemoveRequestSchema = z22.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema
});
var CatalogArtSlotBindRequestSchema = z22.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema,
  pin: CatalogRevisionPinSchema
});
var CatalogArtSlotUnbindRequestSchema = z22.strictObject({
  expectedRevision: CatalogExpectedRevisionSchema
});
var CatalogArtSlotParamsSchema = z22.strictObject({
  projectId: UuidSchema,
  slotId: UuidSchema
});
var CatalogArtSummarySchema = z22.strictObject({
  slots: z22.array(CatalogArtSlotSchema).max(32),
  counts: z22.strictObject({
    total: z22.number().int().min(0).max(32),
    unassigned: z22.number().int().min(0).max(32),
    ready: z22.number().int().min(0).max(32),
    unavailable: z22.number().int().min(0).max(32)
  })
});
var CatalogAssetSelectorQuerySchema = z22.strictObject({
  kind: CatalogProductionKindSchema
});
var CatalogAssetOptionSchema = z22.strictObject({
  assetId: UuidSchema,
  name: catalogText(160).min(1),
  kind: CatalogProductionKindSchema,
  pin: CatalogRevisionPinSchema
});
var CatalogAssetOptionsSchema = z22.strictObject({
  assets: z22.array(CatalogAssetOptionSchema).max(500)
});
var AssignedCatalogRevisionSchema = z22.strictObject({
  assetId: UuidSchema,
  revisionId: UuidSchema,
  checksum: z22.string().regex(/^[a-f0-9]{64}$/),
  kind: CatalogProductionKindSchema,
  width: z22.number().int().positive().max(16384),
  height: z22.number().int().positive().max(16384),
  mimeType: z22.enum(["image/png", "image/webp"]),
  byteSize: z22.number().int().nonnegative().max(25 * 1024 * 1024),
  geometry: AssetAnchorGeometrySchema.nullable(),
  downloadUrl: z22.url()
});

// packages/contracts/src/automation-inspection.ts
var AutomationReferenceInspectionSchema = z23.strictObject({
  ...ReferenceAssetSchema.shape,
  purpose: z23.enum(["style-reference", "moodboard-screen", "technique-reference"])
}).omit({ previewUrl: true });
var AutomationReferenceDownloadSchema = z23.strictObject({
  referenceId: UuidSchema,
  projectId: UuidSchema,
  purpose: z23.enum(["style-reference", "moodboard-screen", "technique-reference"]),
  width: z23.number().int().positive().max(1e8),
  height: z23.number().int().positive().max(1e8),
  mimeType: ImageMimeSchema,
  byteSize: z23.number().int().positive().max(25 * 1024 * 1024),
  checksum: z23.string().regex(/^[a-f0-9]{64}$/),
  downloadUrl: z23.url()
});
var AutomationCatalogDownloadInspectionSchema = AssignedCatalogRevisionSchema.omit({
  downloadUrl: true
}).strict();
var AutomationFileDescriptorSchema = z23.strictObject({
  role: z23.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
  mimeType: z23.enum([
    "image/png",
    "image/webp",
    "application/json",
    "text/markdown",
    "application/zip"
  ]),
  byteSize: z23.number().int().nonnegative().max(100 * 1024 * 1024),
  checksum: z23.string().regex(/^[a-f0-9]{64}$/)
});
var AutomationRevisionInspectionSchema = z23.discriminatedUnion("kind", [
  AssetRevisionSchema.options[0].omit({ previewUrl: true }).strict(),
  AssetRevisionSchema.options[1].omit({ previewUrl: true }).strict(),
  AssetRevisionSchema.options[2].omit({ previewUrl: true }).strict(),
  z23.strictObject(AssetRevisionSchema.options[3].shape).omit({ previewUrl: true }).refine(
    (value) => validateUiSurfaceGeometry({
      width: value.width,
      height: value.height,
      geometry: value.surfaceMetadata.geometry
    }).success,
    "UI surface geometry is invalid for the source canvas."
  ),
  AssetRevisionSchema.options[4].omit({ previewUrl: true }).strict()
]);
var AutomationAssetLibraryQuerySchema = z23.strictObject({
  kind: AssetSchema.shape.kind.exclude(["tileset"]).optional()
});
var AutomationAssetLibrarySchema = z23.strictObject({
  assets: z23.array(AssetSchema.omit({ revisions: true }).strict())
});
var AutomationRevisionListSchema = z23.strictObject({
  revisions: z23.array(AutomationRevisionInspectionSchema)
});
var AutomationRevisionDownloadSchema = z23.strictObject({
  assetId: UuidSchema,
  revisionId: UuidSchema,
  revision: AutomationRevisionInspectionSchema,
  files: z23.array(AutomationFileDescriptorSchema.extend({ downloadUrl: z23.url() })).min(1).max(4)
});
var AutomationDocumentExportDownloadSchema = z23.strictObject({
  documentId: UuidSchema,
  exportId: UuidSchema,
  files: z23.tuple([
    AutomationFileDescriptorSchema.extend({
      role: z23.literal("markdown"),
      mimeType: z23.literal("text/markdown")
    }),
    AutomationFileDescriptorSchema.extend({
      role: z23.literal("manifest"),
      mimeType: z23.literal("application/json")
    })
  ])
});
var AutomationCandidateInspectionSchema = GenerationCandidateSchema.omit({
  previewUrl: true
}).extend({ modelId: z23.string().min(1).max(160) }).strict();
var AutomationJobInspectionSchema = z23.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  characterId: UuidSchema.nullable(),
  kind: GenerationKindSchema,
  status: GenerationJobStatusSchema,
  stage: z23.string().max(160),
  progress: z23.number().int().min(0).max(100),
  modelIds: z23.array(z23.string().min(1).max(160)).max(4),
  candidateCount: z23.number().int().min(1).max(4),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var AutomationGenerationInspectionSchema = z23.strictObject({
  job: AutomationJobInspectionSchema,
  candidates: z23.array(AutomationCandidateInspectionSchema).max(4)
});
function inspectAutomationCandidate({
  previewUrl: _previewUrl,
  ...candidate
}) {
  return AutomationCandidateInspectionSchema.parse(candidate);
}
function inspectAutomationJob(job) {
  const {
    id: id2,
    projectId,
    characterId,
    kind,
    status,
    stage,
    progress,
    modelIds,
    candidateCount,
    createdAt,
    updatedAt
  } = job;
  return AutomationJobInspectionSchema.parse({
    id: id2,
    projectId,
    characterId,
    kind,
    status,
    stage,
    progress,
    modelIds,
    candidateCount,
    createdAt,
    updatedAt
  });
}

// packages/contracts/src/tiles.ts
import { z as z24 } from "zod/v4";
var GridDefinitionSchema = z24.object({
  originX: z24.number().int().min(0),
  originY: z24.number().int().min(0),
  cellWidth: z24.number().int().min(4).max(512),
  cellHeight: z24.number().int().min(4).max(512),
  spacingX: z24.number().int().min(0).max(128),
  spacingY: z24.number().int().min(0).max(128),
  columns: z24.number().int().min(1).max(256),
  rows: z24.number().int().min(1).max(256)
});
var GridCandidateSchema = GridDefinitionSchema.extend({
  confidence: z24.number().min(0).max(1),
  reason: z24.string()
});
var GridDetectionRequestSchema = z24.object({ referenceId: UuidSchema });
var GridDetectionResponseSchema = z24.object({
  candidates: z24.array(GridCandidateSchema).min(1)
});
var TilesetCreateRequestSchema = GridDefinitionSchema.extend({
  referenceId: UuidSchema,
  name: z24.string().trim().min(1).max(160)
}).strict().refine(
  (grid) => grid.columns * grid.rows <= 4096 && grid.columns * grid.rows * grid.cellWidth * grid.cellHeight <= 1e8,
  { message: "Grid exceeds tile or pixel budget." }
);
var TileSliceSchema = z24.object({
  id: UuidSchema,
  tileIndex: z24.number().int(),
  x: z24.number().int(),
  y: z24.number().int(),
  width: z24.number().int(),
  height: z24.number().int(),
  checksum: z24.string().length(64),
  duplicateOfIndex: z24.number().int().nullable(),
  previewUrl: z24.url()
});
var TilesetSchema = GridDefinitionSchema.extend({
  id: UuidSchema,
  projectId: UuidSchema,
  referenceId: UuidSchema,
  name: z24.string(),
  slices: z24.array(TileSliceSchema),
  createdAt: IsoDateTimeSchema
});
var TilesetListSchema = z24.object({ tilesets: z24.array(TilesetSchema) });
var TilesetParamsSchema = z24.object({ projectId: UuidSchema, tilesetId: UuidSchema });

// packages/contracts/src/automation-graphics.ts
var AutomationIndicatorSchema = AutomationAssetSchema.extend({
  revisions: z25.array(AutomationRevisionInspectionSchema)
});
var AutomationIndicatorSourcesSchema = z25.strictObject({
  sources: z25.array(UiIndicatorSourceOptionSchema.omit({ previewUrl: true })).max(100),
  hasMore: z25.boolean()
});
var AutomationIndicatorPreviewSchema = z25.strictObject({
  value: z25.number().finite().min(0).max(1)
});
var AutomationIndicatorExportSchema = z25.strictObject({
  assetId: UuidSchema,
  revisionId: UuidSchema,
  manifest: UiIndicatorExportSchema.shape.manifest,
  files: z25.array(
    UiIndicatorExportSchema.shape.layers.element.omit({ downloadUrl: true }).extend({ ...AutomationFileDescriptorSchema.shape, downloadUrl: z25.url() })
  ).min(2).max(3)
});
var AutomationTilesetSchema = TilesetSchema.extend({
  slices: z25.array(TileSliceSchema.omit({ previewUrl: true })).max(4096)
}).strict();
var AutomationTilesetListSchema = z25.strictObject({
  tilesets: z25.array(AutomationTilesetSchema)
});
var AutomationTilesetExportSchema = z25.strictObject({
  tilesetId: UuidSchema,
  metadata: AutomationTilesetSchema,
  files: z25.array(
    AutomationFileDescriptorSchema.extend({ role: z25.literal("atlas"), downloadUrl: z25.url() })
  ).length(1)
});

// packages/contracts/src/catalog-import.ts
import { z as z26 } from "zod/v4";
var GameCatalogSourceKeySchema = z26.string().min(1).max(256).refine(
  (value) => !Array.from(value).some((character) => {
    const point = character.codePointAt(0) ?? 0;
    return point < 32 || point === 127;
  }),
  "Source keys must not contain controls."
);
var sourceRevision = catalogText(160).transform((value) => value || null).nullable().default(null);
var GameCatalogSlotDefinitionSchema = CatalogArtSlotDefinitionInputSchema.extend({
  sourceKey: GameCatalogSourceKeySchema
}).strict();
var slots = z26.array(GameCatalogSlotDefinitionSchema).max(32).default([]);
var GameCatalogWorldEntrySchema = z26.strictObject({
  sourceKey: GameCatalogSourceKeySchema,
  profile: CatalogProfileInputSchema,
  slots
});
var GameCatalogLocationEntrySchema = z26.strictObject({
  sourceKey: GameCatalogSourceKeySchema,
  worldSourceKey: GameCatalogSourceKeySchema.nullable().default(null),
  profile: CatalogProfileInputSchema,
  slots
});
var GameCatalogItemEntrySchema = z26.strictObject({
  sourceKey: GameCatalogSourceKeySchema,
  profile: ItemProfileInputSchema,
  slots
});
var GameCatalogLocationItemEntrySchema = z26.strictObject({
  sourceKey: GameCatalogSourceKeySchema,
  locationSourceKey: GameCatalogSourceKeySchema,
  itemSourceKey: GameCatalogSourceKeySchema,
  notes: catalogText(2e3).transform((value) => value || null).nullable().default(null)
});
var GameCatalogManifestSchema = z26.strictObject({
  version: z26.literal("game-catalog-v1"),
  namespace: z26.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/),
  sourceRevision,
  worlds: z26.array(GameCatalogWorldEntrySchema).max(5e3).default([]),
  locations: z26.array(GameCatalogLocationEntrySchema).max(5e3).default([]),
  items: z26.array(GameCatalogItemEntrySchema).max(5e3).default([]),
  locationItems: z26.array(GameCatalogLocationItemEntrySchema).max(5e3).default([])
}).superRefine((manifest, context) => {
  const groups = [manifest.worlds, manifest.locations, manifest.items, manifest.locationItems];
  let count = groups.reduce((total, entries) => total + entries.length, 0);
  count += [...manifest.worlds, ...manifest.locations, ...manifest.items].reduce(
    (total, entry) => total + entry.slots.length,
    0
  );
  if (count > 5e3)
    context.addIssue({ code: "custom", message: "Manifest entries must not exceed 5000." });
  const unique = (entries, path) => {
    const keys = /* @__PURE__ */ new Set();
    for (const [index, entry] of entries.entries()) {
      if (keys.has(entry.sourceKey))
        context.addIssue({
          code: "custom",
          path: [path, index, "sourceKey"],
          message: "Source keys must be unique within their type."
        });
      keys.add(entry.sourceKey);
    }
    return keys;
  };
  const worldKeys = unique(manifest.worlds, "worlds");
  const locationKeys = unique(manifest.locations, "locations");
  const itemKeys = unique(manifest.items, "items");
  unique(manifest.locationItems, "locationItems");
  unique(
    [...manifest.worlds, ...manifest.locations, ...manifest.items].flatMap(
      (entry) => entry.slots.map(({ sourceKey: key3 }) => ({ sourceKey: key3 }))
    ),
    "slots"
  );
  const linkPairs = /* @__PURE__ */ new Set();
  for (const [index, location] of manifest.locations.entries())
    if (location.worldSourceKey !== null && !worldKeys.has(location.worldSourceKey))
      context.addIssue({
        code: "custom",
        path: ["locations", index, "worldSourceKey"],
        message: "World source key does not resolve."
      });
  for (const [index, link2] of manifest.locationItems.entries()) {
    if (!locationKeys.has(link2.locationSourceKey))
      context.addIssue({
        code: "custom",
        path: ["locationItems", index, "locationSourceKey"],
        message: "Location source key does not resolve."
      });
    if (!itemKeys.has(link2.itemSourceKey))
      context.addIssue({
        code: "custom",
        path: ["locationItems", index, "itemSourceKey"],
        message: "Item source key does not resolve."
      });
    const pair = `${link2.locationSourceKey}\0${link2.itemSourceKey}`;
    if (linkPairs.has(pair))
      context.addIssue({
        code: "custom",
        path: ["locationItems", index],
        message: "Location and Item may be linked only once."
      });
    linkPairs.add(pair);
  }
  if (utf8ByteLength(JSON.stringify(manifest)) > 4 * 1024 * 1024)
    context.addIssue({ code: "custom", message: "Manifest must not exceed 4 MiB UTF-8." });
});
function selectedSourceKeys() {
  return z26.array(GameCatalogSourceKeySchema).max(5e3).superRefine((keys, context) => {
    const seen = /* @__PURE__ */ new Set();
    for (const [index, key3] of keys.entries()) {
      if (seen.has(key3))
        context.addIssue({
          code: "custom",
          path: [index],
          message: "Selected source keys must be unique within their type."
        });
      seen.add(key3);
    }
  });
}
var GameCatalogImportSelectionSchema = z26.strictObject({
  worlds: selectedSourceKeys().default([]),
  locations: selectedSourceKeys().default([]),
  items: selectedSourceKeys().default([]),
  locationItems: selectedSourceKeys().default([])
});
var GameCatalogImportPreviewRequestSchema = z26.strictObject({
  manifest: GameCatalogManifestSchema,
  selection: GameCatalogImportSelectionSchema.optional(),
  cursor: z26.coerce.number().int().min(0).max(5e3).default(0),
  limit: z26.coerce.number().int().min(1).max(100).default(25)
});
var GameCatalogImportCommitRequestSchema = z26.strictObject({
  manifest: GameCatalogManifestSchema,
  selection: GameCatalogImportSelectionSchema.optional(),
  previewToken: z26.string().min(1).max(4096)
});
var GameCatalogImportDiagnosticSchema = z26.strictObject({
  code: z26.enum([
    "invalid",
    "duplicate_source_key",
    "dangling_reference",
    "source_changed",
    "missing_world",
    "missing_location",
    "missing_item",
    "unknown_source_key",
    "empty_selection"
  ]),
  path: z26.string().max(500),
  message: z26.string().max(500)
});
var GameCatalogImportCountsSchema = z26.strictObject({
  create: z26.number().int().nonnegative().max(5e3),
  skipped: z26.number().int().nonnegative().max(5e3),
  conflicts: z26.number().int().nonnegative().max(5e3)
});
var GameCatalogImportPreviewRowSchema = z26.strictObject({
  kind: z26.enum(["world", "location", "item", "location-item", "slot"]),
  sourceKey: GameCatalogSourceKeySchema,
  name: z26.string().max(500),
  selected: z26.boolean(),
  status: z26.enum(["create", "skipped", "conflict", "blocked"]),
  diagnostic: GameCatalogImportDiagnosticSchema.pick({ code: true, message: true }).nullable()
});
var GameCatalogImportPreviewSchema = z26.strictObject({
  digest: z26.string().regex(/^[a-f0-9]{64}$/),
  catalogRevision: z26.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  expiresAt: IsoDateTimeSchema,
  previewToken: z26.string().min(1).max(4096),
  counts: GameCatalogImportCountsSchema,
  diagnostics: z26.array(GameCatalogImportDiagnosticSchema).max(100),
  rows: z26.array(GameCatalogImportPreviewRowSchema).max(100),
  nextCursor: z26.number().int().nonnegative().max(5e3).nullable(),
  total: z26.number().int().nonnegative().max(5e3),
  canCommit: z26.boolean()
});
var GameCatalogImportReceiptSchema = z26.strictObject({
  projectId: UuidSchema,
  digest: z26.string().regex(/^[a-f0-9]{64}$/),
  catalogRevision: z26.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  counts: GameCatalogImportCountsSchema,
  committedAt: IsoDateTimeSchema
});

// packages/contracts/src/character-graphics.ts
import { z as z27 } from "zod/v4";
var CharacterGraphicsIdentitySchema = z27.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  name: z27.string().min(1).max(320),
  archivedAt: IsoDateTimeSchema.nullable()
});
var CharacterGraphicsQuerySchema = z27.strictObject({
  state: z27.enum(["active", "archived"]).default("active"),
  cursor: UuidSchema.optional(),
  limit: z27.coerce.number().int().min(1).max(100).default(50)
});
var CharacterGraphicsPageSchema = z27.strictObject({
  characters: z27.array(CharacterGraphicsIdentitySchema).max(100),
  nextCursor: UuidSchema.nullable(),
  total: z27.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});

// packages/contracts/src/creative-snapshots.ts
import { z as z30 } from "zod/v4";

// packages/contracts/src/generation-size-policy.ts
import { z as z29 } from "zod/v4";

// packages/contracts/src/model-registry.ts
import { z as z28 } from "zod/v4";

// packages/contracts/src/sha256.ts
var K = [
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
];
function rotateRight(value, bits) {
  return value >>> bits | value << 32 - bits;
}
function utf8(value) {
  const encoded = encodeURIComponent(value);
  const bytes = [];
  for (let index = 0; index < encoded.length; index += 1) {
    const character = encoded[index];
    if (character === "%") {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else if (character) {
      bytes.push(character.charCodeAt(0));
    }
  }
  return bytes;
}
function sha256(value) {
  const bytes = utf8(value);
  const bitLength = bytes.length * 8;
  bytes.push(128);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let shift = 56; shift >= 0; shift -= 8) {
    bytes.push(Math.floor(bitLength / 2 ** shift) & 255);
  }
  const hash = [
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ];
  const words2 = new Array(64).fill(0);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const base = offset + index * 4;
      words2[index] = (bytes[base] ?? 0) << 24 | (bytes[base + 1] ?? 0) << 16 | (bytes[base + 2] ?? 0) << 8 | (bytes[base + 3] ?? 0);
    }
    for (let index = 16; index < 64; index += 1) {
      const previous15 = words2[index - 15] ?? 0;
      const previous2 = words2[index - 2] ?? 0;
      const sigma0 = rotateRight(previous15, 7) ^ rotateRight(previous15, 18) ^ previous15 >>> 3;
      const sigma1 = rotateRight(previous2, 17) ^ rotateRight(previous2, 19) ^ previous2 >>> 10;
      words2[index] = (words2[index - 16] ?? 0) + sigma0 + (words2[index - 7] ?? 0) + sigma1 >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = e & f ^ ~e & g;
      const temporary1 = h + sum1 + choice + (K[index] ?? 0) + (words2[index] ?? 0) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = a & b ^ a & c ^ b & c;
      const temporary2 = sum0 + majority >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + temporary1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = temporary1 + temporary2 >>> 0;
    }
    const next = [a, b, c, d, e, f, g, h];
    for (let index = 0; index < hash.length; index += 1) {
      hash[index] = (hash[index] ?? 0) + (next[index] ?? 0) >>> 0;
    }
  }
  return hash.map((part) => part.toString(16).padStart(8, "0")).join("");
}

// packages/contracts/src/model-registry.ts
var ModelIdSchema = z28.string().trim().min(3).max(160);
var ModalitySchema = z28.enum(["text", "image", "audio", "video"]);
var ExactPixelSizeSchema = z28.string().trim().regex(/^\d+x\d+$/i).max(40);
var ResolutionTierSchema = z28.string().trim().min(2).max(40);
var AspectRatioSchema = z28.string().trim().regex(/^\d+:\d+$/).max(20);
var CanvasCapabilityReasonCodeSchema = z28.enum([
  "not_image_output",
  "aspect_ratio_unsupported",
  "dimension_control_unsupported"
]);
var EndpointCanvasCapabilitySchema = z28.discriminatedUnion("mode", [
  z28.object({
    mode: z28.literal("controlled_dimensions"),
    control: z28.discriminatedUnion("kind", [
      z28.object({
        kind: z28.literal("exact_size"),
        values: z28.array(ExactPixelSizeSchema).min(1).max(64)
      }).strict(),
      z28.object({
        kind: z28.literal("resolution_aspect"),
        resolutions: z28.array(ResolutionTierSchema).min(1).max(32),
        aspectRatios: z28.array(AspectRatioSchema).min(1).max(64)
      }).strict()
    ])
  }).strict(),
  z28.object({
    mode: z28.literal("provider_native_size"),
    control: z28.discriminatedUnion("kind", [
      z28.object({
        kind: z28.literal("aspect_only"),
        aspectRatios: z28.array(AspectRatioSchema).min(1).max(64)
      }).strict(),
      z28.object({ kind: z28.literal("uncontrolled") }).strict()
    ])
  }).strict(),
  z28.object({ mode: z28.literal("unsupported"), reasonCode: CanvasCapabilityReasonCodeSchema }).strict()
]);
var ModelAvailabilitySchema = z28.enum([
  "available",
  "unavailable",
  "sync_error",
  "review_required"
]);
var ModelBenchmarkStatusSchema = z28.enum(["unverified", "eligible", "blocked"]);
var CatalogSyncRunStatusSchema = z28.enum([
  "queued",
  "running",
  "succeeded",
  "partial_failed",
  "failed"
]);
var OpenRouterPriceLineSchema = z28.object({
  billable: z28.string().trim().min(1).max(80),
  unit: z28.string().trim().min(1).max(40),
  cost_usd: z28.number().finite().nonnegative()
}).strict();
var NormalizedModelEndpointSchema = z28.object({
  providerName: z28.string().trim().min(1).max(120),
  providerSlug: z28.string().trim().min(1).max(120),
  providerTag: z28.string().trim().min(1).max(120).nullable(),
  supportedParameters: z28.record(z28.string(), z28.unknown()),
  pricing: z28.array(OpenRouterPriceLineSchema).max(32),
  canvasCapability: EndpointCanvasCapabilitySchema.optional(),
  maxImageReferences: z28.number().int().min(0).max(32).optional(),
  capabilityFingerprint: z28.string().regex(/^[0-9a-f]{64}$/).optional()
}).strict();
var ModelEndpointCapabilityPresentationSchema = z28.object({
  providerName: z28.string().trim().min(1).max(120),
  providerSlug: z28.string().trim().min(1).max(120),
  providerTag: z28.string().trim().min(1).max(120).nullable(),
  canvasCapability: EndpointCanvasCapabilitySchema,
  maxImageReferences: z28.number().int().min(0).max(32),
  capabilityFingerprint: z28.string().regex(/^[0-9a-f]{64}$/),
  pricing: z28.array(OpenRouterPriceLineSchema).max(32)
}).strict();
var ModelRegistryEntrySchema = z28.object({
  modelId: ModelIdSchema,
  displayName: z28.string().trim().min(1).max(200),
  description: z28.string().max(2e3),
  inputModalities: z28.array(ModalitySchema).max(8),
  outputModalities: z28.array(ModalitySchema).max(8),
  supportedParameters: z28.record(z28.string(), z28.unknown()),
  endpoints: z28.array(NormalizedModelEndpointSchema).min(1).max(32),
  availability: ModelAvailabilitySchema,
  adminEnabled: z28.boolean(),
  catalogChecksum: z28.string().regex(/^[0-9a-f]{64}$/),
  reviewedCatalogChecksum: z28.string().regex(/^[0-9a-f]{64}$/).nullable().default(null),
  benchmarkStatus: ModelBenchmarkStatusSchema.default("unverified")
}).strict();
var ModelCatalogSyncRunSchema = z28.object({
  id: z28.string().uuid(),
  status: CatalogSyncRunStatusSchema,
  sourceChecksum: z28.string().regex(/^[0-9a-f]{64}$/).nullable(),
  discoveredCount: z28.number().int().nonnegative(),
  errorCode: z28.string().max(100).nullable(),
  startedAt: z28.string().datetime().nullable(),
  completedAt: z28.string().datetime().nullable(),
  createdAt: z28.string().datetime(),
  updatedAt: z28.string().datetime()
}).strict();
var ModelCatalogPublicFields = {
  modelId: ModelIdSchema,
  displayName: z28.string().trim().min(1).max(200),
  description: z28.string().max(2e3),
  inputModalities: z28.array(ModalitySchema).max(8),
  outputModalities: z28.array(ModalitySchema).max(8),
  endpoints: z28.array(ModelEndpointCapabilityPresentationSchema).min(1).max(32)
};
var AdminModelCatalogEntrySchema = z28.object({
  ...ModelCatalogPublicFields,
  availability: ModelAvailabilitySchema,
  adminEnabled: z28.boolean(),
  catalogChecksum: z28.string().regex(/^[0-9a-f]{64}$/),
  reviewedCatalogChecksum: z28.string().regex(/^[0-9a-f]{64}$/).nullable(),
  benchmarkStatus: ModelBenchmarkStatusSchema,
  lastSyncedAt: z28.string().datetime()
}).strict();
var GenerationModelCatalogEntrySchema = z28.object({
  ...ModelCatalogPublicFields,
  benchmarkStatus: ModelBenchmarkStatusSchema,
  estimatedCostUsd: z28.number().finite().nonnegative().nullable()
}).strict();
var ModelAdminMutationSchema = z28.object({
  enabled: z28.boolean(),
  reason: z28.string().trim().min(1).max(500).optional(),
  acknowledgeUnverified: z28.boolean().optional(),
  acknowledgeProviderNativeSize: z28.boolean().optional()
}).strict().superRefine((value, context) => {
  if (!value.enabled && !value.reason) {
    context.addIssue({
      code: "custom",
      path: ["reason"],
      message: "A disable reason is required."
    });
  }
});
var AdminModelCatalogSortSchema = z28.enum([
  "modelId",
  "displayName",
  "availability",
  "benchmarkStatus",
  "lastSyncedAt"
]);
var AdminModelCanvasModeSchema = z28.enum([
  "controlled_dimensions",
  "provider_native_size",
  "unsupported"
]);
var AdminModelCatalogQuerySchema = AdminPageRequestSchema.extend({
  sort: AdminModelCatalogSortSchema.default("displayName"),
  search: AdminSearchSchema.optional(),
  availability: ModelAvailabilitySchema.optional(),
  enabled: z28.enum(["true", "false"]).transform((value) => value === "true").optional(),
  benchmarkStatus: ModelBenchmarkStatusSchema.optional(),
  modality: ModalitySchema.optional(),
  canvasMode: AdminModelCanvasModeSchema.optional()
}).strict();
var AdminModelCatalogResponseSchema = AdminPageSchema(AdminModelCatalogEntrySchema).extend({ latestSync: ModelCatalogSyncRunSchema.nullable() }).strict();
var GenerationModelCatalogResponseSchema = z28.object({ models: z28.array(GenerationModelCatalogEntrySchema) }).strict();
var RawModelSchema = z28.object({
  id: ModelIdSchema,
  name: z28.string().trim().min(1).max(200),
  description: z28.string().max(2e3).optional().default(""),
  architecture: z28.object({
    input_modalities: z28.array(ModalitySchema).max(8),
    output_modalities: z28.array(ModalitySchema).max(8)
  }).strip(),
  supported_parameters: z28.record(z28.string(), z28.unknown()).default({})
}).strip();
var RawEndpointsSchema = z28.object({
  id: ModelIdSchema,
  endpoints: z28.array(
    z28.object({
      provider_name: z28.string().trim().min(1).max(120),
      provider_slug: z28.string().trim().min(1).max(120),
      provider_tag: z28.string().trim().min(1).max(120).optional(),
      supported_parameters: z28.record(z28.string(), z28.unknown()).default({}),
      pricing: z28.array(OpenRouterPriceLineSchema).max(32).default([])
    }).strip()
  ).min(1).max(32)
}).strip();

// packages/contracts/src/generation-size-policy.ts
var GenerationSizePolicySchema = z29.object({
  id: z29.literal("generation-size-policy-v1"),
  version: z29.literal(1),
  operation: z29.enum([
    "gameplay-moodboard",
    "character",
    "prop",
    "background",
    "ui-icon",
    "ui-surface"
  ]),
  styleCode: BuiltInStyleCodeSchema,
  step: z29.number().int().positive(),
  minShortEdge: z29.number().int().positive(),
  defaultSquare: z29.number().int().positive().nullable(),
  maxLongEdge: z29.number().int().positive().nullable()
}).strict();

// packages/contracts/src/creative-snapshots.ts
var MAX_EFFECTIVE_SNAPSHOT_CHARS = 64 * 1024;
var MoodboardSnapshotInputSchema = MoodboardCreateRequestSchema.extend({
  kind: z30.literal("gameplay-moodboard"),
  nativeWidth: z30.number().int().min(64).max(8192),
  nativeHeight: z30.number().int().min(64).max(8192),
  genre: ProjectGenreSchema.nullable(),
  tiles: ArtTilesSchema.nullable()
}).strict();
var CharacterSnapshotInputSchema = CharacterAssetCreateRequestSchema.extend({
  tiles: ArtTilesSchema.nullable()
}).strict();
var PropSnapshotInputSchema = PropAssetCreateRequestSchema.extend({
  tiles: ArtTilesSchema.nullable()
}).strict();
var BackgroundSnapshotInputSchema = BackgroundAssetCreateRequestSchema.extend({
  viewportWidth: z30.number().int().min(64).max(8192),
  viewportHeight: z30.number().int().min(64).max(8192)
}).strict();
var UiIconSnapshotInputSchema = UiIconAssetCreateRequestSchema;
var UiSurfaceSnapshotInputSchema = UiSurfaceAssetCreateRequestSchema;
var EffectiveSnapshotOperationInputSchema = z30.discriminatedUnion("kind", [
  MoodboardSnapshotInputSchema,
  CharacterSnapshotInputSchema,
  PropSnapshotInputSchema,
  BackgroundSnapshotInputSchema,
  UiIconSnapshotInputSchema,
  UiSurfaceSnapshotInputSchema
]);
var EffectiveGenerationSnapshotV15Schema = z30.object({
  version: z30.literal(15),
  kind: z30.enum([
    "gameplay-moodboard",
    "character",
    "prop",
    "background",
    "ui-icon",
    "ui-surface"
  ]),
  operationInput: EffectiveSnapshotOperationInputSchema,
  style: EffectiveStyleSchema,
  palette: ResolvedPaletteSchema,
  references: z30.array(GenerationReferenceSchema).max(32),
  processingPolicy: ProcessingPolicySchema,
  qualityPolicy: QualityPolicySchema,
  compilerVersion: z30.literal("style-prompt-compiler-v5"),
  candidatePlan: z30.array(CandidatePlanEntrySchema).min(1).max(4),
  sizePolicy: GenerationSizePolicySchema,
  effectiveFingerprint: ChecksumSchema,
  characterId: UuidSchema.nullable(),
  sourceAssetId: UuidSchema.nullable(),
  sourceJobId: UuidSchema.nullable(),
  capturedAt: IsoDateTimeSchema
}).strict().superRefine((value, context) => {
  if (value.kind !== value.operationInput.kind) {
    context.addIssue({
      code: "custom",
      message: "Snapshot kind must match operation input kind."
    });
  }
  const inputCharacterId = value.operationInput.kind === "character" ? value.operationInput.characterId : null;
  if (value.characterId !== inputCharacterId) {
    context.addIssue({
      code: "custom",
      path: ["characterId"],
      message: "Snapshot Character owner must match its immutable operation input."
    });
  }
  const targetWidth = value.operationInput.kind === "gameplay-moodboard" ? value.operationInput.nativeWidth : value.operationInput.kind === "background" ? value.operationInput.viewportWidth : value.operationInput.kind === "ui-icon" ? value.operationInput.size : value.operationInput.width;
  const targetHeight = value.operationInput.kind === "gameplay-moodboard" ? value.operationInput.nativeHeight : value.operationInput.kind === "background" ? value.operationInput.viewportHeight : value.operationInput.kind === "ui-icon" ? value.operationInput.size : value.operationInput.height;
  if (value.candidatePlan.length !== value.operationInput.candidateCount) {
    context.addIssue({
      code: "custom",
      path: ["candidatePlan"],
      message: "Snapshot candidate plan must match the requested variant count."
    });
  }
  for (const [index, candidate] of value.candidatePlan.entries()) {
    if (candidate.index !== index || candidate.modelId !== value.operationInput.modelIds[index % value.operationInput.modelIds.length] || candidate.targetWidth !== targetWidth || candidate.targetHeight !== targetHeight) {
      context.addIssue({
        code: "custom",
        path: ["candidatePlan", index],
        message: "Snapshot candidate plan is inconsistent with its immutable operation input."
      });
      break;
    }
  }
  if (value.sizePolicy.operation !== value.kind || value.sizePolicy.styleCode !== value.style.baseStyleCode)
    context.addIssue({
      code: "custom",
      path: ["sizePolicy"],
      message: "Snapshot size policy must match the captured operation and style."
    });
  const seenReferences = /* @__PURE__ */ new Set();
  const selectedIds = value.references.filter((reference) => reference.purpose !== "technique-reference").map((reference) => reference.id);
  if (selectedIds.length !== value.operationInput.selectedReferenceIds.length || selectedIds.some((id2, index) => id2 !== value.operationInput.selectedReferenceIds[index]))
    context.addIssue({
      code: "custom",
      path: ["operationInput", "selectedReferenceIds"],
      message: "Selection must match the canonical retained reference order."
    });
  let seenMoodboard = false;
  for (const [index, reference] of value.references.entries()) {
    if (reference.order !== index || seenReferences.has(reference.id)) {
      context.addIssue({
        code: "custom",
        message: "Snapshot references must be unique and ordered."
      });
      break;
    }
    seenReferences.add(reference.id);
    if (reference.purpose === "technique-reference" && index !== 0) {
      context.addIssue({
        code: "custom",
        message: "Private technique references must be first."
      });
      break;
    }
    if (reference.purpose === "moodboard-screen") seenMoodboard = true;
    if (seenMoodboard && reference.purpose === "style-reference") {
      context.addIssue({
        code: "custom",
        message: "Style references must precede moodboard references."
      });
      break;
    }
    if (reference.roles.includes("rendering-technique")) {
      if (index !== 0 || value.references.filter((candidate) => candidate.roles.includes("rendering-technique")).length !== 1) {
        context.addIssue({
          code: "custom",
          message: "Rendering-technique reference must be first and unique."
        });
        break;
      }
    }
  }
});
var StylePreviewSnapshotV12Schema = z30.object({
  version: z30.literal(12),
  kind: z30.literal("style-preview"),
  operationInput: StylePreviewCreateRequestSchema,
  expectedProfileFingerprint: ChecksumSchema,
  profileFields: StyleFieldsSchema,
  techniqueSource: GenerationReferenceSchema,
  palette: ResolvedPaletteSchema,
  plan: StylePreviewPlanSchema,
  processingPolicy: ProcessingPolicySchema,
  qualityPolicy: QualityPolicySchema,
  compilerVersion: z30.literal("style-prompt-compiler-v5"),
  candidatePlan: z30.array(CandidatePlanEntrySchema).length(1),
  effectiveFingerprint: ChecksumSchema,
  capturedAt: IsoDateTimeSchema
}).strict().superRefine((value, context) => {
  if (value.techniqueSource.purpose !== "technique-reference" || value.techniqueSource.roles[0] !== "rendering-technique" || value.techniqueSource.order !== 0) {
    context.addIssue({
      code: "custom",
      path: ["techniqueSource"],
      message: "Style preview requires one technique source."
    });
  }
  const candidate = value.candidatePlan[0];
  if (!candidate || candidate.modelId !== value.operationInput.previewModelId) {
    context.addIssue({
      code: "custom",
      path: ["candidatePlan"],
      message: "Style preview requires its selected preview model."
    });
  }
});
var CreativeSnapshotSchema = z30.discriminatedUnion("version", [
  EffectiveGenerationSnapshotV15Schema,
  StylePreviewSnapshotV12Schema
]);
var CreativeSnapshotWorkflowInputSchema = z30.object({
  jobId: UuidSchema,
  snapshotVersion: z30.union([z30.literal(15), z30.literal(12)]),
  effectiveFingerprint: ChecksumSchema
}).strict();
var GenerationOperationSchema = z30.enum(["retry", "clone", "regenerate", "continuation"]);
function canonicalizeCreativeValue(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeCreativeValue).join(",")}]`;
  const entries = Object.entries(value).filter(([, entry]) => entry !== void 0).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key3, entry]) => `${JSON.stringify(key3)}:${canonicalizeCreativeValue(entry)}`).join(",")}}`;
}

// packages/contracts/src/game-concepts.ts
import { z as z31 } from "zod/v4";
function conceptText(limit) {
  return z31.string().refine(
    (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
    "Text must contain well-formed Unicode without NUL."
  ).overwrite((value) => value.replace(/\r\n?/g, "\n").trim()).refine(
    (value) => Array.from(value).length <= limit,
    `Text must not exceed ${limit} code points.`
  ).refine(isSafeMarkdown, "Invalid Markdown.");
}
var scalar = (limit) => conceptText(limit).transform((value) => value || null).nullable();
var GameConceptContentSchema = z31.strictObject({
  logline: scalar(280),
  audience: scalar(1e3),
  playerFantasy: scalar(1e3),
  coreLoop: scalar(4e3),
  designPillars: z31.array(conceptText(280).refine(markdownHasText, "A pillar must contain visible text.")).max(5)
});
function gameConceptReadiness(content) {
  const fields = [content.logline, content.audience, content.playerFantasy, content.coreLoop].map(
    (value) => value !== null && markdownHasText(value)
  );
  const pillars = content.designPillars.some(markdownHasText);
  if (fields.every((value) => !value) && !pillars) return "empty";
  return fields.every(Boolean) && pillars ? "complete" : "partial";
}
var GameConceptSaveRequestSchema = z31.strictObject({
  expectedRevision: z31.number().int().min(1).max(Number.MAX_SAFE_INTEGER - 1),
  content: GameConceptContentSchema
});
var GameConceptSchema = z31.strictObject({
  projectId: UuidSchema,
  revision: z31.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  content: z31.strictObject({
    logline: conceptText(280).min(1).nullable(),
    audience: conceptText(1e3).min(1).nullable(),
    playerFantasy: conceptText(1e3).min(1).nullable(),
    coreLoop: conceptText(4e3).min(1).nullable(),
    designPillars: GameConceptContentSchema.shape.designPillars
  }),
  readiness: z31.enum(["empty", "partial", "complete"])
}).refine(
  (value) => value.readiness === gameConceptReadiness(value.content),
  "Readiness must match content."
);

// packages/contracts/src/game-development-documents.ts
import { z as z32 } from "zod/v4";
var UrlParser = globalThis;
var DocumentTypeSchema = z32.enum([
  "one-pager",
  "gdd",
  "narrative-bible",
  "character-bible",
  "technical-design",
  "production-plan"
]);
function documentText(limit, trim = false) {
  return z32.string().refine(
    (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
    "Text must contain well-formed Unicode without NUL."
  ).overwrite(
    (value) => trim ? value.replace(/\r\n?/g, "\n").trim() : value.replace(/\r\n?/g, "\n")
  ).refine(
    (value) => Array.from(value).length <= limit,
    `Text must not exceed ${limit} code points.`
  );
}
var title = documentText(160, true).min(1);
var markdown = documentText(2e4).refine(isSafeMarkdown, "Invalid Markdown.");
var externalUrl = documentText(2048, true).min(1).superRefine((value, context) => {
  if (new RegExp("\\p{Cc}", "u").test(value)) {
    context.addIssue({
      code: "custom",
      message: "External URL must not contain control characters."
    });
    return;
  }
  try {
    const parsed = new UrlParser.URL(value);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.host || parsed.username || parsed.password || /^[a-z][a-z\d+.-]*:\/\/[^/?#]*@/i.test(value))
      context.addIssue({
        code: "custom",
        message: "External URL must be an absolute HTTP(S) URL without credentials."
      });
  } catch {
    context.addIssue({ code: "custom", message: "External URL must be absolute." });
  }
});
var expectedRevision = z32.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
var DocumentIdempotencyKeySchema = z32.string().regex(/^[A-Za-z0-9_.:-]{1,120}$/);
var DocumentSourceFingerprintSchema = z32.string().regex(/^[a-f0-9]{64}$/);
var sourceBase = z32.strictObject({
  id: UuidSchema,
  reviewedFingerprint: DocumentSourceFingerprintSchema
});
var DocumentSourceSchema = z32.discriminatedUnion("kind", [
  sourceBase.extend({
    kind: z32.literal("concept"),
    field: z32.enum(["logline", "audience", "designPillars", "playerFantasy", "coreLoop"])
  }),
  sourceBase.extend({ kind: z32.literal("character"), targetId: UuidSchema }),
  sourceBase.extend({ kind: z32.literal("mechanic"), targetId: UuidSchema }),
  sourceBase.extend({ kind: z32.literal("quest"), targetId: UuidSchema }),
  sourceBase.extend({ kind: z32.literal("scene"), targetId: UuidSchema })
]);
var DocumentSectionSchema = z32.strictObject({
  id: UuidSchema,
  title,
  markdown,
  sources: z32.array(DocumentSourceSchema).max(20).default([])
});
function validateDocumentSections(sections, context) {
  const sectionIds = /* @__PURE__ */ new Set();
  const sourceIds = /* @__PURE__ */ new Set();
  let sourceCount = 0;
  let proseCount = 0;
  for (const [sectionIndex, section] of sections.entries()) {
    proseCount += Array.from(section.markdown).length;
    if (sectionIds.has(section.id))
      context.addIssue({
        code: "custom",
        path: ["sections", sectionIndex, "id"],
        message: "Section IDs must be unique."
      });
    sectionIds.add(section.id);
    const targets = /* @__PURE__ */ new Set();
    for (const [sourceIndex, source] of section.sources.entries()) {
      sourceCount += 1;
      if (sourceIds.has(source.id))
        context.addIssue({
          code: "custom",
          path: ["sections", sectionIndex, "sources", sourceIndex, "id"],
          message: "Source occurrence IDs must be unique."
        });
      sourceIds.add(source.id);
      const target2 = source.kind === "concept" ? `${source.kind}:${source.field}` : `${source.kind}:${source.targetId}`;
      if (targets.has(target2))
        context.addIssue({
          code: "custom",
          path: ["sections", sectionIndex, "sources", sourceIndex],
          message: "A source target may occur only once per section."
        });
      targets.add(target2);
    }
  }
  if (sourceCount > 200)
    context.addIssue({
      code: "custom",
      path: ["sections"],
      message: "A document may have at most 200 source occurrences."
    });
  if (proseCount > 2e5)
    context.addIssue({
      code: "custom",
      path: ["sections"],
      message: "Document prose must not exceed 200000 code points."
    });
}
var DocumentCreateRequestSchema = z32.strictObject({
  title,
  type: DocumentTypeSchema,
  locale: LocaleSchema,
  template: z32.boolean().default(false)
});
var ExternalDocumentCreateRequestSchema = z32.strictObject({
  title,
  type: DocumentTypeSchema,
  locale: LocaleSchema,
  url: externalUrl
});
var DocumentReplaceRequestSchema = z32.strictObject({
  expectedRevision,
  title,
  locale: LocaleSchema,
  sections: z32.array(DocumentSectionSchema).max(100).default([])
}).superRefine((value, context) => validateDocumentSections(value.sections, context));
var ExternalDocumentUpdateRequestSchema = z32.strictObject({
  expectedRevision,
  title,
  locale: LocaleSchema,
  url: externalUrl
});
var DocumentLifecycleRequestSchema = z32.strictObject({ expectedRevision });
var DocumentReviewRequestSchema = z32.strictObject({
  expectedRevision,
  occurrenceId: UuidSchema,
  displayedFingerprint: DocumentSourceFingerprintSchema
});
var DocumentExportRequestSchema = z32.strictObject({ expectedRevision });
var DocumentParamsSchema = z32.strictObject({
  projectId: UuidSchema,
  documentId: UuidSchema
});
var ExternalDocumentParamsSchema = z32.strictObject({
  projectId: UuidSchema,
  externalDocumentId: UuidSchema
});
var DocumentExportParamsSchema = DocumentParamsSchema.extend({ exportId: UuidSchema });
var DocumentCommandReceiptSchema = z32.strictObject({
  operation: z32.enum([
    "document-create",
    "document-replace",
    "document-archive",
    "document-restore",
    "document-review"
  ]),
  projectId: UuidSchema,
  documentId: UuidSchema,
  documentRevision: z32.number().int().positive()
});
var ExternalDocumentCommandReceiptSchema = z32.strictObject({
  operation: z32.enum([
    "external-document-create",
    "external-document-update",
    "external-document-archive",
    "external-document-restore"
  ]),
  projectId: UuidSchema,
  externalDocumentId: UuidSchema,
  externalDocumentRevision: z32.number().int().positive()
});
var DocumentExportCommandReceiptSchema = z32.strictObject({
  operation: z32.literal("document-export"),
  projectId: UuidSchema,
  documentId: UuidSchema,
  documentRevision: z32.number().int().positive(),
  exportId: UuidSchema
});
var page2 = z32.strictObject({
  cursor: z32.string().trim().min(1).max(500).optional(),
  limit: z32.coerce.number().int().min(1).max(100).default(25)
});
var DocumentListQuerySchema = page2.extend({
  state: z32.enum(["active", "archived"]).default("active"),
  type: DocumentTypeSchema.optional(),
  search: z32.string().trim().min(1).max(160).optional()
});
var DocumentSummarySchema = z32.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  type: DocumentTypeSchema,
  title,
  locale: LocaleSchema,
  revision: z32.number().int().positive(),
  archivedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var ExternalDocumentSummarySchema = z32.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  source: z32.literal("external"),
  type: DocumentTypeSchema,
  title,
  locale: LocaleSchema,
  revision: z32.number().int().positive(),
  archivedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var DocumentLibraryEntrySchema = z32.discriminatedUnion("source", [
  DocumentSummarySchema.extend({ source: z32.literal("internal") }),
  ExternalDocumentSummarySchema
]);
var ExternalDocumentDetailSchema = z32.strictObject({
  externalDocument: ExternalDocumentSummarySchema,
  url: externalUrl
});
var DocumentListResponseSchema = z32.strictObject({
  documents: z32.array(DocumentSummarySchema).max(100),
  nextCursor: z32.string().nullable(),
  total: z32.number().int().nonnegative()
});
var DocumentLibraryQuerySchema = page2.extend({
  state: z32.enum(["active", "archived"]).default("active"),
  type: DocumentTypeSchema.optional(),
  locale: LocaleSchema.optional(),
  source: z32.enum(["internal", "external"]).optional(),
  search: z32.string().trim().min(1).max(160).optional(),
  sort: z32.enum(["title", "updatedAt"]).default("updatedAt"),
  direction: z32.enum(["asc", "desc"]).default("desc")
});
var DocumentLibraryResponseSchema = z32.strictObject({
  entries: z32.array(DocumentLibraryEntrySchema).max(100),
  nextCursor: z32.string().nullable(),
  total: z32.number().int().nonnegative()
});
var DocumentSourceReadStatusSchema = z32.strictObject({
  occurrenceId: UuidSchema,
  status: z32.enum(["current", "stale", "unavailable"]),
  values: z32.record(z32.string(), z32.union([z32.string(), z32.array(z32.string()), z32.null()])).nullable(),
  fingerprint: DocumentSourceFingerprintSchema.nullable()
});
var DocumentDetailSchema = z32.strictObject({
  document: DocumentSummarySchema,
  sections: z32.array(DocumentSectionSchema).max(100),
  sourceStatuses: z32.array(DocumentSourceReadStatusSchema).max(200)
});
var DocumentExportListQuerySchema = page2;
var DocumentExportListResponseSchema = z32.strictObject({
  exports: z32.array(
    z32.strictObject({
      id: UuidSchema,
      documentId: UuidSchema,
      documentRevision: z32.number().int().positive(),
      locale: LocaleSchema,
      createdAt: IsoDateTimeSchema,
      markdownBytes: z32.number().int().nonnegative(),
      markdownSha256: DocumentSourceFingerprintSchema
    })
  ).max(100),
  nextCursor: z32.string().nullable()
});
var DocumentSourceSelectorQuerySchema = page2.extend({
  kind: z32.enum(["concept", "character", "mechanic", "quest", "scene"]),
  search: z32.string().trim().min(1).max(160).optional()
});
var DocumentSourceSelectorResponseSchema = z32.strictObject({
  sources: z32.array(
    z32.strictObject({
      kind: z32.enum(["concept", "character", "mechanic", "quest", "scene"]),
      targetId: UuidSchema,
      conceptField: z32.enum(["logline", "audience", "designPillars", "playerFantasy", "coreLoop"]).nullable(),
      label: z32.string().max(160),
      values: z32.record(z32.string(), z32.union([z32.string(), z32.array(z32.string()), z32.null()])),
      fingerprint: DocumentSourceFingerprintSchema
    })
  ).max(100),
  nextCursor: z32.string().nullable()
});
var DocumentExportSourceSchema = z32.strictObject({
  occurrenceId: UuidSchema,
  kind: z32.enum(["concept", "character", "mechanic", "quest", "scene"]),
  targetId: UuidSchema,
  conceptField: z32.enum(["logline", "audience", "designPillars", "playerFantasy", "coreLoop"]).nullable(),
  projectionVersion: z32.literal("game-development-document-source/v2"),
  fingerprint: DocumentSourceFingerprintSchema,
  observedRevision: z32.number().int().positive(),
  locale: LocaleSchema.nullable(),
  values: z32.record(z32.string(), z32.union([z32.string(), z32.array(z32.string()), z32.null()]))
});
var DocumentExportSnapshotSchema = z32.strictObject({
  format: z32.literal("game-development-document/v1"),
  exportId: UuidSchema,
  documentId: UuidSchema,
  documentRevision: z32.number().int().positive(),
  locale: LocaleSchema,
  capturedAt: IsoDateTimeSchema,
  title,
  type: DocumentTypeSchema,
  sections: z32.array(
    z32.strictObject({
      id: UuidSchema,
      title,
      markdown,
      sources: z32.array(DocumentExportSourceSchema).max(20)
    })
  ).max(100)
});
var DocumentExportManifestSchema = z32.strictObject({
  format: z32.literal("game-development-document/v1"),
  exportId: UuidSchema,
  documentId: UuidSchema,
  documentRevision: z32.number().int().positive(),
  locale: LocaleSchema,
  capturedAt: IsoDateTimeSchema,
  markdownBytes: z32.number().int().nonnegative().max(8 * 1024 * 1024),
  markdownSha256: DocumentSourceFingerprintSchema,
  sections: z32.array(z32.strictObject({ id: UuidSchema, sources: z32.array(DocumentExportSourceSchema).max(20) })).max(100)
});

// packages/contracts/src/generation-workspace.ts
import { z as z33 } from "zod/v4";
var CandidateCountSchema = z33.number().int().min(1).max(MAX_GENERATION_VARIANTS);
var MoodboardGenerationFormSeedInputSchema = z33.object({
  kind: z33.literal("gameplay-moodboard"),
  ...MoodboardMetadataSchema.shape,
  selectedReferenceIds: SelectedReferenceIdsSchema,
  brief: z33.string().trim().min(10).max(4e3),
  screenPreset: ScreenPresetSchema,
  candidateCount: CandidateCountSchema,
  modelIds: CandidateModelSelectionSchema,
  camera: CameraSchema
}).strict();
var AssetGenerationFormSeedBaseSchema = z33.object({
  selectedReferenceIds: SelectedReferenceIdsSchema,
  name: z33.string().trim().min(1).max(160),
  brief: z33.string().trim().min(10).max(4e3),
  width: z33.number().int().min(8).max(2048),
  height: z33.number().int().min(8).max(2048),
  direction: z33.enum(["none", "front", "left", "right", "back"]),
  geometry: AssetAnchorGeometrySchema,
  candidateCount: CandidateCountSchema,
  modelIds: CandidateModelSelectionSchema,
  camera: CameraSchema
});
var AssetGenerationFormSeedInputSchema = z33.discriminatedUnion("kind", [
  AssetGenerationFormSeedBaseSchema.extend({
    kind: z33.literal("character"),
    silhouette: z33.string().trim().max(500)
  }).strict(),
  AssetGenerationFormSeedBaseSchema.extend({ kind: z33.literal("prop") }).strict()
]);
var BackgroundGenerationFormSeedInputSchema = z33.object({
  kind: z33.literal("background"),
  selectedReferenceIds: SelectedReferenceIdsSchema,
  name: z33.string().trim().min(1).max(160),
  brief: z33.string().trim().min(10).max(4e3),
  candidateCount: CandidateCountSchema,
  modelIds: CandidateModelSelectionSchema,
  camera: CameraSchema
}).strict();
var UiIconGenerationFormSeedInputSchema = UiIconAssetCreateRequestSchema.pick({
  selectedReferenceIds: true,
  kind: true,
  name: true,
  brief: true,
  size: true,
  candidateCount: true,
  modelIds: true
}).strict();
var UiSurfaceGenerationFormSeedInputSchema = z33.strictObject({
  kind: z33.literal("ui-surface"),
  selectedReferenceIds: SelectedReferenceIdsSchema,
  name: z33.string().trim().min(1).max(160),
  surfaceKind: z33.enum(["button", "panel", "frame", "slot", "progress-track", "progress-fill"]),
  description: z33.string().trim().min(10).max(4e3),
  width: z33.number().int().min(16).max(512),
  height: z33.number().int().min(16).max(512),
  candidateCount: CandidateCountSchema,
  modelIds: CandidateModelSelectionSchema
}).superRefine((value, context) => {
  if (value.width % 8 || value.height % 8 || Math.max(value.width, value.height) / Math.min(value.width, value.height) > 8) {
    context.addIssue({ code: "custom", message: "UI surface target is unsupported." });
  }
});
var StylePreviewGenerationFormSeedInputSchema = z33.object({
  kind: z33.literal("style-preview"),
  techniqueReferenceId: UuidSchema,
  mode: StyleModeSchema,
  authoringDescription: StyleIntentSchema,
  previewModelId: z33.string().trim().min(1).max(160)
}).strict();
var GenerationFormSeedSchema = z33.object({
  sourceGenerationId: UuidSchema,
  kind: z33.enum([
    "gameplay-moodboard",
    "character",
    "prop",
    "background",
    "ui-icon",
    "ui-surface",
    "style-preview"
  ]),
  input: z33.union([
    MoodboardGenerationFormSeedInputSchema,
    AssetGenerationFormSeedInputSchema,
    BackgroundGenerationFormSeedInputSchema,
    UiIconGenerationFormSeedInputSchema,
    UiSurfaceGenerationFormSeedInputSchema,
    StylePreviewGenerationFormSeedInputSchema
  ])
}).strict();
var GenerationFormSeedParamsSchema = z33.object({ projectId: UuidSchema, jobId: UuidSchema }).strict();
var GenerationHistoryQuerySchema = z33.object({
  limit: z33.coerce.number().int().min(1).max(50).default(20),
  cursor: z33.string().datetime({ offset: true }).optional(),
  kind: z33.enum([
    "gameplay-moodboard",
    "character",
    "prop",
    "background",
    "ui-icon",
    "ui-surface",
    "style-preview"
  ]).optional()
}).strict();

// packages/contracts/src/health.ts
import { z as z34 } from "zod/v4";
var HealthStatusSchema = z34.enum(["ok", "degraded"]);
var HealthResponseSchema = z34.object({
  status: HealthStatusSchema,
  service: z34.string().min(1),
  version: z34.string().min(1)
});

// packages/contracts/src/invitation-mail-config.ts
import { z as z35 } from "zod/v4";
var header = z35.string().min(1).max(320).refine(
  (value) => [...value].every(
    (character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127
  )
);
var key = z35.string().regex(/^[A-Za-z0-9_-]{1,64}:[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/);
var schema = z35.object({
  SMTP_HOST: z35.string().min(1).max(255).refine((value) => !/[\s/@?#]/.test(value)),
  SMTP_PORT: z35.coerce.number().int().min(1).max(65535),
  SMTP_FROM: header.pipe(EmailSchema),
  SMTP_USER: header.optional(),
  SMTP_PASSWORD: z35.string().min(1).max(1024).optional(),
  SMTP_TLS_MODE: z35.enum(["tls", "starttls", "test"]),
  INVITATION_DELIVERY_ENCRYPTION_KEY: key,
  WEB_ORIGIN: z35.url(),
  NODE_ENV: z35.enum(["development", "test", "production"]).default("development")
}).superRefine((value, context) => {
  if (!/^https?:\/\/[^/?#@]+\/?$/i.test(value.WEB_ORIGIN))
    context.addIssue({
      code: "custom",
      message: "Invitation WEB_ORIGIN must be an HTTP(S) origin.",
      path: ["WEB_ORIGIN"]
    });
  if (value.SMTP_USER === void 0 !== (value.SMTP_PASSWORD === void 0))
    context.addIssue({
      code: "custom",
      message: "SMTP authentication requires both user and password."
    });
  if (value.NODE_ENV === "production" && (value.SMTP_TLS_MODE === "test" || !/^https:\/\//i.test(value.WEB_ORIGIN)))
    context.addIssue({
      code: "custom",
      message: "Production invitations require TLS and HTTPS."
    });
  if (value.SMTP_TLS_MODE === "test" && !["127.0.0.1", "localhost", "::1", "[::1]"].includes(value.SMTP_HOST))
    context.addIssue({
      code: "custom",
      message: "Plaintext test SMTP is restricted to local capture."
    });
});

// packages/contracts/src/invitations.ts
import { z as z36 } from "zod/v4";
var InvitationSecretSchema = z36.string().regex(/^[A-Za-z0-9_-]{43}$/);
var InvitationProofSchema = z36.strictObject({ secret: InvitationSecretSchema });
var InvitationAcceptanceSchema = z36.strictObject({
  studioId: UuidSchema,
  status: z36.enum(["accepted", "already-member"])
});

// packages/contracts/src/lifecycle.ts
import { z as z37 } from "zod/v4";
var CONTENT_TRASH_RETENTION_DAYS = 30;
var CONTENT_TRASH_RETENTION_MS = CONTENT_TRASH_RETENTION_DAYS * 864e5;
var ContentFamilySchema = z37.enum(["reference", "asset", "tileset"]);
var ContentLifecycleStateSchema = z37.enum(["active", "trashed", "purge_pending"]);
var ContentLifecycleParamsSchema = z37.object({
  projectId: UuidSchema,
  family: ContentFamilySchema,
  contentId: UuidSchema
}).strict();
var IdempotencyKeySchema = z37.string().trim().min(1).max(120);
var TrashContentRequestSchema = z37.object({ idempotencyKey: IdempotencyKeySchema }).strict();
var RestoreContentRequestSchema = z37.object({ idempotencyKey: IdempotencyKeySchema }).strict();
var PurgeContentRequestSchema = z37.object({
  idempotencyKey: IdempotencyKeySchema,
  confirmDependencies: z37.literal(false).default(false)
}).strict();
var LifecycleMetadataSchema = z37.object({
  state: ContentLifecycleStateSchema,
  deletedAt: IsoDateTimeSchema.nullable(),
  purgeAfter: IsoDateTimeSchema.nullable(),
  purgeRequestedAt: IsoDateTimeSchema.nullable()
}).strict();
var ContentLifecycleResponseSchema = LifecycleMetadataSchema.extend({
  id: UuidSchema,
  projectId: UuidSchema,
  family: ContentFamilySchema
}).strict();
var ReferenceLifecycleResponseSchema = ContentLifecycleResponseSchema.extend({
  family: z37.literal("reference")
}).strict();
var AssetLifecycleResponseSchema = ContentLifecycleResponseSchema.extend({
  family: z37.literal("asset")
}).strict();
var TilesetLifecycleResponseSchema = ContentLifecycleResponseSchema.extend({
  family: z37.literal("tileset")
}).strict();
var TrashListQuerySchema = z37.object({
  family: z37.union([z37.literal("all"), ContentFamilySchema]).default("all"),
  cursor: z37.string().trim().min(1).max(500).optional(),
  limit: z37.coerce.number().int().min(1).max(100).default(50)
}).strict();
var TrashListItemSchema = ContentLifecycleResponseSchema.extend({
  name: z37.string().trim().min(1).max(255),
  previewUrl: z37.url().nullable(),
  dependencyCount: z37.number().int().min(0)
}).strict();
var TrashListResponseSchema = z37.object({ items: z37.array(TrashListItemSchema), nextCursor: z37.string().nullable() }).strict();
var PurgeDependencySchema = z37.object({
  id: UuidSchema,
  family: z37.enum(["tileset", "asset", "catalog-slot"]),
  name: z37.string().trim().min(1).max(160),
  state: ContentLifecycleStateSchema
}).strict();
var PurgeDependencyConflictSchema = z37.object({
  code: z37.literal("content_has_dependencies"),
  contentId: UuidSchema,
  dependencies: z37.array(PurgeDependencySchema).min(1).max(100)
}).strict();
var AutomationTrashListSchema = z37.strictObject({
  items: z37.array(TrashListItemSchema.omit({ previewUrl: true })),
  nextCursor: z37.string().nullable()
});
var AutomationContentStatusSchema = ContentLifecycleResponseSchema.extend({
  state: z37.enum(["active", "trashed", "purge_pending", "purged"]),
  completedAt: IsoDateTimeSchema.nullable(),
  dispatch: z37.enum(["none", "pending", "scheduled"]),
  dependencies: z37.array(PurgeDependencySchema).max(100),
  hiddenDependencyCount: z37.number().int().nonnegative()
});

// packages/contracts/src/mechanics.ts
import { z as z38 } from "zod/v4";
function mechanicText(limit) {
  return z38.string().refine(
    (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
    "Text must contain well-formed Unicode without NUL."
  ).overwrite((value) => value.replace(/\r\n?/g, "\n").trim()).refine(
    (value) => Array.from(value).length <= limit,
    `Text must not exceed ${limit} code points.`
  );
}
var proseText2 = (limit) => mechanicText(limit).refine(isSafeMarkdown, "Invalid Markdown.");
var nullableText2 = (limit) => proseText2(limit).nullable();
var nullableInputText2 = (limit) => proseText2(limit).transform((value) => value || null).nullable();
var requiredName2 = mechanicText(120).min(1);
var revision = z38.number().int().positive().max(Number.MAX_SAFE_INTEGER);
var expectedRevision2 = revision.max(Number.MAX_SAFE_INTEGER - 1);
var MechanicProfileSchema = z38.strictObject({
  name: requiredName2,
  intent: nullableText2(1e3).default(null),
  playerActions: nullableText2(4e3).default(null),
  rules: nullableText2(4e3).default(null),
  feedback: nullableText2(4e3).default(null),
  successState: nullableText2(4e3).default(null),
  failureState: nullableText2(4e3).default(null),
  tags: AuthoringTagsSchema.default([])
});
var MechanicProfileInputSchema = z38.strictObject({
  name: requiredName2,
  intent: nullableInputText2(1e3).default(null),
  playerActions: nullableInputText2(4e3).default(null),
  rules: nullableInputText2(4e3).default(null),
  feedback: nullableInputText2(4e3).default(null),
  successState: nullableInputText2(4e3).default(null),
  failureState: nullableInputText2(4e3).default(null),
  tags: AuthoringTagsSchema.default([])
});
var MechanicSchema = MechanicProfileSchema.extend({
  id: UuidSchema,
  projectId: UuidSchema,
  revision,
  archivedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
}).strict();
var MechanicListItemSchema = MechanicSchema.pick({
  id: true,
  projectId: true,
  name: true,
  revision: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({ intent: ListSummaryProjectionSchema, tags: AuthoringTagsSchema }).strict();
var MechanicDetailSchema = z38.strictObject({ mechanic: MechanicSchema });
var MechanicListQuerySchema = z38.strictObject({
  state: z38.enum(["active", "archived"]).default("active"),
  cursor: z38.string().trim().min(1).max(500).optional(),
  limit: z38.coerce.number().int().min(1).max(100).default(50)
});
var MechanicListResponseSchema = z38.strictObject({
  mechanics: z38.array(MechanicListItemSchema).max(100),
  nextCursor: z38.string().nullable(),
  total: z38.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});
var MechanicCreateRequestSchema = MechanicProfileInputSchema.pick({ name: true }).strict();
var MechanicReplaceRequestSchema = z38.strictObject({
  expectedRevision: expectedRevision2,
  profile: MechanicProfileInputSchema
});
var MechanicLifecycleRequestSchema = z38.strictObject({ expectedRevision: expectedRevision2 });
var MechanicParamsSchema = z38.strictObject({
  projectId: UuidSchema,
  mechanicId: UuidSchema
});
var MechanicEndpointSchema = z38.strictObject({
  id: UuidSchema,
  name: requiredName2,
  archivedAt: IsoDateTimeSchema.nullable()
});
var MechanicInfluenceSchema = z38.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  revision,
  mechanicA: MechanicEndpointSchema,
  mechanicB: MechanicEndpointSchema,
  aToB: nullableText2(2e3),
  bToA: nullableText2(2e3),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});
var MechanicInfluenceCreateRequestSchema = z38.strictObject({
  sourceMechanicId: UuidSchema,
  targetMechanicId: UuidSchema,
  sourceToTarget: nullableInputText2(2e3).default(null),
  targetToSource: nullableInputText2(2e3).default(null)
}).refine(
  (value) => value.sourceMechanicId !== value.targetMechanicId,
  "An influence requires two distinct Mechanics."
).refine(
  (value) => markdownHasText(value.sourceToTarget ?? "") || markdownHasText(value.targetToSource ?? ""),
  "At least one influence direction is required."
);
var MechanicInfluenceReplaceRequestSchema = z38.strictObject({
  expectedRevision: expectedRevision2,
  aToB: nullableInputText2(2e3).default(null),
  bToA: nullableInputText2(2e3).default(null)
}).refine(
  (value) => markdownHasText(value.aToB ?? "") || markdownHasText(value.bToA ?? ""),
  "At least one influence direction is required."
);
var MechanicInfluenceRemoveRequestSchema = z38.strictObject({
  expectedRevision: expectedRevision2,
  initiatingMechanicId: UuidSchema
});
var MechanicInfluenceRemoveResponseSchema = z38.strictObject({ id: UuidSchema });
var MechanicInfluenceParamsSchema = z38.strictObject({
  projectId: UuidSchema,
  influenceId: UuidSchema
});
var MechanicInfluenceListQuerySchema = z38.strictObject({
  cursor: z38.string().trim().min(1).max(500).optional(),
  limit: z38.coerce.number().int().min(1).max(100).default(50)
});
var MechanicInfluenceListResponseSchema = z38.strictObject({
  influences: z38.array(MechanicInfluenceSchema).max(100),
  nextCursor: z38.string().nullable(),
  total: z38.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});
var MechanicSelectorResponseSchema = z38.strictObject({
  mechanics: z38.array(MechanicListItemSchema).max(100),
  nextCursor: z38.string().nullable()
});

// packages/contracts/src/model-discovery.ts
import { z as z39 } from "zod/v4";
var GenerationSizePolicyQuerySchema = z39.object({
  operation: z39.enum([
    "gameplay-moodboard",
    "character",
    "prop",
    "background",
    "ui-icon",
    "ui-surface"
  ])
}).strict();
var GenerationModelCatalogQuerySchema = z39.object({
  operation: z39.enum(["gameplay-moodboard", "character", "prop", "background", "ui-icon", "ui-surface"]).optional(),
  selectedReferenceIds: z39.preprocess((value, ctx) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Expected a JSON array." });
      return z39.NEVER;
    }
  }, GenerationSelectionSchema.shape.selectedReferenceIds).optional(),
  contextFingerprint: GenerationSelectionSchema.shape.contextFingerprint.optional(),
  width: z39.coerce.number().int().positive().max(16384).optional(),
  height: z39.coerce.number().int().positive().max(16384).optional()
}).strict().superRefine((value, context) => {
  const supplied = [
    value.operation,
    value.selectedReferenceIds,
    value.width,
    value.height,
    value.contextFingerprint
  ].filter((item) => item !== void 0).length;
  if (supplied > 0 && supplied < 5)
    context.addIssue({
      code: "custom",
      message: "operation, selectedReferenceIds, contextFingerprint, width and height must be supplied together."
    });
});
var GenerationModelDiscoveryInputSchema = z39.union([
  z39.strictObject({ operation: z39.literal("style-preview") }),
  GenerationModelCatalogQuerySchema
]);

// packages/contracts/src/narrative.ts
import { z as z40 } from "zod/v4";
var NARRATIVE_WRITE_BODY_LIMIT = 65 * 1024 * 1024;
function narrativeText(limit) {
  return z40.string().refine(
    (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
    "Text must contain well-formed Unicode without NUL."
  ).refine(
    (value) => Array.from(value).length <= limit,
    `Text must not exceed ${limit} code points.`
  );
}
var requiredSceneText = (limit) => narrativeText(limit).refine(isSafeMarkdown, "Invalid Markdown.").refine(markdownHasText, "Text must contain visible text.");
var sceneName = narrativeText(160).overwrite((value) => value.trim()).min(1);
var optionalSceneText = (limit) => narrativeText(limit).refine(isSafeMarkdown, "Invalid Markdown.").default("");
var StoryOutlineSchema = z40.strictObject({
  premise: optionalSceneText(1e4),
  themes: optionalSceneText(1e4),
  synopsis: optionalSceneText(1e4),
  opening: optionalSceneText(1e4),
  development: optionalSceneText(1e4),
  climax: optionalSceneText(1e4),
  resolution: optionalSceneText(1e4)
});
var ScenePresentationKindSchema = z40.enum([
  "scene",
  "conversation",
  "cutscene",
  "briefing"
]);
var NarrativeSceneMetadataSchema = z40.strictObject({
  name: sceneName,
  locale: LocaleSchema,
  presentationKind: ScenePresentationKindSchema.default("scene"),
  primaryLocationId: UuidSchema.nullable().default(null),
  purpose: optionalSceneText(4e3),
  locationTimeNotes: optionalSceneText(4e3),
  appearanceContextNotes: optionalSceneText(4e3)
});
var NarrativeDescriptionEntrySchema = z40.strictObject({
  id: UuidSchema,
  kind: z40.literal("description"),
  text: requiredSceneText(4e3)
});
var SpeechBaseSchema = z40.strictObject({
  id: UuidSchema,
  kind: z40.literal("speech"),
  text: requiredSceneText(4e3),
  emotion: narrativeText(160).default(""),
  direction: optionalSceneText(2e3)
});
var NarrativeNarratorSpeechEntrySchema = SpeechBaseSchema.extend({
  speaker: z40.literal("narrator")
}).strict();
var NarrativeCharacterSpeechEntrySchema = SpeechBaseSchema.extend({
  speaker: z40.literal("character"),
  characterId: UuidSchema
}).strict();
var NarrativeSpeechEntrySchema = z40.union([
  NarrativeNarratorSpeechEntrySchema,
  NarrativeCharacterSpeechEntrySchema
]);
var NarrativeSceneEntrySchema = z40.union([
  NarrativeDescriptionEntrySchema,
  NarrativeSpeechEntrySchema
]);
var NarrativeSceneScriptSchema = z40.array(NarrativeSceneEntrySchema).max(500).superRefine((entries, context) => {
  const ids = /* @__PURE__ */ new Set();
  let total = 0;
  for (const [index, entry] of entries.entries()) {
    if (ids.has(entry.id))
      context.addIssue({
        code: "custom",
        path: [index, "id"],
        message: "Scene entry IDs must be unique."
      });
    ids.add(entry.id);
    total += Array.from(entry.text).length;
    if (entry.kind === "speech") total += Array.from(entry.direction).length;
  }
  if (total > 2e5)
    context.addIssue({
      code: "custom",
      message: "Scene entry text and directions must not exceed 200000 code points."
    });
});
var NarrativeStructureItemSchema = z40.lazy(
  () => z40.union([
    z40.strictObject({ kind: z40.literal("scene"), sceneId: UuidSchema }),
    z40.strictObject({ kind: z40.literal("quest"), questId: UuidSchema }),
    z40.strictObject({
      kind: z40.literal("section"),
      id: UuidSchema,
      name: sceneName,
      summary: optionalSceneText(4e3),
      label: z40.enum(["act", "chapter", "episode"]),
      archived: z40.boolean().default(false),
      children: z40.array(NarrativeStructureItemSchema)
    })
  ])
);
var NarrativeStructureSchema = z40.array(NarrativeStructureItemSchema).superRefine((items, context) => {
  let count = 0;
  const sceneIds = /* @__PURE__ */ new Set();
  const questIds = /* @__PURE__ */ new Set();
  const sectionIds = /* @__PURE__ */ new Set();
  const visit = (entries, depth, path) => {
    for (const [index, entry] of entries.entries()) {
      count += 1;
      if (entry.kind === "scene") {
        if (sceneIds.has(entry.sceneId))
          context.addIssue({
            code: "custom",
            path: [...path, index, "sceneId"],
            message: "A Scene may have only one placement."
          });
        sceneIds.add(entry.sceneId);
        continue;
      }
      if (entry.kind === "quest") {
        if (questIds.has(entry.questId))
          context.addIssue({
            code: "custom",
            path: [...path, index, "questId"],
            message: "A Quest may have only one placement."
          });
        questIds.add(entry.questId);
        continue;
      }
      if (sectionIds.has(entry.id))
        context.addIssue({
          code: "custom",
          path: [...path, index, "id"],
          message: "Section IDs must be unique."
        });
      sectionIds.add(entry.id);
      if (depth > 8)
        context.addIssue({
          code: "custom",
          path: [...path, index, "children"],
          message: "A structure may not exceed eight section levels."
        });
      visit(entry.children, depth + 1, [...path, index, "children"]);
    }
  };
  visit(items, 1, []);
  if (count > 2e3)
    context.addIssue({
      code: "custom",
      message: "A structure may not exceed 2000 retained items."
    });
});
var expectedRevision3 = z40.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1);
var NarrativeIdempotencyKeySchema = z40.string().trim().min(1).max(120);
var NarrativeOutlineSaveRequestSchema = z40.strictObject({
  expectedRevision: expectedRevision3,
  outline: StoryOutlineSchema
});
var NarrativeSceneCreateRequestSchema = NarrativeSceneMetadataSchema;
var NarrativeSceneReplaceRequestSchema = z40.strictObject({
  expectedRevision: expectedRevision3.refine((value) => value > 0),
  metadata: NarrativeSceneMetadataSchema,
  entries: NarrativeSceneScriptSchema
});
var NarrativeStructureSaveRequestSchema = z40.strictObject({
  expectedRevision: expectedRevision3,
  items: NarrativeStructureSchema
});
var NarrativeStructureSchemaState = z40.strictObject({
  projectId: UuidSchema,
  revision: z40.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  items: NarrativeStructureSchema
});
var NarrativeSceneLifecycleRequestSchema = z40.strictObject({
  expectedRevision: expectedRevision3.refine((value) => value > 0)
});
var NarrativeSectionLifecycleRequestSchema = z40.strictObject({
  expectedRevision: expectedRevision3,
  sectionId: UuidSchema
});
var NarrativeCommandOperationSchema = z40.enum([
  "narrative-outline-save",
  "narrative-scene-create",
  "narrative-scene-replace",
  "narrative-scene-archive",
  "narrative-scene-restore",
  "narrative-structure-save",
  "narrative-section-archive",
  "narrative-section-restore"
]);
var NarrativeCommandReceiptSchema = z40.strictObject({
  operation: NarrativeCommandOperationSchema,
  projectId: UuidSchema,
  sceneId: UuidSchema.nullable(),
  outlineRevision: z40.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
  structureRevision: z40.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
  sceneRevision: z40.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable()
});
var NarrativeSceneSchema = NarrativeSceneMetadataSchema.extend({
  id: UuidSchema,
  projectId: UuidSchema,
  revision: z40.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  archivedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
}).strict();
var NarrativePlacementSegmentSchema = z40.strictObject({
  sectionId: UuidSchema,
  name: sceneName,
  label: z40.enum(["act", "chapter", "episode"]),
  archived: z40.boolean()
});
var NarrativeScenePlacementSchema = z40.discriminatedUnion("kind", [
  z40.strictObject({ kind: z40.literal("unplaced") }),
  z40.strictObject({
    kind: z40.literal("placed"),
    path: z40.array(NarrativePlacementSegmentSchema).max(8)
  })
]);
var NarrativeSceneSummarySchema = z40.strictObject({
  scene: NarrativeSceneSchema,
  placement: NarrativeScenePlacementSchema
});
var NarrativeSceneListQuerySchema = z40.strictObject({
  state: z40.enum(["active", "archived"]).default("active"),
  placement: z40.enum(["any", "placed", "unplaced"]).default("any"),
  primaryLocationId: UuidSchema.optional(),
  cursor: z40.string().trim().min(1).max(500).optional(),
  limit: z40.coerce.number().int().min(1).max(100).default(25)
});
var NarrativeSceneListResponseSchema = z40.strictObject({
  scenes: z40.array(NarrativeSceneSummarySchema).max(100),
  nextCursor: z40.string().nullable(),
  total: z40.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});
var NarrativeSceneParamsSchema = z40.strictObject({
  projectId: UuidSchema,
  sceneId: UuidSchema
});
var NarrativeDescriptionReadEntrySchema = NarrativeDescriptionEntrySchema;
var NarrativeNarratorSpeechReadEntrySchema = NarrativeNarratorSpeechEntrySchema.extend({
  textRevision: z40.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  textFingerprint: z40.string().regex(/^[0-9a-f]{64}$/)
}).strict();
var NarrativeCharacterSpeechReadEntrySchema = NarrativeCharacterSpeechEntrySchema.extend({
  characterName: sceneName,
  characterArchivedAt: IsoDateTimeSchema.nullable(),
  textRevision: z40.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  textFingerprint: z40.string().regex(/^[0-9a-f]{64}$/)
}).strict();
var NarrativeSceneReadEntrySchema = z40.union([
  NarrativeDescriptionReadEntrySchema,
  NarrativeNarratorSpeechReadEntrySchema,
  NarrativeCharacterSpeechReadEntrySchema
]);
var NarrativeCharacterSelectorItemSchema = z40.strictObject({
  id: UuidSchema,
  name: sceneName,
  archivedAt: IsoDateTimeSchema.nullable()
});
var NarrativeCharacterSelectorQuerySchema = z40.strictObject({
  cursor: z40.string().trim().min(1).max(500).optional(),
  limit: z40.coerce.number().int().min(1).max(100).default(25)
});
var NarrativeCharacterSelectorResponseSchema = z40.strictObject({
  characters: z40.array(NarrativeCharacterSelectorItemSchema).max(100),
  nextCursor: z40.string().nullable()
});
var NarrativeOutlineSchema = z40.strictObject({
  projectId: UuidSchema,
  revision: z40.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  outline: StoryOutlineSchema
});
var NarrativeSceneDetailSchema = z40.strictObject({
  scene: NarrativeSceneSchema,
  entries: z40.array(NarrativeSceneReadEntrySchema).max(500),
  placement: NarrativeScenePlacementSchema
});

// packages/contracts/src/native-pixel-document.ts
import { z as z41 } from "zod/v4";
var NATIVE_PIXEL_MAX_LAYERS = 32;
var NATIVE_PIXEL_MAX_FRAMES = 64;
var NATIVE_PIXEL_MAX_BYTES = 128 * 1024 * 1024;
var NATIVE_PIXEL_HISTORY_BYTES = 64 * 1024 * 1024;
var NativePixelLayerSchema = z41.strictObject({
  id: UuidSchema,
  name: z41.string().trim().min(1).max(120),
  visible: z41.boolean(),
  opacity: z41.number().finite().min(0).max(1)
});
var NativePixelCellSchema = z41.strictObject({
  layerId: UuidSchema,
  checksum: ChecksumSchema,
  byteSize: z41.number().int().positive().max(25 * 1024 * 1024)
});
var NativePixelManifestSchema = z41.strictObject({
  version: z41.literal("native-pixel-v1"),
  width: z41.number().int().min(1).max(8192),
  height: z41.number().int().min(1).max(8192),
  previewFrameId: UuidSchema,
  layers: z41.array(NativePixelLayerSchema).min(1).max(NATIVE_PIXEL_MAX_LAYERS),
  frames: z41.array(
    z41.strictObject({
      id: UuidSchema,
      cells: z41.array(NativePixelCellSchema).min(1).max(NATIVE_PIXEL_MAX_LAYERS)
    })
  ).min(1).max(NATIVE_PIXEL_MAX_FRAMES)
}).superRefine((manifest, context) => {
  const layerIds = new Set(manifest.layers.map(({ id: id2 }) => id2));
  const frameIds = new Set(manifest.frames.map(({ id: id2 }) => id2));
  if (layerIds.size !== manifest.layers.length || frameIds.size !== manifest.frames.length || !frameIds.has(manifest.previewFrameId) || manifest.frames.some(
    ({ cells }) => cells.length !== layerIds.size || new Set(cells.map(({ layerId }) => layerId)).size !== layerIds.size || cells.some(({ layerId }) => !layerIds.has(layerId))
  ))
    context.addIssue({ code: "custom", message: "Native document identities are invalid." });
  if (manifest.width * manifest.height * 4 * manifest.layers.length * manifest.frames.length > NATIVE_PIXEL_MAX_BYTES)
    context.addIssue({
      code: "custom",
      message: "Native document decoded memory exceeds 128 MiB."
    });
  if (manifest.frames.reduce(
    (total, frame) => total + frame.cells.reduce((bytes, cell) => bytes + cell.byteSize, 0),
    0
  ) > NATIVE_PIXEL_MAX_BYTES)
    context.addIssue({
      code: "custom",
      message: "Native document encoded memory exceeds 128 MiB."
    });
});
var NativePixelSaveRequestSchema = z41.strictObject({
  saveId: UuidSchema,
  parentRevisionId: UuidSchema,
  manifest: NativePixelManifestSchema
});
var NativePixelUploadResponseSchema = z41.strictObject({
  revisionId: UuidSchema,
  complete: z41.boolean(),
  cells: z41.array(
    z41.strictObject({
      frameId: UuidSchema,
      layerId: UuidSchema,
      uploadUrl: z41.url(),
      requiredHeaders: z41.record(z41.string(), z41.string())
    })
  ).max(NATIVE_PIXEL_MAX_LAYERS * NATIVE_PIXEL_MAX_FRAMES)
});
var NativePixelReadResponseSchema = z41.strictObject({
  manifest: NativePixelManifestSchema,
  cells: z41.array(
    z41.strictObject({
      frameId: UuidSchema,
      layerId: UuidSchema,
      downloadUrl: z41.url()
    })
  ).max(NATIVE_PIXEL_MAX_LAYERS * NATIVE_PIXEL_MAX_FRAMES)
});
var NativePixelLocalDocumentSchema = z41.strictObject({
  manifest: NativePixelManifestSchema,
  cells: z41.array(
    z41.strictObject({
      frameId: UuidSchema,
      layerId: UuidSchema,
      path: z41.string().min(1).max(1024)
    })
  ).min(1).max(NATIVE_PIXEL_MAX_LAYERS * NATIVE_PIXEL_MAX_FRAMES)
}).superRefine(({ manifest, cells }, ctx) => {
  const expected = manifest.frames.flatMap(
    (frame) => frame.cells.map((cell) => `${frame.id}/${cell.layerId}`)
  );
  const actual = new Set(cells.map((cell) => `${cell.frameId}/${cell.layerId}`));
  if (cells.length !== expected.length || actual.size !== cells.length || expected.some((key3) => !actual.has(key3)))
    ctx.addIssue({
      code: "custom",
      message: "Cell files must match every manifest cell exactly once."
    });
});
var NativePixelSaveFileSchema = z41.strictObject({
  saveId: UuidSchema,
  parentRevisionId: UuidSchema,
  documentPath: z41.string().min(1).max(1024)
});

// packages/contracts/src/quests.ts
import { z as z42 } from "zod/v4";
function questText(limit) {
  return z42.string().refine(
    (value) => !value.includes("\0") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
    "Text must contain well-formed Unicode without NUL."
  ).refine(
    (value) => Array.from(value).length <= limit,
    `Text must not exceed ${limit} code points.`
  );
}
var questName = questText(160).overwrite((value) => value.trim()).min(1);
var optionalQuestText = (limit) => questText(limit).refine(isSafeMarkdown, "Invalid Markdown.").default("");
var QuestMetadataSchema = z42.strictObject({
  name: questName,
  primaryLocationId: UuidSchema.nullable().default(null),
  premise: optionalQuestText(4e3),
  playerGoal: optionalQuestText(4e3),
  acquisitionContext: optionalQuestText(4e3),
  stakes: optionalQuestText(4e3)
});
var QuestObjectiveSchema = z42.strictObject({
  id: UuidSchema,
  kind: z42.literal("objective"),
  name: questName,
  description: optionalQuestText(4e3),
  completionNotes: optionalQuestText(4e3)
});
var QuestStageSchema = z42.strictObject({
  id: UuidSchema,
  kind: z42.literal("stage"),
  name: questName,
  description: optionalQuestText(4e3),
  availabilityNotes: optionalQuestText(4e3),
  completionNotes: optionalQuestText(4e3),
  objectives: z42.array(QuestObjectiveSchema).max(500).default([])
});
var QuestRootItemSchema = z42.discriminatedUnion("kind", [
  QuestObjectiveSchema,
  QuestStageSchema
]);
var QuestOutcomeSchema = z42.strictObject({
  id: UuidSchema,
  name: questName,
  circumstances: optionalQuestText(4e3),
  consequences: optionalQuestText(4e3),
  rewards: optionalQuestText(4e3)
});
var QuestSceneLinkContextSchema = z42.discriminatedUnion("kind", [
  z42.strictObject({ kind: z42.literal("quest") }),
  z42.strictObject({ kind: z42.literal("stage"), id: UuidSchema }),
  z42.strictObject({ kind: z42.literal("objective"), id: UuidSchema }),
  z42.strictObject({ kind: z42.literal("outcome"), id: UuidSchema })
]);
var QuestSceneLinkSchema = z42.strictObject({
  id: UuidSchema,
  sceneId: UuidSchema,
  context: QuestSceneLinkContextSchema,
  note: optionalQuestText(2e3)
});
var QuestContentSchema = z42.strictObject({
  metadata: QuestMetadataSchema,
  root: z42.array(QuestRootItemSchema).max(550).default([]),
  outcomes: z42.array(QuestOutcomeSchema).max(50).default([]),
  sceneLinks: z42.array(QuestSceneLinkSchema).max(500).default([])
}).superRefine((content, context) => {
  const ids = /* @__PURE__ */ new Set();
  const stageIds = /* @__PURE__ */ new Set();
  const objectiveIds = /* @__PURE__ */ new Set();
  const outcomeIds = /* @__PURE__ */ new Set();
  let stages = 0;
  let objectives = 0;
  let prose = textLength([
    content.metadata.name,
    content.metadata.premise,
    content.metadata.playerGoal,
    content.metadata.acquisitionContext,
    content.metadata.stakes
  ]);
  const reserve = (id2, path) => {
    if (ids.has(id2))
      context.addIssue({ code: "custom", path, message: "Quest child IDs must be unique." });
    ids.add(id2);
  };
  for (const [rootIndex, item] of content.root.entries()) {
    reserve(item.id, ["root", rootIndex, "id"]);
    if (item.kind === "objective") {
      objectives += 1;
      objectiveIds.add(item.id);
      prose += textLength([item.name, item.description, item.completionNotes]);
      continue;
    }
    stages += 1;
    stageIds.add(item.id);
    prose += textLength([
      item.name,
      item.description,
      item.availabilityNotes,
      item.completionNotes
    ]);
    for (const [objectiveIndex, objective] of item.objectives.entries()) {
      objectives += 1;
      objectiveIds.add(objective.id);
      reserve(objective.id, ["root", rootIndex, "objectives", objectiveIndex, "id"]);
      prose += textLength([objective.name, objective.description, objective.completionNotes]);
    }
  }
  for (const [index, outcome] of content.outcomes.entries()) {
    reserve(outcome.id, ["outcomes", index, "id"]);
    outcomeIds.add(outcome.id);
    prose += textLength([
      outcome.name,
      outcome.circumstances,
      outcome.consequences,
      outcome.rewards
    ]);
  }
  const contextScenes = /* @__PURE__ */ new Set();
  for (const [index, link2] of content.sceneLinks.entries()) {
    reserve(link2.id, ["sceneLinks", index, "id"]);
    prose += textLength([link2.note]);
    const validContext = link2.context.kind === "quest" || link2.context.kind === "stage" && stageIds.has(link2.context.id) || link2.context.kind === "objective" && objectiveIds.has(link2.context.id) || link2.context.kind === "outcome" && outcomeIds.has(link2.context.id);
    if (!validContext)
      context.addIssue({
        code: "custom",
        path: ["sceneLinks", index, "context"],
        message: "A Scene link context must belong to the current Quest."
      });
    const contextId = link2.context.kind === "quest" ? "" : link2.context.id;
    const pair = `${link2.context.kind}:${contextId}:${link2.sceneId}`;
    if (contextScenes.has(pair))
      context.addIssue({
        code: "custom",
        path: ["sceneLinks", index, "sceneId"],
        message: "A Scene may appear only once in a Quest context."
      });
    contextScenes.add(pair);
  }
  if (stages > 50)
    context.addIssue({ code: "custom", path: ["root"], message: "A Quest may have 50 stages." });
  if (objectives > 500)
    context.addIssue({
      code: "custom",
      path: ["root"],
      message: "A Quest may have 500 objectives."
    });
  if (prose > 2e5)
    context.addIssue({
      code: "custom",
      message: "Active Quest prose must not exceed 200000 code points."
    });
});
var QuestCreateRequestSchema = QuestMetadataSchema;
var questRevision = z42.number().int().positive().max(Number.MAX_SAFE_INTEGER);
var expectedQuestRevision = questRevision.max(Number.MAX_SAFE_INTEGER - 1);
var QuestReplaceRequestSchema = z42.strictObject({
  expectedRevision: expectedQuestRevision,
  content: QuestContentSchema
});
var QuestLifecycleRequestSchema = z42.strictObject({
  expectedRevision: expectedQuestRevision
});
var QuestParamsSchema = z42.strictObject({
  projectId: UuidSchema,
  questId: UuidSchema
});
var QuestSchema = QuestMetadataSchema.extend({
  id: UuidSchema,
  projectId: UuidSchema,
  revision: questRevision,
  archivedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
}).strict();
var QuestSceneLinkReadSchema = QuestSceneLinkSchema.extend({
  sceneName: questName,
  sceneArchivedAt: IsoDateTimeSchema.nullable()
}).strict();
var QuestDetailSchema = z42.strictObject({
  quest: QuestSchema,
  root: z42.array(QuestRootItemSchema).max(550),
  outcomes: z42.array(QuestOutcomeSchema).max(50),
  sceneLinks: z42.array(QuestSceneLinkReadSchema).max(500),
  placement: NarrativeScenePlacementSchema
});
var page3 = {
  cursor: z42.string().trim().min(1).max(500).optional(),
  limit: z42.coerce.number().int().min(1).max(100).default(25)
};
var QuestListQuerySchema = z42.strictObject({
  state: z42.enum(["active", "archived"]).default("active"),
  placement: z42.enum(["any", "placed", "unplaced"]).default("any"),
  primaryLocationId: UuidSchema.optional(),
  search: questName.optional(),
  ...page3
});
var QuestListItemSchema = QuestSchema.pick({
  id: true,
  projectId: true,
  name: true,
  revision: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({ placement: NarrativeScenePlacementSchema }).strict();
var QuestListResponseSchema = z42.strictObject({
  quests: z42.array(QuestListItemSchema).max(100),
  nextCursor: z42.string().nullable(),
  total: z42.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});
var QuestRetainedSummaryRequestSchema = z42.strictObject({ questIds: z42.array(UuidSchema).min(1).max(2e3) }).superRefine(({ questIds }, context) => {
  if (new Set(questIds).size !== questIds.length)
    context.addIssue({
      code: "custom",
      path: ["questIds"],
      message: "Quest IDs must be unique."
    });
});
var QuestRetainedSummarySchema = z42.strictObject({
  id: UuidSchema,
  name: questName,
  archivedAt: IsoDateTimeSchema.nullable()
});
var QuestRetainedSummaryResponseSchema = z42.strictObject({
  quests: z42.array(QuestRetainedSummarySchema).max(2e3)
});
var QuestSceneSelectorQuerySchema = z42.strictObject(page3);
var QuestSceneSelectorItemSchema = z42.strictObject({
  id: UuidSchema,
  name: questName,
  archivedAt: IsoDateTimeSchema.nullable()
});
var QuestSceneSelectorResponseSchema = z42.strictObject({
  scenes: z42.array(QuestSceneSelectorItemSchema).max(100),
  nextCursor: z42.string().nullable()
});
var QuestSceneUsageQuerySchema = z42.strictObject({
  state: z42.enum(["active", "archived"]).default("active"),
  ...page3
});
var QuestSceneUsageItemSchema = z42.strictObject({
  linkId: UuidSchema,
  questId: UuidSchema,
  questName,
  questArchivedAt: IsoDateTimeSchema.nullable(),
  context: QuestSceneLinkContextSchema
});
var QuestSceneUsageResponseSchema = z42.strictObject({
  usages: z42.array(QuestSceneUsageItemSchema).max(100),
  nextCursor: z42.string().nullable(),
  total: z42.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});
var QuestIdempotencyKeySchema = z42.string().trim().min(1).max(120);
var QuestCommandOperationSchema = z42.enum([
  "quest-create",
  "quest-replace",
  "quest-archive",
  "quest-restore"
]);
var QuestCommandReceiptSchema = z42.strictObject({
  operation: QuestCommandOperationSchema,
  projectId: UuidSchema,
  questId: UuidSchema,
  questRevision
});
function textLength(values) {
  return values.reduce((total, value) => total + Array.from(value).length, 0);
}

// packages/contracts/src/realtime.ts
import { z as z43 } from "zod/v4";
var RealtimeTokenSchema = z43.object({ token: z43.string().min(1), websocketUrl: z43.url() });

// packages/contracts/src/addressed-invitation-contracts.ts
import { z as z48 } from "zod/v4";

// packages/contracts/src/studio-directory-contracts.ts
import { z as z47 } from "zod/v4";

// packages/domain/src/invitation-delivery.ts
var SEND_WINDOW_MS = 24 * 60 * 60 * 1e3;

// packages/domain/src/studio-roles.ts
var studioPermissionKeys = [
  "studio.team.manage",
  "studio.profile.manage",
  "project.overview",
  "project.content",
  "project.design",
  "project.graphics",
  "project.tasks"
];

// packages/domain/src/invitations.ts
var INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1e3;

// packages/domain/src/project-sections.ts
var projectSectionKeys = studioPermissionKeys.filter(
  (key3) => key3.startsWith("project.")
);

// packages/contracts/src/studio-role-contracts.ts
import { z as z45 } from "zod/v4";

// packages/contracts/src/team.ts
import { z as z44 } from "zod/v4";
var TeamRevisionSchema = z44.number().int().positive().max(Number.MAX_SAFE_INTEGER);
var sectionCapability = z44.strictObject({
  read: z44.boolean(),
  write: z44.boolean(),
  purge: z44.boolean()
});
var ProjectSectionCapabilitiesSchema = z44.strictObject({
  authorizationRevision: TeamRevisionSchema,
  overview: sectionCapability,
  content: sectionCapability,
  design: sectionCapability,
  graphics: sectionCapability,
  tasks: sectionCapability
});
var ProjectRoleSchema = z44.enum(["manager", "editor", "viewer"]);
var EffectiveProjectRoleSchema = z44.enum(["owner", "admin", "manager", "editor", "viewer"]);
var TeamPageQuerySchema = z44.strictObject({
  cursor: UuidSchema.optional(),
  limit: z44.coerce.number().int().min(1).max(100).default(25)
});
var TeamStudioParamsSchema = z44.strictObject({ studioId: UuidSchema });
var TeamProjectParamsSchema = z44.strictObject({
  studioId: UuidSchema,
  projectId: UuidSchema
});
var TeamCommandKeySchema = z44.strictObject({ commandKey: AutomationIdempotencyKeySchema });
var EmployeeSchema = z44.strictObject({
  userId: UuidSchema,
  email: EmailSchema,
  role: StudioRoleSchema2,
  revision: TeamRevisionSchema
});
var EmployeePageSchema = z44.strictObject({
  items: z44.array(EmployeeSchema).max(100),
  nextCursor: UuidSchema.nullable()
});
var EmployeeCommandSchema = z44.strictObject({
  commandKey: AutomationIdempotencyKeySchema,
  userId: UuidSchema,
  expectedMembershipRevision: TeamRevisionSchema,
  role: z44.enum(["admin", "member"]).nullable()
});
var AssignmentVersionSchema = z44.strictObject({
  assignmentId: UuidSchema,
  revision: TeamRevisionSchema
});
var assignmentCommand = {
  commandKey: AutomationIdempotencyKeySchema,
  userId: UuidSchema,
  expectedMembershipRevision: TeamRevisionSchema
};
var ParticipantCommandSchema = z44.discriminatedUnion("operation", [
  z44.strictObject({
    ...assignmentCommand,
    operation: z44.literal("create"),
    expectedAssignment: z44.null(),
    role: ProjectRoleSchema
  }),
  z44.strictObject({
    ...assignmentCommand,
    operation: z44.literal("update"),
    expectedAssignment: AssignmentVersionSchema,
    role: ProjectRoleSchema
  }),
  z44.strictObject({
    ...assignmentCommand,
    operation: z44.literal("remove"),
    expectedAssignment: AssignmentVersionSchema
  })
]);
var ParticipantSchema = z44.strictObject({
  userId: UuidSchema,
  email: EmailSchema,
  role: EffectiveProjectRoleSchema
});
var ManagedParticipantSchema = ParticipantSchema.extend({
  membershipRevision: TeamRevisionSchema,
  assignment: AssignmentVersionSchema.nullable()
});
var ParticipantPageSchema = z44.strictObject({
  items: z44.array(ParticipantSchema).max(100),
  nextCursor: UuidSchema.nullable()
});
var ManagedParticipantPageSchema = z44.strictObject({
  items: z44.array(ManagedParticipantSchema).max(100),
  nextCursor: UuidSchema.nullable()
});
var EligibleEmployeeSchema = z44.strictObject({
  userId: UuidSchema,
  email: EmailSchema,
  membershipRevision: TeamRevisionSchema
});
var EligibleEmployeePageSchema = z44.strictObject({
  items: z44.array(EligibleEmployeeSchema).max(100),
  nextCursor: UuidSchema.nullable()
});
var ProjectCapabilitiesSchema = z44.strictObject({
  role: EffectiveProjectRoleSchema,
  sections: ProjectSectionCapabilitiesSchema,
  contentWrite: z44.boolean(),
  purgeContent: z44.boolean(),
  manageProject: z44.boolean(),
  manageParticipants: z44.boolean(),
  studioAdmin: z44.boolean()
});
var TeamCommandReceiptSchema = z44.strictObject({
  userId: UuidSchema,
  membershipRevision: TeamRevisionSchema,
  assignment: AssignmentVersionSchema.nullable()
});

// packages/contracts/src/studio-role-contracts.ts
var StudioPermissionSchema = z45.enum(studioPermissionKeys);
var StudioRoleIconSchema = z45.enum([
  "users",
  "brush",
  "pencil",
  "code",
  "book",
  "tasks",
  "shield",
  "star"
]);
var StudioPermissionsSchema = z45.array(StudioPermissionSchema).max(studioPermissionKeys.length).refine(
  (permissions) => new Set(permissions).size === permissions.length,
  "Permissions must be unique."
);
var StudioRoleFields = {
  name: z45.string().trim().min(1).max(80),
  description: z45.string().trim().max(200).nullable(),
  icon: StudioRoleIconSchema,
  permissions: StudioPermissionsSchema
};
var StudioCommandIdentity = {
  commandKey: AutomationIdempotencyKeySchema,
  expectedAuthorizationRevision: TeamRevisionSchema
};
var StudioCustomRoleCommandSchema = z45.discriminatedUnion("operation", [
  z45.strictObject({ operation: z45.literal("create"), ...StudioCommandIdentity, ...StudioRoleFields }),
  z45.strictObject({
    operation: z45.literal("update"),
    ...StudioCommandIdentity,
    ...StudioRoleFields,
    roleId: UuidSchema,
    expectedRoleRevision: TeamRevisionSchema
  }),
  z45.strictObject({
    operation: z45.literal("delete"),
    ...StudioCommandIdentity,
    roleId: UuidSchema,
    expectedRoleRevision: TeamRevisionSchema
  })
]);
var StudioCustomRoleSchema = z45.strictObject({
  id: UuidSchema,
  ...StudioRoleFields,
  revision: TeamRevisionSchema,
  activeEmployeeCount: z45.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  pendingInvitationCount: z45.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  canEdit: z45.boolean(),
  canDelete: z45.boolean(),
  canAssign: z45.boolean()
});
var StudioRoleChoiceSchema = z45.discriminatedUnion("kind", [
  z45.strictObject({ kind: z45.literal("system"), role: z45.enum(["admin", "member"]) }),
  z45.strictObject({
    kind: z45.literal("custom"),
    roleId: UuidSchema,
    expectedRoleRevision: TeamRevisionSchema
  })
]);
var StudioRoleSummarySchema = z45.discriminatedUnion("kind", [
  z45.strictObject({ kind: z45.literal("system"), role: z45.enum(["owner", "admin", "member"]) }),
  z45.strictObject({
    kind: z45.literal("custom"),
    roleId: UuidSchema,
    name: z45.string().min(1).max(80),
    revision: TeamRevisionSchema
  })
]);
var StudioRoleCatalogPageSchema = z45.strictObject({
  customRoles: z45.array(StudioCustomRoleSchema).max(100),
  systemRoles: z45.array(
    z45.strictObject({
      role: z45.enum(["owner", "admin", "member"]),
      permissions: StudioPermissionsSchema,
      activeEmployeeCount: z45.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      canAssign: z45.boolean()
    })
  ).max(3),
  nextCursor: UuidSchema.nullable(),
  authorizationRevision: TeamRevisionSchema
});
var EmployeeRoleAssignmentSchema = z45.strictObject({
  ...StudioCommandIdentity,
  userId: UuidSchema,
  expectedMembershipRevision: TeamRevisionSchema,
  role: StudioRoleChoiceSchema
});
var StudioRoleCommandReceiptSchema = z45.strictObject({
  roleId: UuidSchema,
  roleRevision: TeamRevisionSchema,
  authorizationRevision: TeamRevisionSchema,
  operation: z45.enum(["create", "update", "delete"])
});
var EmployeeAdministrationReceiptSchema = z45.strictObject({
  userId: UuidSchema,
  membershipRevision: TeamRevisionSchema,
  authorizationRevision: TeamRevisionSchema
});

// packages/contracts/src/studio-scope-contracts.ts
import { z as z46 } from "zod/v4";
var SelectedProjectGrantSchema = z46.strictObject({
  projectId: UuidSchema,
  role: ProjectRoleSchema
});
var SelectedProjectGrantsSchema = z46.array(SelectedProjectGrantSchema).min(1).max(100).refine(
  (grants) => new Set(grants.map((grant) => grant.projectId)).size === grants.length,
  "Projects must be unique."
);
var ProjectScopeIntentSchema = z46.discriminatedUnion("kind", [
  z46.strictObject({ kind: z46.literal("none") }),
  z46.strictObject({ kind: z46.literal("all"), role: ProjectRoleSchema }),
  z46.strictObject({ kind: z46.literal("selected"), grants: SelectedProjectGrantsSchema })
]);
var EmployeeScopeCommandSchema = z46.strictObject({
  ...StudioCommandIdentity,
  userId: UuidSchema,
  expectedMembershipRevision: TeamRevisionSchema,
  scope: ProjectScopeIntentSchema
});
var EmployeeAccessSummarySchema = z46.discriminatedUnion("kind", [
  z46.strictObject({ kind: z46.literal("inherited") }),
  z46.strictObject({ kind: z46.literal("none") }),
  z46.strictObject({ kind: z46.literal("all"), role: ProjectRoleSchema }),
  z46.strictObject({
    kind: z46.literal("selected"),
    visibleProjectCount: z46.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    badges: z46.array(z46.strictObject({ projectId: UuidSchema, name: z46.string().min(1).max(160) })).max(3),
    restricted: z46.boolean()
  })
]);
var StudioCapabilitiesSchema = z46.strictObject({
  studioId: UuidSchema,
  authorizationRevision: TeamRevisionSchema,
  permissions: StudioPermissionsSchema,
  teamManage: z46.boolean(),
  profileManage: z46.boolean(),
  grantAllScope: z46.boolean(),
  grantAdmin: z46.boolean()
});

// packages/contracts/src/studio-directory-contracts.ts
var EmployeeDisplayNameSchema = z47.string().trim().min(1).max(120);
var AdministrationCursorSchema = z47.string().min(1).max(1024).regex(/^[A-Za-z0-9_-]+$/);
var EmployeeDirectoryQuerySchema = z47.strictObject({
  search: z47.string().trim().max(320).optional(),
  role: z47.union([StudioRoleSchema2, UuidSchema]).optional(),
  status: z47.enum(["active", "removed"]).default("active"),
  sort: z47.enum(["newest", "oldest"]).default("newest"),
  cursor: AdministrationCursorSchema.optional(),
  limit: z47.coerce.number().int().min(1).max(100).default(25)
});
var DirectoryEmployeeSchema = z47.strictObject({
  userId: UuidSchema,
  email: EmailSchema,
  displayName: EmployeeDisplayNameSchema.nullable(),
  systemRole: StudioRoleSchema2,
  role: StudioRoleSummarySchema,
  status: z47.enum(["active", "removed"]),
  joinedAt: IsoDateTimeSchema,
  revision: TeamRevisionSchema,
  access: EmployeeAccessSummarySchema,
  canManage: z47.boolean(),
  canRemove: z47.boolean()
});
var EmployeeDirectoryPageSchema = z47.strictObject({
  items: z47.array(DirectoryEmployeeSchema).max(100),
  total: z47.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  nextCursor: AdministrationCursorSchema.nullable(),
  authorizationRevision: TeamRevisionSchema
});
var EmployeeDetailSchema = z47.strictObject({
  employee: DirectoryEmployeeSchema,
  authorizationRevision: TeamRevisionSchema
});

// packages/contracts/src/addressed-invitation-contracts.ts
var scope = z48.union([ProjectScopeIntentSchema, z48.strictObject({ kind: z48.literal("inherited") })]);
var previewScope = z48.discriminatedUnion("kind", [
  z48.strictObject({ kind: z48.literal("none") }),
  z48.strictObject({ kind: z48.literal("inherited") }),
  z48.strictObject({ kind: z48.literal("all"), role: ProjectRoleSchema }),
  z48.strictObject({
    kind: z48.literal("selected"),
    grants: z48.array(
      z48.strictObject({
        projectId: UuidSchema,
        name: z48.string().min(1).max(160),
        role: ProjectRoleSchema
      })
    ).min(1).max(100).refine((grants) => new Set(grants.map((grant) => grant.projectId)).size === grants.length)
  })
]);
function matchingScope(value) {
  return (value.role.kind === "system" && value.role.role === "admin") === (value.scope.kind === "inherited");
}
var AddressedInvitationCommandSchema = z48.strictObject({
  ...StudioCommandIdentity,
  email: EmailSchema,
  displayName: EmployeeDisplayNameSchema.nullable(),
  role: StudioRoleChoiceSchema,
  scope,
  locale: LocaleSchema,
  replaceInvitation: z48.strictObject({ invitationId: UuidSchema, expectedRevision: TeamRevisionSchema }).optional()
}).refine(matchingScope, "Admin scope must be inherited; member scope must be explicit.");
var InvitationDeliveryProjectionSchema = z48.strictObject({
  status: z48.enum(["queued", "sending", "accepted-by-smtp", "retrying", "failed", "cancelled"]),
  attempts: z48.number().int().min(0).max(5),
  errorCode: z48.enum([
    "recipient-rejected",
    "transport-unavailable",
    "timeout",
    "payload-unavailable",
    "intent-changed"
  ]).nullable()
});
var AddressedInvitationSchema = z48.strictObject({
  id: UuidSchema,
  createdBy: UuidSchema,
  email: EmailSchema,
  displayName: EmployeeDisplayNameSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  expiresAt: IsoDateTimeSchema,
  revision: TeamRevisionSchema,
  generation: TeamRevisionSchema,
  status: z48.enum(["pending", "accepted", "revoked", "expired"]),
  role: StudioRoleSummarySchema,
  scope,
  delivery: InvitationDeliveryProjectionSchema,
  canResend: z48.boolean(),
  canRevoke: z48.boolean()
});
var AddressedInvitationPageSchema = z48.strictObject({
  items: z48.array(AddressedInvitationSchema).max(100),
  total: z48.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  nextCursor: AdministrationCursorSchema.nullable()
});
var AddressedInvitationQuerySchema = z48.strictObject({
  status: z48.enum(["pending", "accepted", "revoked", "expired"]).optional(),
  sort: z48.enum(["newest", "oldest"]).default("newest"),
  cursor: AdministrationCursorSchema.optional(),
  limit: z48.coerce.number().int().min(1).max(100).default(25)
});
var AddressedInvitationResendSchema = z48.strictObject({
  ...StudioCommandIdentity,
  invitationId: UuidSchema,
  expectedRevision: TeamRevisionSchema
});
var AddressedInvitationInspectionSchema = z48.discriminatedUnion("access", [
  z48.strictObject({
    access: z48.literal("public"),
    studio: z48.strictObject({ id: UuidSchema, name: z48.string().min(1).max(160) }),
    expiresAt: IsoDateTimeSchema
  }),
  z48.strictObject({ access: z48.literal("wrong-account") }),
  z48.strictObject({
    access: z48.literal("already-member"),
    studio: z48.strictObject({ id: UuidSchema, name: z48.string().min(1).max(160) }),
    expiresAt: IsoDateTimeSchema
  }),
  z48.strictObject({
    access: z48.literal("matching"),
    studio: z48.strictObject({ id: UuidSchema, name: z48.string().min(1).max(160) }),
    expiresAt: IsoDateTimeSchema,
    role: StudioRoleSummarySchema,
    scope: previewScope
  })
]);

// packages/contracts/src/studio-administration-preflight.ts
import { z as z49 } from "zod/v4";
var CountSchema = z49.number().int().nonnegative();
var StudioAdministrationPreflightSchema = z49.strictObject({
  missingColumns: z49.array(z49.string().max(120)).max(100),
  dependencyValidatorPresent: z49.boolean(),
  obsoletePendingInvitationCount: CountSchema,
  obsoleteInvitations: z49.array(z49.strictObject({ id: UuidSchema, studioId: UuidSchema })).max(100),
  obsoleteInvitationIdsTruncated: z49.boolean(),
  assignmentCount: CountSchema,
  assignmentsByStudio: z49.array(
    z49.strictObject({
      studioId: UuidSchema,
      assignmentCount: CountSchema,
      memberCount: CountSchema,
      projectCount: CountSchema
    })
  ).max(100),
  unknownDependencies: z49.array(z49.strictObject({ table: z49.string().max(120), count: CountSchema })).max(12),
  ready: z49.boolean()
});

// packages/contracts/src/studios.ts
import { z as z50 } from "zod/v4";
var STUDIO_LOGO_MAX_BYTES = 5 * 1024 * 1024;
var StudioNameSchema = z50.string().trim().min(1).max(160);
var StudioProfileSchema = z50.strictObject({
  studioId: UuidSchema,
  name: StudioNameSchema,
  revision: TeamRevisionSchema,
  logo: StudioLogoSchema.nullable()
});
var StudioLogoIntentSchema = z50.discriminatedUnion("operation", [
  z50.strictObject({ operation: z50.literal("keep") }),
  z50.strictObject({ operation: z50.literal("remove") }),
  z50.strictObject({ operation: z50.literal("replace"), logoId: UuidSchema })
]);
var StudioProfileCommandSchema = z50.strictObject({
  commandKey: AutomationIdempotencyKeySchema,
  expectedProfileRevision: TeamRevisionSchema,
  name: StudioNameSchema,
  logo: StudioLogoIntentSchema
});
var StudioSetupCommandSchema = z50.discriminatedUnion("operation", [
  StudioProfileCommandSchema.extend({
    operation: z50.literal("complete"),
    expectedSetupRevision: TeamRevisionSchema
  }),
  z50.strictObject({
    operation: z50.literal("defer"),
    commandKey: AutomationIdempotencyKeySchema,
    expectedSetupRevision: TeamRevisionSchema
  })
]);
var StudioProfileReceiptSchema = z50.strictObject({
  studioId: UuidSchema,
  profileRevision: TeamRevisionSchema,
  logo: StudioLogoSchema.nullable(),
  setup: StudioSetupProgressSchema.nullable()
});
var StudioLogoUploadMetadataSchema = z50.strictObject({
  commandKey: AutomationIdempotencyKeySchema,
  contentType: ImageMimeSchema,
  checksum: z50.string().regex(/^[0-9a-f]{64}$/)
});
var StudioLogoPreparationSchema = StudioLogoSchema.extend({
  expiresAt: IsoDateTimeSchema
});
var StudioLogoParamsSchema = z50.strictObject({ studioId: UuidSchema, logoId: UuidSchema });
var StudioEmployeeParamsSchema = z50.strictObject({
  studioId: UuidSchema,
  userId: UuidSchema
});
var explicitEmployee = EmployeeSchema.extend({ role: z50.literal("member") });
var inheritedEmployee = EmployeeSchema.extend({ role: z50.enum(["owner", "admin"]) });
var inherited = z50.strictObject({
  access: z50.literal("inherited"),
  employee: inheritedEmployee,
  items: z50.array(z50.never()).max(0),
  nextCursor: z50.null()
});
var EmployeeAssignedProjectSchema = z50.strictObject({
  projectId: UuidSchema,
  name: z50.string().min(1).max(160),
  status: z50.enum(["active", "archived"]),
  role: ProjectRoleSchema,
  assignment: AssignmentVersionSchema
});
var EmployeeAssignedProjectPageSchema = z50.discriminatedUnion("access", [
  inherited,
  z50.strictObject({
    access: z50.literal("explicit"),
    employee: explicitEmployee,
    items: z50.array(EmployeeAssignedProjectSchema).max(100),
    nextCursor: UuidSchema.nullable()
  })
]);
var EmployeeEligibleProjectPageSchema = z50.discriminatedUnion("access", [
  inherited,
  z50.strictObject({
    access: z50.literal("explicit"),
    employee: explicitEmployee,
    items: z50.array(z50.strictObject({ projectId: UuidSchema, name: z50.string().min(1).max(160) })).max(100),
    nextCursor: UuidSchema.nullable()
  })
]);

// packages/contracts/src/style-comparison-scene.ts
import { z as z51 } from "zod/v4";
var StyleComparisonSceneSchema = z51.object({
  version: z51.literal("style-comparison-scene-v1"),
  subjectId: z51.literal("workshop-adventurer-v1"),
  camera: z51.literal("three-quarter-side"),
  canvas: z51.object({ width: z51.literal(1536), height: z51.literal(1024) }).strict(),
  requiredObjects: z51.tuple([
    z51.literal("adventurer"),
    z51.literal("workbench"),
    z51.literal("small-cabin")
  ]),
  layout: z51.tuple([
    z51.literal("one full-body adventurer at the left foreground facing the workbench"),
    z51.literal("one workbench across the center foreground"),
    z51.literal("one small-cabin at the right background")
  ]),
  prohibitedContent: z51.tuple([z51.literal("text"), z51.literal("logos"), z51.literal("brands")])
}).strict();
var styleComparisonScene = StyleComparisonSceneSchema.parse({
  version: "style-comparison-scene-v1",
  subjectId: "workshop-adventurer-v1",
  camera: "three-quarter-side",
  canvas: { width: 1536, height: 1024 },
  requiredObjects: ["adventurer", "workbench", "small-cabin"],
  layout: [
    "one full-body adventurer at the left foreground facing the workbench",
    "one workbench across the center foreground",
    "one small-cabin at the right background"
  ],
  prohibitedContent: ["text", "logos", "brands"]
});
var styleComparisonSceneChecksum = sha256(JSON.stringify(styleComparisonScene));

// packages/contracts/src/task-commands.ts
import { z as z53 } from "zod/v4";

// packages/contracts/src/task-values.ts
import { z as z52 } from "zod/v4";
function isTaskDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= (days[month - 1] ?? 0);
}
var TaskDateSchema = z52.string().refine(isTaskDate, "Invalid calendar date.");
var TaskRevisionSchema = z52.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1);
var TaskCountSchema = z52.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
function taskText(limit) {
  return z52.string().refine(
    (value) => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value) && !value.includes("\0") && Array.from(value).length <= limit,
    `Expected well-formed text of at most ${limit} characters.`
  );
}
var TaskBoardTitleSchema = taskText(120).overwrite((value) => value.trim()).min(1);
var TaskTitleSchema = taskText(240).overwrite((value) => value.trim()).min(1);
var TaskLabelTitleSchema = taskText(80).overwrite((value) => value.trim()).min(1);
var TaskDescriptionSchema = taskText(2e4).refine(isSafeMarkdown, "Invalid Markdown.");
var TaskCommentBodySchema = taskText(5e3).min(1).refine((value) => value.trim().length > 0 && isSafeMarkdown(value), "Invalid Markdown.");
var TaskLabelColorSchema = z52.enum([
  "gray",
  "blue",
  "cyan",
  "green",
  "yellow",
  "orange",
  "red",
  "grape"
]);
var TaskChecklistItemSchema = z52.strictObject({
  id: UuidSchema,
  text: taskText(500).overwrite((value) => value.trim()).min(1),
  checked: z52.boolean()
});
var TaskChecklistSchema = z52.array(TaskChecklistItemSchema).max(100).refine(
  (items) => new Set(items.map((item) => item.id)).size === items.length,
  "Duplicate checklist ID."
);
var TaskMaterialLinkSchema = z52.strictObject({
  kind: z52.enum(["document", "character", "location", "mechanic", "asset"]),
  entityId: UuidSchema
});
var TaskMaterialLinksSchema = z52.array(TaskMaterialLinkSchema).max(50).refine(
  (links) => new Set(links.map((link2) => `${link2.kind}:${link2.entityId}`)).size === links.length,
  "Duplicate material link."
);
var TaskLabelIdsSchema = z52.array(UuidSchema).max(20).refine((ids) => new Set(ids).size === ids.length, "Duplicate label ID.");
var TaskAssigneeAccessSchema = z52.discriminatedUnion("kind", [
  z52.strictObject({ kind: z52.literal("inherited") }),
  z52.strictObject({ kind: z52.literal("all") }),
  z52.strictObject({
    kind: z52.literal("explicit"),
    assignmentId: UuidSchema,
    assignmentRevision: TaskRevisionSchema
  })
]);
var TaskAssignmentSchema = z52.strictObject({
  userId: UuidSchema,
  expectedMembershipRevision: TaskRevisionSchema,
  access: TaskAssigneeAccessSchema
});
var TaskAssigneeSchema = z52.strictObject({
  userId: UuidSchema,
  email: EmailSchema,
  effectiveRole: z52.enum(["owner", "admin", "manager", "editor"]),
  membershipRevision: TaskRevisionSchema,
  access: TaskAssigneeAccessSchema
}).refine(
  (item) => (item.effectiveRole === "owner" || item.effectiveRole === "admin") === (item.access.kind === "inherited"),
  "Access kind does not match effective role."
);
var TaskPageQuerySchema = z52.strictObject({
  cursor: UuidSchema.optional(),
  limit: z52.coerce.number().int().min(1).max(100).default(50)
});
var TaskAssigneePageSchema = z52.strictObject({
  items: z52.array(TaskAssigneeSchema).max(100),
  nextCursor: UuidSchema.nullable()
});
var TaskCardContentSchema = z52.strictObject({
  title: TaskTitleSchema,
  description: TaskDescriptionSchema.default(""),
  assignees: z52.array(TaskAssignmentSchema).max(20).refine(
    (items) => new Set(items.map((item) => item.userId.toLowerCase())).size === items.length,
    "Duplicate assignee."
  ).default([]),
  dueDate: TaskDateSchema.nullable().default(null),
  checklist: TaskChecklistSchema.default([]),
  labelIds: TaskLabelIdsSchema.default([]),
  materialLinks: TaskMaterialLinksSchema.default([])
});

// packages/contracts/src/task-commands.ts
var key2 = { commandKey: AutomationIdempotencyKeySchema };
var board = { boardId: UuidSchema, expectedBoardRevision: TaskRevisionSchema };
var boards = { expectedBoardsRevision: TaskRevisionSchema };
var card = { cardId: UuidSchema, expectedCardRevision: TaskRevisionSchema };
var label = { labelId: UuidSchema, expectedLabelRevision: TaskRevisionSchema };
var TaskArchivePreconditionsSchema = z53.strictObject({
  ...boards,
  expectedBoardRevision: TaskRevisionSchema,
  expectedGraphRevision: TaskRevisionSchema
});
var TaskArchiveImpactSchema = TaskArchivePreconditionsSchema.extend({
  projectId: UuidSchema,
  boardId: UuidSchema,
  noncompletedCards: TaskCountSchema,
  incomingDependencies: TaskCountSchema,
  outgoingDependencies: TaskCountSchema,
  unfinishedPrerequisites: TaskCountSchema,
  unfinishedDependents: TaskCountSchema
});
var TaskMovePositionSchema = z53.discriminatedUnion("mode", [
  z53.strictObject({ mode: z53.literal("manual"), beforeCardId: UuidSchema.nullable() }),
  z53.strictObject({ mode: z53.literal("filtered") })
]);
var TaskCommandSchema = z53.discriminatedUnion("operation", [
  z53.strictObject({ ...key2, operation: z53.literal("setup"), locale: LocaleSchema }),
  z53.strictObject({
    ...key2,
    ...boards,
    operation: z53.literal("board-create"),
    title: TaskBoardTitleSchema,
    locale: LocaleSchema
  }),
  z53.strictObject({
    ...key2,
    ...board,
    ...boards,
    operation: z53.literal("board-rename"),
    title: TaskBoardTitleSchema
  }),
  z53.strictObject({
    ...key2,
    ...board,
    ...boards,
    operation: z53.literal("board-order"),
    beforeBoardId: UuidSchema.nullable()
  }),
  z53.strictObject({
    ...key2,
    ...board,
    ...boards,
    operation: z53.literal("board-archive"),
    expectedGraphRevision: TaskRevisionSchema
  }),
  z53.strictObject({ ...key2, ...board, ...boards, operation: z53.literal("board-restore") }),
  z53.strictObject({
    ...key2,
    ...board,
    operation: z53.literal("column-create"),
    title: TaskBoardTitleSchema,
    isCompleted: z53.boolean()
  }),
  z53.strictObject({
    ...key2,
    ...board,
    operation: z53.literal("column-rename"),
    columnId: UuidSchema,
    title: TaskBoardTitleSchema
  }),
  z53.strictObject({
    ...key2,
    ...board,
    operation: z53.literal("column-order"),
    columnId: UuidSchema,
    beforeColumnId: UuidSchema.nullable()
  }),
  z53.strictObject({
    ...key2,
    ...board,
    operation: z53.literal("column-completion"),
    columnId: UuidSchema,
    isCompleted: z53.boolean(),
    expectedAffectedCards: TaskCountSchema
  }),
  z53.strictObject({
    ...key2,
    ...board,
    operation: z53.literal("column-remove"),
    columnId: UuidSchema,
    destinationColumnId: UuidSchema.nullable(),
    expectedAffectedCards: TaskCountSchema
  }),
  z53.strictObject({
    ...key2,
    ...board,
    operation: z53.literal("card-create"),
    columnId: UuidSchema,
    content: TaskCardContentSchema
  }),
  z53.strictObject({
    ...key2,
    ...card,
    operation: z53.literal("card-save"),
    content: TaskCardContentSchema
  }),
  z53.strictObject({
    ...key2,
    ...card,
    operation: z53.literal("card-move"),
    expectedSourceBoardRevision: TaskRevisionSchema,
    targetBoardId: UuidSchema,
    targetColumnId: UuidSchema,
    expectedTargetBoardRevision: TaskRevisionSchema,
    position: TaskMovePositionSchema
  }),
  z53.strictObject({ ...key2, ...card, operation: z53.literal("card-archive") }),
  z53.strictObject({ ...key2, ...card, operation: z53.literal("card-restore") }),
  z53.strictObject({
    ...key2,
    operation: z53.literal("comment-add"),
    cardId: UuidSchema,
    body: TaskCommentBodySchema
  }),
  z53.strictObject({
    ...key2,
    operation: z53.literal("label-create"),
    title: TaskLabelTitleSchema,
    color: TaskLabelColorSchema
  }),
  z53.strictObject({
    ...key2,
    ...label,
    operation: z53.literal("label-save"),
    title: TaskLabelTitleSchema,
    color: TaskLabelColorSchema
  }),
  z53.strictObject({
    ...key2,
    ...label,
    operation: z53.literal("label-delete"),
    expectedBindingsRevision: TaskRevisionSchema,
    expectedAffectedCards: TaskCountSchema
  }),
  z53.strictObject({
    ...key2,
    operation: z53.literal("dependency-add"),
    prerequisiteId: UuidSchema,
    dependentId: UuidSchema,
    expectedGraphRevision: TaskRevisionSchema
  }),
  z53.strictObject({
    ...key2,
    operation: z53.literal("dependency-remove"),
    prerequisiteId: UuidSchema,
    dependentId: UuidSchema,
    expectedGraphRevision: TaskRevisionSchema
  })
]);
var TaskReceiptSchema = z53.strictObject({
  studioId: UuidSchema,
  projectId: UuidSchema,
  actorId: UuidSchema,
  commandKey: AutomationIdempotencyKeySchema,
  operation: z53.enum(TaskCommandSchema.options.map((option) => option.shape.operation.value)),
  entityId: UuidSchema,
  revision: TaskRevisionSchema,
  boardsRevision: TaskRevisionSchema,
  graphRevision: TaskRevisionSchema
});

// packages/contracts/src/task-queries.ts
import { z as z54 } from "zod/v4";
var TaskListQuerySchema = z54.strictObject({
  boardId: UuidSchema.optional(),
  columnId: UuidSchema.optional(),
  labelIds: z54.preprocess(
    (value) => typeof value === "string" ? value.split(",") : value,
    TaskLabelIdsSchema.default([])
  ),
  search: taskText(240).default(""),
  assignee: z54.union([z54.enum(["any", "me", "unassigned"]), UuidSchema]).default("any"),
  date: z54.enum(["any", "overdue", "today", "next-seven", "none"]).default("any"),
  asOfDate: TaskDateSchema,
  archive: z54.enum(["active", "all", "archived"]).default("active"),
  sort: z54.enum(["manual", "deadline"]).default("manual"),
  offset: z54.coerce.number().int().nonnegative().max(1e6).default(0),
  limit: z54.coerce.number().int().min(1).max(100).default(50)
});
var TaskColumnSchema = z54.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  boardId: UuidSchema,
  title: TaskBoardTitleSchema,
  position: TaskCountSchema,
  isCompleted: z54.boolean(),
  cardCount: TaskCountSchema
});
var TaskBoardSchema = z54.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  title: TaskBoardTitleSchema,
  position: TaskCountSchema,
  revision: TaskRevisionSchema,
  archivedAt: IsoDateTimeSchema.nullable()
});
var TaskBoardDetailSchema = z54.strictObject({
  board: TaskBoardSchema,
  columns: z54.array(TaskColumnSchema).max(100)
}).refine(
  ({ board: board2, columns }) => columns.every(
    (column) => column.boardId === board2.id && column.projectId === board2.projectId
  ),
  "Foreign column."
);
var TaskStateSchema = z54.strictObject({
  initialized: z54.boolean(),
  boardsRevision: TaskRevisionSchema,
  graphRevision: TaskRevisionSchema
});
var TaskBoardPageSchema = TaskStateSchema.extend({
  items: z54.array(TaskBoardSchema).max(100),
  total: TaskCountSchema,
  nextOffset: TaskCountSchema.nullable()
});
var TaskLabelSchema = z54.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  title: TaskLabelTitleSchema,
  color: TaskLabelColorSchema,
  revision: TaskRevisionSchema,
  bindingsRevision: TaskRevisionSchema,
  affectedCards: TaskCountSchema
});
var TaskLabelPageSchema = z54.strictObject({
  items: z54.array(TaskLabelSchema).max(100),
  nextCursor: UuidSchema.nullable()
});
var TaskCardSchema = z54.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  boardId: UuidSchema,
  columnId: UuidSchema,
  title: TaskTitleSchema,
  description: TaskDescriptionSchema,
  assigneeUserIds: z54.array(UuidSchema).max(20),
  dueDate: TaskDateSchema.nullable(),
  checklist: TaskChecklistSchema,
  labels: z54.array(TaskLabelSchema).max(20),
  commentCount: TaskCountSchema,
  materialLinkCount: TaskCountSchema,
  position: TaskCountSchema,
  revision: TaskRevisionSchema,
  archivedAt: IsoDateTimeSchema.nullable(),
  createdBy: UuidSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  boardTitle: TaskBoardTitleSchema,
  columnTitle: TaskBoardTitleSchema,
  boardArchivedAt: IsoDateTimeSchema.nullable(),
  completed: z54.boolean(),
  dependencyWarning: z54.boolean(),
  overdue: z54.boolean()
}).refine(
  (card2) => card2.labels.every((label2) => label2.projectId === card2.projectId),
  "Foreign label."
);
var TaskCardPageSchema = z54.strictObject({
  items: z54.array(TaskCardSchema).max(100),
  total: TaskCountSchema,
  nextOffset: TaskCountSchema.nullable()
});
var TaskMaterialReadSchema = z54.discriminatedUnion("state", [
  TaskMaterialLinkSchema.extend({ state: z54.literal("unavailable") }),
  TaskMaterialLinkSchema.extend({ state: z54.enum(["active", "archived"]), title: taskText(500) })
]);
var TaskCardDetailSchema = z54.strictObject({
  card: TaskCardSchema,
  materialLinks: z54.array(TaskMaterialReadSchema).max(50)
});
var TaskCommentSchema = z54.strictObject({
  id: UuidSchema,
  projectId: UuidSchema,
  cardId: UuidSchema,
  authorId: UuidSchema,
  body: TaskCommentBodySchema,
  createdAt: IsoDateTimeSchema
});
var TaskCommentPageSchema = z54.strictObject({
  items: z54.array(TaskCommentSchema).max(100),
  nextCursor: UuidSchema.nullable()
});
var TaskDependencyPageSchema = z54.strictObject({
  items: z54.array(
    z54.strictObject({ direction: z54.enum(["prerequisite", "dependent"]), card: TaskCardSchema })
  ).max(100),
  nextOffset: TaskCountSchema.nullable(),
  total: TaskCountSchema
});

// packages/automation-client/src/transport.ts
var AutomationError = class extends Error {
  constructor(result) {
    super(result.problem.detail);
    this.result = result;
  }
  result;
};
function problem(category, code, correlationId) {
  return new AutomationError(
    AutomationProblemSchema.parse({
      version: "game-studio-automation/v1",
      ok: false,
      category,
      problem: {
        title: "Automation request failed",
        detail: `Automation request failed (${code}).`,
        code,
        ...correlationId && /^[A-Za-z0-9_-]{1,100}$/.test(correlationId) ? { correlationId } : {}
      }
    })
  );
}
var mutationOptions = (opts) => ({
  ...opts,
  idempotencyKey: input(AutomationIdempotencyKeySchema, opts?.idempotencyKey)
});
var projectPath = (id2) => `/projects/${input(UuidSchema, id2)}`;
var queryString = (query) => new URLSearchParams(
  Object.entries(query).filter(([, value]) => value !== void 0).map(([key3, value]) => [key3, String(value)])
);
function transport(options) {
  let endpoint;
  try {
    endpoint = new URL(options.endpoint);
  } catch {
    throw problem("input", "validation_failed");
  }
  if (!["https:", "http:"].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
    throw problem("input", "validation_failed");
  const root = options.endpoint.replace(/\/$/, "");
  const fetcher = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 3e4;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3e5)
    throw problem("input", "validation_failed");
  async function request(path, schema2, init = {}, requestOptions = {}) {
    const correlationId = requestOptions.correlationId ?? crypto.randomUUID();
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(correlationId)) throw problem("input", "validation_failed");
    const controller2 = new AbortController();
    const abort = () => controller2.abort();
    requestOptions.signal?.addEventListener("abort", abort, { once: true });
    if (requestOptions.signal?.aborted) controller2.abort();
    const timer = setTimeout(abort, timeoutMs);
    try {
      controller2.signal.throwIfAborted();
      const interrupted = new Promise(
        (_resolve, reject) => controller2.signal.addEventListener(
          "abort",
          () => reject(problem("transient", "internal_error", correlationId)),
          { once: true }
        )
      );
      const token = await Promise.race([options.bearer(), interrupted]);
      controller2.signal.throwIfAborted();
      if (!/^sfat_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{32,}$/.test(token))
        throw problem("authorization", "unauthorized", correlationId);
      const headers = {
        authorization: `Bearer ${token}`,
        "x-request-id": correlationId
      };
      if (init.body !== void 0) headers["content-type"] = "application/json";
      if (requestOptions.idempotencyKey) headers["idempotency-key"] = requestOptions.idempotencyKey;
      const response = await fetcher(`${root}/api/automation/v1${path}`, {
        method: init.method ?? "GET",
        headers,
        credentials: "omit",
        redirect: "error",
        signal: controller2.signal,
        ...init.body !== void 0 ? { body: JSON.stringify(init.body) } : {}
      });
      if (response.ok && (init.textMimeType || init.binaryMimeType) && response.headers.get("content-type")?.split(";")[0] !== (init.textMimeType ?? init.binaryMimeType)) {
        await response.body?.cancel();
        throw problem("conflict", "conflict", correlationId);
      }
      const body = response.ok && init.binaryMimeType ? await boundedImage(response) : response.ok && init.textMimeType ? await response.text() : await response.json().catch(() => null);
      if (!response.ok) {
        const parsed = ProblemSchema.safeParse(body);
        const category = response.status === 401 || response.status === 403 ? "authorization" : response.status === 409 || response.status === 404 ? "conflict" : response.status >= 500 || response.status === 429 ? "transient" : "input";
        throw problem(
          category,
          parsed.success ? parsed.data.code : "internal_error",
          correlationId
        );
      }
      if (init.raw) {
        const result2 = schema2.safeParse(body);
        if (!result2.success) throw problem("transient", "internal_error", correlationId);
        return result2.data;
      }
      const result = AutomationSuccessSchema(schema2).safeParse(body);
      if (!result.success) throw problem("transient", "internal_error", correlationId);
      return schema2.parse(Reflect.get(result.data, "data"));
    } catch (error) {
      if (error instanceof AutomationError) throw error;
      throw problem("transient", "internal_error", correlationId);
    } finally {
      clearTimeout(timer);
      requestOptions.signal?.removeEventListener("abort", abort);
    }
  }
  return { request, fetcher };
}
function input(schema2, value) {
  const parsed = schema2.safeParse(value);
  if (!parsed.success) throw problem("input", "validation_failed");
  return parsed.data;
}
async function boundedImage(response) {
  const reader = response.body?.getReader();
  if (!reader) throw problem("conflict", "conflict");
  const chunks = [];
  let size = 0;
  try {
    for (; ; ) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > 100 * 1024 * 1024) throw problem("conflict", "conflict");
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  } finally {
    await reader.cancel().catch(() => void 0);
    reader.releaseLock();
  }
}

// packages/automation-client/src/download.ts
function createFileDownload(initial, refresh, fetcher) {
  const safe = ({ downloadUrl: _url, ...metadata2 }) => metadata2;
  const metadata = safe(initial);
  return {
    metadata,
    async download(signal) {
      let current = initial;
      for (let attempt = 0; attempt < 2; attempt++) {
        let response;
        try {
          response = await fetcher(current.downloadUrl, {
            credentials: "omit",
            redirect: "error",
            signal: AbortSignal.any([AbortSignal.timeout(3e4), ...signal ? [signal] : []])
          });
        } catch {
          throw problem("transient", "internal_error");
        }
        if (response.ok) {
          const mime = response.headers.get("content-type")?.split(";")[0];
          const length = response.headers.get("content-length");
          if (!response.body || mime !== current.mimeType || length !== null && Number(length) !== current.byteSize) {
            await response.body?.cancel();
            throw problem("conflict", "conflict");
          }
          return { body: response.body, file: safe(current) };
        }
        await response.body?.cancel();
        if (attempt === 0 && (response.status === 401 || response.status === 403)) {
          current = await refresh();
          if (JSON.stringify(safe(current)) !== JSON.stringify(metadata))
            throw problem("conflict", "conflict");
          continue;
        }
        throw problem("transient", "internal_error");
      }
      throw problem("transient", "internal_error");
    }
  };
}
function createExportDownload(initial, refresh, fetcher) {
  return createManifestDownload(initial, () => refresh(initial.revisionId), fetcher);
}
function createManifestDownload(initial, refresh, fetcher) {
  const safe = (value) => ({
    ...value,
    files: value.files.map(({ downloadUrl: _url, ...file }) => file)
  });
  const metadata = safe(initial);
  return {
    metadata,
    async download(role, signal) {
      const file = initial.files.find((entry) => entry.role === role);
      if (!file) throw problem("input", "validation_failed");
      return createFileDownload(
        file,
        async () => {
          const current = await refresh();
          if (JSON.stringify(safe(current)) !== JSON.stringify(metadata))
            throw problem("conflict", "conflict");
          const refreshed = current.files.find((entry) => entry.role === role);
          if (!refreshed) throw problem("conflict", "conflict");
          return refreshed;
        },
        fetcher
      ).download(signal);
    }
  };
}

// packages/automation-client/src/catalog.ts
function catalogClient(request, fetcher) {
  const ownerPath = (projectId, value) => {
    const owner = input(CatalogArtOwnerSchema, value);
    const id2 = owner.kind === "world" ? owner.worldId : owner.kind === "location" ? owner.locationId : owner.itemId;
    return `${projectPath(projectId)}/${owner.kind}s/${id2}/graphics`;
  };
  const slotPath = (projectId, slotId) => `${projectPath(projectId)}/catalog-art-slots/${input(UuidSchema, slotId)}`;
  return {
    previewCatalogImport: (projectId, body, opts) => request(
      `${projectPath(projectId)}/catalog/import/preview`,
      GameCatalogImportPreviewSchema,
      { method: "POST", body: input(GameCatalogImportPreviewRequestSchema, body) },
      opts
    ),
    commitCatalogImport: (projectId, body, opts) => request(
      `${projectPath(projectId)}/catalog/import/commit`,
      GameCatalogImportReceiptSchema,
      { method: "POST", body: input(GameCatalogImportCommitRequestSchema, body) },
      mutationOptions(opts)
    ),
    catalogArtAssets: (projectId, query, opts) => request(
      `${projectPath(projectId)}/catalog-art-assets?${queryString(input(CatalogAssetSelectorQuerySchema, query))}`,
      CatalogAssetOptionsSchema,
      {},
      opts
    ),
    catalogGraphics: (projectId, owner, opts) => request(ownerPath(projectId, owner), CatalogArtSummarySchema, {}, opts),
    createCatalogGraphic: (projectId, owner, body, opts) => request(
      ownerPath(projectId, owner),
      CatalogArtSlotSchema,
      { method: "POST", body: input(CatalogArtSlotCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceCatalogGraphic: (projectId, slotId, body, opts) => request(
      slotPath(projectId, slotId),
      CatalogArtSlotSchema,
      { method: "PUT", body: input(CatalogArtSlotReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    removeCatalogGraphic: (projectId, slotId, body, opts) => request(
      slotPath(projectId, slotId),
      CatalogIdResponseSchema,
      { method: "DELETE", body: input(CatalogArtSlotRemoveRequestSchema, body) },
      mutationOptions(opts)
    ),
    bindCatalogGraphic: (projectId, slotId, body, opts) => request(
      `${slotPath(projectId, slotId)}/binding`,
      CatalogArtSlotSchema,
      { method: "PUT", body: input(CatalogArtSlotBindRequestSchema, body) },
      mutationOptions(opts)
    ),
    unbindCatalogGraphic: (projectId, slotId, body, opts) => request(
      `${slotPath(projectId, slotId)}/binding`,
      CatalogArtSlotSchema,
      { method: "DELETE", body: input(CatalogArtSlotUnbindRequestSchema, body) },
      mutationOptions(opts)
    ),
    downloadCatalogGraphic: async (projectId, slotId, opts) => {
      const read = () => request(`${slotPath(projectId, slotId)}/download`, AssignedCatalogRevisionSchema, {}, opts);
      return createFileDownload(await read(), read, fetcher);
    },
    worlds: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/worlds?${queryString(input(WorldListQuerySchema, query))}`,
      WorldListResponseSchema,
      {},
      opts
    ),
    world: (projectId, id2, opts) => request(`${projectPath(projectId)}/worlds/${input(UuidSchema, id2)}`, WorldSchema, {}, opts),
    createWorld: (projectId, body, opts) => request(
      `${projectPath(projectId)}/worlds`,
      CatalogCommandReceiptSchema,
      { method: "POST", body: input(WorldCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceWorld: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/worlds/${input(UuidSchema, id2)}`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(WorldReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveWorld: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/worlds/${input(UuidSchema, id2)}/archive`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(CatalogLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreWorld: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/worlds/${input(UuidSchema, id2)}/restore`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(CatalogLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    locations: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/locations?${queryString(input(LocationListQuerySchema, query))}`,
      LocationListResponseSchema,
      {},
      opts
    ),
    location: (projectId, id2, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}`,
      LocationSchema,
      {},
      opts
    ),
    createLocation: (projectId, body, opts) => request(
      `${projectPath(projectId)}/locations`,
      CatalogCommandReceiptSchema,
      { method: "POST", body: input(LocationCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceLocation: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(LocationReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveLocation: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}/archive`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(CatalogLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreLocation: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}/restore`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(CatalogLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    items: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/items?${queryString(input(ItemListQuerySchema, query))}`,
      ItemListResponseSchema,
      {},
      opts
    ),
    item: (projectId, id2, opts) => request(`${projectPath(projectId)}/items/${input(UuidSchema, id2)}`, ItemSchema, {}, opts),
    createItem: (projectId, body, opts) => request(
      `${projectPath(projectId)}/items`,
      CatalogCommandReceiptSchema,
      { method: "POST", body: input(ItemCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceItem: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/items/${input(UuidSchema, id2)}`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(ItemReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveItem: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/items/${input(UuidSchema, id2)}/archive`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(CatalogLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreItem: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/items/${input(UuidSchema, id2)}/restore`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(CatalogLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    placeLocation: (projectId, id2, body, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}/placement`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(LocationPlacementRequestSchema, body) },
      mutationOptions(opts)
    ),
    locationItems: (projectId, id2, query = {}, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}/items?${queryString(input(CatalogLinkListQuerySchema, query))}`,
      LocationItemLinkListResponseSchema,
      {},
      opts
    ),
    itemLocations: (projectId, id2, query = {}, opts) => request(
      `${projectPath(projectId)}/items/${input(UuidSchema, id2)}/locations?${queryString(input(CatalogLinkListQuerySchema, query))}`,
      LocationItemLinkListResponseSchema,
      {},
      opts
    ),
    locationScenes: (projectId, id2, query = {}, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}/scenes?${queryString(input(CatalogLinkListQuerySchema, query))}`,
      LocationSceneBacklinkListResponseSchema,
      {},
      opts
    ),
    locationQuests: (projectId, id2, query = {}, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, id2)}/quests?${queryString(input(CatalogLinkListQuerySchema, query))}`,
      LocationQuestBacklinkListResponseSchema,
      {},
      opts
    ),
    addLocationItem: (projectId, locationId, body, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, locationId)}/items`,
      CatalogCommandReceiptSchema,
      { method: "POST", body: input(LocationItemLinkCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceLocationItem: (projectId, locationId, linkId, body, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, locationId)}/items/${input(UuidSchema, linkId)}`,
      CatalogCommandReceiptSchema,
      { method: "PUT", body: input(LocationItemLinkReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    removeLocationItem: (projectId, locationId, linkId, body, opts) => request(
      `${projectPath(projectId)}/locations/${input(UuidSchema, locationId)}/items/${input(UuidSchema, linkId)}`,
      CatalogCommandReceiptSchema,
      { method: "DELETE", body: input(LocationItemLinkRemoveRequestSchema, body) },
      mutationOptions(opts)
    ),
    catalogSelectors: (projectId, kind, query = {}, opts) => {
      const entity = input(CatalogEntityKindSchema, kind);
      if (entity === "world")
        return request(
          `${projectPath(projectId)}/catalog/selectors/worlds?${queryString(input(WorldListQuerySchema, query))}`,
          WorldListResponseSchema,
          {},
          opts
        );
      if (entity === "location")
        return request(
          `${projectPath(projectId)}/catalog/selectors/locations?${queryString(input(LocationListQuerySchema, query))}`,
          LocationListResponseSchema,
          {},
          opts
        );
      return request(
        `${projectPath(projectId)}/catalog/selectors/items?${queryString(input(ItemListQuerySchema, query))}`,
        ItemListResponseSchema,
        {},
        opts
      );
    }
  };
}

// packages/automation-client/src/creative.ts
function creativeClient(request, fetcher) {
  const referencePath = (projectId, id2) => `${projectPath(projectId)}/references/${input(UuidSchema, id2)}`;
  return {
    reference: (projectId, id2, opts) => request(referencePath(projectId, id2), AutomationReferenceInspectionSchema, {}, opts),
    unapproveReference: (projectId, id2, opts) => request(
      `${referencePath(projectId, id2)}/unapprove`,
      ReferenceAssetSchema,
      { method: "POST" },
      opts
    ),
    downloadReference: async (projectId, id2, opts) => {
      const read = () => request(
        `${referencePath(projectId, id2)}/download`,
        AutomationReferenceDownloadSchema,
        {},
        opts
      );
      return createFileDownload(await read(), read, fetcher);
    },
    initializeTechniqueReference: (projectId, body, opts) => request(
      `${projectPath(projectId)}/style-profile/technique-upload`,
      AutomationUploadInitResponseSchema,
      { method: "POST", body: input(AutomationTechniqueUploadInitRequestSchema, body) },
      mutationOptions(opts)
    ),
    completeTechniqueReference: (projectId, id2, opts) => request(
      `${projectPath(projectId)}/style-profile/technique-upload/${input(UuidSchema, id2)}/complete`,
      UploadCompleteResponseSchema,
      { method: "POST" },
      opts
    ),
    builtInStyles: (opts) => request("/styles/built-ins", BuiltInStyleListSchema, {}, opts),
    style: (projectId, opts) => request(`${projectPath(projectId)}/style-profile`, StyleProfileSchema, {}, opts),
    saveStyle: (projectId, body, opts) => request(
      `${projectPath(projectId)}/style-profile`,
      StyleProfileSchema,
      { method: "PUT", body: input(StyleProfileSaveInputSchema, body) },
      mutationOptions(opts)
    ),
    analyzeStyle: (projectId, opts) => request(
      `${projectPath(projectId)}/style-profile/analyze`,
      StyleProfileSchema,
      { method: "POST" },
      opts
    ),
    models: (projectId, query = {}, opts) => {
      const parsed = input(GenerationModelDiscoveryInputSchema, query);
      if (parsed.operation === "style-preview")
        return request(
          `${projectPath(projectId)}/style-preview-models`,
          GenerationModelCatalogResponseSchema,
          {},
          opts
        );
      const search = queryString({
        ...parsed,
        ...parsed.selectedReferenceIds !== void 0 ? { selectedReferenceIds: JSON.stringify(parsed.selectedReferenceIds) } : {}
      }).toString();
      return request(
        `${projectPath(projectId)}/generation-models${search ? `?${search}` : ""}`,
        GenerationModelCatalogResponseSchema,
        {},
        opts
      );
    },
    modelSizePolicy: (projectId, query, opts) => request(
      `${projectPath(projectId)}/generation-size-policy?${queryString(input(GenerationSizePolicyQuerySchema, query))}`,
      GenerationSizePolicySchema,
      {},
      opts
    )
  };
}

// packages/automation-client/src/documents.ts
import { z as z55 } from "zod/v4";
function documentClient(request) {
  const documentPath = (projectId, id2) => `${projectPath(projectId)}/documents/${input(UuidSchema, id2)}`;
  const externalPath = (projectId, id2) => `${projectPath(projectId)}/external-documents/${input(UuidSchema, id2)}`;
  return {
    documents: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/documents?${queryString(input(DocumentLibraryQuerySchema, query))}`,
      DocumentLibraryResponseSchema,
      {},
      opts
    ),
    document: (projectId, id2, opts) => request(documentPath(projectId, id2), DocumentDetailSchema, {}, opts),
    documentSources: (projectId, query, opts) => request(
      `${projectPath(projectId)}/document-sources?${queryString(input(DocumentSourceSelectorQuerySchema, query))}`,
      DocumentSourceSelectorResponseSchema,
      {},
      opts
    ),
    documentExports: (projectId, id2, query = {}, opts) => request(
      `${documentPath(projectId, id2)}/exports?${queryString(input(DocumentExportListQuerySchema, query))}`,
      DocumentExportListResponseSchema,
      {},
      opts
    ),
    externalDocument: (projectId, id2, opts) => request(externalPath(projectId, id2), ExternalDocumentDetailSchema, {}, opts),
    createDocument: (projectId, body, opts) => request(
      `${projectPath(projectId)}/documents`,
      DocumentCommandReceiptSchema,
      { method: "POST", body: input(DocumentCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceDocument: (projectId, id2, body, opts) => request(
      documentPath(projectId, id2),
      DocumentCommandReceiptSchema,
      { method: "PUT", body: input(DocumentReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveDocument: (projectId, id2, body, opts) => request(
      `${documentPath(projectId, id2)}/archive`,
      DocumentCommandReceiptSchema,
      { method: "PUT", body: input(DocumentLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreDocument: (projectId, id2, body, opts) => request(
      `${documentPath(projectId, id2)}/restore`,
      DocumentCommandReceiptSchema,
      { method: "PUT", body: input(DocumentLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    reviewDocument: (projectId, id2, body, opts) => request(
      `${documentPath(projectId, id2)}/review`,
      DocumentCommandReceiptSchema,
      { method: "PUT", body: input(DocumentReviewRequestSchema, body) },
      mutationOptions(opts)
    ),
    exportDocument: (projectId, id2, body, opts) => request(
      `${documentPath(projectId, id2)}/exports`,
      DocumentExportCommandReceiptSchema,
      { method: "POST", body: input(DocumentExportRequestSchema, body) },
      mutationOptions(opts)
    ),
    createExternalDocument: (projectId, body, opts) => request(
      `${projectPath(projectId)}/external-documents`,
      ExternalDocumentCommandReceiptSchema,
      { method: "POST", body: input(ExternalDocumentCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    updateExternalDocument: (projectId, id2, body, opts) => request(
      externalPath(projectId, id2),
      ExternalDocumentCommandReceiptSchema,
      { method: "PUT", body: input(ExternalDocumentUpdateRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveExternalDocument: (projectId, id2, body, opts) => request(
      `${externalPath(projectId, id2)}/archive`,
      ExternalDocumentCommandReceiptSchema,
      { method: "PUT", body: input(DocumentLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreExternalDocument: (projectId, id2, body, opts) => request(
      `${externalPath(projectId, id2)}/restore`,
      ExternalDocumentCommandReceiptSchema,
      { method: "PUT", body: input(DocumentLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    downloadDocumentExport: async (projectId, documentId, exportId, opts) => {
      const path = `${documentPath(projectId, documentId)}/exports/${input(UuidSchema, exportId)}`;
      const metadata = await request(path, AutomationDocumentExportDownloadSchema, {}, opts);
      if (metadata.documentId !== documentId || metadata.exportId !== exportId)
        throw problem("conflict", "conflict");
      return {
        metadata,
        async download(role) {
          const file = metadata.files.find((file2) => file2.role === role);
          if (!file) throw problem("input", "validation_failed");
          const content = await request(
            `${path}/${role}`,
            z55.string().max(100 * 1024 * 1024),
            { raw: true, textMimeType: file.mimeType },
            opts
          );
          const bytes = new TextEncoder().encode(content);
          return {
            file,
            body: new ReadableStream({
              start(controller2) {
                controller2.enqueue(bytes);
                controller2.close();
              }
            })
          };
        }
      };
    }
  };
}

// packages/automation-client/src/generation-controls.ts
function generationControls(request) {
  const jobPath = (projectId, jobId) => `${projectPath(projectId)}/jobs/${input(UuidSchema, jobId)}`;
  return {
    submitMoodboard: (projectId, body, opts) => request(
      `${projectPath(projectId)}/moodboards`,
      AssetGenerationResponseSchema,
      { method: "POST", body: input(MoodboardCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    submitStylePreview: (projectId, body, opts) => request(
      `${projectPath(projectId)}/style-previews`,
      AssetGenerationResponseSchema,
      { method: "POST", body: input(StylePreviewCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    generationFormSeed: (projectId, jobId, opts) => request(
      `${projectPath(projectId)}/generations/${input(UuidSchema, jobId)}/form-seed`,
      GenerationFormSeedSchema,
      {},
      opts
    ),
    retryGeneration: (projectId, jobId, opts) => request(
      `${jobPath(projectId, jobId)}/retry`,
      GenerationJobSchema,
      { method: "POST" },
      mutationOptions(opts)
    ),
    cloneGeneration: (projectId, jobId, opts) => request(
      `${jobPath(projectId, jobId)}/clone`,
      GenerationJobSchema,
      { method: "POST" },
      mutationOptions(opts)
    ),
    continueGeneration: (projectId, jobId, body, opts) => request(
      `${jobPath(projectId, jobId)}/continue`,
      GenerationContinuationResponseSchema,
      { method: "POST", body: input(GenerationContinuationRequestSchema, body) },
      mutationOptions(opts)
    ),
    cancelCandidate: (projectId, jobId, candidateId, opts) => request(
      `${jobPath(projectId, jobId)}/candidates/${input(UuidSchema, candidateId)}/cancel`,
      ApproveCandidateResponseSchema,
      { method: "POST" },
      opts
    ),
    activity: (query, opts) => request(
      `/activity?${queryString(input(StudioActivityQuerySchema, query))}`,
      StudioActivityFeedSchema,
      {},
      opts
    )
  };
}

// packages/automation-client/src/graphics.ts
function graphicsClient(request, fetcher) {
  const assetPath = (projectId, assetId) => `${projectPath(projectId)}/assets/${input(UuidSchema, assetId)}`;
  const revisionPath = (projectId, assetId, revisionId) => `${assetPath(projectId, assetId)}/revisions/${input(UuidSchema, revisionId)}`;
  return {
    initializeRasterRevision: (projectId, assetId, body, opts) => request(
      `${assetPath(projectId, assetId)}/revisions/uploads`,
      RevisionUploadInitResponseSchema,
      { method: "POST", body: input(RevisionUploadInitRequestSchema, body) },
      opts
    ),
    completeRasterRevision: (projectId, assetId, revisionId, body, opts) => request(
      `${revisionPath(projectId, assetId, revisionId)}/complete`,
      AutomationRevisionInspectionSchema,
      { method: "POST", body: input(RevisionUploadCompleteRequestSchema, body) },
      opts
    ),
    assetLibrary: (projectId, query = {}, opts) => {
      const search = queryString(input(AutomationAssetLibraryQuerySchema, query)).toString();
      return request(
        `${projectPath(projectId)}/assets${search ? `?${search}` : ""}`,
        AutomationAssetLibrarySchema,
        {},
        opts
      );
    },
    assetRevisions: (projectId, assetId, opts) => request(`${assetPath(projectId, assetId)}/revisions`, AutomationRevisionListSchema, {}, opts),
    assetRevision: (projectId, assetId, revisionId, opts) => request(
      revisionPath(projectId, assetId, revisionId),
      AutomationRevisionInspectionSchema,
      {},
      opts
    ),
    acceptAssetRevision: (projectId, assetId, revisionId, opts) => request(
      `${revisionPath(projectId, assetId, revisionId)}/accept`,
      AutomationAssetSchema,
      { method: "POST" },
      opts
    ),
    saveSurfaceGeometry: (projectId, assetId, revisionId, body, opts) => request(
      `${projectPath(projectId)}/ui-surfaces/${input(UuidSchema, assetId)}/revisions/${input(UuidSchema, revisionId)}/geometry`,
      AutomationRevisionInspectionSchema,
      { method: "POST", body: input(UiSurfaceGeometrySaveRequestSchema, body) },
      mutationOptions(opts)
    ),
    downloadAssetRevision: async (projectId, assetId, revisionId, opts) => {
      const read = async () => {
        const result = await request(
          `${revisionPath(projectId, assetId, revisionId)}/download`,
          AutomationRevisionDownloadSchema,
          {},
          opts
        );
        if (result.assetId !== assetId || result.revisionId !== revisionId || result.revision.id !== revisionId || result.revision.assetId !== assetId)
          throw problem("conflict", "conflict");
        return result;
      };
      return createManifestDownload(await read(), read, fetcher);
    },
    initializeNativeRevision: (projectId, assetId, body, opts) => request(
      `${assetPath(projectId, assetId)}/native/uploads`,
      NativePixelUploadResponseSchema,
      { method: "POST", body: input(NativePixelSaveRequestSchema, body) },
      opts
    ),
    completeNativeRevision: (projectId, assetId, body, opts) => request(
      `${assetPath(projectId, assetId)}/native/complete`,
      AssetParamsSchema.pick({ revisionId: true }),
      { method: "POST", body: input(NativePixelSaveRequestSchema, body) },
      opts
    ),
    downloadNativeRevision: async (projectId, assetId, revisionId, opts) => {
      const read = async () => {
        const result = await request(
          `${revisionPath(projectId, assetId, revisionId)}/native`,
          NativePixelReadResponseSchema,
          {},
          opts
        );
        const files = result.manifest.frames.flatMap(
          (frame) => frame.cells.map((cell) => {
            const matches = result.cells.filter(
              (file) => file.frameId === frame.id && file.layerId === cell.layerId
            );
            if (matches.length !== 1 || !matches[0]) throw problem("conflict", "conflict");
            return {
              ...cell,
              frameId: frame.id,
              role: `${frame.id}/${cell.layerId}`,
              mimeType: "image/png",
              downloadUrl: matches[0].downloadUrl
            };
          })
        );
        if (files.length !== result.cells.length) throw problem("conflict", "conflict");
        return { assetId, revisionId, manifest: result.manifest, files };
      };
      return createManifestDownload(await read(), read, fetcher);
    }
  };
}

// packages/automation-client/src/indicator.ts
import { z as z56 } from "zod/v4";
function indicatorClient(request, fetcher) {
  const base = (projectId) => `${projectPath(projectId)}/ui-indicators`;
  const asset = (projectId, assetId) => `${base(projectId)}/${input(UuidSchema, assetId)}`;
  const revision2 = (projectId, assetId, revisionId) => `${asset(projectId, assetId)}/revisions/${input(UuidSchema, revisionId)}`;
  return {
    indicatorSources: (projectId, query = {}, opts) => request(
      `${base(projectId)}/sources?${queryString(input(UiIndicatorSourceQuerySchema, query))}`,
      AutomationIndicatorSourcesSchema,
      {},
      opts
    ),
    indicator: (projectId, assetId, opts) => request(asset(projectId, assetId), AutomationIndicatorSchema, {}, opts),
    createIndicator: (projectId, body, opts) => request(
      base(projectId),
      UiIndicatorCreateResponseSchema,
      { method: "POST", body: input(UiIndicatorCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    editIndicator: (projectId, assetId, revisionId, body, opts) => request(
      `${revision2(projectId, assetId, revisionId)}/edit`,
      UiIndicatorCreateResponseSchema,
      { method: "POST", body: input(UiIndicatorEditRequestSchema, body) },
      mutationOptions(opts)
    ),
    duplicateIndicator: (projectId, assetId, revisionId, body, opts) => request(
      `${revision2(projectId, assetId, revisionId)}/duplicate`,
      UiIndicatorCreateResponseSchema,
      { method: "POST", body: input(UiIndicatorDuplicateRequestSchema, body) },
      mutationOptions(opts)
    ),
    previewIndicator: (projectId, assetId, revisionId, body, opts) => request(
      `${revision2(projectId, assetId, revisionId)}/preview`,
      z56.instanceof(Uint8Array),
      {
        method: "POST",
        body: input(AutomationIndicatorPreviewSchema, body),
        raw: true,
        binaryMimeType: "image/png"
      },
      opts
    ),
    exportIndicator: async (projectId, assetId, opts) => {
      let expectedRevisionId;
      const read = async () => {
        const result = await request(
          `${asset(projectId, assetId)}/export${expectedRevisionId ? `?revisionId=${expectedRevisionId}` : ""}`,
          AutomationIndicatorExportSchema,
          {},
          opts
        );
        if (result.assetId !== assetId || expectedRevisionId && result.revisionId !== expectedRevisionId)
          throw problem("conflict", "conflict");
        expectedRevisionId = result.revisionId;
        return result;
      };
      return createManifestDownload(await read(), read, fetcher);
    }
  };
}

// packages/automation-client/src/lifecycle.ts
function lifecycleClient(request) {
  const path = (projectId, family, contentId) => {
    const params = input(ContentLifecycleParamsSchema, { projectId, family, contentId });
    return `${projectPath(params.projectId)}/content/${params.family}/${params.contentId}`;
  };
  return {
    contentTrash: (projectId, query, opts) => request(
      `${projectPath(projectId)}/content-trash?${queryString(input(TrashListQuerySchema, query))}`,
      AutomationTrashListSchema,
      {},
      opts
    ),
    contentStatus: (projectId, family, contentId, opts) => request(
      `${path(projectId, family, contentId)}/status`,
      AutomationContentStatusSchema,
      {},
      opts
    ),
    contentCommand: (projectId, family, contentId, operation, body, opts) => request(
      `${path(projectId, family, contentId)}/${operation}`,
      ContentLifecycleResponseSchema,
      {
        method: "POST",
        body: input(
          operation === "purge" ? PurgeContentRequestSchema : TrashContentRequestSchema,
          body
        )
      },
      opts
    )
  };
}

// packages/automation-client/src/tiles.ts
function tilesClient(request, fetcher) {
  const base = (projectId) => `${projectPath(projectId)}/tilesets`;
  const path = (projectId, tilesetId) => `${base(projectId)}/${input(UuidSchema, tilesetId)}`;
  return {
    detectTiles: (projectId, body, opts) => request(
      `${base(projectId)}/detect`,
      GridDetectionResponseSchema,
      { method: "POST", body: input(GridDetectionRequestSchema, body) },
      opts
    ),
    createTileset: (projectId, body, opts) => request(
      base(projectId),
      AutomationTilesetSchema,
      { method: "POST", body: input(TilesetCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    tilesets: (projectId, opts) => request(base(projectId), AutomationTilesetListSchema, {}, opts),
    tileset: (projectId, tilesetId, opts) => request(path(projectId, tilesetId), AutomationTilesetSchema, {}, opts),
    exportTileset: async (projectId, tilesetId, opts) => {
      const read = async () => {
        const result = await request(
          `${path(projectId, tilesetId)}/export`,
          AutomationTilesetExportSchema,
          {},
          opts
        );
        if (result.tilesetId !== tilesetId || result.metadata.id !== tilesetId || result.metadata.projectId !== projectId)
          throw problem("conflict", "conflict");
        return result;
      };
      return createManifestDownload(await read(), read, fetcher);
    }
  };
}

// packages/automation-client/src/poll.ts
async function waitForJob(client, projectId, jobId, options) {
  if (!Number.isInteger(options.maxPolls) || options.maxPolls < 1 || options.maxPolls > 3600)
    throw problem("input", "validation_failed");
  for (let attempt = 0; attempt < options.maxPolls; attempt++) {
    if (options.signal?.aborted) throw problem("transient", "internal_error");
    const job = await client.job(projectId, jobId, options);
    options.onProgress?.(job);
    if (["succeeded", "failed", "cancelled"].includes(job.status)) return job;
    if (attempt + 1 < options.maxPolls) {
      try {
        await options.wait(Math.min(1e3 * 2 ** attempt, 1e4));
      } catch {
        throw problem("transient", "internal_error");
      }
    }
  }
  throw problem("conflict", "conflict");
}

// packages/automation-client/src/index.ts
function createAutomationClient(options) {
  const { request, fetcher } = transport(options);
  const characterPath = (projectId, characterId) => `${projectPath(projectId)}/characters/${input(UuidSchema, characterId)}`;
  const scenePath = (projectId, sceneId) => `${projectPath(projectId)}/narrative/scenes/${input(UuidSchema, sceneId)}`;
  const questPath = (projectId, questId) => `${projectPath(projectId)}/quests/${input(UuidSchema, questId)}`;
  const mechanicPath = (projectId, mechanicId) => `${projectPath(projectId)}/mechanics/${input(UuidSchema, mechanicId)}`;
  const influencePath = (projectId, influenceId) => `${projectPath(projectId)}/mechanic-influences/${input(UuidSchema, influenceId)}`;
  const jobPath = (projectId, jobId) => `${projectPath(projectId)}/jobs/${input(UuidSchema, jobId)}`;
  const candidatePath = (projectId, jobId, candidateId) => `${jobPath(projectId, jobId)}/candidates/${input(UuidSchema, candidateId)}`;
  const exportRead = (projectId, assetId, revisionId, opts) => request(
    `${projectPath(projectId)}/assets/${input(UuidSchema, assetId)}/export${revisionId ? `?expectedRevisionId=${input(UuidSchema, revisionId)}` : ""}`,
    AutomationAcceptedExportSchema,
    {},
    opts
  );
  return {
    ...catalogClient(request, fetcher),
    ...documentClient(request),
    ...creativeClient(request, fetcher),
    ...generationControls(request),
    ...graphicsClient(request, fetcher),
    ...indicatorClient(request, fetcher),
    ...tilesClient(request, fetcher),
    ...lifecycleClient(request),
    narrative: (projectId, opts) => request(`${projectPath(projectId)}/narrative`, NarrativeOutlineSchema, {}, opts),
    setNarrative: (projectId, body, opts) => request(
      `${projectPath(projectId)}/narrative`,
      NarrativeCommandReceiptSchema,
      { method: "PUT", body: input(NarrativeOutlineSaveRequestSchema, body) },
      mutationOptions(opts)
    ),
    scenes: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/narrative/scenes?${queryString(input(NarrativeSceneListQuerySchema, query))}`,
      NarrativeSceneListResponseSchema,
      {},
      opts
    ),
    scene: (projectId, sceneId, opts) => request(scenePath(projectId, sceneId), NarrativeSceneDetailSchema, {}, opts),
    createScene: (projectId, body, opts) => request(
      `${projectPath(projectId)}/narrative/scenes`,
      NarrativeCommandReceiptSchema,
      { method: "POST", body: input(NarrativeSceneCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceScene: (projectId, sceneId, body, opts) => request(
      scenePath(projectId, sceneId),
      NarrativeCommandReceiptSchema,
      { method: "PUT", body: input(NarrativeSceneReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveScene: (projectId, sceneId, body, opts) => request(
      `${scenePath(projectId, sceneId)}/archive`,
      NarrativeCommandReceiptSchema,
      { method: "PUT", body: input(NarrativeSceneLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreScene: (projectId, sceneId, body, opts) => request(
      `${scenePath(projectId, sceneId)}/restore`,
      NarrativeCommandReceiptSchema,
      { method: "PUT", body: input(NarrativeSceneLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    narrativeCharacters: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/narrative/character-selectors?${queryString(input(NarrativeCharacterSelectorQuerySchema, query))}`,
      NarrativeCharacterSelectorResponseSchema,
      {},
      opts
    ),
    narrativeStructure: (projectId, opts) => request(
      `${projectPath(projectId)}/narrative/structure`,
      NarrativeStructureSchemaState,
      {},
      opts
    ),
    setNarrativeStructure: (projectId, body, opts) => request(
      `${projectPath(projectId)}/narrative/structure`,
      NarrativeCommandReceiptSchema,
      { method: "PUT", body: input(NarrativeStructureSaveRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveNarrativeSection: (projectId, body, opts) => request(
      `${projectPath(projectId)}/narrative/structure/sections/archive`,
      NarrativeCommandReceiptSchema,
      { method: "PUT", body: input(NarrativeSectionLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreNarrativeSection: (projectId, body, opts) => request(
      `${projectPath(projectId)}/narrative/structure/sections/restore`,
      NarrativeCommandReceiptSchema,
      { method: "PUT", body: input(NarrativeSectionLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    quests: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/quests?${queryString(input(QuestListQuerySchema, query))}`,
      QuestListResponseSchema,
      {},
      opts
    ),
    quest: (projectId, questId, opts) => request(questPath(projectId, questId), QuestDetailSchema, {}, opts),
    createQuest: (projectId, body, opts) => request(
      `${projectPath(projectId)}/quests`,
      QuestCommandReceiptSchema,
      { method: "POST", body: input(QuestCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceQuest: (projectId, questId, body, opts) => request(
      questPath(projectId, questId),
      QuestCommandReceiptSchema,
      { method: "PUT", body: input(QuestReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveQuest: (projectId, questId, body, opts) => request(
      `${questPath(projectId, questId)}/archive`,
      QuestCommandReceiptSchema,
      { method: "PUT", body: input(QuestLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreQuest: (projectId, questId, body, opts) => request(
      `${questPath(projectId, questId)}/restore`,
      QuestCommandReceiptSchema,
      { method: "PUT", body: input(QuestLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    questRetainedSummaries: (projectId, body, opts) => request(
      `${projectPath(projectId)}/quests/retained-summaries`,
      QuestRetainedSummaryResponseSchema,
      { method: "POST", body: input(QuestRetainedSummaryRequestSchema, body) },
      opts
    ),
    questSceneSelectors: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/quests/scene-selectors?${queryString(input(QuestSceneSelectorQuerySchema, query))}`,
      QuestSceneSelectorResponseSchema,
      {},
      opts
    ),
    sceneQuestUsage: (projectId, sceneId, query = {}, opts) => request(
      `${scenePath(projectId, sceneId)}/quest-usage?${queryString(input(QuestSceneUsageQuerySchema, query))}`,
      QuestSceneUsageResponseSchema,
      {},
      opts
    ),
    mechanics: (projectId, query = {}, opts) => request(
      `${projectPath(projectId)}/mechanics?${queryString(input(MechanicListQuerySchema, query))}`,
      MechanicListResponseSchema,
      {},
      opts
    ),
    mechanic: (projectId, mechanicId, opts) => request(mechanicPath(projectId, mechanicId), MechanicDetailSchema, {}, opts),
    mechanicSelectors: (projectId, mechanicId, query = {}, opts) => request(
      `${mechanicPath(projectId, mechanicId)}/selectors?${queryString(input(MechanicListQuerySchema, query))}`,
      MechanicSelectorResponseSchema,
      {},
      opts
    ),
    createMechanic: (projectId, body, opts) => request(
      `${projectPath(projectId)}/mechanics`,
      MechanicDetailSchema,
      { method: "POST", body: input(MechanicCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceMechanic: (projectId, mechanicId, body, opts) => request(
      mechanicPath(projectId, mechanicId),
      MechanicDetailSchema,
      { method: "PUT", body: input(MechanicReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveMechanic: (projectId, mechanicId, body, opts) => request(
      `${mechanicPath(projectId, mechanicId)}/archive`,
      MechanicDetailSchema,
      { method: "PUT", body: input(MechanicLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreMechanic: (projectId, mechanicId, body, opts) => request(
      `${mechanicPath(projectId, mechanicId)}/restore`,
      MechanicDetailSchema,
      { method: "PUT", body: input(MechanicLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    mechanicInfluences: (projectId, mechanicId, query = {}, opts) => request(
      `${mechanicPath(projectId, mechanicId)}/influences?${queryString(input(MechanicInfluenceListQuerySchema, query))}`,
      MechanicInfluenceListResponseSchema,
      {},
      opts
    ),
    createMechanicInfluence: (projectId, body, opts) => request(
      `${projectPath(projectId)}/mechanic-influences`,
      MechanicInfluenceSchema,
      { method: "POST", body: input(MechanicInfluenceCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceMechanicInfluence: (projectId, influenceId, body, opts) => request(
      influencePath(projectId, influenceId),
      MechanicInfluenceSchema,
      { method: "PUT", body: input(MechanicInfluenceReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    removeMechanicInfluence: (projectId, influenceId, body, opts) => request(
      influencePath(projectId, influenceId),
      MechanicInfluenceRemoveResponseSchema,
      { method: "DELETE", body: input(MechanicInfluenceRemoveRequestSchema, body) },
      mutationOptions(opts)
    ),
    asset: (projectId, assetId, opts) => request(
      `${projectPath(projectId)}/assets/${input(UuidSchema, assetId)}`,
      AutomationAssetSchema,
      {},
      opts
    ),
    version: (opts) => request("/version", AutomationVersionResponseSchema, { raw: true }, opts),
    whoami: (opts) => request("/whoami", AutomationWhoAmIResponseSchema, { raw: true }, opts),
    projects: (studioId, opts, trash = false) => request(
      `/projects?studioId=${input(UuidSchema, studioId)}${trash ? "&trash=true" : ""}`,
      ProjectListResponseSchema,
      {},
      opts
    ),
    project: (projectId, opts, trash = false) => request(`${projectPath(projectId)}${trash ? "?trash=true" : ""}`, ProjectSchema, {}, opts),
    updateProject: (projectId, body, opts) => request(
      projectPath(projectId),
      ProjectSchema,
      { method: "PATCH", body: input(ProjectUpdateRequestSchema, body) },
      mutationOptions(opts)
    ),
    trashProject: (projectId, opts) => request(projectPath(projectId), ProjectSchema, { method: "DELETE" }, mutationOptions(opts)),
    restoreProject: (projectId, opts) => request(
      `${projectPath(projectId)}/restore`,
      ProjectSchema,
      { method: "POST" },
      mutationOptions(opts)
    ),
    concept: (projectId, opts) => request(`${projectPath(projectId)}/concept`, GameConceptSchema, {}, opts),
    setConcept: (projectId, body, opts) => request(
      `${projectPath(projectId)}/concept`,
      GameConceptSchema,
      { method: "PUT", body: input(GameConceptSaveRequestSchema, body) },
      mutationOptions(opts)
    ),
    characterGraphics: (projectId, query = {}, opts) => {
      const parsed = input(CharacterGraphicsQuerySchema, query);
      const params = new URLSearchParams(
        Object.entries(parsed).map(([key3, value]) => [key3, String(value)])
      );
      return request(
        `${projectPath(projectId)}/character-graphics?${params}`,
        CharacterGraphicsPageSchema,
        {},
        opts
      );
    },
    characterGraphicsIdentity: (projectId, characterId, opts) => request(
      `${projectPath(projectId)}/character-graphics/${input(UuidSchema, characterId)}`,
      CharacterGraphicsIdentitySchema,
      {},
      opts
    ),
    characters: (projectId, query = {}, opts) => {
      const parsed = input(CharacterListQuerySchema, query);
      const params = new URLSearchParams(
        Object.entries(parsed).map(([key3, value]) => [key3, String(value)])
      );
      return request(
        `${projectPath(projectId)}/characters?${params}`,
        CharacterListResponseSchema,
        {},
        opts
      );
    },
    character: (projectId, characterId, opts) => request(characterPath(projectId, characterId), CharacterDetailSchema, {}, opts),
    createCharacter: (projectId, body, opts) => request(
      `${projectPath(projectId)}/characters`,
      CharacterDetailSchema,
      { method: "POST", body: input(CharacterCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    replaceCharacter: (projectId, characterId, body, opts) => request(
      characterPath(projectId, characterId),
      CharacterDetailSchema,
      { method: "PUT", body: input(CharacterReplaceRequestSchema, body) },
      mutationOptions(opts)
    ),
    archiveCharacter: (projectId, characterId, body, opts) => request(
      `${characterPath(projectId, characterId)}/archive`,
      CharacterDetailSchema,
      { method: "PUT", body: input(CharacterLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    restoreCharacter: (projectId, characterId, body, opts) => request(
      `${characterPath(projectId, characterId)}/restore`,
      CharacterDetailSchema,
      { method: "PUT", body: input(CharacterLifecycleRequestSchema, body) },
      mutationOptions(opts)
    ),
    artSettings: (projectId, opts) => request(`${projectPath(projectId)}/art-settings`, ProjectArtSettingsSchema, {}, opts),
    setArtSettings: (projectId, body, opts) => request(
      `${projectPath(projectId)}/art-settings`,
      ProjectArtSettingsSchema,
      { method: "PUT", body: input(ProjectArtSettingsSaveRequestSchema, body) },
      mutationOptions(opts)
    ),
    createProject: (body, opts) => request(
      "/projects",
      ProjectSchema,
      { method: "POST", body: input(ProjectCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    references: (projectId, opts, query = {}) => {
      const search = queryString(input(ReferenceListQuerySchema, query)).toString();
      return request(
        `${projectPath(projectId)}/references${search ? `?${search}` : ""}`,
        ReferenceListResponseSchema,
        {},
        opts
      );
    },
    initializeReference: (projectId, body, opts) => request(
      `${projectPath(projectId)}/references/uploads`,
      AutomationUploadInitResponseSchema,
      { method: "POST", body: input(AutomationReferenceUploadInitRequestSchema, body) },
      mutationOptions(opts)
    ),
    completeReference: (projectId, referenceId, opts) => request(
      `${projectPath(projectId)}/references/${input(UuidSchema, referenceId)}/complete`,
      UploadCompleteResponseSchema,
      { method: "POST" },
      opts
    ),
    abortReference: (projectId, referenceId, opts) => request(
      `${projectPath(projectId)}/references/${input(UuidSchema, referenceId)}/abort`,
      AutomationUploadAbortResponseSchema,
      { method: "POST" },
      opts
    ),
    approveReference: (projectId, referenceId, opts) => request(
      `${projectPath(projectId)}/references/${input(UuidSchema, referenceId)}/approve`,
      ReferenceAssetSchema,
      { method: "POST" },
      opts
    ),
    selectTechnique: (projectId, referenceId, opts) => request(
      `${projectPath(projectId)}/style-profile/technique-selection`,
      StyleProfileSchema,
      { method: "PUT", body: input(StyleProfileTechniqueSelectionSchema, { referenceId }) },
      opts
    ),
    clearTechnique: (projectId, opts) => request(
      `${projectPath(projectId)}/style-profile/technique-selection`,
      StyleProfileSchema,
      { method: "DELETE" },
      opts
    ),
    generationContext: (projectId, body, opts) => request(
      `${projectPath(projectId)}/generation-context`,
      GenerationContextSchema,
      { method: "POST", body: input(GenerationContextRequestSchema, body) },
      opts
    ),
    submit: (projectId, body, opts) => request(
      `${projectPath(projectId)}/assets`,
      AssetGenerationResponseSchema,
      { method: "POST", body: input(AssetCreateRequestSchema, body) },
      mutationOptions(opts)
    ),
    jobs: (projectId, query = {}, opts) => {
      const parsed = input(GenerationHistoryQuerySchema, query);
      const params = new URLSearchParams(
        Object.entries(parsed).filter(([, value]) => value !== void 0).map(([key3, value]) => [key3, String(value)])
      );
      return request(`${projectPath(projectId)}/jobs?${params}`, GenerationJobListSchema, {}, opts);
    },
    job: (projectId, jobId, opts) => request(jobPath(projectId, jobId), GenerationJobSchema, {}, opts),
    cancel: (projectId, jobId, opts) => request(`${jobPath(projectId, jobId)}/cancel`, GenerationJobSchema, { method: "POST" }, opts),
    candidates: (projectId, jobId, opts) => request(`${jobPath(projectId, jobId)}/candidates`, GenerationDetailSchema, {}, opts),
    detail: (projectId, jobId, opts) => request(
      `${projectPath(projectId)}/generations/${input(UuidSchema, jobId)}`,
      GenerationDetailSchema,
      {},
      opts
    ),
    preview: (projectId, jobId, candidateId, opts) => request(
      `${candidatePath(projectId, jobId, candidateId)}/preview`,
      AutomationCandidatePreviewSchema,
      {},
      opts
    ),
    process: (projectId, jobId, candidateId, opts) => request(
      `${candidatePath(projectId, jobId, candidateId)}/process`,
      ApproveCandidateResponseSchema,
      { method: "POST" },
      mutationOptions(opts)
    ),
    reject: (projectId, jobId, candidateId, opts) => request(
      `${candidatePath(projectId, jobId, candidateId)}/reject`,
      GenerationCandidateSchema,
      { method: "POST" },
      opts
    ),
    restore: (projectId, jobId, candidateId, opts) => request(
      `${candidatePath(projectId, jobId, candidateId)}/restore`,
      GenerationCandidateSchema,
      { method: "POST" },
      opts
    ),
    exportAsset: async (projectId, assetId, opts) => createExportDownload(
      await exportRead(projectId, assetId, void 0, opts),
      (revisionId) => exportRead(projectId, assetId, revisionId, opts),
      fetcher
    )
  };
}

// apps/cli/src/run.ts
import { z as z58 } from "zod/v4";

// apps/cli/src/files.ts
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, lstat, mkdir, open, realpath, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
var LocalFileError = class extends Error {
  constructor(category, message) {
    super(message);
    this.category = category;
  }
  category;
};
var sha2562 = (bytes) => createHash("sha256").update(bytes).digest("hex");
var absent = (error) => typeof error === "object" && error !== null && Reflect.get(error, "code") === "ENOENT";
async function confinedPath(root, relative, createParents = false) {
  if (!relative || isAbsolute(relative) || /[\\\0]/.test(relative) || /^[A-Za-z]:/.test(relative) || relative.split("/").some((part) => !part || part === ".." || part === "."))
    throw new LocalFileError("input", "Expected a relative path without traversal.");
  const canonical = await realpath(root);
  const segments = relative.split("/");
  let current = canonical;
  for (const [index, segment] of segments.entries()) {
    current = join(current, segment);
    const parent = index < segments.length - 1;
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      if (!absent(error)) throw error;
      if (parent && createParents) {
        await mkdir(current, { mode: 448 }).catch(async (error2) => {
          if (!(typeof error2 === "object" && error2 !== null && Reflect.get(error2, "code") === "EEXIST"))
            throw error2;
        });
        stat = await lstat(current);
      }
    }
    if (stat?.isSymbolicLink() || stat && (parent ? !stat.isDirectory() : !stat.isFile()))
      throw new LocalFileError(
        "input",
        "Path must not contain symbolic links or incompatible entries."
      );
  }
  return current;
}
async function readConfined(root, relative, limit) {
  const path = await confinedPath(root, relative);
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > limit)
      throw new LocalFileError("input", "Input file is too large.");
    const bytes = await file.readFile();
    if (bytes.byteLength > limit) throw new LocalFileError("input", "Input file is too large.");
    return bytes;
  } finally {
    await file.close();
  }
}
async function validateOutputPaths(root, paths) {
  for (const [index, path] of paths.entries()) {
    if (paths.some(
      (other, otherIndex) => index !== otherIndex && (other === path || other.startsWith(`${path}/`))
    ))
      throw new LocalFileError("input", "Output paths must be distinct files.");
    await confinedPath(root, path);
  }
}
async function readJson(path, maxBytes2 = 4 * 1024 * 1024) {
  try {
    const absolute = resolve(path);
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        await readConfined(
          dirname(absolute),
          absolute.slice(dirname(absolute).length + 1),
          maxBytes2
        )
      )
    );
  } catch {
    throw new LocalFileError("input", "Unable to read a valid JSON input file.");
  }
}
async function publish(root, relative, source, expected, previousChecksum, checkpoint) {
  const destination = await confinedPath(root, relative, true);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  const file = await open(temporary, "wx", 384);
  const reader = source.getReader();
  let byteSize = 0;
  const hash = createHash("sha256");
  try {
    for (; ; ) {
      const chunk = await reader.read().catch(() => {
        throw new LocalFileError("transient", "Download stream interrupted.");
      });
      if (chunk.done) break;
      byteSize += chunk.value.byteLength;
      if (byteSize > expected.byteSize)
        throw new LocalFileError("conflict", "Download size mismatch.");
      hash.update(chunk.value);
      await file.writeFile(chunk.value);
    }
    if (byteSize !== expected.byteSize || hash.digest("hex") !== expected.checksum)
      throw new LocalFileError("conflict", "Download checksum or size mismatch.");
    await file.sync();
    checkpoint?.("flushed");
    await file.close();
    await confinedPath(root, relative);
    let existing;
    try {
      existing = sha2562(await readConfined(root, relative, 100 * 1024 * 1024));
    } catch (error) {
      if (!absent(error)) throw error;
    }
    if (existing === expected.checksum)
      return { path: relative, checksum: expected.checksum, byteSize };
    if (existing && existing !== previousChecksum)
      throw new LocalFileError("conflict", "Output belongs to another file.");
    if (existing) await rename(temporary, destination);
    else await link(temporary, destination);
    const directory = await open(dirname(destination), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
    checkpoint?.("published");
    return { path: relative, checksum: expected.checksum, byteSize };
  } finally {
    await reader.cancel().catch(() => void 0);
    await file.close();
    await unlink(temporary).catch((error) => {
      if (!absent(error)) throw error;
    });
  }
}
function publishJson(root, path, data, previousChecksum, checkpoint) {
  const bytes = new TextEncoder().encode(`${JSON.stringify(data, null, 2)}
`);
  return publish(
    root,
    path,
    new ReadableStream({
      start(controller2) {
        controller2.enqueue(bytes);
        controller2.close();
      }
    }),
    { checksum: sha2562(bytes), byteSize: bytes.length },
    previousChecksum,
    checkpoint
  );
}

// apps/cli/src/authoring-commands.ts
async function runAuthoringCommand(command, values, client, opts) {
  const required = (value) => {
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", "Required option is missing.");
    return value;
  };
  const project = () => required(values["project"]);
  const character = () => required(values["character"]);
  const mutationOpts = () => ({ ...opts, idempotencyKey: required(values["idempotency-key"]) });
  const page4 = {
    ...values["cursor"] !== void 0 ? { cursor: values["cursor"] } : {},
    ...values["limit"] !== void 0 ? { limit: values["limit"] } : {}
  };
  switch (command) {
    case "mechanic list":
      return await client.mechanics(
        project(),
        { ...page4, ...values["state"] !== void 0 ? { state: values["state"] } : {} },
        opts
      );
    case "mechanic get":
      return await client.mechanic(project(), required(values["mechanic"]), opts);
    case "mechanic selectors":
      return await client.mechanicSelectors(
        project(),
        required(values["mechanic"]),
        { ...page4, ...values["state"] !== void 0 ? { state: values["state"] } : {} },
        opts
      );
    case "mechanic create":
      return await client.createMechanic(
        project(),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "mechanic set":
      return await client.replaceMechanic(
        project(),
        required(values["mechanic"]),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "mechanic archive":
      return await client.archiveMechanic(
        project(),
        required(values["mechanic"]),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "mechanic restore":
      return await client.restoreMechanic(
        project(),
        required(values["mechanic"]),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "mechanic influence list":
      return await client.mechanicInfluences(project(), required(values["mechanic"]), page4, opts);
    case "mechanic influence create":
      return await client.createMechanicInfluence(
        project(),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "mechanic influence set":
      return await client.replaceMechanicInfluence(
        project(),
        required(values["influence"]),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "mechanic influence remove":
      return await client.removeMechanicInfluence(
        project(),
        required(values["influence"]),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "project update":
      return await client.updateProject(
        project(),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "project archive":
    case "project unarchive":
      return await client.updateProject(
        project(),
        { status: command === "project archive" ? "archived" : "active" },
        mutationOpts()
      );
    case "project trash":
      return await client.trashProject(project(), mutationOpts());
    case "project restore":
      return await client.restoreProject(project(), mutationOpts());
    case "project concept get":
      return await client.concept(project(), opts);
    case "project concept set":
      return await client.setConcept(
        project(),
        await readJson(required(values["file"])),
        mutationOpts()
      );
    case "project art-settings get":
      return await client.artSettings(project(), opts);
    case "project art-settings set":
      return await client.setArtSettings(
        project(),
        await readJson(required(values["file"])),
        mutationOpts()
      );
    case "project list": {
      return await client.projects(required(values["studio"]), opts, values["trash"] === true);
    }
    case "character list": {
      return await client[values["graphics"] === true ? "characterGraphics" : "characters"](
        project(),
        {
          ...values["cursor"] !== void 0 ? { cursor: values["cursor"] } : {},
          ...values["limit"] !== void 0 ? { limit: values["limit"] } : {},
          ...values["state"] !== void 0 ? { state: values["state"] } : {}
        },
        opts
      );
    }
    case "character get":
      return await client[values["graphics"] === true ? "characterGraphicsIdentity" : "character"](
        project(),
        character(),
        opts
      );
    case "character set":
      return await client.replaceCharacter(
        project(),
        character(),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "character archive":
      return await client.archiveCharacter(
        project(),
        character(),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "character restore":
      return await client.restoreCharacter(
        project(),
        character(),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "character create":
      return await client.createCharacter(
        project(),
        await readJson(required(values["input"])),
        mutationOpts()
      );
    case "project create":
    case "project get": {
      const result = command === "project create" ? await client.createProject(await readJson(required(values["input"])), mutationOpts()) : await client.project(project(), opts, values["trash"] === true);
      return result;
    }
    default:
      return void 0;
  }
}

// apps/cli/src/preflight.ts
import { realpath as realpath2 } from "node:fs/promises";
import { basename, dirname as dirname2, resolve as resolve2 } from "node:path";
var fingerprint = (value) => sha2562(JSON.stringify(value));
function operationKey(namespace, externalId, operation, content) {
  return fingerprint([namespace, externalId, operation, content]);
}
async function preflight(path, prior, receiptOverride) {
  const absolute = resolve2(path);
  const base = await realpath2(dirname2(absolute));
  const parsed = AutomationBatchManifestSchema.safeParse(await readJson(absolute));
  if (!parsed.success)
    throw new LocalFileError(
      "input",
      `Invalid game-studio-batch/v3 manifest: ${parsed.error.message}`
    );
  const manifest = parsed.data;
  await confinedPath(base, `${manifest.outputRoot}/.path-check`);
  const root = await realpath2(resolve2(base, manifest.outputRoot));
  const paths = [];
  const entries = [];
  for (const entry of manifest.entries) {
    const brief = entry.prompt.kind === "inline" ? entry.prompt.brief : new TextDecoder("utf-8", { fatal: true }).decode(
      await readConfined(base, entry.prompt.path, 16e3)
    );
    const characterRef = entry.input.kind === "character" ? entry.input.characterRef : void 0;
    const assetInput = entry.input.kind === "character" ? (({ characterRef: _characterRef, ...input3 }) => input3)(entry.input) : entry.input;
    const result = AssetCreateRequestSchema.safeParse({
      ...assetInput,
      contextFingerprint: "0".repeat(64),
      ...entry.input.kind === "character" ? { characterId: "00000000-0000-4000-8000-000000000000" } : {},
      ...entry.input.kind === "ui-surface" ? { description: brief } : { brief }
    });
    if (!result.success) throw new LocalFileError("input", "Invalid family input or prompt file.");
    const input2 = result.data;
    const imagePaths = input2.kind === "ui-surface" && input2.surfaceKind === "button" ? [
      entry.output.imagePath,
      ...["hover", "pressed", "disabled"].map(
        (role) => `${entry.output.imagePath.replace(/\.[^./]+$/, "")}.${role}.png`
      )
    ] : [entry.output.imagePath];
    paths.push(...imagePaths, entry.output.metadataPath);
    if (entry.output.previewPath) paths.push(entry.output.previewPath);
    entries.push({
      ...entry,
      input: input2,
      ...characterRef ? { characterRef } : {},
      fingerprint: fingerprint({
        input: input2,
        characterRef: characterRef ?? null,
        candidatePlan: entry.candidatePlan,
        output: entry.output
      })
    });
  }
  const reservedOutput = paths.some((path2) => path2.split("/")[0] === ".game-studio");
  if (receiptOverride !== void 0) paths.push(receiptOverride);
  const outputPaths = new Set(paths);
  if (reservedOutput || outputPaths.size !== paths.length || paths.some((path2) => {
    const segments = path2.split("/");
    return segments.some(
      (_, index) => index > 0 && outputPaths.has(segments.slice(0, index).join("/"))
    );
  }))
    throw new LocalFileError(
      "input",
      "Output paths collide or use the reserved receipt directory."
    );
  for (const path2 of paths) await confinedPath(root, path2);
  const references = [];
  const characters = (manifest.characters ?? []).map((character) => ({
    ...character,
    fingerprint: fingerprint(character.definition)
  }));
  for (const reference of manifest.bootstrap?.references ?? []) {
    const bytes = await readConfined(base, reference.path, 25 * 1024 * 1024);
    if (!bytes.length) throw new LocalFileError("input", "Reference image is empty.");
    const input2 = {
      purpose: "style-reference",
      fileName: basename(reference.path),
      mimeType: reference.mimeType,
      byteSize: bytes.length,
      checksum: sha2562(bytes)
    };
    references.push({
      ...reference,
      input: input2,
      bytes,
      fingerprint: fingerprint({ input: input2, approve: reference.approve })
    });
  }
  const manifestFingerprint = fingerprint({
    project: manifest.project,
    concurrency: manifest.concurrency,
    outputRoot: manifest.outputRoot,
    entries: entries.map(({ externalId, fingerprint: fingerprint2 }) => ({ externalId, fingerprint: fingerprint2 })),
    references: references.map(({ externalId, fingerprint: fingerprint2 }) => ({ externalId, fingerprint: fingerprint2 })),
    technique: manifest.bootstrap?.technique,
    artSettings: manifest.artSettings,
    characters: characters.map(({ externalId, fingerprint: fingerprint2 }) => ({ externalId, fingerprint: fingerprint2 }))
  });
  if (prior) {
    AutomationBatchReceiptSchema.parse(prior);
    if (prior.manifestFingerprint !== manifestFingerprint)
      throw new LocalFileError("conflict", "Manifest content drift.");
  }
  const receiptPath = receiptOverride ?? `.game-studio/runs/${manifestFingerprint}.json`;
  await confinedPath(root, receiptPath);
  return {
    receiptPath,
    manifest,
    root,
    entries,
    references,
    characters,
    manifestFingerprint,
    manifestIdentity: sha2562(await realpath2(absolute))
  };
}

// apps/cli/src/receipt.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import { open as open2, unlink as unlink2 } from "node:fs/promises";
async function readReceipt(root, path) {
  try {
    const bytes = await readConfined(root, path, 4 * 1024 * 1024);
    const parsed = AutomationBatchReceiptSchema.safeParse(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
    );
    if (!parsed.success) throw new LocalFileError("input", "Invalid receipt.");
    return { receipt: parsed.data, checksum: sha2562(bytes) };
  } catch (error) {
    if (typeof error === "object" && error !== null && Reflect.get(error, "code") === "ENOENT")
      return void 0;
    throw error;
  }
}
async function withReceipt(root, path, operation, lockIdentity = path) {
  const lockPath = await confinedPath(root, `${lockIdentity}.lock`, true);
  let lock;
  try {
    lock = await open2(lockPath, "wx", 384);
  } catch {
    throw new LocalFileError(
      "conflict",
      "Receipt is locked. Confirm the owner has stopped before removing its lock."
    );
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, owner: randomUUID2() }));
    await lock.sync();
    const stored = await readReceipt(root, path);
    let checksum = stored?.checksum;
    return await operation({
      current: stored?.receipt,
      save: async (receipt) => {
        const safe = AutomationBatchReceiptSchema.parse(receipt);
        const result = await publishJson(root, path, safe, checksum);
        checksum = result.checksum;
      }
    });
  } finally {
    await lock.close();
    await unlink2(lockPath);
  }
}
async function assertManifestHistory(root, identity, fingerprint2) {
  try {
    await publishJson(root, `.game-studio/identities/${identity}.json`, {
      version: "game-studio-batch/v3",
      fingerprint: fingerprint2
    });
  } catch (error) {
    if (error instanceof LocalFileError && error.category === "conflict")
      throw new LocalFileError(
        "conflict",
        "Manifest content drift; use a new manifest identity only for an explicitly authorized new batch."
      );
    throw error;
  }
}

// apps/cli/src/transfers.ts
async function uploadReference(client, fetcher, projectId, input2, bytes, opts) {
  const parsed = AutomationReferenceUploadInitRequestSchema.or(
    AutomationTechniqueUploadInitRequestSchema
  ).safeParse(input2);
  if (!parsed.success || parsed.data.byteSize !== bytes.length || parsed.data.checksum !== sha2562(bytes))
    throw new LocalFileError("input", "Invalid reference upload input.");
  const technique = parsed.data.purpose === "technique-reference";
  const initialized = technique ? await client.initializeTechniqueReference(projectId, parsed.data, opts) : await client.initializeReference(projectId, parsed.data, opts);
  if (initialized.status === "pending") {
    try {
      const response = await fetcher(initialized.uploadUrl, {
        method: "PUT",
        body: new Uint8Array(bytes),
        headers: initialized.requiredHeaders,
        credentials: "omit",
        redirect: "error",
        signal: AbortSignal.any([
          AbortSignal.timeout(3e4),
          ...opts.signal ? [opts.signal] : []
        ])
      });
      await response.body?.cancel();
      if (!response.ok) throw new LocalFileError("transient", "Reference transfer failed.");
      const complete = technique ? await client.completeTechniqueReference(projectId, initialized.referenceId, opts) : await client.completeReference(projectId, initialized.referenceId, opts);
      if (complete.checksum !== parsed.data.checksum || complete.byteSize !== bytes.length)
        throw new LocalFileError("conflict", "Reference checksum changed.");
    } catch (error) {
      await client.abortReference(projectId, initialized.referenceId).catch(() => void 0);
      if (error instanceof LocalFileError) throw error;
      throw new LocalFileError(
        "transient",
        "Reference transfer could not complete; retry the same identity."
      );
    }
  }
  return { referenceId: initialized.referenceId, status: "ready" };
}
async function downloadPreview(client, fetcher, projectId, jobId, candidateId, root, path, opts) {
  await confinedPath(root, path);
  let expected;
  for (let attempt = 0; attempt < 2; attempt++) {
    const preview = await client.preview(projectId, jobId, candidateId, opts);
    if (expected && (expected.checksum !== preview.checksum || expected.byteSize !== preview.byteSize || expected.mimeType !== preview.mimeType))
      throw new LocalFileError("conflict", "Preview changed during refresh.");
    expected = preview;
    const response = await fetcher(preview.previewUrl, {
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.any([AbortSignal.timeout(3e4), ...opts.signal ? [opts.signal] : []])
    }).catch(() => {
      throw new LocalFileError("transient", "Preview transfer interrupted.");
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (attempt === 0 && [401, 403].includes(response.status)) continue;
      throw new LocalFileError("transient", "Preview download failed.");
    }
    if (!response.body || response.headers.get("content-type")?.split(";")[0] !== preview.mimeType) {
      await response.body?.cancel();
      throw new LocalFileError("conflict", "Preview MIME mismatch.");
    }
    return {
      ...await publish(root, path, response.body, preview),
      mimeType: preview.mimeType,
      role: "preview",
      candidateId
    };
  }
  throw new LocalFileError("transient", "Preview download failed.");
}
async function exportAsset(client, projectId, assetId, root, image, metadataPath, opts, expectedRevisionId) {
  await validateOutputPaths(root, [image, metadataPath]);
  const result = await client.exportAsset(projectId, assetId, opts);
  if (expectedRevisionId && result.metadata.revisionId !== expectedRevisionId)
    throw new LocalFileError("conflict", "Export revision changed.");
  const paths = result.metadata.files.map(
    (file) => file.role === "normal" ? image : `${image.replace(/\.[^./]+$/, "")}.${file.role}.${file.mimeType === "image/webp" ? "webp" : "png"}`
  );
  await validateOutputPaths(root, [...paths, metadataPath]);
  const outputs = [];
  for (const [index, file] of result.metadata.files.entries()) {
    const path = paths[index];
    if (!path) throw new LocalFileError("input", "Export path is missing.");
    const source = await result.download(file.role, opts.signal);
    outputs.push({
      ...await publish(root, path, source.body, file),
      role: file.role,
      mimeType: file.mimeType
    });
  }
  outputs.push({
    ...await publishJson(root, metadataPath, result.metadata),
    role: "metadata",
    mimeType: "application/json"
  });
  return { assetId, revisionId: result.metadata.revisionId, outputs };
}

// apps/cli/src/batch.ts
async function runBatch(client, fetcher, endpoint, path, action, options) {
  const plan = await preflight(path, void 0, options.receiptPath);
  if (!Number.isInteger(options.maxPolls) || options.maxPolls < 1 || options.maxPolls > 3600)
    throw new LocalFileError("input", "Invalid polling budget.");
  if (action === "select" && (!options.entryId || !options.candidateId))
    throw new LocalFileError("input", "Selection requires exact entry and candidate IDs.");
  const { receiptPath } = plan;
  await client.version(options);
  const { principal } = await client.whoami(options);
  return withReceipt(
    plan.root,
    receiptPath,
    async (store) => {
      await assertManifestHistory(plan.root, plan.manifestIdentity, plan.manifestFingerprint);
      if (store.current) await preflight(path, store.current, receiptPath);
      if (!store.current && action !== "run")
        throw new LocalFileError(
          "conflict",
          "Receipt is missing; specify the original receipt to resume."
        );
      const serverFingerprint = sha2562(
        JSON.stringify([new URL(endpoint).href, principal.studioId])
      );
      const receipt = store.current ?? {
        version: "game-studio-batch/v3",
        manifestFingerprint: plan.manifestFingerprint,
        manifestIdentity: plan.manifestIdentity,
        serverFingerprint,
        project: {
          projectId: plan.manifest.project.mode === "reuse" ? plan.manifest.project.projectId : null
        },
        characters: plan.characters.map((item) => ({
          externalId: item.externalId,
          fingerprint: item.fingerprint,
          mode: item.definition.mode,
          commandKey: item.definition.mode === "create" ? operationKey(
            plan.manifestFingerprint,
            item.externalId,
            "character",
            item.fingerprint
          ) : null,
          characterId: item.definition.mode === "reuse" ? item.definition.characterId : null
        })),
        references: plan.references.map((item) => ({
          externalId: item.externalId,
          fingerprint: item.fingerprint,
          referenceId: null,
          state: "planned"
        })),
        techniqueApplied: false,
        entries: plan.entries.map((entry) => ({
          externalId: entry.externalId,
          fingerprint: entry.fingerprint,
          state: "planned",
          jobId: null,
          contextFingerprint: null,
          candidateId: null,
          assetId: null,
          revisionId: null,
          outputs: [],
          error: null
        }))
      };
      if (receipt.serverFingerprint !== serverFingerprint)
        throw new LocalFileError("conflict", "Receipt belongs to another server or Studio.");
      const save = async () => {
        if (action !== "status") {
          await store.save(receipt);
          options.checkpoint?.(structuredClone(receipt));
        }
      };
      const summary = () => ({
        receiptPath,
        projectId: receipt.project.projectId,
        complete: receipt.entries.every((entry) => entry.state === "exported"),
        entries: receipt.entries
      });
      if (!store.current) await save();
      if (!receipt.project.projectId) {
        if (action === "status") return summary();
        const intent = plan.manifest.project;
        if (intent.mode !== "create")
          throw new LocalFileError("conflict", "Project identity is missing.");
        const project = await client.createProject(
          { ...intent.input, studioId: principal.studioId },
          {
            ...options,
            idempotencyKey: operationKey(
              plan.manifestFingerprint,
              intent.externalId,
              "project",
              plan.manifestFingerprint
            )
          }
        );
        receipt.project.projectId = project.id;
        await save();
      }
      const projectId = receipt.project.projectId;
      await client.project(projectId, options);
      for (const setup2 of action === "run" || action === "resume" ? plan.characters : []) {
        const record = receipt.characters.find((item) => item.externalId === setup2.externalId);
        if (!record || record.fingerprint !== setup2.fingerprint || record.mode !== setup2.definition.mode)
          throw new LocalFileError("conflict", "Character receipt drift.");
        if (!record.characterId) {
          if (setup2.definition.mode !== "create" || !record.commandKey)
            throw new LocalFileError("conflict", "Character identity is missing.");
          record.characterId = (await client.createCharacter(projectId, setup2.definition.input, {
            ...options,
            idempotencyKey: record.commandKey
          })).character.id;
          await save();
        }
        await client.character(projectId, record.characterId, options);
      }
      const setup = plan.manifest.artSettings;
      if (setup && (action === "run" || action === "resume")) {
        const fingerprint2 = sha2562(canonicalizeCreativeValue(setup));
        if (receipt.artSettings && receipt.artSettings.fingerprint !== fingerprint2)
          throw new LocalFileError("conflict", "Art setup intent changed.");
        if (!receipt.artSettings) {
          receipt.artSettings = {
            fingerprint: fingerprint2,
            commandKey: operationKey(
              plan.manifestFingerprint,
              "art-settings",
              "setup",
              fingerprint2
            ),
            revision: null
          };
          await save();
        }
        if (receipt.artSettings.revision === null) {
          const configured = await client.setArtSettings(projectId, setup, {
            ...options,
            idempotencyKey: receipt.artSettings.commandKey
          });
          receipt.artSettings.revision = configured.revision;
          await save();
        }
      }
      const checkArt = async () => {
        const current = await client.artSettings(projectId, options);
        if (receipt.artSettings && current.revision !== receipt.artSettings.revision)
          throw new LocalFileError("conflict", "Art settings changed after batch setup.");
        const missing = [
          ...new Set(
            plan.entries.flatMap((entry) => missingArtSections(entry.input.kind, current.content))
          )
        ];
        if (missing.length)
          throw new LocalFileError("input", `art_settings_required: ${missing.join(", ")}`);
      };
      if (action === "run" || action === "resume") {
        if (receipt.entries.some((entry) => !entry.jobId)) await checkArt();
        for (const reference of plan.references) {
          const record = receipt.references.find(
            (item) => item.externalId === reference.externalId
          );
          if (!record || record.fingerprint !== reference.fingerprint)
            throw new LocalFileError("conflict", "Reference receipt drift.");
          const uploaded = await uploadReference(
            client,
            fetcher,
            projectId,
            reference.input,
            reference.bytes,
            {
              ...options,
              idempotencyKey: operationKey(
                plan.manifestFingerprint,
                reference.externalId,
                "reference",
                reference.fingerprint
              )
            }
          );
          if (record.referenceId && record.referenceId !== uploaded.referenceId)
            throw new LocalFileError("conflict", "Reference identity changed.");
          record.referenceId = uploaded.referenceId;
          record.state = "ready";
          await save();
          if (reference.approve) {
            await client.approveReference(projectId, uploaded.referenceId, options);
            record.state = "approved";
            await save();
          }
        }
        const technique = plan.manifest.bootstrap?.technique;
        if (technique) {
          if (technique.mode === "clear") await client.clearTechnique(projectId, options);
          else {
            const id2 = technique.mode === "reuse" ? technique.referenceId : receipt.references.find((item) => item.externalId === technique.externalId)?.referenceId;
            if (!id2) throw new LocalFileError("conflict", "Technique reference is missing.");
            await client.selectTechnique(projectId, id2, options);
          }
          receipt.techniqueApplied = true;
          await save();
        }
      }
      if (action === "select") {
        const record = receipt.entries.find((item) => item.externalId === options.entryId);
        if (!record?.jobId || record.state !== "awaiting-review")
          throw new LocalFileError("conflict", "Entry is not awaiting review.");
        const detail = await client.candidates(projectId, record.jobId, options);
        const selected = detail.candidates.find((item) => item.id === options.candidateId);
        if (!selected || !["draft", "processing", "ready"].includes(selected.status))
          throw new LocalFileError("conflict", "Candidate is not reviewable.");
        record.candidateId = selected.id;
        await save();
        return summary();
      }
      for (let poll = 0; poll < options.maxPolls; poll++) {
        if (options.signal?.aborted)
          throw new LocalFileError("transient", "Batch interrupted; resume its receipt.");
        let active = 0;
        let waiting = false;
        for (const record of receipt.entries) {
          const entry = plan.entries.find((item) => item.externalId === record.externalId);
          if (!entry || entry.fingerprint !== record.fingerprint)
            throw new LocalFileError("conflict", "Entry receipt drift.");
          if (!record.jobId || record.state === "failed" && record.error?.category !== "authorization")
            continue;
          try {
            const job = await client.job(projectId, record.jobId, options);
            record.error = null;
            if (job.status === "queued" || job.status === "running") {
              active++;
              waiting = true;
              record.state = "awaiting-candidates";
              await save();
              continue;
            }
            if (job.status !== "succeeded") {
              record.state = "failed";
              record.error = { category: "conflict", code: "conflict" };
              await save();
              continue;
            }
            const detail = await client.candidates(projectId, record.jobId, options);
            if (!record.candidateId) {
              const reviewable = detail.candidates.filter((item) => item.status === "draft");
              record.state = reviewable.length ? "awaiting-review" : "failed";
              if (action !== "status" && entry.output.previewPath) {
                for (const candidate of reviewable) {
                  const output = `${entry.output.previewPath.replace(/\.[^./]+$/, "")}.${candidate.id}.png`;
                  const file = await downloadPreview(
                    client,
                    fetcher,
                    projectId,
                    record.jobId,
                    candidate.id,
                    plan.root,
                    output,
                    options
                  );
                  record.outputs = [
                    ...record.outputs.filter((item) => item.path !== file.path),
                    file
                  ];
                  await save();
                }
              }
              await save();
              continue;
            }
            let selected = detail.candidates.find((item) => item.id === record.candidateId);
            if (!selected) throw new LocalFileError("conflict", "Selected candidate is missing.");
            if (selected.status === "draft" && action !== "status") {
              selected = (await client.process(projectId, record.jobId, selected.id, {
                ...options,
                idempotencyKey: operationKey(
                  plan.manifestFingerprint,
                  record.externalId,
                  `process-${selected.id}`,
                  entry.fingerprint
                )
              })).candidate;
              record.state = "processing";
              await save();
            }
            if (selected.status === "processing" || selected.status === "draft") {
              waiting = true;
              continue;
            }
            if (selected.status !== "ready" || selected.outputKind !== "asset-revision" || !selected.outputEntityId || !selected.outputRevisionId)
              throw new LocalFileError("conflict", "Selected processing failed.");
            if (record.revisionId && record.revisionId !== selected.outputRevisionId)
              throw new LocalFileError("conflict", "Accepted revision changed.");
            record.assetId = selected.outputEntityId;
            record.revisionId = selected.outputRevisionId;
            const asset = await client.asset(projectId, record.assetId, options);
            if (asset.acceptedRevisionId !== record.revisionId)
              throw new LocalFileError(
                "conflict",
                "Asset no longer accepts the selected revision."
              );
            let valid = record.state === "exported" && record.outputs.some((item) => item.role === "normal") && record.outputs.some((item) => item.role === "metadata");
            for (const file of record.outputs) {
              try {
                const bytes = await readConfined(plan.root, file.path, 100 * 1024 * 1024);
                valid &&= bytes.length === file.byteSize && sha2562(bytes) === file.checksum;
              } catch {
                valid = false;
              }
            }
            if (valid) continue;
            record.state = "ready";
            await save();
            if (action !== "status") {
              const exported = await exportAsset(
                client,
                projectId,
                record.assetId,
                plan.root,
                entry.output.imagePath,
                entry.output.metadataPath,
                options,
                record.revisionId
              );
              if (exported.revisionId !== record.revisionId)
                throw new LocalFileError("conflict", "Export revision changed.");
              record.outputs = [
                ...record.outputs.filter((item) => item.role === "preview"),
                ...exported.outputs
              ];
              record.state = "exported";
              record.error = null;
              await save();
            }
          } catch (error) {
            if (!(error instanceof AutomationError || error instanceof LocalFileError)) throw error;
            const category = error instanceof AutomationError ? error.result.category : error.category;
            if (category === "authorization") throw error;
            record.state = category === "transient" ? "blocked" : "failed";
            record.error = {
              category,
              code: error instanceof AutomationError ? error.result.problem.code : "conflict"
            };
            await save();
          }
        }
        if (action === "status") return summary();
        for (const record of receipt.entries.filter(
          (item) => !item.jobId && (item.state !== "failed" || item.error?.category === "authorization")
        )) {
          if (active >= plan.manifest.concurrency) {
            waiting = true;
            break;
          }
          const entry = plan.entries.find((item) => item.externalId === record.externalId);
          if (!entry) throw new LocalFileError("conflict", "Entry is missing from manifest.");
          try {
            await checkArt();
            const input2 = entry.input.kind === "character" ? (() => {
              const owner = receipt.characters.find(
                (item) => item.externalId === entry.characterRef
              )?.characterId;
              if (!owner)
                throw new LocalFileError("conflict", "Character identity is missing.");
              return { ...entry.input, characterId: owner };
            })() : entry.input;
            if (input2.kind === "character") {
              const owner = await client.character(projectId, input2.characterId, options);
              if (owner.character.archivedAt)
                throw new LocalFileError("conflict", "Character owner is archived.");
            }
            if (record.contextFingerprint === null) {
              const context = await client.generationContext(
                projectId,
                { operation: input2.kind, selectedReferenceIds: input2.selectedReferenceIds },
                options
              );
              record.contextFingerprint = context.fingerprint;
              await save();
            }
            const result = await client.submit(
              projectId,
              { ...input2, contextFingerprint: record.contextFingerprint },
              {
                ...options,
                idempotencyKey: operationKey(
                  plan.manifestFingerprint,
                  entry.externalId,
                  "submit",
                  entry.fingerprint
                )
              }
            );
            record.jobId = result.job.id;
            record.state = "submitted";
            record.error = null;
            active++;
            waiting = true;
            await save();
          } catch (error) {
            if (!(error instanceof AutomationError || error instanceof LocalFileError)) throw error;
            const category = error instanceof AutomationError ? error.result.category : error.category;
            if (category === "authorization") throw error;
            record.error = {
              category,
              code: error instanceof AutomationError ? error.result.problem.code : "conflict"
            };
            const capacity = error instanceof AutomationError && error.result.problem.code === "generation_limit_reached";
            record.state = capacity || category === "transient" ? "blocked" : "failed";
            await save();
            if (capacity || category === "transient") {
              waiting = true;
              break;
            }
          }
        }
        options.progress?.("reconciled");
        if (!waiting || receipt.entries.every(
          (item) => ["exported", "failed", "awaiting-review"].includes(item.state)
        ))
          return summary();
        if (poll + 1 < options.maxPolls)
          await options.wait(
            Math.round(
              Math.min(1e3 * 2 ** poll, 1e4) * (0.8 + (options.random?.() ?? Math.random()) * 0.4)
            )
          );
      }
      return summary();
    },
    `.game-studio/manifest-${plan.manifestIdentity}`
  );
}

// apps/cli/src/catalog-commands.ts
async function runCatalogCommand(command, values, client, opts) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  const project = () => required("project");
  const mutationOpts = () => ({ ...opts, idempotencyKey: required("idempotency-key") });
  const input2 = () => readJson(required("input"));
  const page4 = Object.fromEntries(
    ["cursor", "limit"].filter((key3) => values[key3] !== void 0).map((key3) => [key3, values[key3]])
  );
  const filters = {
    ...page4,
    ...Object.fromEntries(
      ["state", "search"].filter((key3) => values[key3] !== void 0).map((key3) => [key3, values[key3]])
    )
  };
  if (command === "catalog selectors" && (values["kind"] !== "location" && (values["world"] !== void 0 || values["unplaced"] !== void 0) || values["kind"] !== "item" && values["location"] !== void 0))
    throw new LocalFileError("input", "Filter does not apply to this catalog kind.");
  if (values["world"] && values["unplaced"])
    throw new LocalFileError("input", "Choose --world or --unplaced.");
  const locations = {
    ...filters,
    ...values["world"] ? { worldId: values["world"] } : values["unplaced"] ? { worldId: null } : {}
  };
  const items = { ...filters, ...values["location"] ? { locationId: values["location"] } : {} };
  switch (command) {
    case "catalog import preview":
      return client.previewCatalogImport(project(), await input2(), opts);
    case "catalog import commit":
      return client.commitCatalogImport(project(), await input2(), mutationOpts());
    case "catalog art-assets":
      return client.catalogArtAssets(project(), { kind: required("kind") }, opts);
    case "catalog graphics list":
      return client.catalogGraphics(
        project(),
        { kind: required("kind"), [`${required("kind")}Id`]: required("owner") },
        opts
      );
    case "catalog graphics create":
      return client.createCatalogGraphic(
        project(),
        { kind: required("kind"), [`${required("kind")}Id`]: required("owner") },
        await input2(),
        mutationOpts()
      );
    case "catalog graphics set":
      return client.replaceCatalogGraphic(
        project(),
        required("slot"),
        await input2(),
        mutationOpts()
      );
    case "catalog graphics remove":
      return client.removeCatalogGraphic(
        project(),
        required("slot"),
        await input2(),
        mutationOpts()
      );
    case "catalog graphics bind":
      return client.bindCatalogGraphic(project(), required("slot"), await input2(), mutationOpts());
    case "catalog graphics unbind":
      return client.unbindCatalogGraphic(
        project(),
        required("slot"),
        await input2(),
        mutationOpts()
      );
    case "catalog graphics download": {
      const root = required("output-root");
      const image = required("image");
      const metadataPath = required("metadata");
      await validateOutputPaths(root, [image, metadataPath]);
      const result = await client.downloadCatalogGraphic(project(), required("slot"), opts);
      const metadata = AutomationCatalogDownloadInspectionSchema.parse(result.metadata);
      const source = await result.download(opts.signal);
      const outputs = [
        await publish(root, image, source.body, metadata),
        await publishJson(root, metadataPath, metadata)
      ];
      return {
        slotId: required("slot"),
        assetId: metadata.assetId,
        revisionId: metadata.revisionId,
        outputs
      };
    }
    case "world list":
      return client.worlds(project(), filters, opts);
    case "world get":
      return client.world(project(), required("world"), opts);
    case "world create":
      return client.createWorld(project(), await input2(), mutationOpts());
    case "world set":
      return client.replaceWorld(project(), required("world"), await input2(), mutationOpts());
    case "world archive":
      return client.archiveWorld(project(), required("world"), await input2(), mutationOpts());
    case "world restore":
      return client.restoreWorld(project(), required("world"), await input2(), mutationOpts());
    case "location list":
      return client.locations(project(), locations, opts);
    case "location get":
      return client.location(project(), required("location"), opts);
    case "location create":
      return client.createLocation(project(), await input2(), mutationOpts());
    case "location set":
      return client.replaceLocation(project(), required("location"), await input2(), mutationOpts());
    case "location archive":
      return client.archiveLocation(project(), required("location"), await input2(), mutationOpts());
    case "location restore":
      return client.restoreLocation(project(), required("location"), await input2(), mutationOpts());
    case "item list":
      return client.items(project(), items, opts);
    case "item get":
      return client.item(project(), required("item"), opts);
    case "item create":
      return client.createItem(project(), await input2(), mutationOpts());
    case "item set":
      return client.replaceItem(project(), required("item"), await input2(), mutationOpts());
    case "item archive":
      return client.archiveItem(project(), required("item"), await input2(), mutationOpts());
    case "item restore":
      return client.restoreItem(project(), required("item"), await input2(), mutationOpts());
    case "location place":
      return client.placeLocation(project(), required("location"), await input2(), mutationOpts());
    case "location item list":
      return client.locationItems(project(), required("location"), page4, opts);
    case "location scenes":
      return client.locationScenes(project(), required("location"), page4, opts);
    case "location quests":
      return client.locationQuests(project(), required("location"), page4, opts);
    case "item locations":
      return client.itemLocations(project(), required("item"), page4, opts);
    case "location item add":
      return client.addLocationItem(project(), required("location"), await input2(), mutationOpts());
    case "location item set":
      return client.replaceLocationItem(
        project(),
        required("location"),
        required("link"),
        await input2(),
        mutationOpts()
      );
    case "location item remove":
      return client.removeLocationItem(
        project(),
        required("location"),
        required("link"),
        await input2(),
        mutationOpts()
      );
    case "catalog selectors":
      return client.catalogSelectors(
        project(),
        required("kind"),
        required("kind") === "location" ? locations : required("kind") === "item" ? items : filters,
        opts
      );
    default:
      return void 0;
  }
}

// apps/cli/src/command-examples.ts
var id = "10000000-0000-4000-8000-000000000001";
var target = "10000000-0000-4000-8000-000000000002";
var pin = { assetId: id, revisionId: target, width: 16, height: 16, checksum: "0".repeat(64) };
var composition = {
  kind: "linear",
  track: pin,
  fill: pin,
  bounds: { x: 0, y: 0, width: 1, height: 1 },
  direction: "left-to-right"
};
var commandExamples = {
  "indicator create": { name: "Health", composition },
  "indicator edit": { composition },
  "indicator duplicate": { name: "Health copy" },
  "indicator preview": { value: 0.5 },
  "tileset create": {
    referenceId: id,
    name: "Terrain",
    originX: 0,
    originY: 0,
    cellWidth: 16,
    cellHeight: 16,
    spacingX: 0,
    spacingY: 0,
    columns: 4,
    rows: 4
  },
  "surface geometry set": {
    geometry: { sliceMode: "none", contentInsets: { left: 0, right: 0, top: 0, bottom: 0 } }
  },
  "asset native save": { saveId: target, parentRevisionId: id, documentPath: "native.json" },
  "asset revision upload": {
    saveId: target,
    parentRevisionId: id,
    path: "edited.png",
    mimeType: "image/png",
    checksum: "0".repeat(64)
  },
  "asset native render": {
    manifest: {
      version: "native-pixel-v1",
      width: 1,
      height: 1,
      previewFrameId: id,
      layers: [{ id: target, name: "Base", visible: true, opacity: 1 }],
      frames: [{ id, cells: [{ layerId: target, checksum: "0".repeat(64), byteSize: 70 }] }]
    },
    cells: [{ frameId: id, layerId: target, path: "cell.png" }]
  },
  "generation continue": {},
  "moodboard submit": {
    displayName: "Workshop",
    brief: "A small workshop with a desk and tools.",
    screenPreset: "gameplay",
    candidateCount: 1,
    modelIds: ["eligible/model-id"],
    selectedReferenceIds: [],
    contextFingerprint: "0".repeat(64)
  },
  "style-preview submit": {
    techniqueReferenceId: id,
    mode: "pixel",
    authoringDescription: "Clear silhouettes and warm colors.",
    previewModelId: "eligible/preview-model"
  },
  "style set": {
    recipeSource: { kind: "builtin", styleCode: "pixel-16bit-rpg" },
    mode: "pixel",
    selectedTechniqueStyleReferenceId: null,
    expectedFingerprint: "0".repeat(64),
    fields: Object.fromEntries(
      Object.entries({
        palette: ["#112233"],
        contrast: { min: 0.2, max: 0.8 },
        saturation: { min: 0.2, max: 0.8 },
        detailDensity: 0.5,
        outlineWidth: 1,
        outlineColor: "#112233",
        tileSize: 16,
        antiAliasing: false
      }).map(([key3, value]) => [
        key3,
        { value, provenance: "manual", confidence: null, sourceReferenceIds: [], rule: null }
      ])
    )
  },
  "style technique-upload": { path: "technique.png", mimeType: "image/png" },
  "model list": {
    operation: "character",
    selectedReferenceIds: [],
    contextFingerprint: "0".repeat(64),
    width: 64,
    height: 64
  },
  "model size-policy": { operation: "character" },
  "document create": { title: "Design", type: "gdd", locale: "en", template: true },
  "document set": {
    expectedRevision: 1,
    title: "Design",
    locale: "en",
    sections: [{ id, title: "Vision", markdown: "**Explore** the coast.", sources: [] }]
  },
  "document review": {
    expectedRevision: 1,
    occurrenceId: id,
    displayedFingerprint: "0".repeat(64)
  },
  "document export create": { expectedRevision: 1 },
  "external-document create": {
    title: "Design reference",
    type: "gdd",
    locale: "en",
    url: "https://example.com/design"
  },
  "external-document set": {
    expectedRevision: 1,
    title: "Design reference",
    locale: "en",
    url: "https://example.com/design"
  },
  "catalog import preview": {
    manifest: {
      version: "game-catalog-v1",
      namespace: "game",
      worlds: [{ sourceKey: "world/coast", profile: { name: "Coast" } }]
    },
    selection: { worlds: ["world/coast"], locations: [], items: [], locationItems: [] }
  },
  "catalog import commit": {
    manifest: {
      version: "game-catalog-v1",
      namespace: "game",
      worlds: [{ sourceKey: "world/coast", profile: { name: "Coast" } }]
    },
    selection: { worlds: ["world/coast"], locations: [], items: [], locationItems: [] },
    previewToken: "copy-from-reviewed-preview"
  },
  "catalog graphics create": {
    expectedRevision: 1,
    slot: { title: "Illustration", productionKind: "background" }
  },
  "catalog graphics set": {
    expectedRevision: 2,
    slot: { title: "Illustration", productionKind: "background" }
  },
  "catalog graphics remove": { expectedRevision: 2 },
  "catalog graphics bind": {
    expectedRevision: 2,
    pin: { assetId: id, revisionId: target, checksum: "0".repeat(64) }
  },
  "catalog graphics unbind": { expectedRevision: 3 },
  ...Object.fromEntries(
    ["world", "location", "item"].flatMap((domain) => [
      [`${domain} create`, { name: "Copper coast" }],
      [
        `${domain} set`,
        {
          expectedRevision: 1,
          profile: {
            name: "Copper coast",
            parameters: [{ key: "danger", label: "Danger", type: "number", value: 2 }]
          }
        }
      ]
    ])
  ),
  "location place": { expectedRevision: 1, worldId: id },
  "location item add": { expectedLocationRevision: 1, itemId: id, notes: "Found near the gate" },
  "location item set": { expectedLocationRevision: 1, notes: "Moved to the tower" },
  "location item remove": { expectedLocationRevision: 1 },
  "project create": { studioId: id, name: "Game" },
  "project update": {
    name: "Game",
    description: "**A safe Project brief**",
    targetPlatforms: ["web"]
  },
  "project concept set": {
    expectedRevision: 1,
    content: {
      logline: "A game about discovery",
      audience: null,
      playerFantasy: null,
      coreLoop: null,
      designPillars: []
    }
  },
  "project art-settings set": {
    expectedRevision: 0,
    content: { camera: null, canvas: null, tiles: null, targetEngine: null }
  },
  "character create": { name: "Keeper" },
  "character set": { expectedRevision: 1, profile: { name: "Keeper" }, relationships: [] },
  "mechanic create": { name: "Exploration" },
  "mechanic set": {
    expectedRevision: 1,
    profile: { name: "Exploration", rules: "Find hidden paths", tags: ["movement"] }
  },
  "mechanic influence create": {
    sourceMechanicId: id,
    targetMechanicId: target,
    sourceToTarget: "Provides resources",
    targetToSource: null
  },
  "mechanic influence set": { expectedRevision: 1, aToB: "Provides resources", bToA: null },
  "mechanic influence remove": { expectedRevision: 1, initiatingMechanicId: id },
  "narrative set": {
    expectedRevision: 0,
    outline: {
      premise: "A journey begins",
      themes: "",
      synopsis: "",
      opening: "",
      development: "",
      climax: "",
      resolution: ""
    }
  },
  "narrative structure set": { expectedRevision: 0, items: [] },
  "narrative section archive": { expectedRevision: 1, sectionId: id },
  "narrative section restore": { expectedRevision: 1, sectionId: id },
  "scene create": { name: "Opening", locale: "en" },
  "scene set": {
    expectedRevision: 1,
    metadata: { name: "Opening", locale: "en" },
    entries: [{ id, kind: "description", text: "The door opens." }]
  },
  "quest create": { name: "Rescue" },
  "quest set": {
    expectedRevision: 1,
    content: { metadata: { name: "Rescue" }, root: [], outcomes: [], sceneLinks: [] }
  },
  "quest retained-summaries": { questIds: [id] },
  "reference upload": { path: "reference.png", mimeType: "image/png" },
  "generation context": { operation: "prop", selectedReferenceIds: [] },
  "generation submit": {
    kind: "prop",
    name: "Copper lamp",
    brief: "A copper lamp with a clear silhouette.",
    width: 64,
    height: 64,
    direction: "none",
    candidateCount: 1,
    modelIds: ["eligible/model-id"],
    selectedReferenceIds: [],
    contextFingerprint: "0".repeat(64)
  },
  ...Object.fromEntries(
    [
      "character",
      "mechanic",
      "scene",
      "quest",
      "world",
      "location",
      "item",
      "document",
      "external-document"
    ].flatMap(
      (domain) => ["archive", "restore"].map((action) => [`${domain} ${action}`, { expectedRevision: 1 }])
    )
  )
};

// apps/cli/src/commands.ts
var definitions = [
  ["setup", "", "", "", "", "local"],
  ["init", "", "", "", "", "local"],
  ["asset list", "project", "kind", "", "assets:read", "read"],
  ["asset revisions", "project asset", "revision", "", "assets:read", "read"],
  ["asset accept", "project asset revision", "", "", "projects:write assets:read", "write"],
  [
    "asset download",
    "project asset revision output-root image metadata",
    "",
    "",
    "assets:export",
    "download"
  ],
  [
    "surface geometry set",
    "project asset revision input idempotency-key",
    "",
    "UiSurfaceGeometrySaveRequestSchema",
    "projects:write assets:read",
    "write"
  ],
  [
    "asset native download",
    "project asset revision output-root manifest",
    "",
    "",
    "assets:export",
    "download"
  ],
  [
    "asset native save",
    "project asset input",
    "",
    "NativePixelSaveFileSchema",
    "projects:write assets:read",
    "write"
  ],
  [
    "asset revision upload",
    "project asset input",
    "",
    "RevisionUploadFileSchema",
    "projects:write assets:read",
    "write"
  ],
  [
    "asset native render",
    "input mode output-root image",
    "frame",
    "NativePixelLocalDocumentSchema",
    "",
    "local"
  ],
  ["indicator list", "project", "", "", "assets:read", "read"],
  ["indicator get", "project asset", "", "", "assets:read", "read"],
  ["indicator sources", "project", "search offset", "", "assets:read", "read"],
  [
    "indicator create",
    "project input idempotency-key",
    "",
    "UiIndicatorCreateRequestSchema",
    "projects:write assets:read",
    "write"
  ],
  [
    "indicator edit",
    "project asset revision input idempotency-key",
    "",
    "UiIndicatorEditRequestSchema",
    "projects:write assets:read",
    "write"
  ],
  [
    "indicator duplicate",
    "project asset revision input idempotency-key",
    "",
    "UiIndicatorDuplicateRequestSchema",
    "projects:write assets:read",
    "write"
  ],
  [
    "indicator preview",
    "project asset revision input output-root image",
    "background",
    "AutomationIndicatorPreviewSchema",
    "assets:read",
    "download"
  ],
  ["indicator export", "project asset output-root manifest", "", "", "assets:export", "download"],
  ["tileset detect", "project reference", "", "", "assets:read references:read", "read"],
  [
    "tileset create",
    "project input idempotency-key",
    "",
    "TilesetCreateRequestSchema",
    "projects:write assets:read references:read",
    "write"
  ],
  ["tileset list", "project", "", "", "assets:read", "read"],
  ["tileset get", "project tileset", "", "", "assets:read", "read"],
  [
    "tileset export",
    "project tileset output-root image metadata",
    "",
    "",
    "assets:export",
    "download"
  ],
  [
    "content trash-list",
    "project family",
    "cursor limit",
    "",
    "family read; all: references:read assets:read",
    "read"
  ],
  [
    "content status",
    "project family content",
    "",
    "",
    "family read; dependency details require their read scopes",
    "read"
  ],
  [
    "content trash",
    "project family content idempotency-key",
    "",
    "",
    "reference: references:write; graphics: projects:write assets:read",
    "write"
  ],
  [
    "content restore",
    "project family content idempotency-key",
    "",
    "",
    "reference: references:write; graphics: projects:write assets:read",
    "write"
  ],
  [
    "content purge",
    "project family content confirm idempotency-key",
    "",
    "",
    "reference: references:write; graphics: projects:write assets:read",
    "write"
  ],
  ["activity list", "studio", "recent-limit", "", "generations:read", "read"],
  ["generation form-seed", "project job", "", "", "generations:read", "read"],
  ["generation retry", "project job idempotency-key", "", "", "generations:write", "provider"],
  ["generation clone", "project job idempotency-key", "", "", "generations:write", "provider"],
  [
    "generation continue",
    "project job input idempotency-key",
    "",
    "GenerationContinuationRequestSchema",
    "generations:write",
    "provider"
  ],
  [
    "moodboard submit",
    "project input idempotency-key",
    "",
    "MoodboardCreateRequestSchema",
    "generations:write",
    "provider"
  ],
  [
    "style-preview submit",
    "project input idempotency-key",
    "",
    "StylePreviewCreateRequestSchema",
    "generations:write",
    "provider"
  ],
  ["candidate cancel", "project job candidate", "", "", "generations:write", "write"],
  ["reference get", "project reference", "", "", "references:read", "read"],
  ["reference unapprove", "project reference", "", "", "references:write", "write"],
  [
    "reference download",
    "project reference output-root image metadata",
    "",
    "",
    "references:read",
    "download"
  ],
  ["style built-ins", "", "", "", "references:read", "read"],
  ["style get", "project", "", "", "references:read", "read"],
  [
    "style set",
    "project input idempotency-key",
    "",
    "StyleProfileSaveInputSchema",
    "references:write",
    "write"
  ],
  ["style analyze", "project", "", "", "references:write", "write"],
  [
    "style technique-upload",
    "project input idempotency-key",
    "",
    "ReferenceUploadFile",
    "references:write",
    "write"
  ],
  [
    "model list",
    "project",
    "input",
    "GenerationModelDiscoveryInputSchema",
    "generations:read",
    "read"
  ],
  [
    "model size-policy",
    "project input",
    "",
    "GenerationSizePolicyQuerySchema",
    "generations:read",
    "read"
  ],
  [
    "document list",
    "project",
    "cursor limit state type locale source search sort direction",
    "",
    "projects:read",
    "read"
  ],
  ["document get", "project document", "", "", "projects:read", "read"],
  ["document sources", "project kind", "cursor limit search", "", "projects:read", "read"],
  ["document export list", "project document", "cursor limit", "", "projects:read", "read"],
  [
    "document export download",
    "project document export output-root markdown manifest metadata",
    "",
    "",
    "projects:read",
    "download"
  ],
  ["external-document get", "project document", "", "", "projects:read", "read"],
  [
    "document create",
    "project input idempotency-key",
    "",
    "DocumentCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "document set",
    "project document input idempotency-key",
    "",
    "DocumentReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "document archive",
    "project document input idempotency-key",
    "",
    "DocumentLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "document restore",
    "project document input idempotency-key",
    "",
    "DocumentLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "document review",
    "project document input idempotency-key",
    "",
    "DocumentReviewRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "document export create",
    "project document input idempotency-key",
    "",
    "DocumentExportRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "external-document create",
    "project input idempotency-key",
    "",
    "ExternalDocumentCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "external-document set",
    "project document input idempotency-key",
    "",
    "ExternalDocumentUpdateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "external-document archive",
    "project document input idempotency-key",
    "",
    "DocumentLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "external-document restore",
    "project document input idempotency-key",
    "",
    "DocumentLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "catalog import preview",
    "project input",
    "",
    "GameCatalogImportPreviewRequestSchema",
    "projects:read",
    "read"
  ],
  [
    "catalog import commit",
    "project input idempotency-key",
    "",
    "GameCatalogImportCommitRequestSchema",
    "projects:write",
    "write"
  ],
  ["catalog art-assets", "project kind", "", "", "projects:read assets:read", "read"],
  ["catalog graphics list", "project kind owner", "", "", "projects:read", "read"],
  [
    "catalog graphics create",
    "project kind owner input idempotency-key",
    "",
    "CatalogArtSlotCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "catalog graphics set",
    "project slot input idempotency-key",
    "",
    "CatalogArtSlotReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "catalog graphics remove",
    "project slot input idempotency-key",
    "",
    "CatalogArtSlotRemoveRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "catalog graphics bind",
    "project slot input idempotency-key",
    "",
    "CatalogArtSlotBindRequestSchema",
    "projects:write assets:read",
    "write"
  ],
  [
    "catalog graphics unbind",
    "project slot input idempotency-key",
    "",
    "CatalogArtSlotUnbindRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "catalog graphics download",
    "project slot output-root image metadata",
    "",
    "",
    "projects:read assets:export",
    "download"
  ],
  ["world list", "project", "cursor limit state search", "", "projects:read", "read"],
  ["world get", "project world", "", "", "projects:read", "read"],
  [
    "world create",
    "project input idempotency-key",
    "",
    "WorldCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "world set",
    "project world input idempotency-key",
    "",
    "WorldReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "world archive",
    "project world input idempotency-key",
    "",
    "CatalogLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "world restore",
    "project world input idempotency-key",
    "",
    "CatalogLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "location list",
    "project",
    "cursor limit state search world unplaced",
    "",
    "projects:read",
    "read"
  ],
  ["location get", "project location", "", "", "projects:read", "read"],
  [
    "location create",
    "project input idempotency-key",
    "",
    "LocationCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "location set",
    "project location input idempotency-key",
    "",
    "LocationReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "location archive",
    "project location input idempotency-key",
    "",
    "CatalogLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "location restore",
    "project location input idempotency-key",
    "",
    "CatalogLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  ["item list", "project", "cursor limit state search location", "", "projects:read", "read"],
  ["item get", "project item", "", "", "projects:read", "read"],
  [
    "item create",
    "project input idempotency-key",
    "",
    "ItemCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "item set",
    "project item input idempotency-key",
    "",
    "ItemReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "item archive",
    "project item input idempotency-key",
    "",
    "CatalogLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "item restore",
    "project item input idempotency-key",
    "",
    "CatalogLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "location place",
    "project location input idempotency-key",
    "",
    "LocationPlacementRequestSchema",
    "projects:write",
    "write"
  ],
  ["location scenes", "project location", "cursor limit", "", "projects:read", "read"],
  ["location quests", "project location", "cursor limit", "", "projects:read", "read"],
  ["location item list", "project location", "cursor limit", "", "projects:read", "read"],
  ["item locations", "project item", "cursor limit", "", "projects:read", "read"],
  [
    "location item add",
    "project location input idempotency-key",
    "",
    "LocationItemLinkCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "location item set",
    "project location link input idempotency-key",
    "",
    "LocationItemLinkReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "location item remove",
    "project location link input idempotency-key",
    "",
    "LocationItemLinkRemoveRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "catalog selectors",
    "project kind",
    "cursor limit search world unplaced location",
    "",
    "projects:read",
    "read"
  ],
  ["narrative get", "project", "", "", "projects:read", "read"],
  [
    "narrative set",
    "project input idempotency-key",
    "",
    "NarrativeOutlineSaveRequestSchema",
    "projects:write",
    "write"
  ],
  ["narrative character-selectors", "project", "cursor limit", "", "projects:read", "read"],
  ["narrative structure get", "project", "", "", "projects:read", "read"],
  [
    "narrative structure set",
    "project input idempotency-key",
    "",
    "NarrativeStructureSaveRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "narrative section archive",
    "project input idempotency-key",
    "",
    "NarrativeSectionLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "narrative section restore",
    "project input idempotency-key",
    "",
    "NarrativeSectionLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  ["scene list", "project", "cursor limit state placement location", "", "projects:read", "read"],
  ["scene get", "project scene", "", "", "projects:read", "read"],
  [
    "scene create",
    "project input idempotency-key",
    "",
    "NarrativeSceneCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "scene set",
    "project scene input idempotency-key",
    "",
    "NarrativeSceneReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "scene archive",
    "project scene input idempotency-key",
    "",
    "NarrativeSceneLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "scene restore",
    "project scene input idempotency-key",
    "",
    "NarrativeSceneLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  ["scene quest-usage", "project scene", "cursor limit state", "", "projects:read", "read"],
  [
    "quest list",
    "project",
    "cursor limit state placement location search",
    "",
    "projects:read",
    "read"
  ],
  ["quest get", "project quest", "", "", "projects:read", "read"],
  [
    "quest create",
    "project input idempotency-key",
    "",
    "QuestCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "quest set",
    "project quest input idempotency-key",
    "",
    "QuestReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "quest archive",
    "project quest input idempotency-key",
    "",
    "QuestLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "quest restore",
    "project quest input idempotency-key",
    "",
    "QuestLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "quest retained-summaries",
    "project input",
    "",
    "QuestRetainedSummaryRequestSchema",
    "projects:read",
    "read"
  ],
  ["quest scene-selectors", "project", "cursor limit", "", "projects:read", "read"],
  ["mechanic list", "project", "cursor limit state", "", "projects:read", "read"],
  ["mechanic get", "project mechanic", "", "", "projects:read", "read"],
  ["mechanic selectors", "project mechanic", "cursor limit state", "", "projects:read", "read"],
  [
    "mechanic create",
    "project input idempotency-key",
    "",
    "MechanicCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "mechanic set",
    "project mechanic input idempotency-key",
    "",
    "MechanicReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "mechanic archive",
    "project mechanic input idempotency-key",
    "",
    "MechanicLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "mechanic restore",
    "project mechanic input idempotency-key",
    "",
    "MechanicLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  ["mechanic influence list", "project mechanic", "cursor limit", "", "projects:read", "read"],
  [
    "mechanic influence create",
    "project input idempotency-key",
    "",
    "MechanicInfluenceCreateRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "mechanic influence set",
    "project influence input idempotency-key",
    "",
    "MechanicInfluenceReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "mechanic influence remove",
    "project influence input idempotency-key",
    "",
    "MechanicInfluenceRemoveRequestSchema",
    "projects:write",
    "write"
  ],
  ["auth whoami", "", "", "", "", "read"],
  ["project list", "studio", "trash", "", "projects:read", "read"],
  ["project get", "project", "trash", "", "projects:read", "read"],
  [
    "project update",
    "project input idempotency-key",
    "",
    "ProjectUpdateRequestSchema",
    "projects:write",
    "write"
  ],
  ["project archive", "project idempotency-key", "", "", "projects:write", "write"],
  ["project unarchive", "project idempotency-key", "", "", "projects:write", "write"],
  ["project trash", "project idempotency-key", "", "", "projects:write", "write"],
  ["project restore", "project idempotency-key", "", "", "projects:write", "write"],
  ["project concept get", "project", "", "", "projects:read", "read"],
  [
    "project concept set",
    "project file idempotency-key",
    "",
    "GameConceptSaveRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "project create",
    "input idempotency-key",
    "",
    "ProjectCreateRequestSchema",
    "projects:write",
    "write"
  ],
  ["project art-settings get", "project", "", "", "projects:read", "read"],
  [
    "project art-settings set",
    "project file idempotency-key",
    "",
    "ProjectArtSettingsSaveRequestSchema",
    "projects:write",
    "write"
  ],
  ["character list", "project", "cursor limit state graphics", "", "projects:read", "read"],
  ["character get", "project character", "graphics", "", "projects:read", "read"],
  [
    "character set",
    "project character input idempotency-key",
    "",
    "CharacterReplaceRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "character archive",
    "project character input idempotency-key",
    "",
    "CharacterLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "character restore",
    "project character input idempotency-key",
    "",
    "CharacterLifecycleRequestSchema",
    "projects:write",
    "write"
  ],
  [
    "character create",
    "project input idempotency-key",
    "",
    "CharacterCreateRequestSchema",
    "projects:write",
    "write"
  ],
  ["reference list", "project", "purpose", "", "references:read", "read"],
  [
    "reference upload",
    "project input idempotency-key",
    "",
    "ReferenceUploadFile",
    "references:write",
    "write"
  ],
  ["reference approve", "project reference", "", "", "references:write", "write"],
  ["technique select", "project reference", "", "", "references:write", "write"],
  ["technique clear", "project", "", "", "references:write", "write"],
  [
    "generation context",
    "project input",
    "",
    "GenerationContextRequestSchema",
    "generations:read",
    "read"
  ],
  [
    "generation submit",
    "project input idempotency-key",
    "",
    "AssetCreateRequestSchema",
    "generations:write",
    "provider"
  ],
  ["generation list", "project", "cursor limit kind", "", "generations:read", "read"],
  ["generation status", "project job", "", "", "generations:read", "read"],
  ["generation detail", "project job", "", "", "generations:read", "read"],
  ["generation wait", "project job", "max-polls", "", "generations:read", "read"],
  ["generation cancel", "project job", "", "", "generations:write", "write"],
  ["candidate list", "project job", "", "", "generations:read", "read"],
  ["candidate get", "project job candidate", "", "", "generations:read", "read"],
  [
    "candidate preview",
    "project job candidate output-root image",
    "",
    "",
    "generations:read",
    "download"
  ],
  [
    "candidate process",
    "project job candidate idempotency-key",
    "",
    "",
    "generations:write",
    "write"
  ],
  ["candidate reject", "project job candidate", "", "", "generations:write", "write"],
  ["candidate restore", "project job candidate", "", "", "generations:write", "write"],
  ["asset inspect", "project asset", "", "", "assets:read", "read"],
  [
    "asset export",
    "project asset output-root image metadata",
    "revision",
    "",
    "assets:export",
    "download"
  ],
  ["batch validate", "manifest", "receipt", "AutomationBatchManifestSchema", "", "local"],
  [
    "batch run",
    "manifest",
    "receipt max-polls",
    "AutomationBatchManifestSchema",
    "manifest-dependent",
    "provider"
  ],
  [
    "batch resume",
    "manifest",
    "receipt max-polls",
    "AutomationBatchManifestSchema",
    "manifest-dependent",
    "provider"
  ],
  [
    "batch status",
    "manifest",
    "receipt max-polls",
    "AutomationBatchManifestSchema",
    "manifest-dependent",
    "read"
  ],
  [
    "batch select",
    "manifest entry candidate",
    "receipt max-polls",
    "AutomationBatchManifestSchema",
    "manifest-dependent",
    "write"
  ]
];
var words = (value) => value ? value.split(" ") : [];
var globals = ["json", "ndjson", "help", "endpoint", "token-stdin"];
var commandDefinitions = definitions.map(
  ([path, required, optional, inputContract, scopes, effect]) => ({
    path,
    required: words(required),
    optional: words(optional),
    inputContract: inputContract || null,
    scopes: words(scopes),
    mutation: effect === "write" || effect === "provider",
    providerSpend: effect === "provider",
    localFiles: effect === "download" || effect === "local" || path.startsWith("batch ")
  })
);
function commandHelp(path) {
  const command = commandDefinitions.find((entry) => entry.path === path);
  if (!command) {
    const children = commandDefinitions.filter(
      (entry) => !path || entry.path.startsWith(`${path} `)
    );
    if (!children.length) throw new LocalFileError("input", "Unknown command.");
    return {
      commands: children.map((entry) => entry.path),
      globalOptions: globals,
      exitCodes: AutomationExitCode
    };
  }
  const example = [
    "game-studio",
    path,
    ...command.required.flatMap((key3) => [`--${key3}`, `<${key3}>`]),
    "--json"
  ].join(" ");
  return {
    ...command,
    globalOptions: globals,
    exitCodes: AutomationExitCode,
    example,
    replay: command.required.includes("idempotency-key") ? "Retry unchanged input with the same key to recover the original result. Use a new key for a new intent; read current state separately." : null,
    lifecycle: path === "project list" || path === "project get" ? "--trash discovers retained trashed Projects; normal reads include archived Projects." : null,
    inputExample: commandExamples[path] ?? null,
    inputNotes: path === "generation submit" ? "Use an eligible model and the fingerprint returned by generation context for this Project and reference selection." : path.startsWith("batch ") ? "Manifest example: examples/automation/relic-signal.batch.json" : path === "reference upload" || path === "style technique-upload" ? "Image path is relative to the input JSON file." : null,
    pagination: path === "generation list" ? {
      cursor: "ISO datetime",
      defaultLimit: 20,
      maxLimit: 50,
      kinds: GenerationKindSchema.options
    } : command.optional.includes("cursor") ? {
      cursor: "opaque",
      defaultLimit: /^(character|mechanic) /.test(path) ? 50 : 25,
      maxLimit: 100,
      filters: command.optional.filter((option) => !["cursor", "limit"].includes(option)),
      ...command.optional.includes("state") ? { states: ["active", "archived"] } : {}
    } : path.endsWith(" list") ? { paged: false } : null,
    output: "game-studio-automation/v1; stable entity IDs; page nextCursor where applicable; private media URLs omitted"
  };
}
function validateCommand(path, values) {
  const command = commandDefinitions.find((entry) => entry.path === path);
  if (!command) throw new LocalFileError("input", "Unknown command.");
  const allowed = /* @__PURE__ */ new Set([...globals, ...command.required, ...command.optional]);
  for (const key3 of Object.keys(values))
    if (!allowed.has(key3)) throw new LocalFileError("input", `Unsupported option --${key3}.`);
  if (values["help"]) return;
  for (const key3 of command.required)
    if (!values[key3]) throw new LocalFileError("input", `Required option --${key3} is missing.`);
  for (const key3 of [
    "studio",
    "project",
    "character",
    "reference",
    "job",
    "candidate",
    "asset",
    "revision",
    "mechanic",
    "influence",
    "scene",
    "quest",
    "location",
    "world",
    "item",
    "link",
    "slot",
    "owner",
    "document",
    "export",
    "content",
    "tileset"
  ])
    if (values[key3] !== void 0 && !UuidSchema.safeParse(values[key3]).success)
      throw new LocalFileError("input", `Invalid --${key3} identity.`);
  const polls = values["max-polls"];
  if (path === "content purge" && values["confirm"] !== values["content"])
    throw new LocalFileError("input", "Purge confirmation must match the exact content ID.");
  if (polls !== void 0 && (typeof polls !== "string" || !/^[1-9]\d*$/.test(polls) || !Number.isSafeInteger(Number(polls))))
    throw new LocalFileError("input", "Invalid --max-polls.");
}

// apps/cli/src/creative-commands.ts
async function runCreativeCommand(command, values, client, opts) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  const project = () => required("project");
  const inspectStyle = ({ customSummary, ...profile }) => ({
    ...profile,
    ...customSummary ? {
      customSummary: {
        sourceStatus: customSummary.sourceStatus,
        comparisonSceneVersion: customSummary.comparisonSceneVersion
      }
    } : {}
  });
  switch (command) {
    case "reference get":
      return client.reference(project(), required("reference"), opts);
    case "reference unapprove": {
      const { previewUrl: _url, ...reference } = await client.unapproveReference(
        project(),
        required("reference"),
        opts
      );
      return reference;
    }
    case "reference download": {
      const root = required("output-root");
      const image = required("image");
      const metadata = required("metadata");
      if (image === metadata || image.startsWith(`${metadata}/`) || metadata.startsWith(`${image}/`))
        throw new LocalFileError("input", "Download paths must be distinct files.");
      await confinedPath(root, image);
      await confinedPath(root, metadata);
      const result = await client.downloadReference(project(), required("reference"), opts);
      const source = await result.download(opts.signal);
      const outputs = [
        await publish(root, image, source.body, result.metadata),
        await publishJson(root, metadata, result.metadata)
      ];
      return { referenceId: result.metadata.referenceId, outputs };
    }
    case "style built-ins":
      return client.builtInStyles(opts);
    case "style get":
      return inspectStyle(await client.style(project(), opts));
    case "style set":
      return inspectStyle(
        await client.saveStyle(project(), await readJson(required("input")), {
          ...opts,
          idempotencyKey: required("idempotency-key")
        })
      );
    case "style analyze":
      return inspectStyle(await client.analyzeStyle(project(), opts));
    case "model list":
      return client.models(
        project(),
        values["input"] ? await readJson(required("input")) : {},
        opts
      );
    case "model size-policy":
      return client.modelSizePolicy(project(), await readJson(required("input")), opts);
    default:
      return void 0;
  }
}

// apps/cli/src/document-commands.ts
async function runDocumentCommand(command, values, client, opts) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  const project = () => required("project");
  const input2 = () => readJson(required("input"));
  const mutationOpts = () => ({ ...opts, idempotencyKey: required("idempotency-key") });
  const select = (keys) => Object.fromEntries(
    keys.filter((key3) => values[key3] !== void 0).map((key3) => [key3, values[key3]])
  );
  const page4 = select(["cursor", "limit"]);
  const filters = {
    ...page4,
    ...select(["state", "type", "locale", "source", "search", "sort", "direction"])
  };
  switch (command) {
    case "document list":
      return client.documents(project(), filters, opts);
    case "document get":
      return client.document(project(), required("document"), opts);
    case "document sources":
      return client.documentSources(
        project(),
        {
          ...page4,
          kind: required("kind"),
          ...values["search"] ? { search: values["search"] } : {}
        },
        opts
      );
    case "document export list":
      return client.documentExports(project(), required("document"), page4, opts);
    case "external-document get":
      return client.externalDocument(project(), required("document"), opts);
    case "document create":
      return client.createDocument(project(), await input2(), mutationOpts());
    case "document set":
      return client.replaceDocument(project(), required("document"), await input2(), mutationOpts());
    case "document archive":
      return client.archiveDocument(project(), required("document"), await input2(), mutationOpts());
    case "document restore":
      return client.restoreDocument(project(), required("document"), await input2(), mutationOpts());
    case "document review":
      return client.reviewDocument(project(), required("document"), await input2(), mutationOpts());
    case "document export create":
      return client.exportDocument(project(), required("document"), await input2(), mutationOpts());
    case "external-document create":
      return client.createExternalDocument(project(), await input2(), mutationOpts());
    case "external-document set":
      return client.updateExternalDocument(
        project(),
        required("document"),
        await input2(),
        mutationOpts()
      );
    case "external-document archive":
      return client.archiveExternalDocument(
        project(),
        required("document"),
        await input2(),
        mutationOpts()
      );
    case "external-document restore":
      return client.restoreExternalDocument(
        project(),
        required("document"),
        await input2(),
        mutationOpts()
      );
    case "document export download": {
      const root = required("output-root");
      const paths = [required("markdown"), required("manifest"), required("metadata")];
      await validateOutputPaths(root, paths);
      const result = await client.downloadDocumentExport(
        project(),
        required("document"),
        required("export"),
        opts
      );
      const outputs = [];
      for (const file of result.metadata.files) {
        const path = required(file.role);
        const source = await result.download(file.role);
        outputs.push({
          ...await publish(root, path, source.body, file),
          role: file.role,
          mimeType: file.mimeType
        });
      }
      outputs.push({
        ...await publishJson(root, required("metadata"), result.metadata),
        role: "metadata",
        mimeType: "application/json"
      });
      return {
        documentId: result.metadata.documentId,
        exportId: result.metadata.exportId,
        outputs
      };
    }
    default:
      return void 0;
  }
}

// apps/cli/src/native-files.ts
import { dirname as dirname3, resolve as resolve3 } from "node:path";

// packages/image-processing/src/native-pixel-document.ts
function assertPixelBudget(width, height, layers, frames) {
  if (![width, height, layers, frames].every((value) => Number.isSafeInteger(value) && value > 0) || width > 8192 || height > 8192 || layers > NATIVE_PIXEL_MAX_LAYERS || frames > NATIVE_PIXEL_MAX_FRAMES || width * height * 4 * layers * frames > NATIVE_PIXEL_MAX_BYTES)
    throw new Error("pixel_document_limit");
}
function assertPixelDocument(doc) {
  assertPixelBudget(doc.width, doc.height, doc.layers.length, doc.frames.length);
  const layerIds = new Set(doc.layers.map((layer) => NativePixelLayerSchema.parse(layer).id));
  if (layerIds.size !== doc.layers.length || new Set(doc.frames.map(({ id: id2 }) => id2)).size !== doc.frames.length)
    throw new Error("pixel_document_identity");
  for (const frame of doc.frames) {
    UuidSchema.parse(frame.id);
    if (Object.keys(frame.cells).length !== layerIds.size) throw new Error("pixel_document_cells");
    for (const id2 of layerIds) {
      const cell = frame.cells[id2];
      if (!(cell instanceof Uint8Array) || cell.byteLength !== doc.width * doc.height * 4)
        throw new Error("pixel_document_cells");
    }
  }
}
function composePixelFrame(doc, frameId) {
  assertPixelDocument(doc);
  const frame = doc.frames.find(({ id: id2 }) => id2 === frameId);
  if (!frame) throw new Error("pixel_document_identity");
  const data = new Uint8Array(doc.width * doc.height * 4);
  for (const layer of doc.layers) {
    if (!layer.visible || layer.opacity === 0) continue;
    const pixels = frame.cells[layer.id];
    for (let offset = 0; offset < data.length; offset += 4)
      sourceOver(data, offset, pixels, offset, layer.opacity);
  }
  return { width: doc.width, height: doc.height, data };
}
function composePixelSheet(doc) {
  assertPixelDocument(doc);
  const width = doc.width * doc.frames.length;
  const data = new Uint8Array(width * doc.height * 4);
  doc.frames.forEach((frame, index) => {
    const pixels = composePixelFrame(doc, frame.id).data;
    for (let y = 0; y < doc.height; y += 1)
      data.set(
        pixels.subarray(y * doc.width * 4, (y + 1) * doc.width * 4),
        (y * width + index * doc.width) * 4
      );
  });
  return { width, height: doc.height, data };
}
function sourceOver(target2, at, source, from, opacity = 1) {
  const alpha = (source[from + 3] ?? 0) / 255 * opacity;
  if (alpha === 0) return;
  const retained = (target2[at + 3] ?? 0) / 255 * (1 - alpha);
  const outputAlpha = alpha + retained;
  for (let channel = 0; channel < 3; channel += 1)
    target2[at + channel] = Math.round(
      ((source[from + channel] ?? 0) * alpha + (target2[at + channel] ?? 0) * retained) / outputAlpha
    );
  target2[at + 3] = Math.round(outputAlpha * 255);
}

// apps/cli/src/native-files.ts
import sharp from "sharp";
async function readNative(path) {
  const document = NativePixelLocalDocumentSchema.parse(await readJson(path));
  const root = dirname3(resolve3(path));
  const encoded = /* @__PURE__ */ new Map();
  const frames = [];
  for (const frame of document.manifest.frames) {
    const cells = {};
    for (const cell of frame.cells) {
      const local = document.cells.find(
        (file) => file.frameId === frame.id && file.layerId === cell.layerId
      );
      if (!local) throw new LocalFileError("input", "Native cell is missing.");
      const bytes = await readConfined(root, local.path, cell.byteSize);
      if (bytes.length !== cell.byteSize || sha2562(bytes) !== cell.checksum)
        throw new LocalFileError("input", "Native cell checksum mismatch.");
      try {
        const image = sharp(bytes, {
          limitInputPixels: document.manifest.width * document.manifest.height
        });
        const metadata = await image.metadata();
        if (metadata.format !== "png" || metadata.width !== document.manifest.width || metadata.height !== document.manifest.height)
          throw new Error("Invalid image");
        cells[cell.layerId] = new Uint8Array(await image.ensureAlpha().raw().toBuffer());
      } catch {
        throw new LocalFileError("input", "Native cell image is invalid.");
      }
      encoded.set(`${frame.id}/${cell.layerId}`, bytes);
    }
    frames.push({ id: frame.id, cells });
  }
  return {
    document,
    encoded,
    pixels: {
      width: document.manifest.width,
      height: document.manifest.height,
      layers: document.manifest.layers,
      frames
    }
  };
}
async function saveNative(client, fetcher, projectId, assetId, path, opts) {
  const file = NativePixelSaveFileSchema.parse(await readJson(path));
  const source = await confinedPath(dirname3(resolve3(path)), file.documentPath);
  const { document, encoded } = await readNative(source);
  const request = {
    saveId: file.saveId,
    parentRevisionId: file.parentRevisionId,
    manifest: document.manifest
  };
  const initialized = await client.initializeNativeRevision(projectId, assetId, request, opts);
  if (initialized.revisionId !== file.saveId)
    throw new LocalFileError("conflict", "Save identity changed.");
  if (!initialized.complete) {
    const received = new Set(initialized.cells.map((cell) => `${cell.frameId}/${cell.layerId}`));
    if (received.size !== encoded.size || received.size !== initialized.cells.length || [...received].some((id2) => !encoded.has(id2)))
      throw new LocalFileError("conflict", "Upload cells changed.");
    for (const cell of initialized.cells) {
      const bytes = encoded.get(`${cell.frameId}/${cell.layerId}`);
      if (!bytes) throw new LocalFileError("input", "Native cell is missing.");
      const response = await fetcher(cell.uploadUrl, {
        method: "PUT",
        body: new Uint8Array(bytes),
        headers: cell.requiredHeaders,
        credentials: "omit",
        redirect: "error",
        signal: AbortSignal.any([
          AbortSignal.timeout(3e4),
          ...opts.signal ? [opts.signal] : []
        ])
      }).catch(() => {
        throw new LocalFileError(
          "transient",
          "Native upload interrupted; retry the same save identity."
        );
      });
      await response.body?.cancel();
      if (!response.ok)
        throw new LocalFileError(
          "transient",
          "Native upload failed; retry the same save identity."
        );
    }
    const completed = await client.completeNativeRevision(projectId, assetId, request, opts);
    if (completed.revisionId !== file.saveId)
      throw new LocalFileError("conflict", "Completed save identity changed.");
  }
  return { assetId, revisionId: file.saveId };
}
async function downloadNative(client, projectId, assetId, revisionId, root, manifestPath, opts) {
  await confinedPath(root, manifestPath);
  const downloaded = await client.downloadNativeRevision(projectId, assetId, revisionId, opts);
  const cells = downloaded.metadata.files.map((file) => ({
    frameId: file.frameId,
    layerId: file.layerId,
    path: `native/${revisionId}/${file.role}.png`
  }));
  const prefix = dirname3(manifestPath) === "." ? "" : `${dirname3(manifestPath)}/`;
  await validateOutputPaths(root, [manifestPath, ...cells.map((cell) => `${prefix}${cell.path}`)]);
  const outputs = [];
  for (const [index, file] of downloaded.metadata.files.entries()) {
    const cell = cells[index];
    if (!cell) throw new LocalFileError("conflict", "Native cell descriptor is missing.");
    const source = await downloaded.download(file.role, opts.signal);
    outputs.push(await publish(root, `${prefix}${cell.path}`, source.body, file));
  }
  outputs.push(
    await publishJson(root, manifestPath, { manifest: downloaded.metadata.manifest, cells })
  );
  return { assetId, revisionId, outputs };
}
async function renderNative(path, mode, frameId, root, imagePath) {
  if (!["frame", "sheet"].includes(mode) || mode === "sheet" && frameId)
    throw new LocalFileError("input", "Choose frame or sheet rendering.");
  await confinedPath(root, imagePath);
  const { document, pixels } = await readNative(path);
  const selectedFrame = frameId ?? document.manifest.previewFrameId;
  if (mode === "frame" && !pixels.frames.some((frame) => frame.id === selectedFrame))
    throw new LocalFileError("input", "Frame does not belong to the document.");
  const image = mode === "sheet" ? composePixelSheet(pixels) : composePixelFrame(pixels, selectedFrame);
  const bytes = await sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 4 }
  }).png().toBuffer();
  const file = { checksum: sha2562(bytes), byteSize: bytes.length };
  const output = await publish(
    root,
    imagePath,
    new ReadableStream({
      start(controller2) {
        controller2.enqueue(bytes);
        controller2.close();
      }
    }),
    file
  );
  return { mode, width: image.width, height: image.height, output };
}

// apps/cli/src/raster-files.ts
import { dirname as dirname4, resolve as resolve4 } from "node:path";
import sharp2 from "sharp";
async function saveRaster(client, fetcher, projectId, assetId, path, opts) {
  const { path: source, ...file } = RevisionUploadFileSchema.parse(await readJson(path));
  const bytes = await readConfined(dirname4(resolve4(path)), source, 25 * 1024 * 1024);
  if (sha2562(bytes) !== file.checksum)
    throw new LocalFileError("input", "Raster checksum mismatch.");
  try {
    const image = sharp2(bytes, { limitInputPixels: 1e8 });
    const metadata = await image.metadata();
    if (!["png", "webp"].includes(metadata.format ?? "") || `image/${metadata.format}` !== file.mimeType)
      throw new Error("Invalid MIME");
    await image.raw().toBuffer();
  } catch {
    throw new LocalFileError("input", "Raster image is invalid.");
  }
  const initialized = await client.initializeRasterRevision(
    projectId,
    assetId,
    { ...file, byteSize: bytes.length },
    opts
  );
  if (initialized.revisionId !== file.saveId)
    throw new LocalFileError("conflict", "Save identity changed.");
  if (!initialized.complete) {
    const response = await fetcher(initialized.uploadUrl, {
      method: "PUT",
      body: new Uint8Array(bytes),
      headers: initialized.requiredHeaders,
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.any([AbortSignal.timeout(3e4), ...opts.signal ? [opts.signal] : []])
    }).catch(() => {
      throw new LocalFileError(
        "transient",
        "Raster upload interrupted; retry the same save identity."
      );
    });
    await response.body?.cancel();
    if (!response.ok)
      throw new LocalFileError("transient", "Raster upload failed; retry the same save identity.");
    const completed = await client.completeRasterRevision(
      projectId,
      assetId,
      file.saveId,
      { parentRevisionId: file.parentRevisionId },
      opts
    );
    if (completed.id !== file.saveId)
      throw new LocalFileError("conflict", "Completed save identity changed.");
  }
  return { assetId, revisionId: file.saveId };
}

// apps/cli/src/graphics-commands.ts
async function runGraphicsCommand(command, values, client, opts, fetcher) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  const project = () => required("project");
  const asset = () => required("asset");
  const revision2 = () => required("revision");
  switch (command) {
    case "asset revision upload":
      return saveRaster(client, fetcher, project(), asset(), required("input"), opts);
    case "asset list":
      return client.assetLibrary(project(), values["kind"] ? { kind: values["kind"] } : {}, opts);
    case "asset revisions":
      return values["revision"] ? client.assetRevision(project(), asset(), revision2(), opts) : client.assetRevisions(project(), asset(), opts);
    case "asset accept":
      return client.acceptAssetRevision(project(), asset(), revision2(), opts);
    case "surface geometry set":
      return client.saveSurfaceGeometry(
        project(),
        asset(),
        revision2(),
        await readJson(required("input")),
        { ...opts, idempotencyKey: required("idempotency-key") }
      );
    case "asset native save":
      return saveNative(client, fetcher, project(), asset(), required("input"), opts);
    case "asset native download":
      return downloadNative(
        client,
        project(),
        asset(),
        revision2(),
        required("output-root"),
        required("manifest"),
        opts
      );
    case "asset download": {
      const root = required("output-root");
      const image = required("image");
      const metadata = required("metadata");
      await validateOutputPaths(root, [image, metadata]);
      const result = await client.downloadAssetRevision(project(), asset(), revision2(), opts);
      const paths = result.metadata.files.map(
        (file) => file.role === "normal" ? image : `${image.replace(/\.[^./]+$/, "")}.${file.role}.${file.mimeType === "image/webp" ? "webp" : "png"}`
      );
      await validateOutputPaths(root, [...paths, metadata]);
      const outputs = [];
      for (const [index, file] of result.metadata.files.entries()) {
        const path = paths[index];
        if (!path) throw new LocalFileError("input", "Missing file path.");
        await confinedPath(root, path);
        const source = await result.download(file.role, opts.signal);
        outputs.push({ role: file.role, ...await publish(root, path, source.body, file) });
      }
      outputs.push({ role: "metadata", ...await publishJson(root, metadata, result.metadata) });
      return { assetId: asset(), revisionId: revision2(), outputs };
    }
    default:
      return void 0;
  }
}

// apps/cli/src/indicator-commands.ts
import { basename as basename2, dirname as dirname5, resolve as resolve5 } from "node:path";
import sharp3 from "sharp";
async function runIndicatorCommand(command, values, client, opts) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  const project = () => required("project");
  const asset = () => required("asset");
  const revision2 = () => required("revision");
  const mutation = () => ({ ...opts, idempotencyKey: required("idempotency-key") });
  switch (command) {
    case "indicator list":
      return client.assetLibrary(project(), { kind: "ui-indicator" }, opts);
    case "indicator get":
      return client.indicator(project(), asset(), opts);
    case "indicator sources":
      return client.indicatorSources(
        project(),
        { search: values["search"], offset: values["offset"] },
        opts
      );
    case "indicator create":
      return client.createIndicator(project(), await readJson(required("input")), mutation());
    case "indicator edit":
      return client.editIndicator(
        project(),
        asset(),
        revision2(),
        await readJson(required("input")),
        mutation()
      );
    case "indicator duplicate":
      return client.duplicateIndicator(
        project(),
        asset(),
        revision2(),
        await readJson(required("input")),
        mutation()
      );
    case "indicator preview": {
      const root = required("output-root");
      const path = required("image");
      await confinedPath(root, path);
      let background;
      if (values["background"]) {
        const source = resolve5(required("background"));
        background = await readConfined(dirname5(source), basename2(source), 25 * 1024 * 1024);
        await sharp3(background, { limitInputPixels: 1e8 }).metadata();
      }
      let bytes = await client.previewIndicator(
        project(),
        asset(),
        revision2(),
        await readJson(required("input")),
        opts
      );
      if (background)
        bytes = new Uint8Array(
          await sharp3(background, { limitInputPixels: 1e8 }).composite([{ input: Buffer.from(bytes), gravity: "centre" }]).png().toBuffer()
        );
      const file = { byteSize: bytes.length, checksum: sha2562(bytes) };
      return {
        assetId: asset(),
        revisionId: revision2(),
        output: await publish(
          root,
          path,
          new ReadableStream({
            start(controller2) {
              controller2.enqueue(bytes);
              controller2.close();
            }
          }),
          file
        )
      };
    }
    case "indicator export": {
      const root = required("output-root");
      const manifest = required("manifest");
      await confinedPath(root, manifest);
      const result = await client.exportIndicator(project(), asset(), opts);
      const paths = result.metadata.files.map(
        (file) => `indicator/${result.metadata.revisionId}/${file.role}.${file.mimeType === "image/webp" ? "webp" : "png"}`
      );
      await validateOutputPaths(root, [manifest, ...paths]);
      const outputs = [];
      for (const [index, file] of result.metadata.files.entries()) {
        const path = paths[index];
        if (!path) throw new LocalFileError("conflict", "Missing layer path.");
        const source = await result.download(file.role, opts.signal);
        outputs.push({ role: file.role, ...await publish(root, path, source.body, file) });
      }
      outputs.push({ role: "manifest", ...await publishJson(root, manifest, result.metadata) });
      return { assetId: asset(), revisionId: result.metadata.revisionId, outputs };
    }
    default:
      return void 0;
  }
}

// apps/cli/src/lifecycle-commands.ts
async function runLifecycleCommand(command, values, client, opts) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  switch (command) {
    case "content trash-list":
      return client.contentTrash(
        required("project"),
        { family: required("family"), cursor: values["cursor"], limit: values["limit"] },
        opts
      );
    case "content status":
      return client.contentStatus(
        required("project"),
        required("family"),
        required("content"),
        opts
      );
    case "content trash":
    case "content restore":
    case "content purge": {
      const operation = command === "content trash" ? "trash" : command === "content restore" ? "restore" : "purge";
      const id2 = required("content");
      if (operation === "purge" && required("confirm") !== id2)
        throw new LocalFileError("input", "Purge confirmation must match the exact content ID.");
      return client.contentCommand(
        required("project"),
        required("family"),
        id2,
        operation,
        { idempotencyKey: required("idempotency-key") },
        opts
      );
    }
    default:
      return void 0;
  }
}

// apps/cli/src/project-environment.ts
import { constants as constants2 } from "node:fs";
import { lstat as lstat2, open as open3 } from "node:fs/promises";
import { join as join2 } from "node:path";
import { parseEnv } from "node:util";
var agentEnvironmentTemplate = "GAME_STUDIO_TOKEN=\n";
var defaultStudioEndpoint = "https://studio.lumenarium.biz";
var maxBytes = 64 * 1024;
async function projectFile(root, name, create) {
  const path = join2(root, name);
  const info = await lstat2(path).catch((error) => {
    if (error.code === "ENOENT") return void 0;
    throw error;
  });
  if (info && !info.isFile()) throw new Error("Expected regular project file");
  const flags = create ? constants2.O_RDWR | constants2.O_CREAT | constants2.O_APPEND : constants2.O_RDONLY;
  const handle = await open3(
    path,
    flags | (constants2.O_NOFOLLOW ?? 0),
    name === ".env" ? 384 : 420
  );
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > maxBytes) throw new Error("Invalid project file");
    const content = await handle.readFile("utf8");
    return { handle, content };
  } catch (error) {
    await handle.close();
    throw error;
  }
}
async function initializeProject(root) {
  try {
    const ignore = await projectFile(root, ".gitignore", true);
    try {
      const lastRule = ignore.content.split(/\r?\n/).filter((line) => line && !line.startsWith("#")).at(-1);
      if (lastRule !== ".env" && lastRule !== "/.env")
        await ignore.handle.writeFile(
          `${ignore.content.endsWith("\n") || !ignore.content ? "" : "\n"}/.env
`
        );
    } finally {
      await ignore.handle.close();
    }
    const env = await projectFile(root, ".env", true);
    try {
      if (!Object.hasOwn(parseEnv(env.content), "GAME_STUDIO_TOKEN"))
        await env.handle.writeFile(
          `${env.content.endsWith("\n") || !env.content ? "" : "\n"}${agentEnvironmentTemplate}`
        );
    } finally {
      await env.handle.close();
    }
    return {
      environmentFile: ".env",
      tokenVariable: "GAME_STUDIO_TOKEN",
      endpoint: defaultStudioEndpoint
    };
  } catch {
    throw new LocalFileError(
      "input",
      "Could not initialize .env and .gitignore. Use regular writable files smaller than 64 KiB."
    );
  }
}
async function projectToken(explicitToken, root) {
  if (explicitToken !== void 0 || root === void 0) return explicitToken;
  try {
    const env = await projectFile(root, ".env", false);
    try {
      return parseEnv(env.content)["GAME_STUDIO_TOKEN"];
    } finally {
      await env.handle.close();
    }
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw new LocalFileError(
      "input",
      "Could not read the project .env. Use a regular readable file smaller than 64 KiB."
    );
  }
}

// apps/cli/src/setup.ts
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname as dirname6, join as join3 } from "node:path";
import { fileURLToPath } from "node:url";
import { z as z57 } from "zod/v4";
var PackageSchema = z57.object({
  name: z57.literal("@lumenarium/game-studio-skills"),
  version: z57.string()
});
async function setupProject(root, io) {
  const source = fileURLToPath(new URL("../package.json", import.meta.url));
  const manifest = PackageSchema.parse(JSON.parse(await readFile(source, "utf8")));
  const installed = join3(root, "node_modules", manifest.name);
  const env = {
    ...process.env,
    ...io.env,
    DISABLE_TELEMETRY: "1",
    DO_NOT_TRACK: "1"
  };
  delete env["GAME_STUDIO_TOKEN"];
  delete env["GAME_STUDIO_ENDPOINT"];
  const execute = (args, quiet = false) => new Promise((resolve7, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      ...io.signal ? { signal: io.signal } : {}
    });
    child.stdout.on("data", (chunk) => {
      if (!quiet) io.stderr(String(chunk));
    });
    child.stderr.on("data", (chunk) => io.stderr(String(chunk)));
    child.once(
      "error",
      () => reject(new LocalFileError("input", "Could not start installation. Run setup with npx."))
    );
    child.once(
      "close",
      (code) => code === 0 ? resolve7() : reject(
        new LocalFileError(
          "input",
          "Installation failed. Resolve the reported npm or skill installation error and rerun setup."
        )
      )
    );
  });
  const current = await readFile(join3(installed, "package.json"), "utf8").then(
    (text) => PackageSchema.safeParse(JSON.parse(text)),
    () => void 0
  );
  if (!current?.success || current.data.version !== manifest.version) {
    const npm = io.env["npm_execpath"];
    if (!npm)
      throw new LocalFileError(
        "input",
        "Run npx @lumenarium/game-studio-skills@latest setup in your game project."
      );
    await execute([
      npm,
      "install",
      "--save-dev",
      "--save-exact",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      `${manifest.name}@${manifest.version}`
    ]);
  }
  await execute([join3(installed, "bin/game-studio.js"), "init"], true);
  const require2 = createRequire(join3(installed, "package.json"));
  const skills = join3(dirname6(require2.resolve("skills/package.json")), "bin/cli.mjs");
  await execute([
    skills,
    "add",
    installed,
    "--skill",
    "*",
    "--agent",
    "codex",
    "claude-code",
    "--yes",
    "--copy"
  ]);
  return { installed: true, agents: ["codex", "claude-code"], environmentFile: ".env" };
}

// apps/cli/src/story-commands.ts
async function runStoryCommand(command, values, client, opts) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  const project = () => required("project");
  const mutationOpts = () => ({ ...opts, idempotencyKey: required("idempotency-key") });
  const input2 = () => readJson(
    required("input"),
    command.startsWith("narrative ") || command.startsWith("scene ") ? NARRATIVE_WRITE_BODY_LIMIT : void 0
  );
  const page4 = {
    ...values["cursor"] !== void 0 ? { cursor: values["cursor"] } : {},
    ...values["limit"] !== void 0 ? { limit: values["limit"] } : {}
  };
  const state = { ...page4, ...values["state"] !== void 0 ? { state: values["state"] } : {} };
  const discovery = {
    ...state,
    ...values["placement"] !== void 0 ? { placement: values["placement"] } : {},
    ...values["location"] !== void 0 ? { primaryLocationId: values["location"] } : {}
  };
  switch (command) {
    case "narrative get":
      return client.narrative(project(), opts);
    case "narrative set":
      return client.setNarrative(project(), await input2(), mutationOpts());
    case "narrative character-selectors":
      return client.narrativeCharacters(project(), page4, opts);
    case "narrative structure get":
      return client.narrativeStructure(project(), opts);
    case "narrative structure set":
      return client.setNarrativeStructure(project(), await input2(), mutationOpts());
    case "narrative section archive":
      return client.archiveNarrativeSection(project(), await input2(), mutationOpts());
    case "narrative section restore":
      return client.restoreNarrativeSection(project(), await input2(), mutationOpts());
    case "scene list":
      return client.scenes(project(), discovery, opts);
    case "scene get":
      return client.scene(project(), required("scene"), opts);
    case "scene create":
      return client.createScene(project(), await input2(), mutationOpts());
    case "scene set":
      return client.replaceScene(project(), required("scene"), await input2(), mutationOpts());
    case "scene archive":
      return client.archiveScene(project(), required("scene"), await input2(), mutationOpts());
    case "scene restore":
      return client.restoreScene(project(), required("scene"), await input2(), mutationOpts());
    case "scene quest-usage":
      return client.sceneQuestUsage(project(), required("scene"), state, opts);
    case "quest list":
      return client.quests(
        project(),
        { ...discovery, ...values["search"] !== void 0 ? { search: values["search"] } : {} },
        opts
      );
    case "quest get":
      return client.quest(project(), required("quest"), opts);
    case "quest create":
      return client.createQuest(project(), await input2(), mutationOpts());
    case "quest set":
      return client.replaceQuest(project(), required("quest"), await input2(), mutationOpts());
    case "quest archive":
      return client.archiveQuest(project(), required("quest"), await input2(), mutationOpts());
    case "quest restore":
      return client.restoreQuest(project(), required("quest"), await input2(), mutationOpts());
    case "quest retained-summaries":
      return client.questRetainedSummaries(project(), await input2(), opts);
    case "quest scene-selectors":
      return client.questSceneSelectors(project(), page4, opts);
    default:
      return void 0;
  }
}

// apps/cli/src/tileset-commands.ts
async function runTilesetCommand(command, values, client, opts) {
  const required = (key3) => {
    const value = values[key3];
    if (typeof value !== "string" || !value)
      throw new LocalFileError("input", `Required --${key3} is missing.`);
    return value;
  };
  switch (command) {
    case "tileset detect":
      return client.detectTiles(required("project"), { referenceId: required("reference") }, opts);
    case "tileset create":
      return client.createTileset(required("project"), await readJson(required("input")), {
        ...opts,
        idempotencyKey: required("idempotency-key")
      });
    case "tileset list":
      return client.tilesets(required("project"), opts);
    case "tileset get":
      return client.tileset(required("project"), required("tileset"), opts);
    case "tileset export": {
      const root = required("output-root");
      const image = required("image");
      const metadata = required("metadata");
      await validateOutputPaths(root, [image, metadata]);
      const result = await client.exportTileset(required("project"), required("tileset"), opts);
      const descriptor = result.metadata.files[0];
      if (!descriptor) throw new LocalFileError("conflict", "Atlas is unavailable.");
      const source = await result.download("atlas", opts.signal);
      const atlas = await publish(root, image, source.body, descriptor);
      const manifest = await publishJson(root, metadata, result.metadata);
      return { tilesetId: result.metadata.tilesetId, outputs: [atlas, manifest] };
    }
    default:
      return void 0;
  }
}

// apps/cli/src/run.ts
var summarizeJob = inspectAutomationJob;
async function run(args, io) {
  let ndjson = false;
  try {
    const { values, positionals } = parseArgs({
      args,
      strict: true,
      allowPositionals: true,
      options: {
        json: { type: "boolean" },
        ndjson: { type: "boolean" },
        help: { type: "boolean" },
        version: { type: "boolean" },
        endpoint: { type: "string" },
        "token-stdin": { type: "boolean" },
        input: { type: "string" },
        file: { type: "string" },
        studio: { type: "string" },
        project: { type: "string" },
        reference: { type: "string" },
        job: { type: "string" },
        candidate: { type: "string" },
        asset: { type: "string" },
        revision: { type: "string" },
        character: { type: "string" },
        graphics: { type: "boolean" },
        mechanic: { type: "string" },
        influence: { type: "string" },
        scene: { type: "string" },
        quest: { type: "string" },
        location: { type: "string" },
        world: { type: "string" },
        item: { type: "string" },
        link: { type: "string" },
        slot: { type: "string" },
        owner: { type: "string" },
        document: { type: "string" },
        export: { type: "string" },
        markdown: { type: "string" },
        type: { type: "string" },
        locale: { type: "string" },
        source: { type: "string" },
        sort: { type: "string" },
        direction: { type: "string" },
        unplaced: { type: "boolean" },
        placement: { type: "string" },
        search: { type: "string" },
        "idempotency-key": { type: "string" },
        "output-root": { type: "string" },
        image: { type: "string" },
        metadata: { type: "string" },
        "max-polls": { type: "string" },
        "recent-limit": { type: "string" },
        manifest: { type: "string" },
        receipt: { type: "string" },
        entry: { type: "string" },
        cursor: { type: "string" },
        limit: { type: "string" },
        state: { type: "string" },
        kind: { type: "string" },
        mode: { type: "string" },
        frame: { type: "string" },
        background: { type: "string" },
        offset: { type: "string" },
        tileset: { type: "string" },
        content: { type: "string" },
        confirm: { type: "string" },
        family: { type: "string" },
        purpose: { type: "string" },
        trash: { type: "boolean" }
      }
    });
    ndjson = values.ndjson ?? false;
    if (ndjson && values.json) throw new LocalFileError("input", "Choose JSON or NDJSON.");
    const finish = (data) => {
      io.stdout(
        `${JSON.stringify(
          ndjson ? { version: "game-studio-automation/v1", event: "result", data } : { version: "game-studio-automation/v1", ok: true, data }
        )}
`
      );
      return 0;
    };
    const command = positionals.join(" ");
    if (values.help) {
      const result = commandHelp(command);
      if ("path" in result) validateCommand(command, values);
      else
        for (const key3 of Object.keys(values)) {
          if (!result.globalOptions.includes(key3))
            throw new LocalFileError("input", `Unsupported option --${key3}.`);
        }
      return finish(result);
    }
    if (values.version) {
      if (command || Object.keys(values).some((key3) => !["version", "json", "ndjson"].includes(key3)))
        throw new LocalFileError("input", "Version accepts only output format options.");
      return finish({ cliVersion: "0.1.1", protocol: "game-studio-automation/v1" });
    }
    validateCommand(command, values);
    const required = (value) => {
      if (!value) throw new LocalFileError("input", "Required option is missing.");
      return value;
    };
    const { GAME_STUDIO_TOKEN, GAME_STUDIO_ENDPOINT } = io.env;
    if (command === "setup")
      return finish(await setupProject(io.projectDirectory ?? process.cwd(), io));
    if (command === "init")
      return finish(await initializeProject(io.projectDirectory ?? process.cwd()));
    if (command === "asset native render")
      return finish(
        await renderNative(
          required(values.input),
          required(values.mode),
          values.frame,
          required(values["output-root"]),
          required(values.image)
        )
      );
    if (command === "batch validate") {
      const plan = await preflight(required(values.manifest), void 0, values.receipt);
      return finish({
        manifestFingerprint: plan.manifestFingerprint,
        entries: plan.entries.map(({ externalId, fingerprint: fingerprint2 }) => ({ externalId, fingerprint: fingerprint2 })),
        referenceCount: plan.references.length
      });
    }
    const token = values["token-stdin"] ? (await io.stdin()).trim() : await projectToken(GAME_STUDIO_TOKEN, io.projectDirectory);
    const endpoint = values.endpoint ?? GAME_STUDIO_ENDPOINT ?? defaultStudioEndpoint;
    const client = createAutomationClient({
      endpoint,
      bearer: () => token ?? "",
      ...io.fetch ? { fetch: io.fetch } : {}
    });
    const opts = {
      ...io.signal ? { signal: io.signal } : {},
      ...values["idempotency-key"] ? { idempotencyKey: values["idempotency-key"] } : {}
    };
    const mutationOpts = () => {
      const key3 = required(values["idempotency-key"]);
      if (!/^[A-Za-z0-9_.:-]{1,120}$/.test(key3))
        throw new LocalFileError("input", "Invalid idempotency identity.");
      return { ...opts, idempotencyKey: key3 };
    };
    const project = () => required(values.project);
    const job = () => required(values.job);
    const candidate = () => required(values.candidate);
    const authored = await runAuthoringCommand(command, values, client, opts);
    if (authored !== void 0) return finish(authored);
    const story = await runStoryCommand(command, values, client, opts);
    if (story !== void 0) return finish(story);
    const catalog = await runCatalogCommand(command, values, client, opts);
    if (catalog !== void 0) return finish(catalog);
    const document = await runDocumentCommand(command, values, client, opts);
    if (document !== void 0) return finish(document);
    const creative = await runCreativeCommand(command, values, client, opts);
    if (creative !== void 0) return finish(creative);
    const graphics = await runGraphicsCommand(command, values, client, opts, io.fetch ?? fetch);
    const indicator = await runIndicatorCommand(command, values, client, opts);
    if (indicator !== void 0) return finish(indicator);
    const tileset = await runTilesetCommand(command, values, client, opts);
    if (tileset !== void 0) return finish(tileset);
    const lifecycle = await runLifecycleCommand(command, values, client, opts);
    if (lifecycle !== void 0) return finish(lifecycle);
    if (graphics !== void 0) return finish(graphics);
    switch (command) {
      case "activity list":
        return finish(
          await client.activity(
            {
              studioId: required(values.studio),
              ...values["recent-limit"] ? { recentLimit: values["recent-limit"] } : {}
            },
            opts
          )
        );
      case "generation form-seed":
        return finish(await client.generationFormSeed(project(), job(), opts));
      case "generation retry":
        return finish(summarizeJob(await client.retryGeneration(project(), job(), mutationOpts())));
      case "generation clone":
        return finish(summarizeJob(await client.cloneGeneration(project(), job(), mutationOpts())));
      case "generation continue":
        return finish(
          summarizeJob(
            (await client.continueGeneration(
              project(),
              job(),
              await readJson(required(values.input)),
              mutationOpts()
            )).job
          )
        );
      case "moodboard submit":
        return finish(
          summarizeJob(
            (await client.submitMoodboard(
              project(),
              await readJson(required(values.input)),
              mutationOpts()
            )).job
          )
        );
      case "style-preview submit":
        return finish(
          summarizeJob(
            (await client.submitStylePreview(
              project(),
              await readJson(required(values.input)),
              mutationOpts()
            )).job
          )
        );
      case "candidate cancel": {
        const result = await client.cancelCandidate(project(), job(), candidate(), opts);
        return finish({ candidate: inspectAutomationCandidate(result.candidate), run: result.run });
      }
      case "batch run":
      case "batch resume":
      case "batch status":
      case "batch select": {
        const result = await runBatch(
          client,
          io.fetch ?? fetch,
          endpoint,
          required(values.manifest),
          command.slice(6),
          {
            ...opts,
            ...values.receipt ? { receiptPath: values.receipt } : {},
            ...values.entry ? { entryId: values.entry } : {},
            ...values.candidate ? { candidateId: values.candidate } : {},
            maxPolls: Number(values["max-polls"] ?? 360),
            wait: io.wait ?? ((ms) => delay(ms, void 0, io.signal ? { signal: io.signal } : {})),
            progress: (state) => io.stderr(`Batch ${state}.
`)
          }
        );
        finish(result);
        return result.complete ? 0 : 6;
      }
      case "reference upload":
      case "style technique-upload": {
        const path = resolve6(required(values.input));
        const config = z58.strictObject({ path: z58.string().min(1), mimeType: ImageMimeSchema }).parse(await readJson(path));
        const bytes = await readConfined(dirname7(path), config.path, 25 * 1024 * 1024);
        return finish(
          await uploadReference(
            client,
            io.fetch ?? fetch,
            project(),
            {
              purpose: command === "style technique-upload" ? "technique-reference" : "style-reference",
              fileName: basename3(config.path),
              mimeType: config.mimeType,
              byteSize: bytes.length,
              checksum: sha2562(bytes)
            },
            bytes,
            mutationOpts()
          )
        );
      }
      case "candidate preview":
        return finish(
          await downloadPreview(
            client,
            io.fetch ?? fetch,
            project(),
            job(),
            candidate(),
            required(values["output-root"]),
            required(values.image),
            opts
          )
        );
      case "auth whoami":
        return finish(await client.whoami(opts));
      case "reference list": {
        const result = await client.references(
          project(),
          opts,
          values.purpose ? { purpose: values.purpose } : {}
        );
        return finish({
          references: result.references.map(
            ({ id: id2, purpose, approved, analysisStatus, checksum }) => ({
              id: id2,
              purpose,
              approved,
              analysisStatus,
              checksum
            })
          )
        });
      }
      case "reference approve": {
        const result = await client.approveReference(project(), required(values.reference), opts);
        return finish({
          id: result.id,
          approved: result.approved,
          analysisStatus: result.analysisStatus
        });
      }
      case "technique select":
      case "technique clear": {
        const result = command === "technique select" ? await client.selectTechnique(project(), required(values.reference), opts) : await client.clearTechnique(project(), opts);
        return finish({
          selectedTechniqueStyleReferenceId: result.selectedTechniqueStyleReferenceId,
          fingerprint: result.fingerprint
        });
      }
      case "generation context":
        return finish(
          await client.generationContext(project(), await readJson(required(values.input)), opts)
        );
      case "generation submit":
        return finish(
          summarizeJob(
            (await client.submit(project(), await readJson(required(values.input)), mutationOpts())).job
          )
        );
      case "generation list": {
        const result = await client.jobs(
          project(),
          {
            ...values.cursor !== void 0 ? { cursor: values.cursor } : {},
            ...values.limit !== void 0 ? { limit: values.limit } : {},
            ...values.kind !== void 0 ? { kind: values.kind } : {}
          },
          opts
        );
        return finish({ jobs: result.jobs.map(summarizeJob), nextCursor: result.nextCursor });
      }
      case "generation detail": {
        const result = await client.detail(project(), job(), opts);
        return finish({
          job: summarizeJob(result.job),
          candidates: result.candidates.map(inspectAutomationCandidate)
        });
      }
      case "generation status":
        return finish(summarizeJob(await client.job(project(), job(), opts)));
      case "generation cancel":
        return finish(summarizeJob(await client.cancel(project(), job(), opts)));
      case "generation wait": {
        const result = await waitForJob(client, project(), job(), {
          ...opts,
          maxPolls: Number(values["max-polls"] ?? "360"),
          wait: io.wait ?? ((milliseconds) => delay(milliseconds, void 0, io.signal ? { signal: io.signal } : {})),
          onProgress: (state) => {
            if (ndjson)
              io.stdout(
                `${JSON.stringify({
                  version: "game-studio-automation/v1",
                  event: "progress",
                  stage: state.status,
                  message: "Waiting for generation."
                })}
`
              );
            else io.stderr(`Generation ${state.status}.
`);
          }
        });
        return finish(summarizeJob(result));
      }
      case "candidate list": {
        const result = await client.candidates(project(), job(), opts);
        return finish({ candidates: result.candidates.map(inspectAutomationCandidate) });
      }
      case "candidate get": {
        const candidateId = z58.uuid().parse(candidate());
        const result = await client.candidates(project(), job(), opts);
        const found = result.candidates.find(({ id: id2 }) => id2 === candidateId);
        if (!found)
          throw new LocalFileError("input", "Candidate was not found in this generation.");
        return finish(inspectAutomationCandidate(found));
      }
      case "candidate process": {
        const result = await client.process(project(), job(), candidate(), mutationOpts());
        return finish({
          candidateId: result.candidate.id,
          status: result.candidate.status,
          runId: result.run.id,
          candidate: inspectAutomationCandidate(result.candidate),
          run: result.run
        });
      }
      case "candidate reject":
      case "candidate restore": {
        const result = command === "candidate reject" ? await client.reject(project(), job(), candidate(), opts) : await client.restore(project(), job(), candidate(), opts);
        return finish(inspectAutomationCandidate(result));
      }
      case "asset inspect":
        return finish(await client.asset(project(), required(values.asset), opts));
      case "asset export": {
        const root = required(values["output-root"]);
        const image = required(values.image);
        const metadataPath = required(values.metadata);
        return finish(
          await exportAsset(
            client,
            project(),
            required(values.asset),
            root,
            image,
            metadataPath,
            opts,
            values.revision
          )
        );
      }
      default:
        throw new LocalFileError("input", "Unknown command.");
    }
  } catch (error) {
    const result = error instanceof AutomationError ? error.result : AutomationProblemSchema.parse({
      version: "game-studio-automation/v1",
      ok: false,
      category: io.signal?.aborted ? "transient" : error instanceof LocalFileError ? error.category : "input",
      problem: {
        title: "Command failed",
        detail: error instanceof LocalFileError ? error.message : "Command could not complete.",
        code: error instanceof LocalFileError && error.category === "conflict" ? "conflict" : "validation_failed"
      }
    });
    io.stdout(
      `${JSON.stringify(
        ndjson ? {
          version: result.version,
          event: "problem",
          category: result.category,
          problem: result.problem
        } : result
      )}
`
    );
    return AutomationExitCode[result.category];
  }
}

// apps/cli/src/main.ts
var controller = new AbortController();
var cancel = () => {
  controller.abort();
  process.stdin.destroy();
};
process.once("SIGINT", cancel);
process.once("SIGTERM", cancel);
try {
  process.exitCode = await run(process.argv.slice(2), {
    env: process.env,
    projectDirectory: process.cwd(),
    signal: controller.signal,
    stdout: (line) => {
      process.stdout.write(line);
    },
    stderr: (line) => {
      process.stderr.write(line);
    },
    stdin: async () => {
      let result = "";
      for await (const chunk of process.stdin) {
        result += String(chunk);
        if (result.length > 8192) throw new Error("Token input is too large.");
      }
      return result;
    }
  });
} finally {
  process.removeListener("SIGINT", cancel);
  process.removeListener("SIGTERM", cancel);
}
