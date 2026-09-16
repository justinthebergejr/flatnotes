<template>
  <Modal v-model="isVisible" class="px-6 py-4">
    <div class="mb-6 text-xl">Delete Group</div>

    <p v-if="groups.length === 0" class="mb-6 text-theme-text-muted">
      There are no groups to delete.
    </p>
    <div v-else class="mb-6 max-h-64 overflow-y-auto">
      <button
        v-for="group in groups"
        :key="group"
        class="block w-full rounded px-2 py-1 text-left hover:bg-theme-background-elevated"
        :class="{
          'bg-theme-background-elevated text-theme-text': group === selected,
          'text-theme-text-muted': group !== selected,
        }"
        @click="selected = group"
      >
        {{ group }}
        <span class="text-theme-text-very-muted">
          ({{ noteCount(group) }} {{ noteCount(group) === 1 ? "note" : "notes" }})
        </span>
      </button>
    </div>

    <p v-if="selected && noteCount(selected) > 0" class="mb-6">
      What should happen to the notes in '{{ selected }}'?
    </p>

    <div class="flex flex-wrap justify-end gap-2">
      <CustomButton label="Cancel" @click="isVisible = false" />
      <template v-if="selected && noteCount(selected) > 0">
        <CustomButton
          label="Move Notes Out"
          :style="'cta'"
          @click="confirmHandler('move')"
        />
        <CustomButton
          label="Delete Notes Too"
          :style="'danger'"
          @click="confirmHandler('delete')"
        />
      </template>
      <CustomButton
        v-else-if="selected"
        label="Delete"
        :style="'danger'"
        @click="confirmHandler('move')"
      />
    </div>
  </Modal>
</template>

<script setup>
import { useToast } from "primevue/usetoast";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { apiErrorHandler, deleteGroup, getGroups, getNotes } from "../api.js";
import { useGlobalStore } from "../globalStore.js";
import { getToastOptions, splitNoteTitle } from "../helpers.js";
import CustomButton from "./CustomButton.vue";
import Modal from "./Modal.vue";

const isVisible = defineModel({ type: Boolean });
const globalStore = useGlobalStore();
const groups = ref([]);
const notes = ref([]);
const route = useRoute();
const router = useRouter();
const selected = ref(null);
const toast = useToast();

function load() {
  selected.value = null;
  Promise.all([getGroups(), getNotes("*")])
    .then(([groupsData, notesData]) => {
      groups.value = groupsData;
      notes.value = notesData;
    })
    .catch((error) => {
      apiErrorHandler(error, toast);
    });
}

function noteCount(group) {
  return notes.value.filter((note) => note.group === group).length;
}

function confirmHandler(notesAction) {
  const group = selected.value;
  deleteGroup(group, notesAction)
    .then(() => {
      isVisible.value = false;
      globalStore.groupsVersion++;
      toast.add(getToastOptions("Group deleted ✓", "Success", "success"));
      followCurrentNote(group, notesAction);
    })
    .catch((error) => {
      if (error.response?.status === 409) {
        toast.add(getToastOptions(error.response.data.detail, "Clash", "error"));
      } else {
        apiErrorHandler(error, toast);
      }
    });
}

function followCurrentNote(group, notesAction) {
  if (route.name !== "note") {
    return;
  }
  const current = splitNoteTitle(route.params.title);
  if (current.group !== group) {
    return;
  }
  if (notesAction === "move") {
    router.replace({ name: "note", params: { title: current.name } });
  } else {
    router.push({ name: "home" });
  }
}

watch(isVisible, (visible) => {
  if (visible) {
    load();
  }
});
</script>
