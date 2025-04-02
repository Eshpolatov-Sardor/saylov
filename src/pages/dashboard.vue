<script setup lang="ts">
  import { computed, onMounted, ref } from "vue"
  import { createClient } from "@supabase/supabase-js"

  const SUPABASE_URL = "https://tcvwcyovxfyfijkrahjl.supabase.co"
  const SUPABASE_KEY
    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdndjeW92eGZ5Zmlqa3JhaGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzA0ODEsImV4cCI6MjA1ODY0NjQ4MX0.0uJ4TepuTM6rTmZx4DdaLLGUrUvC6xqvxWh1DcldqIw"

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  interface Nomzod {
    id: number
    name: string
    votes: number
  }

  interface Yonalish {
    id: number
    title: string
    nomzodlar: Nomzod[]
    status: boolean
    boshlanishVaqti: string // string format
    tugashVaqti: string // string format
  }

  const yonalishlar = ref<Yonalish[]>([])
  const tanlanganYonalish = ref<Yonalish | null>(null)

  const userVotes = ref(new Map<string, Map<number, number | null>>()) // Har bir user idga qarab ovoz berish uchun

  const hozirgiVaqt = ref(new Date())

  setInterval(() => {
    hozirgiVaqt.value = new Date()
  }, 60000) // Har minutda yangilanadi

  const saylovDavomEtyaptimi = computed(() => {
    if (!tanlanganYonalish.value) {
      return false
    }

    const boshlanish = new Date(tanlanganYonalish.value.boshlanishVaqti)
    const tugash = new Date(tanlanganYonalish.value.tugashVaqti)
    return hozirgiVaqt.value >= boshlanish && hozirgiVaqt.value <= tugash && tanlanganYonalish.value.status
  })

  const userId = "test"

  onMounted(() => {
    fetchMalumotlar()
  })

  // Supabase'dan ma'lumotlarni olish
  async function fetchMalumotlar() {
    try {
      const { data: yonalishData, error: yonalishError } = await supabase
        .from("yonalishlar")
        .select("*")

      if (yonalishError) {
        console.error("Yo'nalishlarni yuklashda xatolik:", yonalishError)
        return
      }

      const { data: nomzodData, error: nomzodError } = await supabase
        .from("nomzodlar")
        .select("*")

      if (nomzodError) {
        console.error("Nomzodlarni yuklashda xatolik:", nomzodError)
        return
      }

      // Yo'nalishlarni nomzodlar bilan birlashtirish
      yonalishlar.value = yonalishData.map(yonalish => ({
        ...yonalish,
        status: typeof yonalish.status === "string" ? yonalish.status === "true" : yonalish.status,
        nomzodlar: nomzodData
          .filter(nomzod => nomzod.yonalish_id === yonalish.id)
          .map(nomzod => ({
            id: nomzod.id,
            name: nomzod.name,
            votes: nomzod.votes,
          })),
      }))
    }
    catch (error) {
      console.error("Ma'lumotlarni yuklashda xatolik:", error)
    }
  }

  function ochish(yonalish: Yonalish) {
    tanlanganYonalish.value = yonalish
  }

  async function ovozBerish(nomzod: Nomzod, yonalishId: number) {
    let votesForUser = userVotes.value.get(userId)
    if (!votesForUser) {
      votesForUser = new Map<number, number | null>()
    }
    // Yonalishda allaqachon ovoz berilganmi?
    if (votesForUser.has(yonalishId)) {
      return
    }

    try {
      const { error } = await supabase
        .from("nomzodlar")
        .update({ votes: nomzod.votes + 1 })
        .eq("id", nomzod.id)

      if (error) {
        console.error("Ovoz berishda xatolik:", error)
        return
      }

      nomzod.votes += 1
      votesForUser.set(yonalishId, nomzod.id) // Setga nomzod ID'sini qo'shamiz

      userVotes.value.set(userId, votesForUser)

      fetchMalumotlar()
    }
    catch (error) {
      console.error("Ovoz berishda xatolik:", error)
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) {
      return "Mavjud emas"
    }

    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0") // Month is 0-indexed
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${day}-${month}-${year} ${hours}:${minutes}`
  }
</script>

<template>
  <div>
    <TheHeader />
    <div class="md:w-[1280px] w-full mx-auto py-10 md:pb-44">
      <h1 class="text-3xl font-bold text-blue-700 text-center mb-6">
        Saylov yo‘nalishlari
      </h1>
      <p v-if="!saylovDavomEtyaptimi" class="text-red-500 text-center">
        Saylov hozirda davom etmayapti.
      </p>
      <!-- Yo‘nalishlar -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="yonalish in yonalishlar"
          :key="yonalish.id"
          if="yonalish.status === true"
          class="p-6 border rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
          @click="ochish(yonalish)"
        >
          <div>
            <span class="text-lg font-semibold">{{ yonalish.title }}</span>
          </div>
          <span class="text-blue-600 text-xl">→</span>
        </div>
      </div>

      <!-- Nomzodlar chiqadigan qism -->
      <div v-if="tanlanganYonalish && tanlanganYonalish.status">
        <div class="mt-10 p-6 border rounded-lg shadow">
          <div class="flex justify-between mb-4">
            <h2 class="text-2xl font-bold">
              {{ tanlanganYonalish.title }} uchun nomzodlar
            </h2>
            <div class="text-sm text-gray-500">
              <p>Boshlanish vaqti: {{ formatDate(tanlanganYonalish.boshlanishVaqti) }}</p>
              <p>Tugash vaqti: {{ formatDate(tanlanganYonalish.tugashVaqti) }}</p>
            </div>
          </div>
          <div v-if="!saylovDavomEtyaptimi" class="text-red-500 text-center">
            Saylov hozirda davom etmayapti.
          </div>
          <div v-for="nomzod in tanlanganYonalish.nomzodlar" :key="nomzod.id" class="p-4 border-b flex justify-between">
            <span class="text-lg">{{ nomzod.name }}</span>
            <button
              class="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
              :disabled="userVotes.get(userId)?.get(tanlanganYonalish.id) === nomzod.id || !saylovDavomEtyaptimi"
              @click="ovozBerish(nomzod, tanlanganYonalish.id)"
            >
              Ovoz berish
            </button>
          </div>

          <h3 class="text-xl font-bold mt-4">
            Ovoz natijalari
          </h3>
          <ul>
            <li v-for="nomzod in tanlanganYonalish.nomzodlar" :key="nomzod.id">
              {{ nomzod.name }} - {{ nomzod.votes }} ta ovoz
            </li>
          </ul>
        </div>
      </div>
    </div>
    <TheFooter />
  </div>
</template>
