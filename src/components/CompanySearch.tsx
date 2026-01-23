import { useState } from "react";

const COMPANIES = [
  "Naspers", "MTN Group", "Sasol", "Standard Bank", "FirstRand", "Shoprite", "Vodacom",
  "Discovery Limited", "Capitec Bank", "Anglo American Platinum", "Absa Group", "Old Mutual",
  "Sanlam", "Nedbank", "Pick n Pay", "Woolworths South Africa", "Bidvest", "Tiger Brands",
  "Clicks Group", "Mr Price", "Multichoice", "Sibanye Stillwater", "Kumba Iron Ore", "Exxaro",
  "Life Healthcare", "Netcare", "Mediclinic", "Telkom South Africa", "Remgro", "PSG Group",
  "Microsoft", "Google", "Amazon", "Apple", "Meta", "Nvidia", "OpenAI", "Salesforce", "SAP", "Oracle"
];

export function CompanySearch({ onCompanySelected }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleInput(e) {
    const value = e.target.value;
    setQuery(value);
    setSuggestions(
      value ? COMPANIES.filter((c) => c.toLowerCase().includes(value.toLowerCase())) : []
    );
  }

  async function handleSelect(company) {
    setQuery(company);
    setSuggestions([]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trigger-news-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      onCompanySelected(company);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <input
        value={query}
        onChange={handleInput}
        placeholder="Search company..."
        className="input border px-3 py-2 rounded w-full"
        disabled={loading}
      />
      {suggestions.length > 0 && (
        <ul className="border rounded bg-white shadow mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((c) => (
            <li
              key={c}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(c)}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
      {loading && <div className="text-blue-600 mt-2">Triggering Logic App…</div>}
      {error && <div className="text-red-600 mt-2">Error: {error}</div>}
    </div>
  );
}
