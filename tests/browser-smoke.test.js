const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

let playwright;
try {
  playwright = require("playwright");
} catch (_) {
  playwright = null;
}

const root = path.resolve(__dirname, "..");

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const requestPath = new URL(request.url, "http://127.0.0.1").pathname;
    const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json" }[extension] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

test("static app initializes scoring before app, persists a pick, and resets", { skip: !playwright }, async () => {
  const server = await startStaticServer();
  const address = server.address();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "networkidle" });
    const boot = await page.evaluate(() => ({
      scoringReady: Boolean(window.FANTASY_SCORING && typeof window.FANTASY_SCORING.scorePlayer === "function"),
      scriptOrder: [...document.scripts].map((script) => script.getAttribute("src")),
      recommendations: document.querySelectorAll(".recommendation-option").length
    }));
    assert.ok(boot.scoringReady);
    assert.ok(boot.scriptOrder.indexOf("scoring.js") < boot.scriptOrder.indexOf("app.js"));
    assert.equal(boot.recommendations, 4);

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "I took" }).first().click();
    const afterPick = await page.evaluate(() => JSON.parse(localStorage.getItem("draftboard-2026-state-v1")));
    assert.equal(afterPick.drafted.length, 1);
    assert.equal(afterPick.myRoster.length, 1);
    assert.match(await page.locator("#pick-count").textContent(), /1 logged/);

    await page.reload({ waitUntil: "networkidle" });
    assert.match(await page.locator("#pick-count").textContent(), /1 logged · pick 2/);
    assert.equal(await page.locator("#player-suggestions option").count(), 322);

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset" }).click();
    const afterReset = await page.evaluate(() => JSON.parse(localStorage.getItem("draftboard-2026-state-v1")));
    assert.equal(afterReset.drafted.length, 0);
    assert.equal(afterReset.myRoster.length, 0);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
