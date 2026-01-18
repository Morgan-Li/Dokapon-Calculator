# Reference Data Documentation

This document describes the game reference data used for damage calculations.

## Data Sources

All data scraped from the [Dokapon Kingdom Wiki](https://dokapon.fandom.com/wiki/Dokapon_Kingdom):

- **Damage Formulas**: [Damage (Kingdom)](https://dokapon.fandom.com/wiki/Damage_(Kingdom))
- **Jobs**: User-provided weapon proficiency list
- **Weapons**: [Weapon (Kingdom)](https://dokapon.fandom.com/wiki/Weapon_(Kingdom))
- **Defensive Magic**: [Defensive Magic (Kingdom)](https://dokapon.fandom.com/wiki/Defensive_Magic_(Kingdom))
- **Offensive Magic**: [Offensive Magic (Kingdom)](https://dokapon.fandom.com/wiki/Offensive_Magic_(Kingdom))

## Damage Formulas

### Attack
```
Damage = (Attacker AT × 2.8 - Defender DF × 1.2) × Guard × Proficiency × Random
```

**Guard Multipliers**:
- Defend: 1.0
- Magic Defend: 1.4
- Counter: 1.8
- Unable to react: 2.0

**Proficiency**: 1.3 if job matches weapon, otherwise 1.0

### Strike
```
AttackerTotal = Attacker AT + Attacker MG + Attacker SP
DefenderTotal = Defender DF + Defender MG + Defender SP
Damage = (AttackerTotal × 2.5 - DefenderTotal) × Guard × Proficiency × Random
```

**Guard Multipliers**:
- Defend: 1.6
- Magic Defend: 1.7
- Counter: 0 (special calculation - attacker takes damage)
- Unable to react: 2.5

**Proficiency**: 1.3 if job matches weapon, otherwise 1.0

### Offensive Magic
```
Damage = (Attacker MG × 2.4 - Defender MG) × OffensivePower × (1 - DefensivePower) × Guard × Random
```

**Guard Multipliers**:
- Defend: 1.4
- Magic Defend: 1.0
- Counter: 1.8
- Unable to react: 2.0

**Note**: No proficiency bonus for magic

**Random Factor**: All formulas use either 95% or 105% (min/max)

## File Structure

### jobs.json

Contains job classes and their weapon proficiencies.

**Structure**:
```json
{
  "JobName": {
    "name": "JobName",
    "weapons": ["Weapon1", "Weapon2", ...]
  }
}
```

**Jobs Included** (12 total):
- **Starting Jobs**: Warrior, Magician, Thief
- **Advanced Jobs**: Hero, Spellsword, Alchemist, Robo Knight, Cleric, Ninja, Monk, Acrobat, Darkling

**Proficiency**: If a weapon is in the job's `weapons` array, that job gets a 30% damage bonus with it.

**Special Cases**:
- Hero, Spellsword: Same weapon proficiencies as Warrior
- Alchemist: Same weapon proficiencies as Magician
- Darkling: No weapon proficiencies (empty array)

### weapons.json

Simple array of all 67 weapon names in Dokapon Kingdom.

**Examples**: `["Knife", "Dagger", "Longsword", "Rapier", "Fairy Wand", ...]`

### defensive-magic.json

Defensive magic spells and their defensive power values.

**Structure**:
```json
{
  "SpellName": {
    "name": "SpellName",
    "power": 0.5
  }
}
```

**Power Values**: Range from 0 (no defense) to 0.9 (90% reduction)

**Key Spells** (20 total):
- **M Guard Series**: M Guard (20%), M Guard+ (60%), M Guard DX (90%)
- **Refresh Series**: Refresh (20%), Refresh+ (35%), Refresh DX (50%)
- **Charge Series**: AT/DF/MG/SP Charge (35% each), Charge All (60%)
- **Others**: Super Cure (50%), Charm (70%), Bounce/Super Bounce (0%)

**Formula Usage**: `(1 - DefensivePower)` - so higher power = more damage reduction

### offensive-magic.json

Offensive magic spells and their power multipliers.

**Structure**:
```json
{
  "SpellName": {
    "name": "SpellName",
    "power": 2.5
  }
}
```

**Power Values**: Range from 0 (utility spells) to 5.0 (Aurora)

**Key Spells** (23 total):
- **Fire**: Scorch (1.95), Scorcher (2.65), Giga Blaze (3.7)
- **Lightning**: Zap (2.25), Zapper (3.15), Lectro Beam (4.45)
- **Ice**: Chill (2.1), Chiller (2.9), Ice Barrage (4.1)
- **Wind**: Gust (2.45), Guster (3.2), F5 Storm (4.75)
- **Special**: Aurora (5.0) - highest power
- **Status**: Curse (1.6), Sleepy (1.1), Blind (1.4)
- **Utility**: Drain (0), Swap (0) - no direct damage

## Usage in Code

### Loading Reference Data

```typescript
import { JOBS, WEAPONS, DEFENSIVE_MAGIC, OFFENSIVE_MAGIC } from './core/reference/loader';

// Check proficiency
const isProficient = JOBS['Warrior'].weapons.includes('Rapier'); // true

// Get spell power
const defensivePower = DEFENSIVE_MAGIC['M Guard'].power; // 0.2
const offensivePower = OFFENSIVE_MAGIC['Aurora'].power; // 5.0
```

### Fuzzy Matching OCR Results

```typescript
import { matchJob, matchWeapon, matchDefensiveMagic, matchOffensiveMagic } from './core/reference/matcher';

// OCR returns "Warriar" (typo)
const jobMatch = matchJob('Warriar');
// Returns: { match: 'Warrior', confidence: 0.85, alternatives: ['Magician', 'Thief'] }

// OCR returns "M Gard" (typo)
const magicMatch = matchDefensiveMagic('M Gard');
// Returns: { match: 'M Guard', confidence: 0.9, alternatives: ['M Guard+', 'M Guard DX'] }
```

### Helper Functions

```typescript
import {
  isProficient,
  getProficiencyMultiplier,
  getDefensivePower,
  getOffensivePower
} from './core/reference/loader';

// Check proficiency
const proficient = isProficient('Warrior', 'Rapier'); // true
const multiplier = getProficiencyMultiplier('Warrior', 'Rapier'); // 1.3

// Get spell powers
const defensePower = getDefensivePower('M Guard'); // 0.2
const offensePower = getOffensivePower('Aurora'); // 5.0
```

## Data Quality Notes

- All weapon names normalized (title case)
- Defensive power values are decimals (20% = 0.2)
- Offensive power values are multipliers (not percentages)
- Job names are exact matches to game data
- Fuzzy matching handles OCR errors with ~60% threshold

## Updating Reference Data

To update game data:

1. Edit the JSON files in `src/data/`
2. Rebuild: `npm run build`
3. Data is bundled into the production build

No backend required - all data is static and loaded at build time.

---

**Last Updated**: Based on Dokapon Kingdom (Wii/PS2) data as of 2026-01-18
