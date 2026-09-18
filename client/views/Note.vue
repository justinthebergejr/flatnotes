<template>
  <!-- Confirm Deletion Modal -->
  <ConfirmModal
    v-model="isDeleteModalVisible"
    title="Confirm Deletion"
    :message="`Are you sure you want to delete the note '${note.name}'?`"
    confirmButtonText="Delete"
    confirmButtonStyle="danger"
    @confirm="deleteConfirmedHandler"
  />

  <!-- Save Changes Modal -->
  <ConfirmModal
    v-model="isSaveChangesModalVisible"
    title="Save Changes"
    message="Do you want to save your changes?"
    confirmButtonText="Save"
    confirmButtonStyle="success"
    rejectButtonText="Discard"
    rejectButtonStyle="danger"
    @confirm="saveHandler((close = true))"
    @reject="closeNote"
    @cancel="pendingRoute = null"
  />

  <!-- Draft Modal -->
  <ConfirmModal
    v-model="isDraftModalVisible"
    title="Draft Detected"
    message="There is an unsaved draft of this note stored in this browser. Do you want to resume the draft version or delete it?"
    confirmButtonText="Resume Draft"
    confirmButtonStyle="cta"
    rejectButtonText="Delete Draft"
    rejectButtonStyle="danger"
    @confirm="setEditMode()"
    @reject="
      clearDraft();
      setEditMode();
    "
  />

  <NewGroupModal v-model="isNewGroupModalVisible" @confirm="setGroup" />

  <LoadingIndicator ref="loadingIndicator" class="flex h-full flex-col">
    <!-- Header -->
    <div class="flex flex-col-reverse md:flex-row md:items-baseline">
      <CustomButton
        :iconPath="
          globalStore.sideBarHidden ? mdilChevronRight : mdilChevronLeft
        "
        :title="globalStore.sideBarHidden ? 'Show sidebar' : 'Hide sidebar'"
        class="mr-2 hidden md:block print:hidden"
        @click="globalStore.sideBarHidden = !globalStore.sideBarHidden"
      />
      <!-- Title. The right margin keeps it from colliding with the controls. -->
      <div class="grow truncate text-3xl leading-[1.6em] md:mr-6">
        <span v-show="!editMode" :title="note.name">{{ note.name }}</span>
        <input
          v-show="editMode"
          v-model.trim="newTitle"
          class="w-full bg-theme-background outline-none"
          placeholder="Title"
        />
      </div>

      <!-- Controls. Everything here is secondary to the title, so it is set a
           size down and in a muted colour. -->
      <div
        class="flex shrink-0 items-center gap-1 self-end md:self-baseline print:hidden"
      >
        <CustomButton
          v-show="editMode"
          :label="newGroup || 'No Group'"
          :iconPath="mdilFolder"
          iconSize="1em"
          class="text-sm"
          @click="toggleGroupMenu"
        />
        <PrimeMenu ref="groupMenu" :model="groupMenuItems" :popup="true" />

        <!-- Save status. Appears only while something is happening and fades
             out again, unless a save actually failed. -->
        <Transition name="save-status">
          <span
            v-if="saveStatus"
            class="whitespace-nowrap px-1 text-sm"
            :class="
              saveStatus.isError
                ? 'font-semibold text-theme-danger'
                : 'text-theme-text-very-muted'
            "
            >{{ saveStatus.label }}</span
          >
        </Transition>

        <!-- Save. Only shown for the things autosave deliberately will not do:
             creating a new note, and applying a title or group change. -->
        <CustomButton
          v-show="needsManualSave"
          label="Save"
          :iconPath="mdilContentSave"
          iconSize="1em"
          class="relative text-sm"
          @click="saveHandler((close = false))"
        >
          <!-- Unsaved Changes Indicator -->
          <div
            v-show="unsavedChanges"
            class="absolute right-1 h-1.5 w-1.5 rounded-full bg-theme-brand"
          ></div>
        </CustomButton>

        <!-- Everything infrequent or destructive lives in here. -->
        <CustomButton
          v-show="overflowMenuItems.length"
          :iconPath="mdilDotsHorizontal"
          title="More actions"
          @click="toggleOverflowMenu"
        />
        <PrimeMenu
          ref="overflowMenu"
          :model="overflowMenuItems"
          :popup="true"
        />

        <!-- Edit Toggle -->
        <Toggle
          v-if="canModify"
          label="Edit"
          :isOn="editMode"
          @click="toggleEditModeHandler"
        />
      </div>
    </div>

    <hr v-if="!editMode" class="my-4 border-theme-border" />

    <!-- Content. min-h-0 lets the editor own its own scrolling so the toolbar
         stays in view instead of being pushed off the top of the page. -->
    <div class="flex min-h-0 flex-1 flex-col">
      <MarkdownViewer
        v-if="!editMode"
        :initialValue="note.content"
        class="overflow-y-auto pb-4"
      />
      <MarkdownEditor
        v-if="editMode"
        ref="editor"
        :initialValue="getInitialEditorValue()"
        :uploadImage="postAttachment"
        @change="startContentChangedTimeout"
        @keydown="keydownHandler"
      />
    </div>
  </LoadingIndicator>
</template>

<style>
/* The save status appears promptly and lingers just long enough to be read. */
.save-status-enter-active {
  transition: opacity 0.15s ease;
}
.save-status-leave-active {
  transition: opacity 0.6s ease;
}
.save-status-enter-from,
.save-status-leave-to {
  opacity: 0;
}
</style>

<script setup>
import { mdiNoteOffOutline } from "@mdi/js";
import {
  mdilChevronLeft,
  mdilChevronRight,
  mdilContentSave,
  mdilDelete,
  mdilDotsHorizontal,
  mdilFolder,
  mdilFolderPlus,
} from "@mdi/light-js";
import Mousetrap from "mousetrap";
import { useToast } from "primevue/usetoast";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from "vue-router";

import {
  apiErrorHandler,
  createAttachment,
  createNote,
  deleteNote,
  getGroups,
  getNote,
  updateNote,
} from "../api.js";
import { Note } from "../classes.js";
import ConfirmModal from "../components/ConfirmModal.vue";
import CustomButton from "../components/CustomButton.vue";
import LoadingIndicator from "../components/LoadingIndicator.vue";
import MarkdownEditor from "../components/markdown/MarkdownEditor.vue";
import MarkdownViewer from "../components/markdown/MarkdownViewer.vue";
import NewGroupModal from "../components/NewGroupModal.vue";
import PrimeMenu from "../components/PrimeMenu.vue";
import Toggle from "../components/Toggle.vue";
import { authTypes } from "../constants.js";
import { useGlobalStore } from "../globalStore.js";
import { getToastOptions, joinNoteTitle } from "../helpers.js";
import { isCurrentTokenStored } from "../tokenStorage.js";

const props = defineProps({
  title: String,
});

const canModify = computed(
  () => globalStore.config.authType != authTypes.readOnly,
);
let contentChangedTimeout = null;
let autosaveTimeout = null;
let autosaveStatusTimeout = null;
let autosaveInFlight = false;
const autosaveState = ref("idle");

const saveStatus = computed(
  () =>
    ({
      saving: { label: "Saving…", isError: false },
      saved: { label: "✓ Saved", isError: false },
      error: { label: "Autosave failed", isError: true },
    })[autosaveState.value] || null,
);


/*
 * Manual saving only covers what autosave deliberately leaves alone: creating a
 * note that has never been saved, and applying a title or group change.
 */
const needsManualSave = computed(() => {
  if (!editMode.value) return false;
  return (
    isNewNote.value ||
    joinNoteTitle(newGroup.value, newTitle.value) !== note.value.title
  );
});
const editMode = ref(false);
const globalStore = useGlobalStore();
const isSaveChangesModalVisible = ref(false);
const isDeleteModalVisible = ref(false);
const isDraftModalVisible = ref(false);
const isNewNote = computed(() => !props.title);
const loadingIndicator = ref();
const note = ref({});
const reservedFilenameCharacters = /[<>:"/\\|?*]/;
const router = useRouter();
const newTitle = ref();
const newGroup = ref(null);
const groupMenu = ref();
const groupMenuItems = ref([]);
const overflowMenu = ref();

/*
 * Infrequent and destructive actions. Manual saving stays reachable here even
 * when the Save button is hidden, so the shortcut always has a visible twin.
 */
const overflowMenuItems = computed(() => {
  const items = [];
  if (editMode.value) {
    items.push({
      label: "Save now",
      icon: mdilContentSave,
      keyboardShortcut: "Ctrl + Enter",
      command: () => saveHandler(false),
    });
  }
  if (canModify.value && !isNewNote.value) {
    if (items.length) {
      items.push({ separator: true });
    }
    items.push({
      label: "Delete note",
      icon: mdilDelete,
      command: deleteHandler,
    });
  }
  return items;
});

function toggleOverflowMenu(event) {
  overflowMenu.value.toggle({ currentTarget: event.currentTarget });
}
const isNewGroupModalVisible = ref(false);
let pendingRoute = null;
const toast = useToast();
const editor = ref();
const unsavedChanges = ref(false);

function init() {
  // Return if we already have the note e.g. When we rename a note, the route prop would change but we’d already have the note.
  if (props.title && props.title == note.value.title) {
    return;
  }

  clearAutosaveTimeout();
  setAutosaveState("idle");
  loadingIndicator.value.setLoading();
  if (props.title) {
    editMode.value = false;
    unsavedChanges.value = false;
    getNote(props.title)
      .then((data) => {
        note.value = data;
        loadingIndicator.value.setLoaded();
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          loadingIndicator.value.setFailed("Note not found", mdiNoteOffOutline);
        } else {
          loadingIndicator.value.setFailed();
          apiErrorHandler(error, toast);
        }
      });
  } else {
    newTitle.value = "";
    newGroup.value = null;
    note.value = new Note();
    // Set the editMode to false to close any existing editors.
    // This ensures the editor is cleanly reinitialised in an empty state.
    // Simple fix for #266 without requiring a full re-work of the logic.
    editMode.value = false;
    nextTick(() => {
      editHandler();
      loadingIndicator.value.setLoaded();
    });
  }
}

// Note Editing
function toggleEditModeHandler() {
  if (editMode.value) {
    closeHandler();
  } else {
    editHandler();
  }
}

function editHandler() {
  const draftContent = loadDraft();
  if (draftContent) {
    isDraftModalVisible.value = true;
  } else {
    setEditMode();
  }
}

function setEditMode() {
  newTitle.value = note.value.name;
  newGroup.value = note.value.group;
  unsavedChanges.value = false;
  editMode.value = true;
}

function getInitialEditorValue() {
  const draftContent = loadDraft();
  return draftContent ? draftContent : note.value.content;
}

// Note Deletion
function deleteHandler() {
  isDeleteModalVisible.value = true;
}

function deleteConfirmedHandler() {
  deleteNote(note.value.title)
    .then(() => {
      clearDraft();
      editMode.value = false;
      toast.add(getToastOptions("Note deleted ✓", "Success", "success"));
      router.push({ name: "home" });
    })
    .catch((error) => {
      apiErrorHandler(error, toast);
    });
}

// Note Saving
function saveHandler(close = false) {
  // A manual save supersedes any pending autosave.
  clearAutosaveTimeout();

  // Empty Title Validation
  if (!newTitle.value) {
    toast.add(
      getToastOptions("Cannot save note without a title.", "Invalid", "error"),
    );
    return;
  }

  // Invalid Character Validation
  if (reservedFilenameCharacters.test(newTitle.value)) {
    badFilenameToast("Title");
    return;
  }

  // Save Note
  let newContent = editor.value.getMarkdown();
  const fullTitle = joinNoteTitle(newGroup.value, newTitle.value);
  if (isNewNote.value) {
    saveNew(fullTitle, newContent, close);
  } else {
    saveExisting(fullTitle, newContent, close);
  }
}

function saveNew(newTitle, newContent, close = false) {
  createNote(newTitle, newContent)
    .then((data) => {
      clearDraft();
      note.value = data;
      router
        .push({
          name: "note",
          params: { title: note.value.title },
        })
        .then(() => {
          // Wait for the route to be updated before setting edit mode to false
          // as the route is used to determine the action.
          noteSaveSuccess(close);
        });
    })
    .catch(noteSaveFailure);
}

function saveExisting(newTitle, newContent, close = false) {
  // Return if no changes
  if (newTitle == note.value.title && newContent == note.value.content) {
    noteSaveSuccess(close);
    return;
  }

  updateNote(note.value.title, newTitle, newContent)
    .then((data) => {
      clearDraft();
      note.value = data;
      router.replace({ name: "note", params: { title: note.value.title } });
      noteSaveSuccess(close);
    })
    .catch(noteSaveFailure);
}

function noteSaveFailure(error) {
  pendingRoute = null;
  if (error.response?.status === 409) {
    toast.add(
      getToastOptions(
        "A note with this title already exists. Please try again with a new title.",
        "Duplicate",
        "error",
      ),
    );
  } else if (error.response?.status === 413) {
    entityTooLargeToast("note");
  } else {
    apiErrorHandler(error, toast);
  }
}

function noteSaveSuccess(close = false) {
  unsavedChanges.value = false;
  if (close) {
    closeNote();
  }
  setBeforeUnloadConfirmation(false);
  toast.add(getToastOptions("Note saved successfully ✓", "Success", "success"));
}

// Note Closure
function closeHandler() {
  pendingRoute = null;
  flushAutosave();
  if (isContentChanged()) {
    isSaveChangesModalVisible.value = true;
  } else {
    closeNote();
  }
}

function closeNote() {
  clearAutosaveTimeout();
  setAutosaveState("idle");
  clearDraft();
  editMode.value = false;
  unsavedChanges.value = false;
  setBeforeUnloadConfirmation(false);
  if (pendingRoute) {
    const to = pendingRoute;
    pendingRoute = null;
    router.push(to);
  } else if (isNewNote.value) {
    router.push({ name: "home" });
  }
}

// Groups
function toggleGroupMenu(event) {
  const target = event.currentTarget;
  getGroups()
    .then((groups) => {
      if (newGroup.value && !groups.includes(newGroup.value)) {
        groups.push(newGroup.value);
      }
      groups.sort((a, b) => a.localeCompare(b));
      groupMenuItems.value = [
        { label: "No Group", command: () => setGroup(null) },
        ...groups.map((group) => ({
          label: group,
          icon: mdilFolder,
          command: () => setGroup(group),
        })),
        { separator: true },
        {
          label: "New Group",
          icon: mdilFolderPlus,
          command: () => (isNewGroupModalVisible.value = true),
        },
      ];
      groupMenu.value.toggle({ currentTarget: target });
    })
    .catch((error) => {
      apiErrorHandler(error, toast);
    });
}

function setGroup(group) {
  newGroup.value = group;
  startContentChangedTimeout();
}

// Image Upload
function postAttachment(file) {
  // Invalid Character Validation
  if (reservedFilenameCharacters.test(file.name)) {
    badFilenameToast("Title");
    return;
  }

  // Uploading Toast
  toast.add(getToastOptions("Uploading attachment..."));

  // Upload the attachment
  return createAttachment(file)
    .then((data) => {
      // Success Toast
      toast.add(
        getToastOptions(
          "Attachment uploaded successfully ✓",
          "Success",
          "success",
        ),
      );
      return data;
    })
    .catch((error) => {
      if (error.response?.status === 409) {
        // Note: The current implementation will append a datetime to the filename if it already exists.
        // Error Toast
        toast.add(
          getToastOptions(
            "An attachment with this filename already exists.",
            "Duplicate",
            "error",
          ),
        );
      } else if (error.response?.status == 413) {
        entityTooLargeToast("attachment");
      } else {
        apiErrorHandler(error, toast);
      }
    });
}

// Autosave
/*
 * Content is written back to the server a couple of seconds after typing stops.
 * Only the content is autosaved, under the note's existing title: renaming stays
 * a deliberate action so a half-typed title can never strand a note under the
 * wrong name. Notes that have never been saved have no title to save against, so
 * they stay draft-only until the first manual save.
 */
const autosaveDelay = 2000;
const savedStatusDuration = 1500;

/*
 * "Saving…" and "✓ Saved" are transient - autosave runs constantly, so a
 * permanent status would just be noise. A failure stays put until the next
 * successful save.
 */
function setAutosaveState(state) {
  autosaveState.value = state;
  clearTimeout(autosaveStatusTimeout);
  if (state === "saved") {
    autosaveStatusTimeout = setTimeout(() => {
      if (autosaveState.value === "saved") {
        autosaveState.value = "idle";
      }
    }, savedStatusDuration);
  }
}

function canAutosave() {
  return (
    canModify.value && editMode.value && !isNewNote.value && Boolean(note.value.title)
  );
}

function scheduleAutosave() {
  clearAutosaveTimeout();
  if (canAutosave()) {
    autosaveTimeout = setTimeout(autosave, autosaveDelay);
  }
}

function clearAutosaveTimeout() {
  if (autosaveTimeout == null) return;
  clearTimeout(autosaveTimeout);
  autosaveTimeout = null;
}

// Run any pending autosave now, e.g. before navigating away.
function flushAutosave() {
  if (autosaveTimeout != null) {
    clearAutosaveTimeout();
    autosave();
  }
}

function autosave() {
  autosaveTimeout = null;
  if (!canAutosave() || autosaveInFlight) {
    return;
  }

  const newContent = editor.value?.getMarkdown();
  if (newContent == null || newContent === note.value.content) {
    return;
  }

  autosaveInFlight = true;
  setAutosaveState("saving");
  const titleAtSave = note.value.title;

  updateNote(titleAtSave, titleAtSave, newContent)
    .then((data) => {
      // The note may have been renamed or closed while the request was in
      // flight; only apply the result if it still refers to this note.
      if (note.value.title === titleAtSave) {
        note.value.content = data.content;
        note.value.lastModified = data.lastModified;
        if (editMode.value && editor.value) {
          contentChangedHandler();
        }
      }
      setAutosaveState("saved");
    })
    .catch((error) => {
      // Keep the local draft so nothing is lost, and only complain once per
      // failure rather than on every retry.
      const alreadyFailing = autosaveState.value === "error";
      setAutosaveState("error");
      if (!alreadyFailing) {
        apiErrorHandler(error, toast);
      }
    })
    .finally(() => {
      autosaveInFlight = false;
    });
}

// Content Change Watcher
function startContentChangedTimeout() {
  clearContentChangedTimeout();
  scheduleAutosave();
  contentChangedTimeout = setTimeout(contentChangedHandler, 1000);
}

function clearContentChangedTimeout() {
  if (contentChangedTimeout != null) {
    clearTimeout(contentChangedTimeout);
  }
}

function contentChangedHandler() {
  if (isContentChanged()) {
    unsavedChanges.value = true;
    setBeforeUnloadConfirmation(true);
    saveDraft();
  } else {
    unsavedChanges.value = false;
    setBeforeUnloadConfirmation(false);
    clearDraft();
  }
}

// Drafts
function saveDraft() {
  const content = editor.value?.getMarkdown();
  const userHasPersistedToken = isCurrentTokenStored();
  if (content) {
    if (userHasPersistedToken) {
      localStorage.setItem(note.value.title, content);
    } else {
      sessionStorage.setItem(note.value.title, content);
    }
  }
}

function clearDraft() {
  localStorage.removeItem(note.value.title);
  sessionStorage.removeItem(note.value.title);
}

function loadDraft() {
  const localDraft = localStorage.getItem(note.value.title);
  const sessionDraft = sessionStorage.getItem(note.value.title);
  return localDraft || sessionDraft;
}

// Keyboard Shortcuts
// 'e' to edit
Mousetrap.bind("e", () => {
  if (editMode.value === false && canModify.value) {
    editHandler();
  }
});

function keydownHandler(event) {
  // Ctrl + Enter to save
  if ((event.ctrlKey || event.metaKey) && event.key == "Enter") {
    saveHandler((close = false));
  }
  // Escape to exit edit mode
  if (event.key == "Escape") {
    closeHandler();
  }
}

// Helpers
function entityTooLargeToast(entityName) {
  toast.add(
    getToastOptions(
      `This ${entityName} is too large. Please try again with a smaller ${entityName} or adjust your server configuration.`,
      "Failure",
      "error",
    ),
  );
}

function badFilenameToast(entityName) {
  toast.add(
    getToastOptions(
      'Due to filename restrictions, the following characters are not allowed: <>:"/\\|?*',
      `Invalid ${entityName}`,
      "error",
    ),
  );
}

function setBeforeUnloadConfirmation(enable = true) {
  if (enable) {
    window.onbeforeunload = () => {
      return true;
    };
  } else {
    window.onbeforeunload = null;
  }
}

function isContentChanged() {
  if (!editor.value) {
    return false;
  }
  return (
    joinNoteTitle(newGroup.value, newTitle.value) != note.value.title ||
    editor.value.getMarkdown() != note.value.content
  );
}

function unsavedChangesGuard(to) {
  flushAutosave();
  if (editMode.value && isContentChanged()) {
    pendingRoute = to.fullPath;
    isSaveChangesModalVisible.value = true;
    return false;
  }
}

onBeforeRouteLeave(unsavedChangesGuard);
onBeforeRouteUpdate(unsavedChangesGuard);

watch(() => props.title, init);
onMounted(init);
</script>
