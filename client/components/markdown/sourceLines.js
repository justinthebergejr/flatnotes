export default function sourceLines(md) {
  md.core.ruler.push("source_lines", (state) => {
    for (const token of state.tokens) {
      if (token.map && token.nesting !== -1 && token.type !== "inline") {
        token.attrSet("data-line", String(token.map[0]));
      }
    }
    return true;
  });
}
