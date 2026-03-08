

## Plan: Skip Mapping Step and Go Directly to Edit/Validate

**Problem**: The mapping screen is blocking the flow (button may not work) and the user doesn't want to see it. They want to go straight from file upload → data editing/validation.

**Solution**: After file analysis completes, automatically call `processWithMappings()` and skip the `mapping` step entirely, going directly to the `preview` (edit & validate) step.

### Changes

**File: `src/components/shared/SmartImportDialog.tsx`**

1. Remove the `mapping` step from the flow entirely. After analyzing the file and detecting column mappings, automatically process the data and jump to `preview`.

2. In `handleFileChange`:
   - For **image imports** (line ~330): Instead of `setStep('mapping')`, call `processWithMappings` directly after setting mappings.
   - For **Excel/PDF imports** (line ~414): Same — skip `setStep('mapping')` and go straight to processing.

3. Since `processWithMappings` reads from state (`rawHeaders`, `rawData`, `columnMappings`), refactor it to accept parameters directly so it can be called inline without waiting for state updates.

4. Remove the entire `mapping` step UI block (lines 657-710) and its footer buttons (lines 862-868).

5. Update the "Volver" button in the `preview` footer to go back to `upload` instead of `mapping`.

### Technical approach

Refactor `processWithMappings` to accept `(headers, data, mappings)` as parameters (with fallback to state). Call it directly at the end of `handleFileChange` with the local variables, bypassing the React state timing issue.

```
handleFileChange → analyze → detect mappings → processWithMappings(headers, data, mappings) → preview step
```

No mapping UI shown at all. The AI analysis info message can optionally appear in the preview step.

