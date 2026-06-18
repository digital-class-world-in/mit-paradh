'use client';

import { useState, useEffect } from 'react';

export default function ScopePage() {
  const [status, setStatus] = useState('Initializing...');
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function runScoping() {
      try {
        setStatus('Running scoping operation...');
        // We will execute the FS scoping logic directly on the server by hitting an action or we can do a fetch to a clean API.
        // Wait, if the API route itself had compilation errors, we can write the scoping logic in a server action or we can do it via a route that has no imports.
        // Let's call a minimal API route /api/run-scope which has no custom imports, just raw Node fs/path!
        const res = await fetch('/api/run-scope');
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
          setStatus('Completed successfully!');
        } else {
          setError(data.error || 'Unknown error');
          setStatus('Failed.');
        }
      } catch (err: any) {
        setError(err.message || err);
        setStatus('Error occurred.');
      }
    }
    runScoping();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Scoping Run Status: {status}</h1>
      {error && (
        <div style={{ color: 'red', margin: '20px 0', padding: 20, border: '1px solid red' }}>
          <h3>Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      <h3>Results:</h3>
      <ul>
        {results.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
