const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const gpRes = await fetch(`https://games-popularity.com/swagger/api/game/players/${appId}?apiKey=${apiKey}`);",
  "const gpRes = await fetch(`https://games-popularity.com/swagger/api/game/players/${appId}`, { headers: { 'ApiKey': apiKey } });"
);

fs.writeFileSync('server.ts', code);
