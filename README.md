# lovebirds — gifts for every kind of love

An animated storefront for **lovebirds**, a gift shop for couples, friends and family.
Built as a dependency-free static site (plain HTML, CSS and JavaScript) — no build step,
no framework, no backend. Drop it on any host and it runs.

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

## Setting the WhatsApp number

Every WhatsApp button (navbar, mobile menu, footer, contact page, *Buy on WhatsApp* on the
product page) is wired to one setting. Open `assets/js/products.js` and fill in the number
in full international format, digits only:

```js
const CONFIG = {
  whatsapp: '9613123456',   // ← was ''
  ...
};
```

While it is empty the buttons stay **unlinked** on purpose and simply tell the visitor that
WhatsApp ordering is coming soon. As soon as a number is set, every button opens a
`wa.me` chat with a pre-filled message (the product page passes the product name along).

## Editing the shop

Everything a shop owner touches lives in **`assets/js/products.js`**:

* `CONFIG` — currency symbol, delivery fee, free-delivery threshold, email, opening hours, WhatsApp number.
* `CATEGORIES` — the four category tiles.
* `PRODUCTS` — name, price, `compareAt` (optional, shows a “save %” badge), category, badge,
  image, short line, description and the *what’s inside* list.

Adding a product is one object in that array — it shows up on the shop page, in its category
filter, and gets its own detail page at `product.html?id=<id>` automatically.

### Images

The illustrations in `assets/img/` are original SVG artwork made for this build, so the site
looks finished out of the box. To use photography instead, drop your files in `assets/img/`
and point `image:` at them — anything square (1:1) works.

## How it is put together

```
index.html · categories.html · product.html · checkout.html · order-confirmed.html · contact.html
assets/
  css/lovebirds.css      design tokens, layout, components, motion, responsive rules
  js/products.js         CONFIG + catalogue (the file to edit)
  js/app.js              nav, reveal animations, parallax, cart store, cart sidebar, toasts
  js/home.js             category tiles + featured grid
  js/categories.js       filtering and sorting
  js/product.js          product detail page
  js/checkout.js         form validation, saved details, order summary, order placement
  js/confirm.js          order confirmation
  js/contact.js          contact form + FAQ
  img/                   SVG illustrations, logo, favicon, social image
```

**Motion.** Sections fade and rise into view with an `IntersectionObserver` (staggered for
grids), and decorative layers — hero blobs, the sunset band’s sun, clouds and birds on a wire
— move at different speeds on scroll via `requestAnimationFrame`. Everything collapses to a
static page under `prefers-reduced-motion: reduce`.

**State.** The cart, saved delivery details, favourites and the last order are kept in
`localStorage` (keys prefixed `lovebirds.`). There is no server, so *Complete order* records
the order locally and shows the confirmation page — connect it to your order system (or an
email/WhatsApp webhook) in `assets/js/checkout.js` when you are ready.

## Deploying

* **Vercel** — New Project → import this repo → framework preset *Other* → Deploy.
  No build command and no output directory: it is a static site and `vercel.json`
  already sets the headers. Every push to `main` redeploys automatically.
* **GitHub Pages** — Settings → Pages → deploy from branch `main`, folder `/ (root)`.
* **Netlify** — import the repo, no build command, publish directory `.`.

## Browser support

Current Chrome, Safari, Firefox and Edge, mobile and desktop. Layouts are fluid from 320px up.
