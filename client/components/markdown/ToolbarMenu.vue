<template>
  <div ref="container" class="relative">
    <button
      type="button"
      :title="title"
      class="flex items-center rounded py-1 pl-1.5 pr-0.5 text-sm"
      :class="
        isOpen
          ? 'bg-theme-background-elevated text-theme-text'
          : 'text-theme-text-muted hover:bg-theme-background-elevated hover:text-theme-text'
      "
      @click="isOpen = !isOpen"
    >
      <SvgIcon v-if="iconPath" type="mdi" :path="iconPath" size="1.15em" />
      <span v-if="label" class="ml-1">{{ label }}</span>
      <SvgIcon type="mdi" :path="mdiMenuDown" size="1em" />
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 z-20 mt-1 max-h-80 overflow-y-auto rounded border border-theme-border bg-theme-background p-2 shadow-lg shadow-theme-shadow"
      :class="panelClass"
    >
      <slot :close="close"></slot>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiMenuDown } from "@mdi/js";
import { onBeforeUnmount, onMounted, ref } from "vue";

defineProps({
  title: String,
  label: String,
  iconPath: String,

  panelClass: {
    type: String,
    default: "w-56",
  },
});

const container = ref();
const isOpen = ref(false);

function close() {
  isOpen.value = false;
}

function closeOnOutsideClick(event) {
  if (isOpen.value && container.value && !container.value.contains(event.target)) {
    close();
  }
}

function closeOnEscape(event) {
  if (event.key === "Escape") close();
}

onMounted(() => {
  document.addEventListener("click", closeOnOutsideClick);
  document.addEventListener("keydown", closeOnEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeOnOutsideClick);
  document.removeEventListener("keydown", closeOnEscape);
});
</script>
