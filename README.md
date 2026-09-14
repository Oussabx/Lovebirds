# lovebirds — gifts for every kind of love

An animated storefront for **lovebirds**, a gift shop for couples, friends and family,
with an admin dashboard at `/admin` for running the shop.

No build step, no framework, no npm dependencies: plain HTML, CSS and JavaScript for the
shop, plus four small serverless functions for the dashboard and orders.

![lovebirds](assets/img/og-image.svg)

## Pages & flow

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Hero with parallax, categories, featured gifts, sunset parallax band, story, promises, reviews |
| Categories | `categories.html` | All gifts with category filters (`?cat=couples`) and sorting |
| Product detail | `product.html?id=<product-id>` | Gallery, quantity, **Add to cart**, **Buy on WhatsApp**, accordion details, related gifts |
| Checkout | `checkout.html` | Delivery details, cash on delivery, order summary, **Complete order** |
| Order confirmed | `order-confirmed.html` | Order number, delivery address and totals |
| Contact us | `contact.html` | Message form, contact details, FAQ |
| Dashboard | `admin/index.html` | Password-protected: orders, products, categories, all text, colours, fonts, settings, images, backups |

The shopping flow is exactly:

```
product card → product detail → add to cart → cart sidebar → checkout → order confirmed
```

The cart is a slide-in sidebar available from every page (bag icon in the navbar), with
quantity controls, a free-delivery progress bar and a checkout button.

Checkout collects: country, first name, last name, address, apartment / floor, city,
phone number, email address, and a *save this information for next time* option.
Payment is **cash on delivery only**, followed by the order summary and *Complete order*.

## Run it locally

No build step — just serve the folder:

```bash
npx http-server -p 8080 -c-1 .
# or
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## The dashboard

Sign in at **`/admin`** to run the shop. Everything the storefront shows is edited
there — there is no need to touch code.

| Tab | What it does |
| --- | --- |
| Overview | Orders, revenue, this week, average order, latest orders at a glance |
| Orders | Every order with customer details, items and totals. Move an order through New → Confirmed → Packed → Delivered → Cancelled, add a private note, copy the address, call or WhatsApp the customer, export everything to CSV |
| Products | Add, edit, duplicate, reorder, hide or delete gifts — name, price, “was” price, category, badge, descriptions, what’s-inside list, tags, pictures, featured on the home page |
| Categories | Add, rename, reorder and re-picture the category tiles |
| Text & pages | Every heading, paragraph, button label and list on every page — hero, ribbon, sunset band, story, promises, reviews, shop page, product page, cart, checkout, thank-you page, contact, FAQ and footer |
| Appearance | The eight brand colours, three fonts and corner roundness, with a live preview |
| Shop settings | Shop name, currency and its position, WhatsApp number and greeting, contact details, delivery fee, free-delivery threshold, country list, announcement bar, menu links |
| Images | Upload photos (they are shrunk in the browser first) and pick them anywhere an image is used |
| Account & backup | Change the password, download or restore a full backup, undo the last save, reset the shop to its original content |

Changes are held until you press **Save changes** (or ⌘/Ctrl + S); **Discard** throws
them away. Saving publishes to every visitor immediately.

## Setting it up on Vercel

The dashboard needs two things: somewhere to store data, and a password.

**1 · Add a database.** In the Vercel project: **Storage → Create Database →
Upstash (Redis)** and connect it to the project. That adds the connection
variables automatically (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, or the
`UPSTASH_REDIS_REST_*` pair — either is picked up). The free tier is plenty.

**2 · Set a password.** **Settings → Environment Variables → Add**:

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | a long password you choose |

**3 · Redeploy** so both take effect, then open `/admin` and sign in.

Until a database is connected the dashboard still opens, but it says *demo mode*
and anything saved disappears when the server restarts. Once you change the
password inside the dashboard, the stored password takes over and
`ADMIN_PASSWORD` is only a fallback.

## How the data works

* `GET /api/content` — the live site content (public, cached for 10 seconds).
* `PUT /api/content` — saves it (dashboard only).
* `POST /api/orders` — checkout sends the order here. **Prices are recalculated
  on the server from your catalogue**, so a tampered browser cannot change what
  an order costs.
* `GET/PATCH/DELETE /api/orders` — the dashboard reads and updates orders.
* `POST /api/media`, `GET /api/media?id=…` — uploaded pictures.
* `POST /api/auth` — sign in, sign out, change password.

Sessions are HttpOnly, Secure, SameSite=Strict cookies; every write also requires
an `X-LB-Admin` header, so a cross-site form cannot reach the API. Sign-in
attempts are rate limited, passwords are stored salted with scrypt, and changing
the password signs out every other device.

If the site is deployed without the `api/` folder (plain GitHub Pages, say), the
storefront still works from `assets/js/defaults.js` and checkout falls back to a
local confirmation — you just lose the dashboard and stored orders.

## Setting the WhatsApp number

Every WhatsApp button (navbar, mobile menu, footer, contact page, *Buy on WhatsApp* on the
product page) is wired to one setting: **Shop settings → WhatsApp → WhatsApp number**
in the dashboard. Enter it in full international format, digits only, e.g. `9613123456`.

Before the dashboard is set up you can also edit the same value in
`assets/js/defaults.js`.

While it is empty the buttons stay **unlinked** on purpose and simply tell the visitor that
WhatsApp ordering is coming soon. As soon as a number is set, every button opens a
`wa.me` chat with a pre-filled message (the product page passes the product name along).

## Editing the shop

Use the dashboard at `/admin`. For the starting content — what a brand-new
install shows, and what *Reset* restores — edit **`assets/js/defaults.js`**
(and its server twin `api/_defaults.js`, which prices orders before the first
save). Both hold the same object: `settings`, `theme`, `nav`, `categories`,
`products` and the page copy.

Adding a product is one entry in `products` — it appears on the shop page, in its
category filter, and gets its own page at `product.html?id=<id>` automatically.

### Images

The illustrations in `assets/img/` are original SVG artwork made for this build, so the site
looks finished out of the box. To use photography instead, drop your files in `assets/img/`
and point `image:` at them — anything square (1:1) works.

## How it is put together

```
index.html · categories.html · product.html · checkout.html · order-confirmed.html · contact.html
admin/
  index.html             login + dashboard shell
  admin.css              dashboard styling
  admin.js               auth, state, saving, overview, orders
  admin-views.js         products, categories, text, appearance, settings, images, account
api/
  _lib.js                storage (Redis over REST), sessions, rate limiting, helpers
  _defaults.js           server copy of the starting content
  auth.js                sign in / out, change password
  content.js             read, save, undo, reset the site content
  orders.js              create (public), read / update / delete (dashboard)
  media.js               image upload, serving and deletion
assets/
  css/lovebirds.css      design tokens, layout, components, motion, responsive rules
  js/defaults.js         the starting content (edit here or in the dashboard)
  js/content.js          loads live content, paints the theme, fills data-cms elements
  js/app.js              nav, reveal animations, parallax, cart store, cart sidebar, toasts
  js/home.js             home page sections
  js/categories.js       filtering and sorting
  js/product.js          product detail page
  js/checkout.js         validation, saved details, order placement
  js/confirm.js          order confirmation
  js/contact.js          contact details, form, FAQ
  img/                   SVG illustrations, logo, favicon, social image
```

**Motion.** Sections fade and rise into view with an `IntersectionObserver` (staggered for
grids), and decorative layers — hero blobs, the sunset band’s sun, clouds and birds on a wire
— move at different speeds on scroll via `requestAnimationFrame`. Everything collapses to a
static page under `prefers-reduced-motion: reduce`.

**Content.** Text bound with `data-cms="path.to.value"` is filled from the live content;
the words in the HTML are the fallback if the API is unreachable. Lists — products,
categories, reviews, promises, FAQ — are drawn by the page scripts. The theme is applied as
CSS variables, with the softer shades derived from the colours you pick.

**State.** The cart, saved delivery details, favourites and the last order are kept in
`localStorage` (keys prefixed `lovebirds.`). Orders themselves live on the server.

**Artwork.** The built-in SVG illustrations are drawn in the original burgundy palette, so
they stay burgundy if you change the theme colours. Upload your own photos in the dashboard
to replace them.

## Deploying

* **Vercel** — New Project → import this repo → framework preset *Other* → Deploy.
  No build command and no output directory: it is a static site and `vercel.json`
  already sets the headers. Every push to `main` redeploys automatically.
* **GitHub Pages** — Settings → Pages → deploy from branch `main`, folder `/ (root)`.
* **Netlify** — import the repo, no build command, publish directory `.`.

## Browser support

Current Chrome, Safari, Firefox and Edge, mobile and desktop. Layouts are fluid from 320px up.
