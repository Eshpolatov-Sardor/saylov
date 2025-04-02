<script setup>
  import { ref } from "vue"

  const isMenuOpen = ref(false)

  // Menyu yopish funksiyasi
  function closeMenu() {
    isMenuOpen.value = false
  };
</script>

<template>
  <header class="bg-blue-700 text-white shadow-md">
    <div class="container mx-auto flex justify-between items-center py-4 px-6">
      <!-- Logo -->
      <div class="flex items-center space-x-2">
        <img src="" alt="Saylov Logo" class="w-10 h-10">
        <h1 class="text-2xl font-bold">
          Saylov 2025
        </h1>
      </div>

      <!-- Navigation -->
      <nav class="hidden md:flex space-x-6">
        <RouterLink to="/dashboard" class="hover:text-yellow-400">
          Saylov turlari
        </RouterLink>
        <RouterLink to="/natijalar" class="hover:text-yellow-400">
          Saylov natijalari
        </RouterLink>
      </nav>

      <!-- Hamburger Menu Button -->
      <button class="md:hidden focus:outline-none" @click="isMenuOpen = !isMenuOpen">
        <svg
          class="w-8 h-8"
          :class="isMenuOpen ? 'text-yellow-400' : 'text-white'"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="isMenuOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      @click="closeMenu"
    >
      <nav
        class="bg-blue-800 w-3/4 max-w-xs rounded-lg p-6 space-y-4 shadow-lg"
        @click.stop
      >
        <button class="absolute top-4 right-4 text-white text-2xl" @click="closeMenu">
          &times;
        </button>
        <RouterLink to="/dashboard" class="block py-2 px-4 text-white hover:bg-blue-600">
          Saylov turlari
        </RouterLink>
        <RouterLink to="/natijalar" class="block py-2 px-4 text-white hover:bg-blue-600">
          Saylov natijalari
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
