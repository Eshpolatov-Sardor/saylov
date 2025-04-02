import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null
  }),
  actions: {
    setUser(userData) {
      this.user = userData;
      localStorage.setItem("user", JSON.stringify(userData)); // LocalStorage-ga saqlash
    },
    logout() {
      this.user = null;
      localStorage.removeItem("user");
    }
  }
});
