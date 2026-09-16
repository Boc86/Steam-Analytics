const fs = require('fs');
let code = fs.readFileSync('src/components/GameDetailModal.tsx', 'utf8');

// 1. Add state
code = code.replace(
  "const [copiedLaunch, setCopiedLaunch] = useState(false);",
  "const [copiedLaunch, setCopiedLaunch] = useState(false);\n  const [activeTab, setActiveTab] = useState<'overview' | 'economy'>('overview');\n  const [regionalPrices, setRegionalPrices] = useState<any[]>([]);\n  const [loadingPrices, setLoadingPrices] = useState(false);\n\n  useEffect(() => {\n    if (activeTab === 'economy' && regionalPrices.length === 0) {\n      setLoadingPrices(true);\n      fetch(`/api/steam/game/${game.id}/regional-prices`)\n        .then(r => r.json())\n        .then(d => {\n          if (d.success) setRegionalPrices(d.prices);\n          setLoadingPrices(false);\n        })\n        .catch(() => setLoadingPrices(false));\n    }\n  }, [activeTab, game.id]);\n"
);

// 2. Add Tab Bar
const tabBar = `
        {/* Tab Bar */}
        <div className="flex items-center gap-6 px-6 bg-slate-950 border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('overview')}
            className={\`px-1 py-3 text-sm font-semibold tracking-wide border-b-2 transition-colors \${activeTab === 'overview' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}\`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('economy')}
            className={\`px-1 py-3 text-sm font-semibold tracking-wide border-b-2 transition-colors \${activeTab === 'economy' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}\`}
          >
            Economy & Regions
          </button>
        </div>
`;

code = code.replace(
  "        {/* Scrollable Content */}",
  tabBar + "\n        {/* Scrollable Content */}"
);

// 3. Render content conditionally
const contentWrapperStart = `        {/* Scrollable Content */}\n        <div className="overflow-y-auto flex-1 min-h-[40vh] p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">\n          {activeTab === 'overview' ? (\n            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;
code = code.replace(
  "        {/* Scrollable Content */}\n        <div className=\"overflow-y-auto flex-1 min-h-[40vh] p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent\">\n          <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">",
  contentWrapperStart
);

const economyRender = `
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Regional Pricing</h3>
                  <p className="text-sm text-slate-400">Compare base prices across global currencies</p>
                </div>
              </div>
              
              {loadingPrices ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <p className="text-sm text-slate-400 animate-pulse font-mono">Querying global store servers...</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <th className="py-4 px-6">Region</th>
                        <th className="py-4 px-6">Currency</th>
                        <th className="py-4 px-6 text-right">Local Price</th>
                        <th className="py-4 px-6 text-right">Converted (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {regionalPrices.map((rp, i) => {
                        const isUS = rp.currencyCode === 'USD';
                        // Simple rough hardcoded conversion for demonstration/prototype if not pulling live FX
                        // Since we just fetched them locally from Steam directly, let's just display Local Price 
                        // To accurately do "Converted (USD)", we'd need FX rates. Let's just show Local Price for Phase 1.
                        return (
                          <tr key={i} className={\`hover:bg-slate-800/40 transition-colors \${isUS ? 'bg-slate-800/30' : ''}\`}>
                            <td className="py-4 px-6 flex items-center gap-3">
                              {isUS && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                              <span className="font-sans font-medium text-slate-200">{rp.region}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-400">{rp.currencyCode}</td>
                            <td className="py-4 px-6 text-right font-bold text-emerald-400">{rp.priceFormatted}</td>
                            <td className="py-4 px-6 text-right text-slate-500">
                              {isUS ? 'Base' : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {regionalPrices.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No regional pricing data available for this title.</div>
                  )}
                </div>
              )}
            </div>
          )}
`;

code = code.replace(
  "          </div>\n        </div>\n      </div>\n    </div>\n  );\n};\n",
  economyRender + "        </div>\n      </div>\n    </div>\n  );\n};\n"
);

fs.writeFileSync('src/components/GameDetailModal.tsx', code);
