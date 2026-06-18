const fs = require('fs');
fetch('https://mit-paradh-default-rtdb.firebaseio.com/users.json?shallow=false')
  .then(r => r.json())
  .then(users => {
    const result = {};
    for (const uid in users) {
      const user = users[uid];
      const role = user?.role;
      const modules = user?.modules || {};
      const coursesCount = modules.courses ? Object.keys(modules.courses).length : 0;
      const collegesCount = modules.colleges ? Object.keys(modules.colleges).length : 0;
      
      if (role === 'admin' || coursesCount > 0 || collegesCount > 0) {
        result[uid] = { role, coursesCount, collegesCount };
      }
    }
    fs.writeFileSync('db_dump.json', JSON.stringify(result, null, 2));
    console.log('Saved to db_dump.json');
  })
  .catch(console.error);
