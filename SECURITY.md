# Security

How the shop protects itself, what to configure, and what to do if something looks wrong.
It describes the site as it stands after the review in September 2026.

## The short version

- The dashboard is the only way in. Everything else — the storefront, the order form,
  the pictures — is public by design.
- Nothing in the browser is trusted. Prices, totals and quantities are recalculated on the
  server from the catalogue, so a tampered checkout page still pays the real price.
- Every value written into a page is escaped, and a Content-Security-Policy means that even
  if something slipped through, the browser would refuse to run it.

## Signing in

| Control | What it does |
| --- | --- |
| Password hashing | `scrypt` with a random 16-byte salt per password; comparison is constant-time. The password is never stored or logged in the clear. |
| Session | A random 192-bit token kept server-side, handed out in a cookie that is `HttpOnly`, `Secure`, `SameSite=Strict` and expires after 14 days. |
| Rate limit | 10 failed sign-ins per IP per 15 minutes. The address comes from the headers Vercel's edge sets itself, so a client cannot rotate it to get a fresh allowance. |
| Password change | Signs out every other device by bumping a version number that existing sessions carry. |
| CSRF | Every state-changing call must carry an `X-LB-Admin: 1` header, which a cross-site form post cannot set. `SameSite=Strict` is the second lock. |

`ADMIN_PASSWORD` in Vercel is only the *first* password: the first successful sign-in stores
a salted hash, and from then on the password is changed from **Account & backup** in the
dashboard. Use a long one — the dashboard can change prices, text and orders.

## Orders and money

- Prices, line totals, subtotal and delivery are recomputed from the catalogue. Whatever the
  browser claims is ignored.
- Quantities are clamped to 1–99, at most 50 lines per order.
- Delivery details are length-limited and the email and phone are checked for shape.
- 30 orders per hour per address.
- Whether the WhatsApp alert went out is dashboard-only; the customer's confirmation never
  carries it.

## Content and pictures

- Everything the dashboard publishes is HTML-escaped when the shop renders it, so a `<script>`
  in a product name shows up as text.
- Links and image sources from the dashboard must be `http(s):`, `mailto:`, `tel:`, a relative
  path, or a base64 raster image — a `javascript:` link is dropped.
- Uploads accept JPG, PNG, WebP, GIF and AVIF. **SVG is refused**: it is a document that can
  carry script, and served from this domain it would run with the dashboard's privileges.
- Stored pictures are served with `Content-Security-Policy: default-src 'none'; sandbox` and
  `X-Content-Type-Options: nosniff`.
- Keys that would poison `Object.prototype` (`__proto__`, `constructor`, `prototype`) are
  rejected by the API and skipped by the browser when content is merged.
- Content must contain products, categories, a settings object and a theme object, so a
  malformed file cannot leave the shop or the dashboard blank.
- The CSV export prefixes any cell beginning with `= + - @` or a control character with an
  apostrophe, so a customer cannot write a formula that runs when you open the file.

## Headers

Set in `vercel.json` for every response:

```
Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none';
  frame-ancestors 'self'; form-action 'self'; script-src 'self'; connect-src 'self';
  img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com; frame-src 'self'; media-src 'self';
  worker-src 'none'; manifest-src 'self'; upgrade-insecure-requests
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains
Cross-Origin-Opener-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), …
```

`script-src 'self'` is why there are no inline `<script>` blocks and no `onclick=` attributes
anywhere in the site — keep it that way, or the policy has to be loosened for everyone.
`/admin` additionally gets `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.

`Strict-Transport-Security` includes subdomains. If you later add a custom domain with a
subdomain that is not served over HTTPS, drop `includeSubDomains` first.

These headers come from `vercel.json`, so they apply on Vercel. Host the files anywhere else
and you have to set the same headers there — on a plain static host the dashboard and orders
would not work anyway, since those need the serverless functions in `api/`.

## Secrets

Everything sensitive lives in Vercel environment variables and never in the repository:

| Variable | Used for |
| --- | --- |
| `ADMIN_PASSWORD` | First sign-in only |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | The database |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` / `TWILIO_*` / `CALLMEBOT_API_KEY` | Order alerts |

Without a database the API still answers, but writes go to a temporary file and every
response is tagged `store: "ephemeral"` — changes will not survive. The dashboard says so.

## If you think someone got in

1. Change the password in **Account & backup**. Every other session is signed out immediately.
2. Rotate `KV_REST_API_TOKEN` and the WhatsApp credentials in Vercel, then redeploy.
3. Check **Text & pages**, **Products** and **Images** for anything you did not write. There is
   a one-step undo, and **Account & backup** can restore a backup file.
4. Look through **Orders** for entries you do not recognise before fulfilling anything.

## Reporting a problem

Open an issue on the repository, or message the shop's WhatsApp number. Please do not include
a working exploit in a public issue.
