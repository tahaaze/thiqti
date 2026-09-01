const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, 'apps/web/src/data/cars-snapshot.ts'), 'utf8');
const start = content.indexOf('`') + 1;
const end = content.lastIndexOf('`');
const json = content.substring(start, end);
fs.writeFileSync(path.join(__dirname, 'apps/web/src/data/cars-snapshot.json'), json);
console.log('Written:', fs.statSync(path.join(__dirname, 'apps/web/src/data/cars-snapshot.json')).size, 'bytes');
