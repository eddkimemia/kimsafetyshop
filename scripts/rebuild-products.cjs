// Maintenance script: rebuild products.ts + product-images.ts from scratch.
// 1) restore products.ts from git HEAD (44 products)
// 2) re-apply slug support
// 3) run image generator
// 4) splice generated entries into products.ts
const { execSync } = require("child_process");
const fs = require("fs");

console.log("1/4 restoring products.ts from git HEAD...");
execSync("git checkout -- src/lib/data/products.ts", { stdio: "inherit" });

console.log("2/4 re-applying slug support...");
let s = fs.readFileSync("src/lib/data/products.ts", "utf8");
s = s.replace(
  'import type { Product } from "../types";',
  'import type { Product } from "../types";\n\nexport function slugify(name: string): string {\n  return name\n    .toLowerCase()\n    .replace(/&/g, " and ")\n    .replace(/[^a-z0-9]+/g, "-")\n    .replace(/^-+|-+$/g, "");\n}'
);
s = s.replace(
  'function p(input: Omit<Product, "bulk" | "downloads" | "specs" | "features"> & { features?: string[] }): Product {',
  'function p(input: Omit<Product, "slug" | "bulk" | "downloads" | "specs" | "features"> & { features?: string[] }): Product {'
);
s = s.replace(
  "return { ...input, bulk, specs, features, downloads:",
  "return { ...input, slug: slugify(input.name), bulk, specs, features, downloads:"
);
s = s.replace(
  "return products.find((p) => p.sku === slug || p.id === slug);",
  "return products.find((p) => p.slug === slug || p.sku === slug || p.id === slug);"
);
fs.writeFileSync("src/lib/data/products.ts", s);

console.log("3/4 running image generator...");
execSync("node scripts/gen-product-images.cjs", { stdio: "inherit" });

console.log("4/4 splicing generated entries...");
s = fs.readFileSync("src/lib/data/products.ts", "utf8");
const entries = fs.readFileSync("new-products.ts", "utf8");
const arrEnd = s.indexOf("];", s.indexOf("export const products"));
if (arrEnd < 0) throw new Error("array close not found");
fs.writeFileSync("src/lib/data/products.ts", s.slice(0, arrEnd) + entries + "];" + s.slice(arrEnd + 2));
fs.unlinkSync("new-products.ts");

console.log("done. p( entries:", (fs.readFileSync("src/lib/data/products.ts", "utf8").match(/p\(\{/g) || []).length);
