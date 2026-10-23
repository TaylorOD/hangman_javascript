const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "src/requests.js"), "utf8");
const compiled = fs.readFileSync(path.join(root, "public/scripts/bundle.js"), "utf8");
const url = "https://puzzle.mead.io/puzzle?wordCount=";

assert.ok(source.includes(url), "source request must require HTTPS");
assert.ok(compiled.includes(url), "published bundle must require HTTPS");
// Reject scheme-relative fetch calls while allowing https:// URLs.
assert.ok(!source.includes("fetch(`//puzzle.mead.io"), "no scheme-relative source request");
assert.ok(!compiled.includes('fetch("//puzzle.mead.io'), "no scheme-relative bundle request");
assert.ok(!compiled.includes("sourceMappingURL"), "no stale source map reference");
assert.ok(!fs.existsSync(path.join(root, "public/scripts/bundle.js.map")), "no stale production map");

const config = require(path.join(root, "webpack.config.js"));
assert.strictEqual(config({}, { mode: "production" }).devtool, false);
assert.strictEqual(config({}, { mode: "development" }).devtool, "source-map");

console.log("HTTPS puzzle requests and production bundle checks passed");
