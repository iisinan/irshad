const https = require('https');
https.get('https://iirshad.com/assets/index-CnvUYmTz.js', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    require('fs').writeFileSync('/tmp/live_index.js', data);
    console.log('Saved to /tmp/live_index.js. Size:', data.length);
  });
});
