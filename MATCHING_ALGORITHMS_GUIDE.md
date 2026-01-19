# Template Matching Algorithms Guide

## Overview

I've implemented **4 different matching strategies** to handle your custom Dokapon font:

1. **Multi-Scale Matching** - Handles size mismatches between templates and digits
2. **Three Matching Algorithms** - Different mathematical approaches for comparison
3. **Ensemble Mode** - Tries all algorithms and picks the best result
4. **Spatial Search** - Searches nearby positions to handle slight misalignment

## Matching Algorithms Explained

### 1. Normalized Cross-Correlation (NCC)
**Location:** [templateMatcher.ts:133-176](src/core/ocr/templateMatcher.ts#L133-L176)

**How it works:**
- Calculates correlation between template and image patch
- Normalized to handle brightness differences
- Range: 0 (no match) to 1 (perfect match)

**Best for:**
- Images with slight brightness variations
- When template and input have similar preprocessing

**Pros:** Robust to brightness changes
**Cons:** Slower, can give false positives if patterns are similar

### 2. Sum of Squared Differences (SSD)
**Location:** [templateMatcher.ts:84-128](src/core/ocr/templateMatcher.ts#L84-L128)

**How it works:**
- Calculates pixel-by-pixel difference squared
- Lower difference = better match
- Converted to similarity score (0-1)

**Best for:**
- Exact matching of preprocessed images
- When you want strict pixel-perfect matching

**Pros:** Fast, precise for identical preprocessing
**Cons:** Sensitive to brightness differences

### 3. Hamming Distance
**Location:** [templateMatcher.ts:134-172](src/core/ocr/templateMatcher.ts#L134-L172)

**How it works:**
- Converts to binary (black/white at threshold 128)
- Counts differing pixels
- **FASTEST algorithm**, ideal for binary images

**Best for:**
- Preprocessed black/white images (after adaptive thresholding)
- When speed is critical

**Pros:** VERY fast, works great for clean binary images
**Cons:** Loses grayscale information

## Multi-Scale Matching

**Location:** [templateMatcher.ts:271-288](src/core/ocr/templateMatcher.ts#L271-L288)

The code now tries matching at multiple scales:

1. **Original template size** (scale = 1.0)
2. **Scaled by height** to match segment height
3. **Scaled by width** to match segment width
4. **Scaled by average** of height/width ratio

This handles the size mismatch between your templates and the extracted digit segments!

### Why This Matters:
If your templates are 45x66 pixels but the actual digits in the screenshot are 30x40 pixels after extraction, the code will automatically try scaling to find the best match.

## Ensemble Mode (RECOMMENDED)

**Location:** [templateMatcher.ts:289-291, 306-346](src/core/ocr/templateMatcher.ts#L289-L346)

**Current setting:** `algorithm: 'ensemble'`

In ensemble mode, the code:
1. Tries **ALL THREE** algorithms (NCC, SSD, Hamming)
2. Takes the **maximum confidence** across all methods
3. Logs which algorithm worked best (in console)

This gives you the best of all worlds!

## Configuration Options

You can change the matching behavior by editing [templateMatcher.ts:289-291](src/core/ocr/templateMatcher.ts#L289-L291):

```typescript
// CONFIGURABLE: Choose matching algorithm
type MatchingAlgorithm = 'ncc' | 'ssd' | 'hamming' | 'ensemble';
const algorithm: MatchingAlgorithm = 'ensemble'; // <-- CHANGE THIS

// Ensemble mode: Try multiple algorithms and pick the one with highest confidence
const useEnsemble = algorithm === 'ensemble';
```

### Options:
- `'ensemble'` - Try all algorithms, use best (RECOMMENDED)
- `'ncc'` - Only use Normalized Cross-Correlation
- `'ssd'` - Only use Sum of Squared Differences
- `'hamming'` - Only use Hamming distance (fastest)

## Multi-Digit Recognition

**Your Question:** "The templates are single digits. Will they work if the ROIs are multiple digits?"

**Answer:** YES! The code handles this automatically.

**How it works:** [templateMatcher.ts:352-404](src/core/ocr/templateMatcher.ts#L352-L404)

1. **Column Segmentation:** Scans the multi-digit ROI and finds columns with white pixels
2. **Digit Separation:** Groups consecutive columns into individual digit segments
3. **Individual Matching:** Matches each segment against your single-digit templates
4. **Concatenation:** Joins recognized digits into the full number

Example:
```
Input ROI:  "66" (two digits side by side)
           ↓
Segmentation finds two separate regions:
           "6" | "6"
           ↓     ↓
Template matching on each:
           6  +  6
           ↓
Output: "66"
```

## Performance Optimizations

1. **Template Caching** - Templates loaded once and reused
2. **Spatial Search** - Only searches ±3 pixels around expected position
3. **Early Rejection** - Skips out-of-bounds matches
4. **Sampling in Debug Logs** - Only logs 5-10% of attempts to avoid spam

## What to Expect in Console

When you run extraction, you'll see:

```
Template 6 size: 45x66, Segment size: 30x40
Trying 4 scales for digit 6: [1.00, 0.61, 0.67, 0.64]
Scaled template 6 from 45x66 to 27x40
Template 6 (scale 0.61x) white ratio: 38.2%, Segment white ratio: 35.1%
Best algo for digit 6: Hamming (NCC: 0.723, SSD: 0.812, Hamming: 0.891)
🥇 Digit 6: 89.1%
```

This tells you:
- ✅ Size mismatch detected and handled
- ✅ Multiple scales tried
- ✅ Best scale found (0.61x)
- ✅ Pixel distributions are similar (38% vs 35%)
- ✅ Hamming algorithm performed best
- ✅ High confidence match (89.1%)

## Troubleshooting

### Low Confidence (<60%)
**Possible causes:**
- Templates and segments have different preprocessing
- Size mismatch not resolved by multi-scale
- Color inversion (template white on black, segment black on white)

**Solutions:**
- Check white pixel ratios in console
- Try different algorithm (change `algorithm` setting)
- Recreate templates with identical preprocessing

### Wrong Digits Recognized
**Possible causes:**
- Similar-looking digits (6 vs 8, 1 vs 7)
- ROI positioned incorrectly

**Solutions:**
- Lower confidence threshold at [templateMatcher.ts:398](src/core/ocr/templateMatcher.ts#L398)
- Adjust ROI positions in [rois.ts](src/core/ocr/rois.ts)
- Use Debug UI to visualize what's being extracted

### Segmentation Issues
**Possible causes:**
- Digits touching each other
- Background noise creating false segments

**Solutions:**
- Adjust preprocessing to separate digits better
- Modify minimum segment width at [templateMatcher.ts:386](src/core/ocr/templateMatcher.ts#L386)

## Next Steps

1. **Run the app** and upload your screenshot
2. **Check browser console** for diagnostic output
3. **Look for these key indicators:**
   - Size scaling working correctly
   - White pixel ratios similar (within 20%)
   - Which algorithm performs best
   - Confidence scores >60%

The ensemble mode with multi-scale matching should handle most issues automatically!
