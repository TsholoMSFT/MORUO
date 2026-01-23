import { useEffect, useState } from "react";

interface NewsRow {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  guid?: string;
}

interface NewsFeedTableProps {
  customer: string;
}

export function NewsFeedTable({ customer }: NewsFeedTableProps) {
  const [rows, setRows] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    setError(null);
    fetch(`/api/rss-latest?customer=${encodeURIComponent(customer)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
      })
      .then((data) => setRows(data.rows || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer) return <div>Please select a customer.</div>;
  if (loading) return <div>Loading news feed…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!rows.length) return <div>No news found for this customer.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left">Title</th>
            <th className="px-3 py-2 text-left">Published</th>
            <th className="px-3 py-2 text-left">Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.guid || i} className="border-t">
              <td className="px-3 py-2 font-medium">{row.title}</td>
              <td className="px-3 py-2 whitespace-nowrap">{row.pubDate}</td>
              <td className="px-3 py-2">
                <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
