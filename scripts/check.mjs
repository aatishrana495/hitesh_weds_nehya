import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const htmlPath = join(root, "index.html");
const html = readFileSync(htmlPath, "utf8");
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const releaseMode = process.argv.includes("--release");

assert(/^<!doctype html>/i.test(html), "index.html must start with a doctype");
assert(/<html[^>]+lang="en"/.test(html), "Document language is missing");
assert(/name="viewport"/.test(html), "Viewport metadata is missing");
assert(/name="description"/.test(html), "Description metadata is missing");
assert(/name="robots" content="noindex/.test(html), "Private invitation must default to noindex");
assert(!/href="#"/.test(html), "Empty hash link found");
assert(!/https?:\/\/images\.unsplash|fonts\.googleapis|fonts\.gstatic/.test(html), "Remote media/font dependency found");
assert(!/9876543210|_{3,}|Wedding Venue ·/.test(html), "Known placeholder content found");
assert(/<\/html>\s*$/.test(html), "Unexpected text exists after the closing html element");

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert(duplicates.length === 0, `Duplicate ids found: ${[...new Set(duplicates)].join(", ")}`);
const controls = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*\sid="([^"]+)"[^>]*>/g)].map((match) => match[1]);
for (const id of controls) assert(new RegExp(`<label[^>]+for="${id}"`).test(html), `Missing label for #${id}`);

for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const reference = match[1];
  if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;
  const clean = reference.split("?")[0];
  assert(existsSync(join(dirname(htmlPath), clean)), `Missing local reference: ${reference}`);
}

for (const script of ["assets/config.js", "assets/app.js"]) {
  try { new vm.Script(readFileSync(join(root, script), "utf8"), { filename: script }); }
  catch (error) { failures.push(`${script} does not parse: ${error.message}`); }
}

if (releaseMode) {
  const config = readFileSync(join(root, "assets/config.js"), "utf8");
  const hasEndpoint = /rsvpEndpoint:\s*"https:\/\/.+"/.test(config);
  const hasWhatsApp = /whatsappNumber:\s*"\d{8,15}"/.test(config);
  assert(hasEndpoint || hasWhatsApp, "Release requires an HTTPS RSVP endpoint or a valid WhatsApp number in assets/config.js");
  assert(!/property="og:image" content="assets\//.test(html), "Release requires an absolute public Open Graph image URL");
}

if (failures.length) {
  console.error(`Release check failed (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Release check passed: ${ids.length} unique IDs, ${controls.length} labelled form controls, and all local references resolved.`);
