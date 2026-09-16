const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { ChartsView } from './components/ChartsView';",
  "import { ChartsView } from './components/ChartsView';\nimport { LeaderboardsView } from './components/LeaderboardsView';"
);

code = code.replace(
  "        {activeTab === 'charts' && (",
  "        {activeTab === 'leaderboards' && (\n          <LeaderboardsView onSelectGameById={handleSelectGameById} />\n        )}\n\n        {activeTab === 'charts' && ("
);

fs.writeFileSync('src/App.tsx', code);
