const fs = require('fs');
let code = fs.readFileSync('src/components/ChartsView.tsx', 'utf8');

code = code.replace(
  "      {/* Detailed Charts Table */}",
  "      )} {/* End Bento Grid */}\n\n      {/* Detailed Charts Table */}"
);

fs.writeFileSync('src/components/ChartsView.tsx', code);
