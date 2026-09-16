import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useGlobalStore = defineStore("global", () => {
  const config = ref({});
  const groupsVersion = ref(0);
  const sideBarHidden = ref(localStorage.getItem("sideBarHidden") === "true");

  watch(sideBarHidden, (value) => {
    localStorage.setItem("sideBarHidden", value);
  });

  return { config, groupsVersion, sideBarHidden };
});
