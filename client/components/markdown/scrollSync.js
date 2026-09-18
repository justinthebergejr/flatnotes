const HANDOVER_MS = 150;

function clamp(value, min, max) {
  if (value < min) return min;
  return value > max ? max : value;
}

export function topForLine(anchors, line, docLines, contentHeight) {
  if (!anchors.length) return 0;
  if (line <= anchors[0].line) return 0;

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (line < b.line) {
      return a.top + ((line - a.line) / (b.line - a.line)) * (b.top - a.top);
    }
  }

  const tail = anchors[anchors.length - 1];
  const span = Math.max(docLines - tail.line, 1);
  const rest = Math.max(contentHeight - tail.top, 0);
  return tail.top + clamp((line - tail.line) / span, 0, 1) * rest;
}

export function lineForTop(anchors, top, docLines, contentHeight) {
  if (!anchors.length) return 0;
  if (top <= anchors[0].top) return anchors[0].line;

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (top < b.top) {
      const span = b.top - a.top;
      if (span <= 0) return a.line;
      return a.line + ((top - a.top) / span) * (b.line - a.line);
    }
  }

  const tail = anchors[anchors.length - 1];
  const rest = Math.max(contentHeight - tail.top, 1);
  const span = Math.max(docLines - tail.line, 1);
  return tail.line + clamp((top - tail.top) / rest, 0, 1) * span;
}

export default function createScrollSync(view, preview) {
  const scroller = view.scrollDOM;

  let anchors = [];
  let measuredHeight = -1;
  let dirty = true;

  let driver = null;
  let driverAt = 0;
  let frame = 0;
  let pending = null;

  function usable() {
    return preview.clientHeight > 0 && scroller.clientHeight > 0;
  }

  function claim(source) {
    const now = performance.now();
    if (driver && driver !== source && now - driverAt < HANDOVER_MS) return false;
    driver = source;
    driverAt = now;
    return true;
  }

  function rebuild() {
    const base = preview.scrollTop - preview.getBoundingClientRect().top;
    const found = [];
    let last = -1;
    for (const el of preview.querySelectorAll("[data-line]")) {
      const line = Number(el.dataset.line);
      if (!Number.isFinite(line) || line <= last) continue;
      found.push({ line, top: el.getBoundingClientRect().top + base });
      last = line;
    }
    anchors = found;
    measuredHeight = preview.scrollHeight;
    dirty = false;
  }

  function editorLimit() {
    return Math.max(scroller.scrollHeight - scroller.clientHeight, 0);
  }

  function previewLimit() {
    return Math.max(preview.scrollHeight - preview.clientHeight, 0);
  }

  function editorLine() {
    const rect = scroller.getBoundingClientRect();
    const pos = view.posAtCoords({ x: rect.left + 4, y: rect.top + 1 }, false);
    if (pos == null) return 0;

    const doc = view.state.doc;
    const line = doc.lineAt(pos);
    const index = line.number - 1;
    if (line.number >= doc.lines) return index;

    const here = view.coordsAtPos(line.from);
    const next = view.coordsAtPos(doc.line(line.number + 1).from);
    if (!here || !next || next.top <= here.top) return index;

    return index + clamp((rect.top - here.top) / (next.top - here.top), 0, 1);
  }

  function editorTopFor(line) {
    const doc = view.state.doc;
    const number = clamp(Math.floor(line) + 1, 1, doc.lines);
    const coords = view.coordsAtPos(doc.line(number).from);
    if (!coords) {
      return ((number - 1) / Math.max(doc.lines - 1, 1)) * editorLimit();
    }
    return scroller.scrollTop + coords.top - scroller.getBoundingClientRect().top;
  }

  function applyFromEditor() {
    const top = topForLine(anchors, editorLine(), docLines(), preview.scrollHeight);
    const target = Math.round(clamp(top, 0, previewLimit()));
    if (Math.abs(preview.scrollTop - target) > 1) preview.scrollTop = target;
  }

  function applyFromPreview() {
    const line = lineForTop(anchors, preview.scrollTop, docLines(), preview.scrollHeight);
    const target = Math.round(clamp(editorTopFor(line), 0, editorLimit()));
    if (Math.abs(scroller.scrollTop - target) > 1) scroller.scrollTop = target;
  }

  function docLines() {
    return view.state.doc.lines;
  }

  function schedule(job) {
    pending = job;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const run = pending;
      pending = null;
      if (!run || !usable()) return;
      if (dirty || preview.scrollHeight !== measuredHeight) rebuild();
      if (anchors.length) run();
    });
  }

  function onEditorScroll() {
    if (claim("editor")) schedule(applyFromEditor);
  }

  function onPreviewScroll() {
    if (claim("preview")) schedule(applyFromPreview);
  }

  scroller.addEventListener("scroll", onEditorScroll, { passive: true });
  preview.addEventListener("scroll", onPreviewScroll, { passive: true });

  const resize = new ResizeObserver(() => {
    dirty = true;
  });
  resize.observe(preview);

  return {
    refresh() {
      dirty = true;
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onEditorScroll);
      preview.removeEventListener("scroll", onPreviewScroll);
      resize.disconnect();
    },
  };
}
