export type TextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  font?: string;
};

export type Block =
  | { kind: "p"; runs: TextRun[] }
  | { kind: "h1"; runs: TextRun[] }
  | { kind: "h2"; runs: TextRun[] }
  | { kind: "h3"; runs: TextRun[] }
  | { kind: "bullet"; runs: TextRun[] }
  | { kind: "number"; index: number; runs: TextRun[] }
  | { kind: "quote"; runs: TextRun[] }
  | { kind: "spacer" };

type Elem = { tag: string; children: (Elem | string)[] };

type InlineStyle = Pick<TextRun, "bold" | "italic" | "underline" | "strike" | "font">;

const BASE: InlineStyle = {};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, "\u00A0")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&hellip;/g, "\u2026");
}

export function parseHTML(html: string): Elem {
  const root: Elem = { tag: "#root", children: [] };
  const stack: Elem[] = [root];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  let last = 0;
  const pushText = (t: string) => {
    if (!t) return;
    stack[stack.length - 1].children.push(decodeEntities(t));
  };
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    pushText(html.slice(last, m.index));
    last = re.lastIndex;
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (closing) {
      if (stack.length > 1 && stack[stack.length - 1].tag === tag) {
        stack.pop();
      } else {
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === tag) {
            stack.length = i;
            break;
          }
        }
      }
    } else {
      const el: Elem = { tag, children: [] };
      stack[stack.length - 1].children.push(el);
      stack.push(el);
    }
  }
  pushText(html.slice(last));
  return root;
}

function inlineRuns(node: Elem, style: InlineStyle): TextRun[] {
  const runs: TextRun[] = [];
  for (const child of node.children) {
    if (typeof child === "string") {
      if (child) runs.push({ text: child, ...style });
    } else {
      const t = child.tag;
      if (t === "br") {
        runs.push({ text: "\n", ...style });
      } else if (t === "strong" || t === "b") {
        runs.push(...inlineRuns(child, { ...style, bold: true }));
      } else if (t === "em" || t === "i") {
        runs.push(...inlineRuns(child, { ...style, italic: true }));
      } else if (t === "u") {
        runs.push(...inlineRuns(child, { ...style, underline: true }));
      } else if (t === "s" || t === "strike" || t === "del") {
        runs.push(...inlineRuns(child, { ...style, strike: true }));
      } else if (t === "code") {
        runs.push(...inlineRuns(child, { ...style, font: "Courier" }));
      } else {
        runs.push(...inlineRuns(child, style));
      }
    }
  }
  return runs;
}

export function htmlToBlocks(html: string): Block[] {
  const root = parseHTML(html);
  const blocks: Block[] = [];

  const isEmpty = (runs: TextRun[]) => runs.every((r) => !r.text.trim());

  const processList = (node: Elem, ordered: boolean) => {
    let n = 1;
    for (const child of node.children) {
      if (typeof child === "string") continue;
      if (child.tag === "li" || child.tag === "p" || child.tag === "div") {
        const runs = inlineRuns(child, BASE);
        if (!isEmpty(runs)) {
          blocks.push(ordered ? { kind: "number", index: n++, runs } : { kind: "bullet", runs });
        }
      }
    }
  };

  const handleChild = (child: Elem | string) => {
    if (typeof child === "string") {
      if (child.trim()) blocks.push({ kind: "p", runs: [{ text: child.trim(), ...BASE }] });
      return;
    }
    const tag = child.tag;
    if (tag === "p" || tag === "div" || tag === "section") {
      const runs = inlineRuns(child, BASE);
      if (isEmpty(runs)) blocks.push({ kind: "spacer" });
      else blocks.push({ kind: "p", runs });
    } else if (tag === "h1") {
      blocks.push({ kind: "h1", runs: inlineRuns(child, BASE) });
    } else if (tag === "h2") {
      blocks.push({ kind: "h2", runs: inlineRuns(child, BASE) });
    } else if (tag === "h3") {
      blocks.push({ kind: "h3", runs: inlineRuns(child, BASE) });
    } else if (tag === "ul") {
      processList(child, false);
    } else if (tag === "ol") {
      processList(child, true);
    } else if (tag === "blockquote") {
      const runs = inlineRuns(child, { ...BASE, italic: true });
      if (!isEmpty(runs)) blocks.push({ kind: "quote", runs });
    } else if (tag === "pre") {
      const runs = inlineRuns(child, { ...BASE, font: "Courier" });
      if (!isEmpty(runs)) blocks.push({ kind: "p", runs });
    } else if (tag === "br") {
      blocks.push({ kind: "spacer" });
    } else if (tag === "li") {
      const runs = inlineRuns(child, BASE);
      if (!isEmpty(runs)) blocks.push({ kind: "bullet", runs });
    }
  };

  for (const child of root.children) handleChild(child);
  return blocks;
}
