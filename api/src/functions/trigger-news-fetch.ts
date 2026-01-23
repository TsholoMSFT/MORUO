import fetch from "node-fetch";

const LOGIC_APP_URL = process.env["LOGIC_APP_URL"];

export default async function (context, req) {
  const company = req.body?.company || req.query.company;
  if (!company) {
    context.res = { status: 400, body: { error: "Missing company parameter" } };
    return;
  }
  if (!LOGIC_APP_URL) {
    context.res = { status: 500, body: { error: "Missing LOGIC_APP_URL env var" } };
    return;
  }
  try {
    const res = await fetch(LOGIC_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company }),
    });
    const data = await res.json();
    context.res = { status: res.status, body: data };
  } catch (err) {
    context.res = { status: 500, body: { error: err.message } };
  }
}
