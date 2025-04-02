<script setup>
  import { ref } from "vue"

  const ism = ref("")
  const email = ref("")
  const xabar = ref("")

  function yuborish() {
    ism.value = ""
    email.value = ""
    xabar.value = ""
  };
</script>

<template>
  <TheHeader />
  <div class="md:w-[1280px] w-full mx-auto py-10">
    <h1 class="text-3xl font-bold text-blue-700">
      Bog‘lanish
    </h1>
    <form class="mt-6 space-y-4" @submit.prevent="yuborish">
      <input v-model="ism" type="text" placeholder="Ismingiz" required class="w-full p-2 border rounded">
      <input v-model="email" type="email" placeholder="Email" required class="w-full p-2 border rounded">
      <textarea v-model="xabar" placeholder="Xabaringiz" required class="w-full p-2 border rounded" />
      <button type="submit" class="bg-blue-700 text-white px-4 py-2 rounded">
        Yuborish
      </button>
    </form>
  </div>
  <TheFooter />
</template>
