const http = require('http');
const fs = require('fs');

http.get('http://127.0.0.1:9002/api/debug', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('debug_output.json', data);
    console.log('Saved to debug_output.json');
  });
}).on('error', err => {
  console.error(err.message);
});
