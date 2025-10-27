(async () => {
  try {
    const url = 'https://token.jup.ag/strict?cluster=devnet';
    console.log('Fetching', url);
    const res = await fetch(url);
    console.log('status', res.status, res.statusText);
    const data = await res.json();
    if (Array.isArray(data)) {
      console.log('token array length:', data.length);
    } else if (typeof data === 'object' && data !== null) {
      console.log('token object keys:', Object.keys(data).length);
    } else {
      console.log('unknown token list shape:', typeof data);
    }
  } catch (err) {
    console.error('fetch error', err);
    process.exit(1);
  }
})();