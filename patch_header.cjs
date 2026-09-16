const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const leaderboardTab = `
        <button 
          onClick={() => setActiveTab('leaderboards')}
          className={\`flex items-center gap-2 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 \${
            activeTab === 'leaderboards'
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }\`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
          Leaderboards
        </button>
`;

code = code.replace(
  "        <button \n          onClick={() => setActiveTab('sales')}",
  leaderboardTab + "        <button \n          onClick={() => setActiveTab('sales')}"
);

// We need BarChart2 import in Header.tsx if it's not there.
if (!code.includes('BarChart2')) {
  code = code.replace("Search,", "Search, BarChart2,");
}

fs.writeFileSync('src/components/Header.tsx', code);
