import { useState, useMemo } from 'react'
import { CharacterState } from './types'
import { calculateAllAttackDamage, calculateAllStrikeDamage, calculateAllMagicDamage, calculateAccuracy } from './core/calculator'
import { DamageTable } from './components/DamageTable'
import { Dropdown } from './components/Dropdown'
import { ImageAlignment } from './components/ImageAlignment'
import { OCRDebugger } from './components/OCRDebugger'
import { isProficient, getJobNames, getWeaponNames, getDefensiveMagicNames, getOffensiveMagicNames } from './core/reference/loader'
import { extractCharacterStats } from './core/ocr/parser'
import { matchJob, matchWeapon, matchOffensiveMagic, matchDefensiveMagic } from './core/reference/matcher'
import exampleDokapon from './assets/example-Dokapon.png'

function App() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [alignedScreenshot, setAlignedScreenshot] = useState<string | null>(null);
  const [isAligning, setIsAligning] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [perspective, setPerspective] = useState<'leftAttacks' | 'rightAttacks'>('leftAttacks');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSuccess, setExtractionSuccess] = useState(false);

  // Get reference data for dropdowns
  const jobs = useMemo(() => getJobNames(), []);
  const weapons = useMemo(() => getWeaponNames(), []);
  const defensiveMagic = useMemo(() => getDefensiveMagicNames(), []);
  const offensiveMagic = useMemo(() => getOffensiveMagicNames(), []);

  // Mock character state (will be populated by OCR later)
  const [leftChar, setLeftChar] = useState<Partial<CharacterState>>({
    hpCurrent: 50,
    hpMax: 100,
    at: 20,
    df: 15,
    mg: 10,
    sp: 12,
    job: 'Warrior',
    weapon: 'Rapier',
    defensiveMagic: 'M Guard',
    offensiveMagic: undefined,
  });

  const [rightChar, setRightChar] = useState<Partial<CharacterState>>({
    hpCurrent: 45,
    hpMax: 90,
    at: 12,
    df: 10,
    mg: 18,
    sp: 14,
    job: 'Magician',
    weapon: 'Fairy Wand',
    defensiveMagic: 'M Guard+',
    offensiveMagic: 'Scorch',
  });

  const loadImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setScreenshot(imageData);
      setAlignedScreenshot(null);
      setIsAligning(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          loadImageFile(file);
          break;
        }
      }
    }
  };

  const handleAlignmentComplete = (alignedImageData: string, scale: number) => {
    setAlignedScreenshot(alignedImageData);
    setIsAligning(false);
    console.log('Alignment complete with scale:', scale);
  };

  const handleAlignmentCancel = () => {
    setIsAligning(false);
    setScreenshot(null);
  };

  const handleExtractData = async () => {
    const imageToUse = alignedScreenshot || screenshot;
    if (!imageToUse) return;

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionSuccess(false);

    try {
      console.log('Starting OCR extraction...');

      // Extract stats from both character cards
      const [leftStats, rightStats] = await Promise.all([
        extractCharacterStats(imageToUse, 'left'),
        extractCharacterStats(imageToUse, 'right'),
      ]);

      console.log('Left stats extracted:', leftStats);
      console.log('Right stats extracted:', rightStats);

      // Apply fuzzy matching to correct OCR errors
      const leftJobMatch = matchJob(leftStats.job);
      const leftWeaponMatch = matchWeapon(leftStats.weapon);
      const leftOffensiveMagicMatch = matchOffensiveMagic(leftStats.offensiveMagic);
      const leftDefensiveMagicMatch = matchDefensiveMagic(leftStats.defensiveMagic);
      const rightJobMatch = matchJob(rightStats.job);
      const rightWeaponMatch = matchWeapon(rightStats.weapon);
      const rightOffensiveMagicMatch = matchOffensiveMagic(rightStats.offensiveMagic);
      const rightDefensiveMagicMatch = matchDefensiveMagic(rightStats.defensiveMagic);

      console.log('Job matches:', { left: leftJobMatch, right: rightJobMatch });
      console.log('Weapon matches:', { left: leftWeaponMatch, right: rightWeaponMatch });
      console.log('Offensive magic matches:', { left: leftOffensiveMagicMatch, right: rightOffensiveMagicMatch });
      console.log('Defensive magic matches:', { left: leftDefensiveMagicMatch, right: rightDefensiveMagicMatch });

      // Update left character state
      const newLeftChar = {
        ...leftChar,
        job: leftJobMatch?.match ?? leftChar.job,
        weapon: leftWeaponMatch?.match ?? leftChar.weapon,
        offensiveMagic: leftOffensiveMagicMatch?.match ?? leftChar.offensiveMagic,
        defensiveMagic: leftDefensiveMagicMatch?.match ?? leftChar.defensiveMagic,
        hpCurrent: leftStats.hp ?? leftChar.hpCurrent,
        hpMax: leftStats.hp ?? leftChar.hpMax,
        at: leftStats.at ?? leftChar.at,
        df: leftStats.df ?? leftChar.df,
        mg: leftStats.mg ?? leftChar.mg,
        sp: leftStats.sp ?? leftChar.sp,
      };

      // Update right character state
      const newRightChar = {
        ...rightChar,
        job: rightJobMatch?.match ?? rightChar.job,
        weapon: rightWeaponMatch?.match ?? rightChar.weapon,
        offensiveMagic: rightOffensiveMagicMatch?.match ?? rightChar.offensiveMagic,
        defensiveMagic: rightDefensiveMagicMatch?.match ?? rightChar.defensiveMagic,
        hpCurrent: rightStats.hp ?? rightChar.hpCurrent,
        hpMax: rightStats.hp ?? rightChar.hpMax,
        at: rightStats.at ?? rightChar.at,
        df: rightStats.df ?? rightChar.df,
        mg: rightStats.mg ?? rightChar.mg,
        sp: rightStats.sp ?? rightChar.sp,
      };

      console.log('New left character:', newLeftChar);
      console.log('New right character:', newRightChar);

      setLeftChar(newLeftChar);
      setRightChar(newRightChar);

      // Log confidence warnings if needed
      if (leftJobMatch && leftJobMatch.confidence < 0.7) {
        console.warn('Low confidence left job match:', leftJobMatch);
      }
      if (rightJobMatch && rightJobMatch.confidence < 0.7) {
        console.warn('Low confidence right job match:', rightJobMatch);
      }
      if (leftWeaponMatch && leftWeaponMatch.confidence < 0.7) {
        console.warn('Low confidence left weapon match:', leftWeaponMatch);
      }
      if (rightWeaponMatch && rightWeaponMatch.confidence < 0.7) {
        console.warn('Low confidence right weapon match:', rightWeaponMatch);
      }

      console.log('✓ OCR extraction completed successfully!');
      setExtractionSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setExtractionSuccess(false), 3000);

    } catch (error) {
      console.error('OCR extraction failed:', error);
      setExtractionError(error instanceof Error ? error.message : 'Failed to extract stats');
    } finally {
      setIsExtracting(false);
    }
  };

  // Helper to check if character state is valid for calculations
  const isValidChar = (char: Partial<CharacterState>): char is CharacterState => {
    return !!(
      char.hpCurrent !== undefined &&
      char.hpMax !== undefined &&
      char.at !== undefined &&
      char.df !== undefined &&
      char.mg !== undefined &&
      char.sp !== undefined &&
      char.job &&
      char.weapon
    );
  };

  // Calculate damage based on perspective
  const damageResults = useMemo(() => {
    const attacker = perspective === 'leftAttacks' ? leftChar : rightChar;
    const defender = perspective === 'leftAttacks' ? rightChar : leftChar;

    if (!isValidChar(attacker) || !isValidChar(defender)) {
      return { attack: null, strike: null, magic: null, accuracy: null };
    }

    return {
      attack: calculateAllAttackDamage(attacker, defender),
      strike: calculateAllStrikeDamage(attacker, defender),
      magic: calculateAllMagicDamage(attacker, defender),
      accuracy: calculateAccuracy(attacker, defender),
    };
  }, [leftChar, rightChar, perspective]);

  // Check proficiency for display
  const leftProficient = leftChar.job && leftChar.weapon
    ? isProficient(leftChar.job, leftChar.weapon)
    : 'unknown';
  const rightProficient = rightChar.job && rightChar.weapon
    ? isProficient(rightChar.job, rightChar.weapon)
    : 'unknown';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Dokapon Kingdom - Damage Calculator</h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload, align, and calculate battle damage in one view
          </p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* LEFT PANEL: Screenshot Upload & OCR */}
          <div className="space-y-6">

            {/* Upload & Extract Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                Screenshot Upload
              </h2>

              {!screenshot ? (
                <label
                  tabIndex={0}
                  onPaste={handlePaste}
                  className="relative block border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-blue-400 focus:border-blue-400 focus:outline-none transition-colors cursor-pointer text-center overflow-hidden"
                  style={{
                    backgroundImage: `url(${exampleDokapon})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div className="absolute inset-0 bg-gray-800/85" />
                  <div className="relative z-10">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-400">
                      Click to upload, drag and drop, or paste from clipboard
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Character comparison screenshot (PNG, JPG)
                    </p>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={alignedScreenshot || screenshot}
                      alt="Uploaded screenshot"
                      className="w-full rounded border border-gray-700"
                    />
                    {alignedScreenshot && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        ✓ Aligned
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleExtractData}
                        disabled={isExtracting || !alignedScreenshot}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors font-medium"
                      >
                        {isExtracting ? 'Extracting...' : 'Extract Stats (OCR)'}
                      </button>
                      <button
                        onClick={() => setIsAligning(true)}
                        disabled={isExtracting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors text-sm"
                      >
                        Re-align
                      </button>
                      <button
                        onClick={() => setShowDebugger(true)}
                        disabled={!alignedScreenshot}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors text-sm"
                      >
                        Debug
                      </button>
                      <button
                        onClick={() => {
                          setScreenshot(null);
                          setAlignedScreenshot(null);
                        }}
                        disabled={isExtracting}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    {!alignedScreenshot && (
                      <div className="text-yellow-400 text-sm p-2 bg-yellow-900/20 rounded">
                        Please align the screenshot before extracting stats
                      </div>
                    )}
                    {extractionSuccess && (
                      <div className="text-green-400 text-sm p-2 bg-green-900/20 rounded">
                        Stats extracted successfully! Check the character panels below.
                      </div>
                    )}
                    {extractionError && (
                      <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded">
                        {extractionError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Character Data & Results */}
          <div className="space-y-6">

            {/* Character Stats Review */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Character Stats
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Left Character */}
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold text-blue-400 mb-3 text-center">Left Character</h3>
                  <div className="space-y-2 text-sm">
                    <Dropdown
                      label="Job"
                      value={leftChar.job}
                      onChange={(value) => setLeftChar({ ...leftChar, job: value })}
                      options={jobs}
                      placeholder="Select job..."
                    />

                    <Dropdown
                      label="Weapon"
                      value={leftChar.weapon}
                      onChange={(value) => setLeftChar({ ...leftChar, weapon: value })}
                      options={weapons}
                      placeholder="Select weapon..."
                      badge={leftProficient === true ? '✓ Proficient (+30%)' : leftProficient === false ? 'No proficiency' : ''}
                      badgeColor={leftProficient === true ? 'text-green-400' : 'text-gray-500'}
                    />

                    <div>
                      <label className="text-gray-400 text-xs">HP</label>
                      <input
                        type="number"
                        value={leftChar.hpCurrent}
                        onChange={(e) => setLeftChar({ ...leftChar, hpCurrent: Number(e.target.value), hpMax: Number(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-gray-400 text-xs">AT</label>
                        <input
                          type="number"
                          value={leftChar.at}
                          onChange={(e) => setLeftChar({ ...leftChar, at: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">DF</label>
                        <input
                          type="number"
                          value={leftChar.df}
                          onChange={(e) => setLeftChar({ ...leftChar, df: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">MG</label>
                        <input
                          type="number"
                          value={leftChar.mg}
                          onChange={(e) => setLeftChar({ ...leftChar, mg: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">SP</label>
                        <input
                          type="number"
                          value={leftChar.sp}
                          onChange={(e) => setLeftChar({ ...leftChar, sp: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>

                    <Dropdown
                      label="Defensive Magic"
                      value={leftChar.defensiveMagic}
                      onChange={(value) => setLeftChar({ ...leftChar, defensiveMagic: value })}
                      options={defensiveMagic}
                      placeholder="None"
                    />

                    <Dropdown
                      label="Offensive Magic"
                      value={leftChar.offensiveMagic}
                      onChange={(value) => setLeftChar({ ...leftChar, offensiveMagic: value })}
                      options={offensiveMagic}
                      placeholder="None"
                    />
                  </div>
                </div>

                {/* Right Character */}
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold text-red-400 mb-3 text-center">Right Character</h3>
                  <div className="space-y-2 text-sm">
                    <Dropdown
                      label="Job"
                      value={rightChar.job}
                      onChange={(value) => setRightChar({ ...rightChar, job: value })}
                      options={jobs}
                      placeholder="Select job..."
                    />

                    <Dropdown
                      label="Weapon"
                      value={rightChar.weapon}
                      onChange={(value) => setRightChar({ ...rightChar, weapon: value })}
                      options={weapons}
                      placeholder="Select weapon..."
                      badge={rightProficient === true ? '✓ Proficient (+30%)' : rightProficient === false ? 'No proficiency' : ''}
                      badgeColor={rightProficient === true ? 'text-green-400' : 'text-gray-500'}
                    />

                    <div>
                      <label className="text-gray-400 text-xs">HP</label>
                      <input
                        type="number"
                        value={rightChar.hpCurrent}
                        onChange={(e) => setRightChar({ ...rightChar, hpCurrent: Number(e.target.value), hpMax: Number(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-gray-400 text-xs">AT</label>
                        <input
                          type="number"
                          value={rightChar.at}
                          onChange={(e) => setRightChar({ ...rightChar, at: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">DF</label>
                        <input
                          type="number"
                          value={rightChar.df}
                          onChange={(e) => setRightChar({ ...rightChar, df: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">MG</label>
                        <input
                          type="number"
                          value={rightChar.mg}
                          onChange={(e) => setRightChar({ ...rightChar, mg: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">SP</label>
                        <input
                          type="number"
                          value={rightChar.sp}
                          onChange={(e) => setRightChar({ ...rightChar, sp: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>

                    <Dropdown
                      label="Defensive Magic"
                      value={rightChar.defensiveMagic}
                      onChange={(value) => setRightChar({ ...rightChar, defensiveMagic: value })}
                      options={defensiveMagic}
                      placeholder="None"
                    />

                    <Dropdown
                      label="Offensive Magic"
                      value={rightChar.offensiveMagic}
                      onChange={(value) => setRightChar({ ...rightChar, offensiveMagic: value })}
                      options={offensiveMagic}
                      placeholder="None"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Damage Results */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Damage Results
              </h2>

              {/* Perspective Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setPerspective('leftAttacks')}
                  className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                    perspective === 'leftAttacks'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  You Attack (Left → Right)
                </button>
                <button
                  onClick={() => setPerspective('rightAttacks')}
                  className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                    perspective === 'rightAttacks'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  You Defend (Right → Left)
                </button>
              </div>

              {/* Damage Tables */}
              <div className="space-y-4">
                <DamageTable
                  title="Attack"
                  color="text-yellow-400"
                  results={damageResults.attack}
                  accuracy={damageResults.accuracy ?? undefined}
                />

                <DamageTable
                  title="Strike"
                  color="text-purple-400"
                  results={damageResults.strike}
                  accuracy={damageResults.accuracy ?? undefined}
                />

                <DamageTable
                  title="Offensive Magic"
                  color="text-cyan-400"
                  results={damageResults.magic}
                  disabled={!damageResults.magic}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-gray-500 text-sm py-4 mt-8 border-t border-gray-800">
        Dokapon Kingdom fan calculator - Not affiliated with Sting Entertainment
      </footer>

      {/* Alignment Modal */}
      {isAligning && screenshot && (
        <ImageAlignment
          imageData={screenshot}
          onAlignmentComplete={handleAlignmentComplete}
          onCancel={handleAlignmentCancel}
        />
      )}

      {/* OCR Debug Modal */}
      {showDebugger && alignedScreenshot && (
        <OCRDebugger
          imageData={alignedScreenshot}
          onClose={() => setShowDebugger(false)}
        />
      )}
    </div>
  )
}

export default App
