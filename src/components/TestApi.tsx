import { useEffect, useState } from 'react';

export default function TestApi() {
  const [status, setStatus] = useState('Testing API...');
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    testApi();
  }, []);

  const testApi = async () => {
    const API_KEY = import.meta.env.VITE_ODDS_API_KEY;

    setStatus(`API Key: ${API_KEY ? 'Present' : 'Missing'}`);

    if (!API_KEY) {
      setStatus('ERROR: API Key is missing!');
      return;
    }

    try {
      setStatus('Fetching sports list...');
      const sportsUrl = `https://api.the-odds-api.com/v4/sports/?apiKey=${API_KEY}`;
      const sportsResponse = await fetch(sportsUrl);

      if (!sportsResponse.ok) {
        setStatus(`ERROR: Sports API returned ${sportsResponse.status} - ${sportsResponse.statusText}`);
        return;
      }

      const sports = await sportsResponse.json();
      setStatus(`Found ${sports.length} sports. Testing soccer_epl...`);

      const url = `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${API_KEY}&regions=us,uk,eu&markets=h2h&oddsFormat=decimal`;

      setStatus('Fetching EPL matches...');
      const response = await fetch(url);

      if (!response.ok) {
        setStatus(`ERROR: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        console.error('Response:', text);
        return;
      }

      const data = await response.json();
      setStatus(`SUCCESS: Got ${data.length} matches!`);
      setMatches(data);

    } catch (error: any) {
      setStatus(`ERROR: ${error.message}`);
      console.error('Test error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      <div className="bg-slate-800 p-4 rounded mb-4">
        <p className="font-mono">{status}</p>
      </div>

      {matches.length > 0 && (
        <div className="bg-slate-800 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Matches Found:</h2>
          {matches.slice(0, 5).map((match, i) => (
            <div key={i} className="mb-2 p-2 bg-slate-700 rounded">
              <p className="font-bold">{match.home_team} vs {match.away_team}</p>
              <p className="text-sm text-slate-400">{match.sport_title}</p>
              <p className="text-xs text-slate-500">{new Date(match.commence_time).toLocaleString()}</p>
            </div>
          ))}
          {matches.length > 5 && (
            <p className="text-slate-400 mt-2">...and {matches.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}
