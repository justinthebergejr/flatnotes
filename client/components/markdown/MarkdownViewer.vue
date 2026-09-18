<template>
  <div class="markdown-body" v-html="html"></div>
</template>

<script setup>
import { computed } from "vue";

import renderMarkdown from "./renderMarkdown.js";

const props = defineProps({
  initialValue: String,
});

const html = computed(() => renderMarkdown(props.initialValue));
</script>

<style>
@import "katex/dist/katex.min.css";
@import "./markdown.scss";
</style>
