// S.U.G.A.M. — full route/API smoke test across all 7 demo roles.
// Usage: node scripts/smoke_all_routes.mjs [baseUrl]
const BASE = process.argv[2] || "http://localhost:3000";

const ROLES = [
  ["student", "student@sugam.demo"],
  ["student2", "student2@sugam.demo"],
  ["faculty", "faculty@sugam.demo"],
  ["college", "college@sugam.demo"],
  ["intake", "intake@sugam.demo"],
  ["bureau", "bureau@sugam.demo"],
  ["reviewer", "reviewer@sugam.demo"],
  ["auditor", "auditor@sugam.demo"],
  ["admin", "admin@sugam.demo"],
];

// Every GET route + the role expected to be able to call it (others may 403; 401 = BUG)
const ROUTES = [
  ["/api/v1/health", "*"],
  ["/api/v1/auth/me", "*"],
  ["/api/v1/dashboard/summary", "*"],
  ["/api/v1/dashboard/workload", "INTAKE_OFFICER,BUREAU_OFFICER,REVIEWING_OFFICER,PLATFORM_ADMIN"],
  ["/api/v1/cases?pageSize=50", "COMPLAINANT,INTAKE_OFFICER,BUREAU_OFFICER,REVIEWING_OFFICER,AUDITOR,PLATFORM_ADMIN"],
  ["/api/v1/institutions?pageSize=50", "*"],
  ["/api/v1/notifications", "*"],
  ["/api/v1/admin/reports", "INSTITUTION_OFFICER,INTAKE_OFFICER,REVIEWING_OFFICER,PLATFORM_ADMIN"],
  ["/api/v1/admin/users", "PLATFORM_ADMIN"],
  ["/api/v1/admin/scores", "PLATFORM_ADMIN,REVIEWING_OFFICER,AUDITOR"],
  ["/api/v1/admin/templates", "PLATFORM_ADMIN,INSTITUTION_OFFICER,INTAKE_OFFICER,BUREAU_OFFICER,REVIEWING_OFFICER"],
  ["/api/v1/audit/events?page=1&pageSize=20", "AUDITOR,REVIEWING_OFFICER,PLATFORM_ADMIN"],
  ["/api/v1/audit/verify", "AUDITOR,REVIEWING_OFFICER,PLATFORM_ADMIN"],
  ["/api/v1/imports/runs", "PLATFORM_ADMIN,INTAKE_OFFICER"],
  ["/api/v1/integrations/status", "PLATFORM_ADMIN,INTAKE_OFFICER"],
  ["/api/v1/officers", "INTAKE_OFFICER,BUREAU_OFFICER,REVIEWING_OFFICER,PLATFORM_ADMIN"],
];

async function jfetch(path, opts = {}, cookie = null) {
  const headers = { ...(opts.headers || {}) };
  if (opts.json !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(BASE + path, {
    method: opts.method || (opts.json !== undefined ? "POST" : "GET"),
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, setCookie: res.headers.get("set-cookie") };
}

function roleOf(body) {
  return body?.data?.user?.primaryRole || body?.user?.primaryRole || "?";
}

const results = [];
let bugs = 0;

for (const [label, email] of ROLES) {
  const login = await jfetch("/api/v1/auth/login", { json: { email, password: "demo123" } });
  if (login.status !== 200 || !login.body?.success) {
    console.log(`✗ LOGIN ${label} (${email}) → ${login.status} ${JSON.stringify(login.body?.error || {})}`);
    bugs++;
    continue;
  }
  const setc = login.setCookie || "";
  const m = setc.match(/sugam_token=[^;]+/);
  if (!m) { console.log(`✗ LOGIN ${label}: 200 but NO Set-Cookie!`); bugs++; continue; }
  const cookie = m[0];
  const role = roleOf(login.body);

  // session verification immediately after login (cookie must resolve)
  const me = await jfetch("/api/v1/auth/me", {}, cookie);
  if (me.status !== 200) { console.log(`✗ ${label}: auth/me right after login → ${me.status} (cookie race!)`); bugs++; }

  for (const [path, allowed] of ROUTES) {
    const r = await jfetch(path, {}, cookie);
    let verdict = "ok";
    if (allowed === "*") {
      if (r.status !== 200) { verdict = "BUG(expected 200)"; bugs++; }
    } else {
      const list = allowed.split(",");
      if (list.includes(role)) {
        if (r.status !== 200) { verdict = "BUG(expected 200)"; bugs++; }
      } else {
        if (r.status === 401) { verdict = "BUG(401 should be 403)"; bugs++; }
        else if (r.status !== 403 && r.status !== 200) { verdict = `BUG(unexpected ${r.status})`; bugs++; }
      }
    }
    results.push(`${verdict === "ok" ? "·" : "✗"} ${label.padEnd(9)} ${role.padEnd(20)} GET ${path} → ${r.status} ${verdict !== "ok" ? "  <<< " + verdict : ""}`);
  }
}

console.log(results.join("\n"));
console.log(`\n${bugs === 0 ? "✔ ALL ROUTE CHECKS PASSED" : `✗ ${bugs} ROUTE BUG(S) FOUND`}`);
process.exit(bugs === 0 ? 0 : 1);
