const fs = require('fs');
let code = fs.readFileSync('src/components/ChartsView.tsx', 'utf8');

code = code.replace(
  "      {/* Filter and Control Bar - Bento Style */}",
  "      )} {/* End Bento Grid */}\n\n      {/* Filter and Control Bar - Bento Style */}"
);

fs.writeFileSync('src/components/ChartsView.tsx', code);
