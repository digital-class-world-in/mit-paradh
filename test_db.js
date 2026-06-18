const https = require('https');
https.get('https://mit-paradh-default-rtdb.firebaseio.com/settings/website/home.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Keys:', Object.keys(parsed));
      console.log('Notices count:', parsed.notices ? parsed.notices.length : 0);
      console.log('Related videos count:', parsed.relatedVideos ? parsed.relatedVideos.length : 0);
      if (parsed.notices && parsed.notices.length > 0) {
        console.log('First notice:', JSON.stringify(parsed.notices[0]).substring(0, 100));
      }
    } catch (e) {
      console.error('Failed to parse:', e.message);
      console.log('Raw length:', data.length);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
