import { ROI } from '../../types';

// ROI definitions for the character comparison screenshot
// These coordinates are relative to the aligned screenshot
// Values will need to be calibrated based on actual screenshot dimensions

export const LEFT_CARD_ROIS: Record<string, ROI> = {
  job: { x: 50, y: 80, w: 150, h: 30 },
  hp: { x: 50, y: 120, w: 120, h: 25 },
  at: { x: 60, y: 160, w: 50, h: 20 },
  df: { x: 60, y: 185, w: 50, h: 20 },
  mg: { x: 60, y: 210, w: 50, h: 20 },
  sp: { x: 60, y: 235, w: 50, h: 20 },
  weapon: { x: 50, y: 300, w: 150, h: 25 },
  magicList: { x: 50, y: 330, w: 150, h: 100 },
};

export const RIGHT_CARD_ROIS: Record<string, ROI> = {
  job: { x: 450, y: 80, w: 150, h: 30 },
  hp: { x: 450, y: 120, w: 120, h: 25 },
  at: { x: 460, y: 160, w: 50, h: 20 },
  df: { x: 460, y: 185, w: 50, h: 20 },
  mg: { x: 460, y: 210, w: 50, h: 20 },
  sp: { x: 460, y: 235, w: 50, h: 20 },
  weapon: { x: 450, y: 300, w: 150, h: 25 },
  magicList: { x: 450, y: 330, w: 150, h: 100 },
};

// Overlay guide positions for manual alignment UI
export const OVERLAY_GUIDES = {
  leftCardFrame: { x: 40, y: 50, w: 200, h: 450 },
  rightCardFrame: { x: 440, y: 50, w: 200, h: 450 },
  leftStatRegion: { x: 50, y: 150, w: 80, h: 120 },
  rightStatRegion: { x: 450, y: 150, w: 80, h: 120 },
};
