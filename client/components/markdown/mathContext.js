import { insertSnippet } from "./editorCommands.js";

function isEscaped(text, index) {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

export function mathRegions(text) {
  const regions = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] !== "$" || isEscaped(text, i)) {
      i += 1;
      continue;
    }

    const delimiter = text.startsWith("$$", i) ? "$$" : "$";
    const contentFrom = i + delimiter.length;

    let end = -1;
    for (let j = contentFrom; j < text.length; j += 1) {
      if (text[j] === "$" && !isEscaped(text, j) && text.startsWith(delimiter, j)) {
        end = j;
        break;
      }
    }

    if (end === -1) {
      i = contentFrom;
      continue;
    }

    regions.push({ from: i, to: end + delimiter.length, contentFrom, contentTo: end });
    i = end + delimiter.length;
  }

  return regions;
}

export function isInsideMath(text, pos) {
  return mathRegions(text).some((region) => pos > region.from && pos < region.to);
}

export default function insertMath(view, latex) {
  const { state } = view;
  const inside = isInsideMath(state.doc.toString(), state.selection.main.from);
  insertSnippet(view, inside ? latex : `$${latex}$`);
}
