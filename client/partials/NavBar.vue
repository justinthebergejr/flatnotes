<template>
  <nav class="mb-4 flex flex-wrap items-center gap-y-2 md:mb-8">
    <RouterLink :to="{ name: 'home' }" class="mr-4 shrink-0">
      <Logo iconOnly></Logo>
    </RouterLink>
    <SearchInput
      :initialSearchTerm="currentSearchTerm"
      :autofocus="false"
      class="order-last md:order-none md:max-w-[500px] md:flex-1"
    />
    <div class="ml-auto flex items-center pl-4">
      <!-- New -->
      <CustomButton
        v-if="showNewButton"
        :iconPath="mdilPlusCircle"
        label="New"
        @click="toggleNewMenu"
      />
      <PrimeMenu ref="newMenu" :model="newMenuItems" :popup="true" />
      <NewGroupModal
        v-model="isNewGroupModalVisible"
        @confirm="newGroupHandler"
      />
      <DeleteGroupModal v-model="isDeleteGroupModalVisible" />
      <!-- Menu -->
      <CustomButton
        class="ml-1"
        :iconPath="mdilMenu"
        label="Menu"
        @click="toggleMenu"
      />
      <PrimeMenu ref="menu" :model="menuItems" :popup="true" />
    </div>
  </nav>
</template>

<script setup>
import {
  mdilLogout,
  mdilDelete,
  mdilMagnify,
  mdilMenu,
  mdilFolderPlus,
  mdilMonitor,
  mdilNote,
  mdilNoteMultiple,
  mdilPlusCircle,
} from "@mdi/light-js";
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { apiErrorHandler, createGroup } from "../api.js";
import CustomButton from "../components/CustomButton.vue";
import DeleteGroupModal from "../components/DeleteGroupModal.vue";
import Logo from "../components/Logo.vue";
import NewGroupModal from "../components/NewGroupModal.vue";
import PrimeMenu from "../components/PrimeMenu.vue";
import { authTypes, params, searchSortOptions } from "../constants.js";
import { useGlobalStore } from "../globalStore.js";
import { getToastOptions, toggleTheme } from "../helpers.js";
import { clearStoredToken } from "../tokenStorage.js";
import SearchInput from "./SearchInput.vue";

const globalStore = useGlobalStore();
const isDeleteGroupModalVisible = ref(false);
const isNewGroupModalVisible = ref(false);
const menu = ref();
const newMenu = ref();
const toast = useToast();
const route = useRoute();
const router = useRouter();

const emit = defineEmits(["toggleSearchModal"]);

const currentSearchTerm = computed(() => {
  return route.name === "search" ? route.query[params.searchTerm] || "" : "";
});

const newMenuItems = [
  {
    label: "Note",
    icon: mdilNote,
    command: () => router.push({ name: "new" }),
    keyboardShortcut: "Ctrl+Alt+N",
  },
  {
    label: "Group",
    icon: mdilFolderPlus,
    command: () => (isNewGroupModalVisible.value = true),
  },
];

const menuItems = [
  {
    label: "Search",
    icon: mdilMagnify,
    command: () => emit("toggleSearchModal"),
    keyboardShortcut: "/",
  },
  {
    label: "All Notes",
    icon: mdilNoteMultiple,
    command: () =>
      router.push({
        name: "search",
        query: {
          [params.searchTerm]: "*",
          [params.sortBy]: searchSortOptions.title,
        },
      }),
  },
  {
    label: "Delete Group",
    icon: mdilDelete,
    command: () => (isDeleteGroupModalVisible.value = true),
    visible: () => showNewButton.value,
  },
  {
    label: "Toggle Theme",
    icon: mdilMonitor,
    command: toggleTheme,
  },
  {
    separator: true,
    visible: showLogOutButton,
  },
  {
    label: "Log Out",
    icon: mdilLogout,
    command: logOut,
    visible: showLogOutButton,
  },
];

const showNewButton = computed(() => {
  return globalStore.config.authType !== authTypes.readOnly;
});

function logOut() {
  clearStoredToken();
  localStorage.clear();
  router.push({ name: "login" });
}

function toggleNewMenu(event) {
  newMenu.value.toggle(event);
}

function newGroupHandler(name) {
  createGroup(name)
    .then(() => {
      globalStore.groupsVersion++;
      toast.add(getToastOptions("Group created ✓", "Success", "success"));
    })
    .catch((error) => {
      if (error.response?.status === 409) {
        toast.add(
          getToastOptions(
            "A group with this name already exists.",
            "Duplicate",
            "error",
          ),
        );
      } else {
        apiErrorHandler(error, toast);
      }
    });
}

function toggleMenu(event) {
  menu.value.toggle(event);
}

function showLogOutButton() {
  return ![authTypes.none, authTypes.readOnly].includes(globalStore.config.authType);
}
</script>
