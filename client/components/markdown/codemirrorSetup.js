import { EditorView, drawSelection, keymap } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { languages } from "@codemirror/language-data";
import { Prec } from "@codemirror/state";
import { tags } from "@lezer/highlight";

import { insertSnippet, toggleWrap } from "./editorCommands.js";

const theme = EditorView.theme({
  "&": {
    height: "100%",
    color: "rgb(var(--theme-text))",
    backgroundColor: "rgb(var(--theme-background))",
    fontSize: "1rem",
  },
  ".cm-content": {
    fontFamily: 'Consolas, "Lucida Console", Monaco, "Andale Mono", monospace',
    padding: "1rem 0",
    caretColor: "rgb(var(--theme-text))",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", lineHeight: "1.6" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "rgb(var(--theme-text))" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "rgb(var(--theme-brand) / 0.25)",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },
});

const highlightStyle = HighlightStyle.define([
  {
    tag: tags.heading,
    fontWeight: "bold",
    color: "rgb(var(--theme-text))",
  },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.link, color: "rgb(var(--theme-brand))" },
  { tag: tags.url, color: "rgb(var(--theme-brand))" },
  {
    tag: [tags.monospace, tags.labelName],
    color: "rgb(var(--theme-brand))",
  },
  { tag: tags.quote, color: "rgb(var(--theme-text-muted))" },
  {
    tag: [tags.processingInstruction, tags.contentSeparator],
    color: "rgb(var(--theme-text-very-muted))",
  },
  { tag: tags.list, color: "rgb(var(--theme-brand))" },
  { tag: tags.keyword, color: "rgb(var(--theme-brand))" },
  { tag: tags.comment, color: "rgb(var(--theme-text-muted))" },
  { tag: tags.string, color: "rgb(var(--theme-text-muted))" },
]);

const formattingKeymap = [
  { key: "Mod-b", run: (view) => toggleWrap(view, "**") },
  { key: "Mod-i", run: (view) => toggleWrap(view, "*") },
  { key: "Mod-e", run: (view) => toggleWrap(view, "`") },
  { key: "Mod-Shift-x", run: (view) => toggleWrap(view, "~~") },
  { key: "Mod-Shift-h", run: (view) => toggleWrap(view, "==") },
  { key: "Mod-k", run: (view) => insertSnippet(view, "[{}](url)") },
].map(({ key, run }) => ({
  key,

  run: (view) => {
    run(view);
    return true;
  },
}));

export default function codemirrorExtensions() {
  return [
    history(),
    drawSelection(),
    EditorView.lineWrapping,
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    syntaxHighlighting(highlightStyle),

    indentUnit.of("    "),
    Prec.high(keymap.of(formattingKeymap)),

    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    theme,
  ];
}
