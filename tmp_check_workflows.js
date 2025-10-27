(async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/workflows');
    console.log('status', res.status);
    const txt = await res.text();
    console.log('body', txt);
  } catch (e) {
    console.error('error', e.stack || e);
    process.exit(1);
  }
})();