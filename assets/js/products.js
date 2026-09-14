/* ==========================================================================
   lovebirds — store configuration + catalogue
   Everything a shop owner needs to edit lives in this file.
   ========================================================================== */

const CONFIG = {
  brand: 'lovebirds',
  tagline: 'Gifts for every kind of love',
  /* ------------------------------------------------------------------
     WHATSAPP
     Put the store number here in full international format, digits only
     (e.g. '9613123456'). While it is empty every WhatsApp button stays
     unlinked and simply tells the visitor it is coming soon.
     ------------------------------------------------------------------ */
  whatsapp: '',
  email: 'hello@lovebirds.gifts',
  hours: 'Mon – Sat, 10:00 – 19:00',
  currency: '$',
  shippingFlat: 5,
  freeShippingOver: 60,
  codOnly: true
};

const CATEGORIES = [
  { id: 'couples',  name: 'For Couples',  blurb: 'Two of everything',      image: 'assets/img/p-mugs.svg' },
  { id: 'friends',  name: 'For Friends',  blurb: 'The chosen family',      image: 'assets/img/p-candle.svg' },
  { id: 'family',   name: 'For Family',   blurb: 'Where it all started',   image: 'assets/img/p-frame.svg' },
  { id: 'everyone', name: 'For Everyone', blurb: 'Just because days',      image: 'assets/img/p-cards.svg' }
];

const SCENES = ['assets/img/scene-wrap.svg', 'assets/img/scene-note.svg'];

const PRODUCTS = [
  {
    id: 'better-together-mugs',
    name: 'Better Together Mug Set',
    script: 'Two cups, one slow morning.',
    price: 34, compareAt: 42,
    category: 'couples',
    badge: 'Bestseller',
    image: 'assets/img/p-mugs.svg',
    short: 'A pair of soft stoneware mugs — one for each of you.',
    description: 'Hand-glazed stoneware in warm cream, finished with a small burgundy heart that peeks out every time the cup is lifted. Heavy enough to feel like a ritual, light enough for the third refill.',
    includes: ['Two 350 ml stoneware mugs', 'Hand-lettered “Better Together” motif', 'Dishwasher & microwave safe', 'Packed in a lovebirds gift box'],
    tags: ['Set of two', 'Stoneware', 'Gift boxed']
  },
  {
    id: 'good-things-candle',
    name: 'Good Things Ahead Candle',
    script: 'Light it on an ordinary night.',
    price: 26,
    category: 'everyone',
    badge: 'New',
    image: 'assets/img/p-candle.svg',
    short: 'Soy wax, fig and warm amber, 45 hours of quiet.',
    description: 'Poured in small batches into a reusable frosted glass. Fig leaf and warm amber with a whisper of vanilla — the smell of a room where nobody is in a hurry.',
    includes: ['220 g natural soy wax', 'Approx. 45 hours burn time', 'Cotton wick, clean burn', 'Reusable glass vessel'],
    tags: ['Soy wax', '45 h burn', 'Hand poured']
  },
  {
    id: 'same-dreams-journal',
    name: 'Same Dreams Journal',
    script: 'Bigger adventures, written down.',
    price: 22,
    category: 'couples',
    image: 'assets/img/p-journal.svg',
    short: 'A linen-bound journal for the plans you keep making.',
    description: 'Ink-dark linen over hard board with a gold foil band, 192 dotted pages and a ribbon marker. Made for bucket lists, apartment sketches and the notes you leave each other.',
    includes: ['192 dotted pages, 120 gsm', 'Linen hardcover with gold foil', 'Lay-flat binding & ribbon marker', 'A5 — fits any bag'],
    tags: ['192 pages', 'Linen bound', 'A5']
  },
  {
    id: 'heart-keychain-pair',
    name: 'Heart Keychain Pair',
    script: 'One for you, one for the door.',
    price: 18,
    category: 'couples',
    image: 'assets/img/p-keychain.svg',
    short: 'Two brushed heart charms that live on your keys.',
    description: 'A small, unfussy reminder in brushed brass and deep burgundy enamel. Weighty in the hand, quiet in a pocket — the kind of thing you touch without noticing.',
    includes: ['Two heart charms with split rings', 'Brushed brass & enamel finish', 'Optional initial engraving', 'Pouch for each charm'],
    tags: ['Pair', 'Brass', 'Engravable']
  },
  {
    id: 'just-because-box',
    name: 'Just Because Gift Box',
    script: 'No occasion required.',
    price: 58, compareAt: 70,
    category: 'everyone',
    badge: 'Most gifted',
    image: 'assets/img/p-giftbox.svg',
    short: 'Our little curated box for a day that needs lifting.',
    description: 'The box we send most often. A candle, a bar of dark chocolate, dried blooms and a blank card you fill in yourself — wrapped in blush tissue and tied with a burgundy ribbon.',
    includes: ['Good Things Ahead candle (mini)', 'Dark chocolate bar', 'Small dried bloom posy', 'Hand-written card of your words'],
    tags: ['4 pieces', 'Ready to gift', 'Free note']
  },
  {
    id: 'little-bear-bundle',
    name: 'Little Bear Bundle',
    script: 'Soft, small, impossible to return.',
    price: 42,
    category: 'family',
    image: 'assets/img/p-teddy.svg',
    short: 'A plush bear with a heart, plus a card of your words.',
    description: 'Ridiculously soft, 30 cm tall, holding a velvet heart. Comes with one of our blank cards so you can say the thing you have been meaning to say.',
    includes: ['30 cm plush bear', 'Velvet heart', 'Blank card + envelope', 'Blush tissue wrap'],
    tags: ['30 cm', 'Super soft', 'Card included']
  },
  {
    id: 'dried-bloom-posy',
    name: 'Dried Bloom Posy',
    script: 'Flowers that stay.',
    price: 30,
    category: 'friends',
    image: 'assets/img/p-bouquet.svg',
    short: 'A small dried bouquet wrapped in kraft and twine.',
    description: 'Preserved blooms in blush, cream and soft rose, gathered by hand and wrapped in kraft paper. No water, no wilting — it keeps its shape for years on a shelf.',
    includes: ['Hand-tied dried posy, approx. 30 cm', 'Kraft wrap & cotton twine', 'Care card', 'Lasts 2+ years indoors'],
    tags: ['Dried', 'No water', 'Hand-tied']
  },
  {
    id: 'you-matter-cards',
    name: 'You Matter Card Set',
    script: 'Eight small ways to say it.',
    price: 12,
    category: 'friends',
    image: 'assets/img/p-cards.svg',
    short: 'Eight blank cards for the things worth writing down.',
    description: 'Thick cotton card stock, letterpress-feel print, eight different lines in our handwriting. Because a text disappears and a card ends up taped to a mirror.',
    includes: ['8 cards, 8 designs', '8 blush envelopes', '300 gsm cotton stock', 'Blank inside'],
    tags: ['Set of 8', 'Blank inside', 'Cotton stock']
  },
  {
    id: 'lovebirds-tote',
    name: 'Lovebirds Canvas Tote',
    script: 'Carries snacks and secrets.',
    price: 24,
    category: 'everyone',
    image: 'assets/img/p-tote.svg',
    short: 'Heavy natural canvas with our birds printed small.',
    description: 'Thick 340 gsm canvas, long shoulder straps, one inside pocket for the keys you always lose. Printed with the lovebirds mark in burgundy.',
    includes: ['340 gsm natural canvas', 'Inside pocket', '38 × 42 cm, 65 cm straps', 'Machine washable at 30°'],
    tags: ['340 gsm', 'Inside pocket', 'Washable']
  },
  {
    id: 'sunset-photo-frame',
    name: 'Sunset Photo Frame',
    script: 'That one photo, finally printed.',
    price: 28,
    category: 'family',
    image: 'assets/img/p-frame.svg',
    short: 'A warm wood frame for the photo still stuck in your phone.',
    description: 'Solid wood in a warm honey finish with a wide cream mount that makes any snapshot look considered. Stands on a shelf or hangs either way up.',
    includes: ['Fits 13 × 18 cm photo', 'Solid wood, honey finish', 'Cream mount board', 'Stand + wall fixing'],
    tags: ['13 × 18 cm', 'Solid wood', 'Shelf or wall']
  },
  {
    id: 'midnight-chocolate-box',
    name: 'Midnight Chocolate Box',
    script: 'Nine reasons to stay in.',
    price: 32,
    category: 'couples',
    image: 'assets/img/p-chocolate.svg',
    short: 'Nine dark chocolate hearts, filled and not too sweet.',
    description: 'Seventy percent dark chocolate shells with salted caramel, roasted hazelnut and raspberry centres. Made this week, not last season.',
    includes: ['9 filled chocolate hearts', '3 flavours, 70% dark', 'Made in small batches', 'Keeps 6 weeks, cool & dry'],
    tags: ['9 pieces', '70% dark', 'Fresh batch']
  },
  {
    id: 'first-date-memory-box',
    name: 'First Date Memory Box',
    script: 'Keep the ticket stubs.',
    price: 64,
    category: 'couples',
    badge: 'Keepsake',
    image: 'assets/img/p-memorybox.svg',
    short: 'A keepsake box for photos, notes and small proof.',
    description: 'A lidded kraft box lined in blush, with photo corners, labelled dividers and twelve prompt cards for the story so far. The place all those tiny paper things finally belong.',
    includes: ['Lidded keepsake box, 24 × 18 cm', '12 prompt cards', 'Photo corners & dividers', 'Space for 100+ photos'],
    tags: ['Keepsake', '12 prompts', 'Lined box']
  }
];

/* Each product shows its own illustration plus the two shared brand scenes. */
PRODUCTS.forEach(p => { p.images = [p.image, ...SCENES]; });

const getProduct = id => PRODUCTS.find(p => p.id === id) || null;
const getCategory = id => CATEGORIES.find(c => c.id === id) || null;
const categoryName = id => (getCategory(id) || {}).name || 'Gifts';
