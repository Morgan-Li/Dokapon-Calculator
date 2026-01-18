import { useState } from 'react'
import { CharacterState } from './types'

function App() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<'leftAttacks' | 'rightAttacks'>('leftAttacks');

  // Mock character state (will be populated by OCR later)
  const [leftChar, setLeftChar] = useState<Partial<CharacterState>>({
    hpCurrent: 0,
    hpMax: 0,
    at: 0,
    df: 0,
    mg: 0,
    sp: 0,
    job: '',
    weapon: '',
  });

  const [rightChar, setRightChar] = useState<Partial<CharacterState>>({
    hpCurrent: 0,
    hpMax: 0,
    at: 0,
    df: 0,
    mg: 0,
    sp: 0,
    job: '',
    weapon: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshot(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractData = () => {
    // TODO: Implement OCR extraction
    alert('OCR extraction will be implemented next!');
  };

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

          {/* LEFT PANEL: Screenshot Upload & Alignment */}
          <div className="space-y-6">

            {/* Upload Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                Upload Screenshot
              </h2>

              {!screenshot ? (
                <label className="block border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer text-center">
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
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Character comparison screenshot (PNG, JPG)
                  </p>
                </label>
              ) : (
                <div className="space-y-4">
                  <img
                    src={screenshot}
                    alt="Uploaded screenshot"
                    className="w-full rounded border border-gray-700"
                  />
                  <button
                    onClick={() => setScreenshot(null)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove screenshot
                  </button>
                </div>
              )}
            </div>

            {/* Alignment Section */}
            {screenshot && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Align Screenshot
                </h2>

                <div className="bg-gray-700 rounded p-6 text-center">
                  <p className="text-gray-400 mb-4">
                    Pan and zoom the screenshot to align with overlay guides
                  </p>
                  <div className="text-sm text-gray-500 mb-4">
                    Alignment UI with overlay will go here
                  </div>
                  <button
                    onClick={handleExtractData}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                  >
                    Extract Data (OCR)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Character Data & Results */}
          <div className="space-y-6">

            {/* Character Stats Review */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                Character Stats
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Left Character */}
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold text-blue-400 mb-3 text-center">Left Character</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-gray-400 text-xs">Job</label>
                      <input
                        type="text"
                        value={leftChar.job}
                        onChange={(e) => setLeftChar({ ...leftChar, job: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        placeholder="Warrior"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Weapon</label>
                      <input
                        type="text"
                        value={leftChar.weapon}
                        onChange={(e) => setLeftChar({ ...leftChar, weapon: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        placeholder="Rapier"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-400 text-xs">HP</label>
                        <input
                          type="number"
                          value={leftChar.hpCurrent}
                          onChange={(e) => setLeftChar({ ...leftChar, hpCurrent: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">Max HP</label>
                        <input
                          type="number"
                          value={leftChar.hpMax}
                          onChange={(e) => setLeftChar({ ...leftChar, hpMax: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
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
                  </div>
                </div>

                {/* Right Character */}
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold text-red-400 mb-3 text-center">Right Character</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-gray-400 text-xs">Job</label>
                      <input
                        type="text"
                        value={rightChar.job}
                        onChange={(e) => setRightChar({ ...rightChar, job: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        placeholder="Magician"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Weapon</label>
                      <input
                        type="text"
                        value={rightChar.weapon}
                        onChange={(e) => setRightChar({ ...rightChar, weapon: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        placeholder="Staff"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-400 text-xs">HP</label>
                        <input
                          type="number"
                          value={rightChar.hpCurrent}
                          onChange={(e) => setRightChar({ ...rightChar, hpCurrent: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">Max HP</label>
                        <input
                          type="number"
                          value={rightChar.hpMax}
                          onChange={(e) => setRightChar({ ...rightChar, hpMax: Number(e.target.value) })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                      </div>
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
                  </div>
                </div>
              </div>
            </div>

            {/* Damage Results */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
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
                {/* Attack */}
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold mb-3 text-yellow-400">Attack</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="text-left pb-2">Defender Action</th>
                        <th className="text-right pb-2">Min</th>
                        <th className="text-right pb-2">Max</th>
                        <th className="text-right pb-2">KO?</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Defend</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Magic Defend</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Counter</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Can't React</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Strike */}
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold mb-3 text-purple-400">Strike</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="text-left pb-2">Defender Action</th>
                        <th className="text-right pb-2">Min</th>
                        <th className="text-right pb-2">Max</th>
                        <th className="text-right pb-2">KO?</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Defend</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Magic Defend</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Counter</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Can't React</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Magic */}
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-semibold mb-3 text-cyan-400">Offensive Magic</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="text-left pb-2">Defender Action</th>
                        <th className="text-right pb-2">Min</th>
                        <th className="text-right pb-2">Max</th>
                        <th className="text-right pb-2">KO?</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Defend</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Magic Defend</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Counter</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                      <tr className="border-t border-gray-600">
                        <td className="py-2">Can't React</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                        <td className="text-right">--</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-gray-500 text-sm py-4 mt-8 border-t border-gray-800">
        Dokapon Kingdom fan calculator - Not affiliated with Sting Entertainment
      </footer>
    </div>
  )
}

export default App
