<script setup lang="ts">
  import { onMounted, ref } from "vue"
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
    boshlanishVaqti: string // Supabase datetime uchun string
    tugashVaqti: string // Supabase datetime uchun string
  }

  const yonalishlar = ref<Yonalish[]>([])
  const newYonalish = ref("")
  const newNomzod = ref("")
  const selectedYonalish = ref<Yonalish | null>(null)
  const menuOpen = ref(false)
  const vaqtModalOchiq = ref(false)
  const vaqtniOzgartirishYonalish = ref<Yonalish | null>(null)

  // Supabase-dan ma'lumotlarni olish
  async function fetchYonalishlar() {
    try {
      const { data, error } = await supabase
        .from("yonalishlar")
        .select(`*, nomzodlar(*)`) // Nomzodlarni ham olish
      // .order('id', { ascending: true }); // optional ordering
      if (error) {
        console.error("Ma'lumotlarni olishda xatolik:", error)
        return
      }

      yonalishlar.value = data.map(yonalish => ({
        ...yonalish,
        nomzodlar: (yonalish.nomzodlar as any[] || []).map(nomzod => ({
          id: nomzod.id,
          name: nomzod.name,
          votes: nomzod.votes,
        })),
      })) as Yonalish[]
    }
    catch (error) {
      console.error("Ma'lumotlarni olishda xatolik:", error)
    }
  }

  // Supabase-ga yangi yo'nalish qo'shish
  async function addYonalish() {
    if (newYonalish.value.trim()) {
      const newYonalishData: Omit<Yonalish, "id" | "nomzodlar"> = {
        title: newYonalish.value,
        status: true,
        boshlanishVaqti: new Date().toISOString(), // ISO string format
        tugashVaqti: new Date(new Date().getTime() + 3600000).toISOString(), // ISO string format
      }

      try {
        const { error } = await supabase
          .from("yonalishlar")
          .insert([newYonalishData])
          .select("*")

        if (error) {
          console.error("Yo'nalish qo'shishda xatolik:", error)
          return
        }

        fetchYonalishlar()
        newYonalish.value = ""
      }
      catch (error) {
        console.error("Yo'nalish qo'shishda xatolik:", error)
      }
    }
  }

  // Supabase-dan yo'nalishni o'chirish
  async function removeYonalish(id: number) {
    try {
      const { error } = await supabase.from("yonalishlar").delete().eq("id", id)

      if (error) {
        console.error("Yo'nalishni o'chirishda xatolik:", error)
        return
      }

      yonalishlar.value = yonalishlar.value.filter(y => y.id !== id)
      fetchYonalishlar()
    }
    catch (error) {
      console.error("Yo'nalishni o'chirishda xatolik:", error)
    }
  }

  function selectYonalish(yonalish: Yonalish) {
    selectedYonalish.value = yonalish
  }

  // Supabase-ga yangi nomzod qo'shish
  async function addNomzod() {
    if (selectedYonalish.value && newNomzod.value.trim()) {
      try {
        const { error } = await supabase
          .from("nomzodlar")
          .insert([
            {
              name: newNomzod.value,
              votes: 0,
              yonalish_id: selectedYonalish.value.id, // Yo'nalish ID
            },
          ])
          .select("*")

        if (error) {
          return
        }
        fetchYonalishlar()
        newNomzod.value = ""
      }
      catch (error) {
        console.error("Nomzod qo'shishda xatolik:", error)
      }
    }
  }

  // Supabase-dan nomzodni o'chirish
  async function removeNomzod(nomzodId: number) {
    if (selectedYonalish.value) {
      try {
        const { error } = await supabase.from("nomzodlar").delete().eq("id", nomzodId)

        if (error) {
          console.error("Nomzodni o'chirishda xatolik:", error)
          return
        }

        fetchYonalishlar()
      }
      catch (error) {
        console.error("Nomzodni o'chirishda xatolik:", error)
      }
    }
  }

  // Supabase-da yo'nalish statusini o'zgartirish
  async function toggleYonalishStatus(yonalish: Yonalish) {
    try {
      const { error } = await supabase
        .from("yonalishlar")
        .update({ status: !yonalish.status })
        .eq("id", yonalish.id)

      if (error) {
        console.error("Yo'nalish statusini o'zgartirishda xatolik:", error)
        return
      }

      yonalish.status = !yonalish.status
    }
    catch (error) {
      console.error("Yo'nalish statusini o'zgartirishda xatolik:", error)
    }
  }

  // Supabase-da yo'nalish vaqtini o'zgartirish
  async function vaqtniSaqlash() {
    if (vaqtniOzgartirishYonalish.value) {
      try {
        const { error } = await supabase
          .from("yonalishlar")
          .update({
            boshlanishVaqti: vaqtniOzgartirishYonalish.value.boshlanishVaqti,
            tugashVaqti: vaqtniOzgartirishYonalish.value.tugashVaqti,
          })
          .eq("id", vaqtniOzgartirishYonalish.value.id)

        if (error) {
          console.error("Vaqtni o'zgartirishda xatolik:", error)
          return
        }

        fetchYonalishlar()
        vaqtModalOchiq.value = false
        vaqtniOzgartirishYonalish.value = null
      }
      catch (error) {
        console.error("Vaqtni o'zgartirishda xatolik:", error)
      }
    }
  }

  function vaqtniOzgartirishniBoshlash(yonalish: Yonalish) {
    vaqtniOzgartirishYonalish.value = { ...yonalish } // Kopyasini yaratamiz
    vaqtModalOchiq.value = true
  }

  function vaqtModalniYopish() {
    vaqtModalOchiq.value = false
    vaqtniOzgartirishYonalish.value = null
  }

  onMounted(() => {
    fetchYonalishlar()
  })
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header
      class="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md py-4"
    >
      <div class="container mx-auto flex justify-between items-center px-6">
        <h1
          class="text-2xl sm:text-3xl font-extrabold text-white mb-2 sm:mb-0"
        >
          Saylov Admini
        </h1>
        <nav class="hidden sm:flex space-x-6">
          <button class="text-white text-sm font-medium hover:underline">
            Bosh sahifa
          </button>
          <button class="text-white text-sm font-medium hover:underline">
            Sozlamalar
          </button>
          <button class="text-white text-sm font-medium hover:underline">
            Chiqish
          </button>
        </nav>
        <button
          class="sm:hidden text-white focus:outline-none"
          @click="menuOpen = !menuOpen"
        >
          ☰
        </button>
      </div>
      <div v-if="menuOpen" class="sm:hidden bg-indigo-700 p-4">
        <button class="block text-white text-sm font-medium py-2">
          Bosh sahifa
        </button>
        <button class="block text-white text-sm font-medium py-2">
          Sozlamalar
        </button>
        <button class="block text-white text-sm font-medium py-2">
          Chiqish
        </button>
      </div>
    </header>

    <main class="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-6">
        Yo‘nalishlar
      </h2>

      <div class="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          v-model="newYonalish"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto border-gray-300 rounded-md px-4 py-2"
          placeholder="Yangi yo‘nalish nomi"
        >
        <button
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          @click="addYonalish"
        >
          Qo‘shish
        </button>
      </div>

      <ul
        class="divide-y divide-gray-200 rounded-md shadow-sm overflow-hidden"
      >
        <li
          v-for="(yonalish, index) in yonalishlar"
          :key="yonalish.id"
          class="bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <div
            class="px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between"
          >
            <div>
              <button
                class="text-lg font-medium text-gray-800 hover:text-indigo-600"
                @click="selectYonalish(yonalish)"
              >
                {{ index + 1 }}. {{ yonalish.title }}
              </button>
              <div class="mt-1 text-sm text-gray-500">
                <span v-if="yonalish.status" class="text-green-500">Faol</span>
                <span v-else class="text-red-500">Nofaol</span>
              </div>
            </div>
            <div class="mt-2 sm:mt-0 space-x-2">
              <button
                class="px-3 py-2 border rounded-md text-sm font-medium"
                :class="
                  yonalish.status
                    ? 'border-red-500 text-red-700 hover:bg-red-50'
                    : 'border-green-500 text-green-700 hover:bg-green-50'
                "
                @click="toggleYonalishStatus(yonalish)"
              >
                {{ yonalish.status ? 'Nofaol qilish' : 'Faol qilish' }}
              </button>
              <button
                class="px-3 py-2 border border-blue-500 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50"
                @click="vaqtniOzgartirishniBoshlash(yonalish)"
              >
                Vaqtni o‘zgartirish
              </button>
              <button
                class="px-3 py-2 border border-red-500 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                @click="removeYonalish(yonalish.id)"
              >
                O‘chirish
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div v-if="selectedYonalish" class="mt-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          {{ selectedYonalish.title }} uchun nomzodlar
        </h2>

        <div class="mb-6 flex flex-col sm:flex-row gap-3">
          <input
            v-model="newNomzod"
            class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:w-auto border-gray-300 rounded-md px-4 py-2"
            placeholder="Yangi nomzod nomi"
          >
          <button
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            @click="addNomzod"
          >
            Qo‘shish
          </button>
        </div>

        <ul
          class="divide-y divide-gray-200 rounded-md shadow-sm overflow-hidden"
        >
          <li
            v-for="(nomzod, index) in selectedYonalish.nomzodlar"
            :key="nomzod.id"
            class="bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <div class="px-4 py-4 flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ index + 1 }}. {{ nomzod.name }}
                </p>
                <p class="mt-1 text-sm text-gray-500">
                  <span class="font-semibold">{{ nomzod.votes }}</span> ta ovoz
                </p>
              </div>
              <button
                class="px-3 py-2 border border-red-500 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                @click="removeNomzod(nomzod.id)"
              >
                O‘chirish
              </button>
            </div>
          </li>
        </ul>
      </div>
    </main>

    <!-- Vaqtni o'zgartirish Modal -->
    <div
      v-if="vaqtModalOchiq"
      class="fixed z-10 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        />
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3
              id="modal-title"
              class="text-lg leading-6 font-medium text-gray-900"
            >
              Vaqtni o‘zgartirish
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                {{ vaqtniOzgartirishYonalish?.title }} uchun yangi vaqtni
                belgilang.
              </p>
              <div class="mt-4">
                <label
                  for="boshlanishVaqti"
                  class="block text-sm font-medium text-gray-700"
                >Boshlanish vaqti</label>
                <input
                  id="boshlanishVaqti"
                  v-model="vaqtniOzgartirishYonalish!.boshlanishVaqti"
                  type="datetime-local"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full border-gray-300 rounded-md px-4 py-2"
                >
              </div>
              <div class="mt-4">
                <label
                  for="tugashVaqti"
                  class="block text-sm font-medium text-gray-700"
                >Tugash vaqti</label>
                <input
                  id="tugashVaqti"
                  v-model="vaqtniOzgartirishYonalish!.tugashVaqti"
                  type="datetime-local"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full border-gray-300 rounded-md px-4 py-2"
                >
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
              @click="vaqtniSaqlash"
            >
              Saqlash
            </button>
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="vaqtModalniYopish"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
