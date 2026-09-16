<template>
  <aside class="flex flex-col items-start">
    <template v-if="!globalStore.config.quickAccessHide">
      <p
        v-if="recentNotes.length > 0"
        class="mb-2 px-2 text-xs font-bold uppercase text-theme-text-very-muted"
      >
        {{ globalStore.config.quickAccessTitle }}
      </p>
      <RouterLink
        v-for="note in recentNotes"
        :key="note.title"
        :to="{ name: 'note', params: { title: note.title } }"
        class="mb-1 block w-full"
      >
        <CustomButton
          :label="note.name"
          :title="note.name"
          class="w-full overflow-hidden text-left"
          :class="noteClasses(note)"
        />
      </RouterLink>
    </template>

    <template v-if="groups.length > 0">
      <p
        class="mb-2 mt-4 px-2 text-xs font-bold uppercase text-theme-text-very-muted"
      >
        Groups
      </p>
      <div v-for="group in groups" :key="group.name" class="w-full">
        <CustomButton
          :label="isExpanded(group.name) ? `${group.name} –` : group.name"
          class="mb-1 w-full overflow-hidden text-left"
          @click="toggleGroup(group.name)"
        />
        <div v-if="isExpanded(group.name)" class="pl-6">
          <RouterLink
            v-for="note in group.notes"
            :key="note.title"
            :to="{ name: 'note', params: { title: note.title } }"
            class="mb-1 block w-full"
          >
            <CustomButton
              :label="note.name"
              :title="note.name"
              class="w-full overflow-hidden text-left"
              :class="noteClasses(note)"
            />
          </RouterLink>
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup>
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { apiErrorHandler, getGroups, getNotes } from "../api.js";
import CustomButton from "../components/CustomButton.vue";
import { useGlobalStore } from "../globalStore.js";

const globalStore = useGlobalStore();
const notes = ref([]);
const groupNames = ref([]);
const expandedGroups = ref([]);
const route = useRoute();
const toast = useToast();

const recentNotes = computed(() => notes.value.slice(0, 3));

const groups = computed(() => {
  const byName = {};
  for (const name of groupNames.value) {
    byName[name] = [];
  }
  for (const note of notes.value) {
    if (note.group) {
      byName[note.group] = byName[note.group] || [];
      byName[note.group].push(note);
    }
  }
  return Object.keys(byName)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name: name,
      notes: byName[name].sort((a, b) => a.name.localeCompare(b.name)),
    }));
});

const currentTitle = computed(() => {
  return route.name === "note" ? route.params.title : null;
});

function init() {
  Promise.all([getNotes("*", "lastModified", "desc"), getGroups()])
    .then(([notesData, groupsData]) => {
      notes.value = notesData;
      groupNames.value = groupsData;
      expandCurrentGroup();
    })
    .catch((error) => {
      apiErrorHandler(error, toast);
    });
}

function expandCurrentGroup() {
  const note = notes.value.find((note) => note.title === currentTitle.value);
  if (note?.group && !isExpanded(note.group)) {
    expandedGroups.value.push(note.group);
  }
}

function isExpanded(name) {
  return expandedGroups.value.includes(name);
}

function toggleGroup(name) {
  if (isExpanded(name)) {
    expandedGroups.value = expandedGroups.value.filter((g) => g !== name);
  } else {
    expandedGroups.value.push(name);
  }
}

function noteClasses(note) {
  if (note.title === currentTitle.value) {
    return "bg-theme-background-elevated";
  }
  return "";
}

watch(() => route.fullPath, init);
watch(() => globalStore.groupsVersion, init);
onMounted(init);
</script>
