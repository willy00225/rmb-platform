const TARGET = "http://localhost:3001";
const CONCURRENT = 100;   // nombre de requêtes simultanées
const TOTAL_REQUESTS = 1000;

async function fetchUrl(url) {
  const start = Date.now();
  try {
    const res = await fetch(url);
    const duration = Date.now() - start;
    return { url, status: res.status, duration, ok: res.ok };
  } catch (err) {
    return { url, status: 0, duration: Date.now() - start, ok: false, error: err.message };
  }
}

async function batch(urls) {
  const results = await Promise.all(urls.map(url => fetchUrl(url)));
  return results;
}

async function main() {
  console.log(`Test de charge : ${TOTAL_REQUESTS} requêtes, ${CONCURRENT} en parallèle`);
  const startAll = Date.now();
  const allUrls = new Array(TOTAL_REQUESTS).fill(`${TARGET}/api/site-config`);
  const results = [];
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT) {
    const batchUrls = allUrls.slice(i, i + CONCURRENT);
    const batchResults = await batch(batchUrls);
    results.push(...batchResults);
    process.stdout.write(".");
  }
  const totalTime = Date.now() - startAll;
  const success = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  const avgTime = success.reduce((sum, r) => sum + r.duration, 0) / success.length;
  console.log("\nTerminé.");
  console.log(`Succès : ${success.length}/${TOTAL_REQUESTS}`);
  console.log(`Échecs : ${failed.length}`);
  console.log(`Temps moyen : ${avgTime.toFixed(0)} ms`);
  console.log(`Temps total : ${totalTime} ms`);
  console.log(`Requêtes/sec : ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(1)}`);
}

main().catch(console.error);