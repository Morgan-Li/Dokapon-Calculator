# Dokapon Kingdom - Damage Calculator

A web-based damage calculator for Dokapon Kingdom battles. Upload a character comparison screenshot, and the app will extract stats via OCR and calculate damage outcomes for Attack, Strike, and Offensive Magic.

## Features

- **Screenshot OCR**: Upload character comparison screenshots and extract stats automatically
- **Manual Alignment**: Align screenshots to overlay guides for accurate ROI extraction
- **Smart Correction**: Review and correct extracted data with fuzzy-matched suggestions
- **Damage Calculations**: Calculate min/max damage for all attack types and defender reactions
- **Perspective Toggle**: Switch between "You Attack" and "You Defend" views

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Tesseract.js** - Client-side OCR
- **react-zoom-pan-pinch** - Image alignment
- **Fuse.js** - Fuzzy string matching

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This app is designed to deploy to **Netlify** (free tier).

### Deploy to Netlify

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repo
   - Build settings are auto-detected from `netlify.toml`
   - Click "Deploy"

3. **Your site will be live at**: `https://dokapon-calculator.netlify.app`

### Manual Deploy (Alternative)

```bash
npm run build
npx netlify-cli deploy --prod
```

## Project Structure

```
dokapon-calculator/
├── src/
│   ├── components/          # React components
│   ├── core/
│   │   ├── ocr/            # OCR and parsing logic
│   │   ├── calculator/     # Damage calculation modules
│   │   └── reference/      # Reference data matching
│   ├── data/               # Static game data (JSON)
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── netlify.toml           # Netlify config
└── vite.config.ts         # Vite config
```

## Development Roadmap

### MVP (Current)
- [ ] Screenshot upload + alignment UI
- [ ] OCR extraction for stats, job, weapon, magic
- [ ] Review UI with correction dropdowns
- [ ] Reference data (jobs, weapons, spells)
- [ ] Damage calculators (Attack, Strike, Magic)
- [ ] Results UI with perspective toggle

### Future Enhancements
- [ ] Auto-alignment with anchors
- [ ] Multiple screenshot types (battle screen, spell selection)
- [ ] Item/proc effects
- [ ] Win% simulation
- [ ] Best action planner

## Contributing

This is a fan project. Contributions welcome via pull requests.

## License

MIT - Not affiliated with Sting Entertainment or Dokapon Kingdom.

## Reference

- [Dokapon Kingdom Wiki](https://dokapon.fandom.com/wiki/Dokapon_Kingdom)
- [Weapons](https://dokapon.fandom.com/wiki/Weapon_(Kingdom))
- [Jobs](https://dokapon.fandom.com/wiki/Job)
- [Defensive Magic](https://dokapon.fandom.com/wiki/Defensive_Magic_(Kingdom))
- [Offensive Magic](https://dokapon.fandom.com/wiki/Offensive_Magic_(Kingdom))
