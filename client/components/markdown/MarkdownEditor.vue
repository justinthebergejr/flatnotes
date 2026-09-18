<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <MarkdownToolbar
      :view="view"
      :viewMode="viewMode"
      @update:viewMode="setViewMode"
      @uploadImage="uploadFile"
    />

    <div class="flex min-h-0 flex-1">
      <div
        v-show="viewMode !== 'preview'"
        ref="editorElement"
        class="min-w-0 flex-1 overflow-hidden"
      ></div>

      <div
        v-if="viewMode === 'split'"
        class="mx-3 hidden w-px shrink-0 bg-theme-border md:block"
      ></div>

      <div
        v-show="viewMode !== 'edit'"
        ref="previewElement"
        class="markdown-body min-w-0 flex-1 overflow-y-auto py-4"
        :class="{ 'hidden md:block': viewMode === 'split' }"
        v-html="previewHtml"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { EditorState, Prec } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";

import MarkdownToolbar from "./MarkdownToolbar.vue";
import codemirrorExtensions from "./codemirrorSetup.js";
import { replaceSelection } from "./editorCommands.js";
import renderMarkdown from "./renderMarkdown.js";
import createScrollSync from "./scrollSync.js";

const viewModeStorageKey = "markdownEditorViewMode";
const previewDebounceMs = 200;

const props = defineProps({
  initialValue: String,

  uploadImage: Function,
});

const emit = defineEmits(["change", "keydown"]);

const editorElement = ref();
const previewElement = ref();

const view = shallowRef(null);
let scrollSync = null;
const previewSource = ref(props.initialValue || "");
const viewMode = ref(loadViewMode());

const previewHtml = computed(() => renderMarkdown(previewSource.value));

let previewTimeout = null;

function loadViewMode() {
  const stored = localStorage.getItem(viewModeStorageKey);
  return ["edit", "split", "preview"].includes(stored) ? stored : "split";
}

function setViewMode(mode) {
  viewMode.value = mode;
  localStorage.setItem(viewModeStorageKey, mode);
}

function schedulePreview() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(() => {
    previewSource.value = getMarkdown();
  }, previewDebounceMs);
}

function imageFrom(list) {
  return Array.from(list || []).find((file) => file.type.startsWith("image/"));
}

function uploadFile(file) {
  if (!props.uploadImage || !file) {
    return;
  }
  Promise.resolve(props.uploadImage(file)).then((data) => {
    if (data && view.value) {
      replaceSelection(view.value, `![${data.filename}](${data.url})`);
    }
  });
}

onMounted(() => {
  view.value = new EditorView({
    parent: editorElement.value,
    state: EditorState.create({
      doc: props.initialValue || "",
      extensions: [
        ...codemirrorExtensions(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            emit("change");
            schedulePreview();
          }
        }),

        Prec.highest(
          EditorView.domEventHandlers({
            keydown(event) {
              emit("keydown", event);
              const isSave =
                (event.ctrlKey || event.metaKey) && event.key === "Enter";
              return isSave || event.key === "Escape";
            },
            paste(event) {
              const file = imageFrom(event.clipboardData?.files);
              if (file) {
                event.preventDefault();
                uploadFile(file);
                return true;
              }
              return false;
            },
            drop(event) {
              const file = imageFrom(event.dataTransfer?.files);
              if (file) {
                event.preventDefault();
                uploadFile(file);
                return true;
              }
              return false;
            },
          }),
        ),
      ],
    }),
  });
  view.value.focus();
  scrollSync = createScrollSync(view.value, previewElement.value);
});

watch([previewHtml, viewMode], () => {
  nextTick(() => scrollSync?.refresh());
});

onBeforeUnmount(() => {
  clearTimeout(previewTimeout);
  scrollSync?.destroy();
  view.value?.destroy();
});

function getMarkdown() {
  return view.value
    ? view.value.state.doc.toString()
    : props.initialValue || "";
}

defineExpose({ getMarkdown });
</script>

<style>
@import "katex/dist/katex.min.css";
@import "./markdown.scss";
</style>
