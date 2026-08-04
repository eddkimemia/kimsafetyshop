const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h2", "h3", "h4", "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "blockquote", "code", "pre",
  "a", "img", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
]);

const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title", "class"]);

export function sanitizePostHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*(script|iframe|style|object|embed|form|link|meta|input|button|textarea|select)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|style|object|embed|form|link|meta|input|button|textarea|select)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/\shref\s*=\s*"(?:javascript|vbscript):[^"]*"/gi, ' href="#"')
    .replace(/\shref\s*=\s*'(?:javascript|vbscript):[^']*'/gi, " href='#'")
    .replace(/\ssrc\s*=\s*"(?:javascript|vbscript):[^"]*"/gi, ' src="#"')
    .replace(/\ssrc\s*=\s*'(?:javascript|vbscript):[^']*'/gi, " src='#'")
    .replace(/<([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (match, tag: string, attrs: string) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lower)) return "";
      const kept = attrs
        .match(/([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g)
        ?.filter((attr) => {
          const name = attr.split("=")[0].trim().toLowerCase();
          return ALLOWED_ATTRS.has(name);
        })
        .join(" ");
      return kept ? `<${lower} ${kept}>` : `<${lower}>`;
    })
    .replace(/<\/([a-zA-Z][a-zA-Z0-9-]*)>/g, (match, tag: string) =>
      ALLOWED_TAGS.has(tag.toLowerCase()) ? `</${tag.toLowerCase()}>` : ""
    );
}
