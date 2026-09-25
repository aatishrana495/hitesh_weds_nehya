# Hitesh & Nehya — wedding invitation

A privacy-conscious, dependency-free wedding invitation for 23–25 October 2026 in Hyderabad.

## Local preview

Run `npm run dev`, then open `http://localhost:4173`. Use a web server for realistic security and form testing; do not rely only on opening `index.html` directly.

## Configure before publishing

1. Verify every date and time in `index.html` with both families.
2. Replace the family-level wording with parent names if the couple wants them public.
3. Decide whether venue details should remain private. If public, add each venue name, address, map URL, parking notes, and arrival guidance.
4. Add the real RSVP deadline and a family contact route.
5. Configure one RSVP delivery option in `assets/config.js`:
   - `rsvpEndpoint`: preferred; an HTTPS endpoint that accepts JSON and returns success only after durable storage.
   - `whatsappNumber`: fallback; digits only, including the country code. The UI tells guests they still need to press **Send** in WhatsApp.
6. Replace the decorative story artwork with authorized couple photographs if desired. Preserve explicit dimensions and write accurate alt text.
7. Supply an absolute public Open Graph image URL after the deployment URL is known. Social platforms generally prefer a 1200×630 PNG or JPEG.
8. Keep `noindex` unless the couple explicitly wants this private event indexed by search engines.

Never put API keys or secrets in `assets/config.js`; it is publicly downloadable.

## RSVP endpoint contract

The browser sends a JSON `POST` with `name`, `attendance`, `guestCount`, `contact`, `notes`, `submittedAt`, and `event`. Production endpoints should validate and rate-limit requests, store submissions durably, restrict CORS to the invitation origin, notify the families, avoid logging sensitive request bodies, and provide backups/export. Return a non-2xx status unless storage succeeded.

## Release check

Run `npm test` during development. Before deployment, run `npm run release`; the stricter release check intentionally fails until RSVP delivery and the public social-card URL are configured. Checks cover JavaScript syntax, local file references, form-label relationships, duplicate IDs, unsafe blank links, remote media, and launch metadata. The `_headers` file configures security headers on hosts that support Netlify/Cloudflare Pages-style header files.

Before sharing, also test VoiceOver or NVDA, iOS Safari, Android Chrome, a slow mobile connection, RSVP success and failure, popup blocking, calendar downloads, and the post-wedding countdown state.
