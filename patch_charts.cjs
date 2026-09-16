const fs = require('fs');
let code = fs.readFileSync('src/components/ChartsView.tsx', 'utf8');

// Add viewMode state
code = code.replace(
  "const [discountOnly, setDiscountOnly] = useState(false);",
  "const [discountOnly, setDiscountOnly] = useState(false);\n  const [viewMode, setViewMode] = useState<'bento' | 'dense'>('bento');"
);

// Add toggle UI
const toggleUI = `
      {/* Top Bar with View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Trending Database
        </h2>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-1">
          <button 
            onClick={() => setViewMode('bento')}
            className={\`px-3 py-1.5 text-xs font-semibold rounded-md transition-all \${viewMode === 'bento' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}\`}
          >
            Bento View
          </button>
          <button 
            onClick={() => setViewMode('dense')}
            className={\`px-3 py-1.5 text-xs font-semibold rounded-md transition-all \${viewMode === 'dense' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}\`}
          >
            Dense List
          </button>
        </div>
      </div>
`;

code = code.replace(
  "    <div className=\"space-y-6\">",
  "    <div className=\"space-y-6\">\n" + toggleUI
);

// Hide bento grid based on viewMode
code = code.replace(
  "      {/* Bento Grid Showcase - Top Hero & Key Metric Tiles */}\n      <div className=\"grid grid-cols-1 lg:grid-cols-4 gap-4\">",
  "      {/* Bento Grid Showcase - Top Hero & Key Metric Tiles */}\n      {viewMode === 'bento' && (<div className=\"grid grid-cols-1 lg:grid-cols-4 gap-4\">"
);

code = code.replace(
  "      {/* Detailed Charts Table */}",
  "      )} {/* End Bento Grid */}\n\n      {/* Detailed Charts Table */}"
);

// Add layout to support new tools (List Layout)
code = code.replace(
  "import { Currency, SteamGame, ConcurrentTimeframe } from '../types';",
  "import { List, Grid } from 'lucide-react';\nimport { Currency, SteamGame, ConcurrentTimeframe } from '../types';"
);

fs.writeFileSync('src/components/ChartsView.tsx', code);
