const FENCE = "$$";

function lineText(state, line) {
  return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

function hasClosingFence(state, start, end) {
  const opening = lineText(state, start);

  if (!opening.startsWith(FENCE)) return true;

  if (opening.slice(FENCE.length).includes(FENCE)) return true;

  for (let line = start + 1; line < end; line += 1) {
    if (lineText(state, line).includes(FENCE)) return true;
  }
  return false;
}

export default function strictMathBlocks(md) {
  const rule = md.block.ruler.__rules__?.find((r) => r.name === "math_block");
  if (!rule) return;
  const original = rule.fn;

  md.block.ruler.at(
    "math_block",
    (state, start, end, silent) =>
      hasClosingFence(state, start, end) && original(state, start, end, silent),
    { alt: rule.alt },
  );
}
