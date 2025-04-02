<script setup lang="ts">
  import { onMounted, ref } from "vue"

  interface Nomzod {
    id: number
    name: string
    votes: number
  }

  interface Yonalish {
    title: string
    nomzodlar: Nomzod[]
  }

  const yonalishlar = ref<Yonalish[]>([])

  onMounted(() => {
    const savedResults = localStorage.getItem("results")
    if (savedResults) {
      yonalishlar.value = JSON.parse(savedResults)
    }
  })

  function getWinner(nomzodlar: Nomzod[]) {
    return nomzodlar.reduce((max, nomzod) => (nomzod.votes > max.votes ? nomzod : max), nomzodlar[0])
  };
</script>

<template>
  <TheHeader />
  <div class="w-[1280px] mx-auto py-10 ">
    <h1 class="text-3xl font-bold text-blue-700 text-center mb-6">
      Saylov Natijalari
    </h1>

    <div v-if="yonalishlar.length">
      <div v-for="(yonalish, index) in yonalishlar" :key="index" class="p-6 border rounded-lg shadow mb-4">
        <h2 class="text-2xl font-semibold mb-2">
          {{ yonalish.title }}
        </h2>
        <p class="text-lg font-bold text-green-600">
          G‘olib: {{ getWinner(yonalish.nomzodlar).name }} ({{ getWinner(yonalish.nomzodlar).votes }} ta ovoz)
        </p>
      </div>
    </div>
    <div v-else class="text-center text-red-600 text-xl">
      Hozircha hech qanday ovoz yo‘q.
    </div>
  </div>
  <TheFooter />
</template>
