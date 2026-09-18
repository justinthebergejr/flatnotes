import { EditorSelection } from "@codemirror/state";

export function toggleWrap(view, before, after = before) {
  const { state } = view;
  view.dispatch(
    state.changeByRange((range) => {
      const wrapped =
        state.sliceDoc(range.from - before.length, range.from) === before &&
        state.sliceDoc(range.to, range.to + after.length) === after;
      if (wrapped) {
        return {
          changes: [
            { from: range.from - before.length, to: range.from },
            { from: range.to, to: range.to + after.length },
          ],
          range: EditorSelection.range(range.from - before.length, range.to - before.length),
        };
      }
      return {
        changes: [
          { from: range.from, insert: before },
          { from: range.to, insert: after },
        ],
        range: EditorSelection.range(range.from + before.length, range.to + before.length),
      };
    }),
  );
  view.focus();
}

export function toggleLinePrefix(view, test, prefix) {
  const { state } = view;
  const lines = [];
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(range.to).number;
    for (let number = first; number <= last; number += 1) {
      if (!lines.some((line) => line.number === number)) {
        lines.push(state.doc.line(number));
      }
    }
  }

  const allPrefixed = lines.every((line) => test.test(line.text));
  const changes = lines.map((line, index) => {
    if (allPrefixed) {
      return {
        from: line.from,
        to: line.from + test.exec(line.text)[0].length,
      };
    }
    return { from: line.from, insert: prefix(index) };
  });

  view.dispatch({ changes });
  view.focus();
}

export function insertSnippet(view, snippet) {
  const { state } = view;
  view.dispatch(
    state.changeByRange((range) => {
      const selected = state.sliceDoc(range.from, range.to);
      const slot = snippet.indexOf("{}");

      if (slot === -1) {
        const text = snippet + selected;
        return {
          changes: { from: range.from, to: range.to, insert: text },
          range: EditorSelection.cursor(range.from + text.length),
        };
      }

      const text =
        snippet.slice(0, slot + 1) + selected + snippet.slice(slot + 1);
      return {
        changes: { from: range.from, to: range.to, insert: text },
        range: EditorSelection.cursor(range.from + slot + 1 + selected.length),
      };
    }),
  );
  view.focus();
}

export function insertBlock(view, text) {
  const { state } = view;
  view.dispatch(
    state.changeByRange((range) => {
      const line = state.doc.lineAt(range.from);
      const lead = line.text.trim() === "" ? "" : "\n\n";
      const insert = `${lead}${text}\n`;
      return {
        changes: { from: line.to, insert },
        range: EditorSelection.cursor(line.to + insert.length),
      };
    }),
  );
  view.focus();
}

export function replaceSelection(view, text) {
  const { state } = view;
  view.dispatch(
    state.changeByRange((range) => ({
      changes: { from: range.from, to: range.to, insert: text },
      range: EditorSelection.cursor(range.from + text.length),
    })),
  );
  view.focus();
}
