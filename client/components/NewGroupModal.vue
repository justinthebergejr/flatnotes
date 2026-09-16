<template>
  <Modal v-model="isVisible" class="px-6 py-4">
    <div class="mb-6 text-xl">New Group</div>
    <TextInput
      v-model="name"
      v-focus
      placeholder="Group name"
      class="mb-6"
      @keydown.enter="confirmHandler"
    />
    <div class="flex justify-end">
      <CustomButton label="Cancel" class="mr-2" @click="isVisible = false" />
      <CustomButton label="Create" :style="'cta'" @click="confirmHandler" />
    </div>
  </Modal>
</template>

<script setup>
import { useToast } from "primevue/usetoast";
import { ref, watch } from "vue";

import { getToastOptions } from "../helpers.js";
import CustomButton from "./CustomButton.vue";
import Modal from "./Modal.vue";
import TextInput from "./TextInput.vue";

const emit = defineEmits(["confirm"]);
const isVisible = defineModel({ type: Boolean });
const name = ref("");
const toast = useToast();

function confirmHandler() {
  const value = name.value.trim();
  if (!value) {
    toast.add(getToastOptions("Please enter a group name.", "Invalid", "error"));
    return;
  }
  if (/[<>:"/\\|?*]/.test(value)) {
    toast.add(
      getToastOptions(
        'Due to filename restrictions, the following characters are not allowed: <>:"/\\|?*',
        "Invalid Group",
        "error",
      ),
    );
    return;
  }
  if (value.startsWith(".") || value.toLowerCase() === "attachments") {
    toast.add(
      getToastOptions(
        `'${value}' can't be used as a group name.`,
        "Invalid",
        "error",
      ),
    );
    return;
  }
  isVisible.value = false;
  emit("confirm", value);
}

watch(isVisible, (visible) => {
  if (visible) {
    name.value = "";
  }
});
</script>
