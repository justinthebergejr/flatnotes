<template>
  <div
    class="flex shrink-0 flex-wrap items-center gap-y-1 border-b border-theme-border py-1 print:hidden"
  >

    <template v-for="(group, index) in toolGroups" :key="index">
      <div
        v-if="index > 0"
        class="mx-1.5 h-5 w-px shrink-0 bg-theme-border"
      ></div>
      <div class="flex items-center gap-0.5">
        <button
          v-for="item in group"
          :key="item.title"
          type="button"
          :title="item.title"
          class="rounded p-1 text-theme-text-muted hover:bg-theme-background-elevated hover:text-theme-text"
          @click="item.run"
        >
          <SvgIcon type="mdi" :path="item.icon" size="1.15em" />
        </button>
      </div>
    </template>

    <div class="mx-1.5 h-5 w-px shrink-0 bg-theme-border"></div>

    <div class="flex items-center gap-0.5">
      <ToolbarMenu label="More" title="More formatting" panelClass="w-52">
        <template #default="{ close }">
          <button
            v-for="item in moreTools"
            :key="item.title"
            type="button"
            class="flex w-full items-center rounded px-2 py-1 text-left text-sm text-theme-text hover:bg-theme-background-elevated"
            @click="
              item.run();
              close();
            "
          >
            <SvgIcon
              type="mdi"
              :path="item.icon"
              size="1.15em"
              class="mr-2 text-theme-text-muted"
            />
            {{ item.title }}
          </button>
        </template>
      </ToolbarMenu>

      <ToolbarMenu
        label="Math"
        title="Maths and LaTeX"
        :iconPath="mdiSigma"
        panelClass="w-72"
      >
        <template #default="{ close }">
          <div class="mb-2 flex flex-wrap gap-0.5">
            <button
              v-for="item in mathTools"
              :key="item.title"
              type="button"
              :title="item.title"
              class="rounded p-1 text-theme-text hover:bg-theme-background-elevated"
              @click="
                item.run();
                close();
              "
            >
              <SvgIcon type="mdi" :path="item.icon" size="1.15em" />
            </button>
          </div>

          <div v-for="group in symbolGroups" :key="group.name" class="mb-2">
            <p class="mb-1 text-xs font-semibold text-theme-text-muted">
              {{ group.name }}
            </p>
            <div class="flex flex-wrap gap-0.5">
              <button
                v-for="symbol in group.symbols"
                :key="symbol.latex"
                type="button"
                :title="`${symbol.title || symbol.latex} — ${symbol.latex}`"
                class="min-w-[2rem] rounded px-1.5 py-1 text-theme-text hover:bg-theme-background-elevated"
                @click="insertSymbol(symbol.latex)"
              >
                {{ symbol.label }}
              </button>
            </div>
          </div>
        </template>
      </ToolbarMenu>
    </div>

    <div class="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
      <button
        v-for="mode in viewModes"
        :key="mode.value"
        type="button"
        :title="mode.title"
        class="rounded p-1 hover:bg-theme-background-elevated"
        :class="
          viewMode === mode.value
            ? 'bg-theme-background-elevated text-theme-brand'
            : 'text-theme-text-muted hover:text-theme-text'
        "
        @click="$emit('update:viewMode', mode.value)"
      >
        <SvgIcon type="mdi" :path="mode.icon" size="1.15em" />
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="fileSelected"
    />
  </div>
</template>

<script setup>
import SvgIcon from "@jamescoyle/vue-icon";
import {
  mdiCodeBracesBox,
  mdiCodeTags,
  mdiEyeOutline,
  mdiFormatBold,
  mdiFormatHeaderPound,
  mdiFormatItalic,
  mdiFormatListBulleted,
  mdiFormatListChecks,
  mdiFormatListNumbered,
  mdiFormatQuoteClose,
  mdiFormatStrikethrough,
  mdiFormatSubscript,
  mdiFormatSuperscript,
  mdiFractionOneHalf,
  mdiFunctionVariant,
  mdiImageOutline,
  mdiLinkVariant,
  mdiMarker,
  mdiMinus,
  mdiPi,
  mdiSigma,
  mdiSquareEditOutline,
  mdiSquareRoot,
  mdiTable,
  mdiViewSplitVertical,
} from "@mdi/js";
import { ref } from "vue";

import ToolbarMenu from "./ToolbarMenu.vue";
import {
  insertBlock,
  insertSnippet,
  toggleLinePrefix,
  toggleWrap,
} from "./editorCommands.js";
import insertMath from "./mathContext.js";
import symbolGroups from "./symbols.js";

const props = defineProps({
  view: Object,
  viewMode: String,
});

const emit = defineEmits(["update:viewMode", "uploadImage"]);

const fileInput = ref();

const viewModes = [
  { value: "edit", icon: mdiSquareEditOutline, title: "Editor only" },
  { value: "split", icon: mdiViewSplitVertical, title: "Editor and preview" },
  { value: "preview", icon: mdiEyeOutline, title: "Preview only" },
];

function withView(action) {
  return () => {
    if (props.view) {
      action(props.view);
    }
  };
}

const toolGroups = [
  [
    {
      title: "Heading",
      icon: mdiFormatHeaderPound,
      run: withView((view) => toggleLinePrefix(view, /^#{1,6}\s/, () => "## ")),
    },
    {
      title: "Bold",
      icon: mdiFormatBold,
      run: withView((view) => toggleWrap(view, "**")),
    },
    {
      title: "Italic",
      icon: mdiFormatItalic,
      run: withView((view) => toggleWrap(view, "*")),
    },
  ],
  [
    {
      title: "Bullet list",
      icon: mdiFormatListBulleted,
      run: withView((view) =>
        toggleLinePrefix(view, /^[-*+]\s(?!\[[ xX]\]\s)/, () => "- "),
      ),
    },
    {
      title: "Numbered list",
      icon: mdiFormatListNumbered,
      run: withView((view) =>
        toggleLinePrefix(view, /^\d+\.\s/, (index) => `${index + 1}. `),
      ),
    },
    {
      title: "Task list",
      icon: mdiFormatListChecks,
      run: withView((view) =>
        toggleLinePrefix(view, /^[-*+]\s\[[ xX]\]\s/, () => "- [ ] "),
      ),
    },
    {
      title: "Quote",
      icon: mdiFormatQuoteClose,
      run: withView((view) => toggleLinePrefix(view, /^>\s/, () => "> ")),
    },
  ],
  [
    {
      title: "Link",
      icon: mdiLinkVariant,
      run: withView((view) => insertSnippet(view, "[{}](url)")),
    },
    {
      title: "Insert image",
      icon: mdiImageOutline,
      run: () => fileInput.value.click(),
    },
    {
      title: "Table",
      icon: mdiTable,
      run: withView((view) =>
        insertBlock(
          view,
          "| Column | Column |\n| ------ | ------ |\n|        |        |",
        ),
      ),
    },
  ],
  [
    {
      title: "Inline code",
      icon: mdiCodeTags,
      run: withView((view) => toggleWrap(view, "`")),
    },
    {
      title: "Code block",
      icon: mdiCodeBracesBox,
      run: withView((view) => insertBlock(view, "```\n\n```")),
    },
  ],
];

const moreTools = [
  {
    title: "Strikethrough",
    icon: mdiFormatStrikethrough,
    run: withView((view) => toggleWrap(view, "~~")),
  },
  {
    title: "Highlight",
    icon: mdiMarker,
    run: withView((view) => toggleWrap(view, "==")),
  },
  {
    title: "Superscript",
    icon: mdiFormatSuperscript,
    run: withView((view) => toggleWrap(view, "^")),
  },
  {
    title: "Subscript",
    icon: mdiFormatSubscript,
    run: withView((view) => toggleWrap(view, "~")),
  },
  {
    title: "Horizontal rule",
    icon: mdiMinus,
    run: withView((view) => insertBlock(view, "---")),
  },
];

const mathTools = [
  {
    title: "Inline maths",
    icon: mdiFunctionVariant,
    run: withView((view) => toggleWrap(view, "$")),
  },
  {
    title: "Pi",
    icon: mdiPi,
    run: withView((view) => insertMath(view, "\\pi")),
  },
  {
    title: "Fraction",
    icon: mdiFractionOneHalf,
    run: withView((view) => insertMath(view, "\\frac{}{}")),
  },
  {
    title: "Square root",
    icon: mdiSquareRoot,
    run: withView((view) => insertMath(view, "\\sqrt{}")),
  },
];

function insertSymbol(latex) {
  if (props.view) {
    insertMath(props.view, latex);
  }
}

function fileSelected(event) {
  const [file] = event.target.files;
  if (file) {
    emit("uploadImage", file);
  }

  event.target.value = "";
}
</script>
