# Markdown Syntax

Notes are rendered with [markdown-it](https://github.com/markdown-it/markdown-it),
which supports [CommonMark](https://commonmark.org/) and GitHub Flavored Markdown
plus the extensions below. Everything here works both in the editor's live
preview and in the saved note.

## Text formatting

| Syntax | Result |
| --- | --- |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `~~struck through~~` | ~~struck through~~ |
| `==highlighted==` or `<mark>highlighted</mark>` | highlighted text |
| `++inserted++` or `<ins>inserted</ins>` | underlined/inserted text |
| `H~2~O` | subscript |
| `19^th^` | superscript |
| `` `inline code` `` | `inline code` |

## Typographic replacements

These are converted as you type them:

| Input | Output |
| --- | --- |
| `(c)` `(C)` | © |
| `(r)` `(R)` | ® |
| `(tm)` `(TM)` | ™ |
| `+-` | ± |
| `...` | … |
| `--` / `---` | – / — |
| `"quoted"` | curly quotes |

## Emoji

Shortcodes are replaced with the matching emoji, e.g. `:cry:` → 😢,
`:tada:` → 🎉, `:+1:` → 👍. The full
[markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji) set is
available.

## Links

* Plain URLs and email addresses are linked automatically, including bare
  `www.example.com` addresses.
* `[[Note Title]]` links to another note.
* `#tag` links to a search for that tag.
* `[text](#heading-id)` jumps to a heading in the same note.

## Code

Indented code blocks (four spaces) and fenced blocks both work. Add a language
to a fenced block for syntax highlighting:

````text
```python
def greet(name):
    return f"Hello {name}"
```
````

## Lists

Bullet, numbered and task lists work as usual:

```text
- [ ] not done
- [x] done
```

### Definition lists

```text
Term
: The definition of the term.

Another term
: Its definition.
```

## Footnotes

```text
Here is a statement that needs a source[^1].

[^1]: The source, at the bottom of the note.
```

## Abbreviations

Define an abbreviation anywhere in the note and every occurrence of it gets a
tooltip:

```text
*[HTML]: HyperText Markup Language

The HTML spec is long.
```

## Custom containers

Use three colons to open and close a container. An optional title follows the
container name.

```text
::: warning Check your backups
This action cannot be undone.
:::
```

Available callouts: `info`, `note`, `tip`, `success`, `warning`, `caution`,
`danger`, `error`.

`details` renders a collapsible block:

```text
::: details Show the workings
The hidden content.
:::
```

Any other name, e.g. `::: my-thing`, becomes a plain `<div>` with a matching
class so you can target it with your own CSS.

## Maths

LaTeX is rendered with [KaTeX](https://katex.org/). Use `$…$` for inline maths
and `$$…$$` for a display block:

```text
Inline: $E = mc^2$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

A display block needs its closing `$$`. Until you type it, the `$$` shows as
ordinary text rather than swallowing the rest of the note.

The toolbar's **Math** menu holds shortcuts for inline maths, **π**, **fractions**
and **square roots**, along with a palette of common symbols (Greek letters,
operators, set notation, calculus and structures such as matrices).

All of them are aware of where the cursor is. Inside a maths span they insert
bare LaTeX; outside one they add the `$…$` themselves:

| Cursor is | Clicking √ inserts |
| --- | --- |
| `The area is ‸` | `$\sqrt{}$` |
| `$x = ‸$` | `\sqrt{}` |

The caret lands inside the first pair of braces, and any text you had selected is
wrapped by them.

## Editor shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd` + `B` | Bold |
| `Ctrl/Cmd` + `I` | Italic |
| `Ctrl/Cmd` + `E` | Inline code |
| `Ctrl/Cmd` + `K` | Link |
| `Ctrl/Cmd` + `Shift` + `X` | Strikethrough |
| `Ctrl/Cmd` + `Shift` + `H` | Highlight |
| `Tab` / `Shift` + `Tab` | Indent / outdent by four spaces |
| `Ctrl/Cmd` + `Enter` | Save |
| `Escape` | Leave edit mode |

## Autosaving

Edits to a saved note are written back a couple of seconds after you stop
typing. The header shows *Saving…* and then a *✓ Saved* that fades away; if a
save fails it stays on screen until the next one succeeds.

Only the content is autosaved — renaming a note stays a deliberate action. The
**Save** button therefore appears only when there is something autosave will not
do for you: a note that has never been saved, or a pending title or group
change. *Save now* is also always available from the **⋯** menu, alongside
*Delete note*.

## Raw HTML

Inline and block HTML is supported and sanitised before rendering, so scripts,
event handlers and `javascript:` links are stripped.
