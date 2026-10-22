# Cliptique shop

The storefront for Cliptique: plant-based hair clips with a wool felt pad, and botanical scent blends to wear with them. Made in small batches in Cyprus.

Open `index.html` through any static file server (the page loads ES modules, so it needs `http://`, not `file://`). It works on phones and desktops and follows the visitor's light or dark setting.

## What's here

| File | What it holds |
| --- | --- |
| `index.html` | Page layout, styles and copy |
| `app.js` | Catalogue, prices, 3D stages, product dialog and bag |
| `models.js` | The 3D models, built in code, in millimetres |
| `brand-shapes.js` | The plum and pear outlines from the Cliptique mark |
| `glb/` | Every model as a `.glb` file at real size, for Blender, Shopify 3D or AR viewers |
| `renders/` | A still render of each product, plus `products.png` with all eleven |

## The products

Clips (prices include one 5 ml blend):

| Clip | Type | Size | Price |
| --- | --- | --- | --- |
| The Oval | Snap clip | 65 × 17 mm | €11.90 |
| The Leaf | Snap clip | 69 × 29 mm | €11.90 |
| Signature C | Snap clip, from the logo's plum | 31 × 43 mm | €11.90 |
| Signature Q | Snap clip, from the logo's pear | 28 × 49 mm | €11.90 |
| The Claw | Claw clip with a felt inlay | 76 × 43 × 29 mm | €14.90 |
| The Line | Barrette on a French clasp | 76 × 14 mm | €11.90 |
| The Paphos Shell | Ribbed scallop snap clip | 55 × 33 mm | €13.90 |

Sets: Single €11.90, Pair €19.90, Family €34.90 (plus €3 per claw clip and €2 per shell).

Blends, each €6.90 for 5 ml or €11.90 for 10 ml:

| Blend | Recipe | Bottle |
| --- | --- | --- |
| Citrus Grove | Citronella 40, Lemongrass 30, Geranium 20, Lavender 10 | Amber glass dropper |
| Lavender Dusk | Lavender 40, Geranium 30, Citronella 30 | Frosted glass, bamboo cap |
| Rose Geranium | Geranium 40, Citronella 30, Lemongrass 20, Lavender 10 | Blush glass, porcelain stopper |
| Winter Cedar (limited) | Cedarwood 40, Sweet orange 30, Lavender 20, Frankincense 10 | Smoked glass, carob-wood cap |

## Notes

- The copy talks about scent and style only. It never says the clips repel or protect against insects, because that would need EU biocide approval.
- Checkout is not connected yet. The bag is saved in the visitor's browser and "Pre-order" explains that orders open with the first batch in March 2027.
- three.js 0.165.0 loads from the jsDelivr CDN.
