import { runHealthChecks } from './healthcheck.js';

runHealthChecks(true)
  .then((states) => {
    console.log('[healthcheck] Standalone health checks completed.');
    console.table(
      Object.entries(states).map(([name, data]) => ({
        Service: name,
        Status: data.status.toUpperCase(),
        'Last Checked': data.lastChecked,
        Error: data.error || '-',
      }))
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error('[healthcheck] Standalone health checks failed with a critical error:', err);
    process.exit(1);
  });
