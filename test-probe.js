require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 4000;

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runProbe() {
  console.log(`--- PROBING LOCAL SERVERS (Backend Port: ${PORT}) ---`);
  try {
    const fe = await checkUrl('http://localhost:5173/');
    console.log('✅ Frontend Vite Server (http://localhost:5173/): HTTP Status', fe.status);
  } catch (e) {
    console.error('❌ Frontend Server Probe Error:', e.message);
  }

  try {
    const be = await checkUrl(`http://localhost:${PORT}/api/health`);
    console.log(`✅ Backend API Server (http://localhost:${PORT}/api/health): HTTP Status`, be.status);
  } catch (e) {
    console.error('❌ Backend Server Probe Error:', e.message);
  }
}

runProbe();
