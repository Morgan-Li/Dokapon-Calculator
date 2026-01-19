import { ROI } from '../../types';

// ROI definitions for the character comparison screenshot
// Recalibrated based on example-Dokapon.png (600x338 actual dimensions)
// Reference dimensions scaled up 3x for better OCR accuracy

// Reference dimensions (3x the example screenshot size for better quality)
export const REFERENCE_WIDTH = 1800;
export const REFERENCE_HEIGHT = 1014;

// Left character card ROIs (calibrated to match OVERLAY_GUIDES)
export const LEFT_CARD_ROIS: Record<string, ROI> = {
  job: { x: 160, y: 200, w: 300, h: 42 },           // "Warrior" text (matches leftJobBox)
  hp: { x: 270, y: 320, w: 130, h: 40 },            // "62/140" HP values (matches leftHPBox)
  at: { x: 185, y: 395, w: 90, h: 40 },             // AT stat (derived from leftStatsBox)
  df: { x: 275, y: 395, w: 90, h: 40 },             // DF stat (derived from leftStatsBox)
  mg: { x: 370, y: 395, w: 80, h: 40 },             // MG stat (derived from leftStatsBox)
  sp: { x: 455, y: 395, w: 80, h: 40 },             // SP stat (derived from leftStatsBox)
  weapon: { x: 190, y: 525, w: 265, h: 40 },        // Weapon name
  offensiveMagic: { x: 190, y: 720, w: 265, h: 40 },// Offensive magic
  defensiveMagic: { x: 190, y: 785, w: 265, h: 40 },// Defensive magic
};

// Right character card ROIs (calibrated to match OVERLAY_GUIDES)
export const RIGHT_CARD_ROIS: Record<string, ROI> = {
  job: { x: 700, y: 200, w: 300, h: 42 },           // "Warrior" text (matches rightJobBox)
  hp: { x: 810, y: 320, w: 130, h: 40 },            // "122/140" HP values (matches rightHPBox)
  at: { x: 725, y: 395, w: 90, h: 40 },             // AT stat (derived from rightStatsBox)
  df: { x: 815, y: 395, w: 87, h: 40 },             // DF stat (derived from rightStatsBox)
  mg: { x: 903, y: 395, w: 85, h: 40 },             // MG stat (derived from rightStatsBox)
  sp: { x: 995, y: 395, w: 80, h: 40 },             // SP stat (derived from rightStatsBox)
  weapon: { x: 730, y: 525, w: 265, h: 40 },        // Weapon name
  offensiveMagic: { x: 730, y: 720, w: 265, h: 40 },// Offensive magic
  defensiveMagic: { x: 730, y: 785, w: 265, h: 40 },// Defensive magic
};

// Overlay guide positions for manual alignment UI
// These match the actual OCR extraction regions for precise alignment feedback
export const OVERLAY_GUIDES = {
  leftCardOutline: { x: 120, y: 90, w: 510, h: 770 },
  rightCardOutline: { x: 660, y: 90, w: 510, h: 770 },
  leftJobBox: { x: 160, y: 200, w: 300, h: 42 },
  rightJobBox: { x: 700, y: 200, w: 300, h: 42 },
  leftHPBox: { x: 270, y: 320, w: 130, h: 40 },
  rightHPBox: { x: 810, y: 320, w: 130, h: 40 },
  leftATBox: { x: 185, y: 395, w: 90, h: 40 },
  leftDFBox: { x: 275, y: 395, w: 90, h: 40 },
  leftMGBox: { x: 370, y: 395, w: 80, h: 40 },
  leftSPBox: { x: 455, y: 395, w: 80, h: 40 },
  rightATBox: { x: 725, y: 395, w: 90, h: 40 },
  rightDFBox: { x: 815, y: 395, w: 87, h: 40 },
  rightMGBox: { x: 903, y: 395, w: 85, h: 40 },
  rightSPBox: { x: 995, y: 395, w: 80, h: 40 },
  leftWeaponBox: { x: 190, y: 525, w: 265, h: 40 },
  rightWeaponBox: { x: 729, y: 525, w: 265, h: 40 },
  leftOffensiveMagicBox: { x: 190, y: 720, w: 265, h: 40 },
  rightOffensiveMagicBox: { x: 730, y: 720, w: 265, h: 40 },
  leftDefensiveMagicBox: { x: 190, y: 785, w: 265, h: 40 },
  rightDefensiveMagicBox: { x: 730, y: 785, w: 265, h: 40 },
};

// ============================================================
// BATTLE SCREEN ROI DEFINITIONS
// For battle view screenshots (different layout than overworld)
// ============================================================

// Battle screen uses the same reference dimensions for consistency
// The battle screen layout has:
// - HP bars at top corners
// - Stats in center (left values vs right values)
// - Action menus at bottom (left = attacker, right = defender)

// Left character ROIs for battle screen (matches BATTLE_OVERLAY_GUIDES)
export const BATTLE_LEFT_ROIS: Record<string, ROI> = {
  hp: { x: 515, y: 298, w: 90, h: 30 },              // HP numbers from top-left bar
  at: { x: 720, y: 365, w: 100, h: 40 },             // AT stat (left number in center)
  df: { x: 720, y: 425, w: 100, h: 40 },             // DF stat
  mg: { x: 720, y: 480, w: 100, h: 40 },             // MG stat
  sp: { x: 720, y: 535, w: 100, h: 40 },             // SP stat
  magic: { x: 480, y: 605, w: 190, h: 45 },          // Magic from left menu
};

// Right character ROIs for battle screen (matches BATTLE_OVERLAY_GUIDES)
export const BATTLE_RIGHT_ROIS: Record<string, ROI> = {
  hp: { x: 975, y: 298, w: 90, h: 30 },              // HP numbers from top-right bar
  at: { x: 865, y: 365, w: 100, h: 40 },             // AT stat (right number in center)
  df: { x: 865, y: 425, w: 100, h: 40 },             // DF stat
  mg: { x: 865, y: 480, w: 100, h: 40 },             // MG stat
  sp: { x: 865, y: 535, w: 100, h: 40 },             // SP stat
  magic: { x: 1020, y: 605, w: 190, h: 45 },          // Magic from right menu
};

// Overlay guides for battle screen alignment UI
export const BATTLE_OVERLAY_GUIDES = {
  // HP bar areas
  leftHPBox: { x: 515, y: 298, w: 90, h: 30 },
  rightHPBox: { x: 975, y: 298, w: 90, h: 30 },
  // Center stat display area
  statsAreaOutline: { x: 650, y: 340, w: 500, h: 280 },
  // Individual stat boxes (left values)
  leftATBox: { x: 720, y: 365, w: 100, h: 40 },
  leftDFBox: { x: 720, y: 425, w: 100, h: 40 },
  leftMGBox: { x: 720, y: 480, w: 100, h: 40 },
  leftSPBox: { x: 720, y: 535, w: 100, h: 40 },
  // Individual stat boxes (right values)
  rightATBox: { x: 865, y: 365, w: 100, h: 40 },
  rightDFBox: { x: 865, y: 425, w: 100, h: 40 },
  rightMGBox: { x: 865, y: 480, w: 100, h: 40 },
  rightSPBox: { x: 865, y: 535, w: 100, h: 40 },
  // Magic menu areas
  leftMagicBox: { x: 480, y: 605, w: 190, h: 45 },
  rightMagicBox: { x: 1020, y: 605, w: 190, h: 45 },
};
