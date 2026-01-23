import { AzureNamedKeyCredential, BlobServiceClient } from "@azure/storage-blob";
import { parseStringPromise } from "xml2js";

const STORAGE_CONNECTION_STRING = process.env["BLOB_CONNECTION_STRING"];
const CONTAINER_NAME = "rss-feeds";

/**
 * API endpoint: /api/rss-latest?customer=absa-group
 * Returns latest RSS feed for the given customer as JSON (news table rows)
 */
export default async function (context, req) {
  const customer = (req.query.customer || req.body?.customer || "").toLowerCase();
  if (!customer) {
    context.res = { status: 400, body: { error: "Missing customer parameter" } };
    return;
  }
  if (!STORAGE_CONNECTION_STRING) {
    context.res = { status: 500, body: { error: "Missing blob connection string" } };
    return;
  }
  try {
    const blobService = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
    const container = blobService.getContainerClient(CONTAINER_NAME);
    // List blobs for this customer, sort by date descending
    let latestBlob = null;
    let latestDate = 0;
    for await (const blob of container.listBlobsFlat()) {
      if (blob.name.startsWith(`${customer}-news-`) && blob.name.endsWith('.xml')) {
        // Extract date from name: customer-news-YYYY-MM-DD-HH-MM.xml
        const parts = blob.name.split("-");
        if (parts.length >= 7) {
          const dateStr = parts.slice(-6, -1).join("-"); // YYYY-MM-DD-HH-MM
          const date = new Date(dateStr.replace(/-/g, "/")).getTime();
          if (date > latestDate) {
            latestDate = date;
            latestBlob = blob.name;
          }
        }
      }
    }
    if (!latestBlob) {
      context.res = { status: 404, body: { error: "No RSS feed found for customer" } };
      return;
    }
    // Download and parse XML
    const blobClient = container.getBlobClient(latestBlob);
    const download = await blobClient.download();
    const xml = (await streamToBuffer(download.readableStreamBody)).toString();
    const parsed = await parseStringPromise(xml, { explicitArray: false });
    // Extract news items (RSS 2.0)
    const items = parsed?.rss?.channel?.item || [];
    const news = Array.isArray(items) ? items : [items];
    // Map to table rows
    const rows = news.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.description,
      guid: item.guid,
    }));
    context.res = { status: 200, body: { customer, latestBlob, rows } };
  } catch (err) {
    context.res = { status: 500, body: { error: err.message } };
  }
}

function streamToBuffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (data) => chunks.push(data));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}
