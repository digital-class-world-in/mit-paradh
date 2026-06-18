
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyCcuNPJ1vExS-99EzbP6fa7f2Wp9u7on78",
  authDomain: "mit-paradh.firebaseapp.com",
  databaseURL: "https://mit-paradh-default-rtdb.firebaseio.com",
  projectId: "mit-paradh",
  storageBucket: "mit-paradh.appspot.com",
  messagingSenderId: "365449764500",
  appId: "1:365449764500:web:93f6c77873307612f12255"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkInquiries() {
  try {
    const collegesRef = ref(db, 'colleges');
    const snap = await get(collegesRef);
    if (!snap.exists()) {
      console.log("No colleges found");
      return;
    }
    const colleges = snap.val();
    let found = 0;
    Object.entries(colleges).forEach(([id, data]) => {
      if (data.frontOffice && data.frontOffice.admissionInquiries) {
        console.log(`College ${id} (${data.name}) has ${Object.keys(data.frontOffice.admissionInquiries).length} inquiries`);
        found++;
      }
    });
    if (found === 0) {
      console.log("No inquiries found in any college");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkInquiries();
