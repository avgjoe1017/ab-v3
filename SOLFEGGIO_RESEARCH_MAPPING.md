# Solfeggio Frequency Mapping Based on Research

This document maps goalTags to appropriate solfeggio frequencies based on research from `Brain/affirmation_research.md`.

## Research-Based Mappings

The research document provides a use case table (lines 141-175) mapping common goals to both binaural beats and solfeggio frequencies. This implementation uses those mappings.

### Automatic Mappings (via `getSolfeggioForGoalTag()`)

| goalTag | Solfeggio Frequency | Traditional Use | Research-Based Rationale |
|---------|-------------------|----------------|-------------------------|
| `focus` | **741 Hz** | Awakening Intuition & Expression | Research recommends 741 Hz for "Focus & Concentration" - promotes mental clarity, problem-solving, and self-expression |
| `sleep` | **528 Hz** | Transformation & Love (Miracle Tone) | Research recommends 528 Hz for "Deep Sleep" - linked to reduced cortisol and improved sleep quality in studies |
| `anxiety` / `anxiety-relief` | **852 Hz** | Spiritual Awareness & Anxiety Relief | Research recommends 852 Hz for "Anxiety Relief" - replaces negative thought patterns, calms overactive mind |
| `meditate` | **963 Hz** | Divine Consciousness | Research recommends 963 Hz for "Meditation & Mindfulness" - spiritual awakening, pineal gland activation |
| `wake-up` / `coffee-replacement` | **396 Hz** | Liberation from Fear & Guilt | Research recommends 396 Hz for "Energy Boost & Motivation" - uplifting energy, dispels fear-based emotions |
| `creativity` | **741 Hz** | Awakening Intuition & Expression | Research recommends 741 Hz for creativity - mental stimulation and clear communication |
| `pre-performance` | **528 Hz** | Transformation & Love | Confidence, heart-opening feelings, deep serenity |

### Alternative Mappings (Not Auto-Selected, But Available)

For other use cases, users can manually select:

- **174 Hz** - Relaxation & Stress Relief (grounding, pain/stress relief)
- **417 Hz** - Deep Sleep (emotional release, trauma clearing)
- **639 Hz** - Harmonious Relationships (connection, empathy)
- **285 Hz** - Tissue Restoration (physical healing)
- **432 Hz** - Natural frequency (peaceful, harmonious - mentioned in research but not in our 11-file set)

## Implementation

The `getSolfeggioForGoalTag()` function in `packages/contracts/src/session-frequency.ts` provides these mappings. It returns `null` for goalTags that don't have a research-based solfeggio recommendation, defaulting to binaural beats instead.

## Usage Example

```typescript
import { getSolfeggioForGoalTag } from "@ab/contracts";

// Auto-suggest solfeggio for sleep sessions
const solfeggioInfo = getSolfeggioForGoalTag("sleep");
if (solfeggioInfo) {
  // solfeggioInfo = { frequencyHz: 528, description: "...", traditionalUse: "..." }
  // Use this to suggest or auto-select 528 Hz solfeggio
}
```

## Research Notes

From `Brain/affirmation_research.md`:

1. **528 Hz** has preliminary scientific support:
   - Reduced cortisol (stress hormone) in studies
   - Improved sleep quality
   - Increased oxytocin
   - Reduced anxiety behaviors in rat studies

2. **Most solfeggio frequencies** are based on traditional/spiritual use rather than scientific validation

3. **Combined approach**: Research suggests using binaural beats for brainwave entrainment and solfeggio for emotional/spiritual aspects

4. **Individual preference matters**: What's soothing for one person might be irritating to another

## Next Steps

- Consider adding UI to let users choose between binaural and solfeggio when creating sessions
- Use `getSolfeggioForGoalTag()` to auto-suggest solfeggio frequencies based on goalTag
- Allow manual override so users can experiment with different frequencies

