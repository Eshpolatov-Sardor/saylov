<script setup>
import { ref } from "vue"
import { supabase } from "../../Supabase"

const name = ref("")
const email = ref("")
const password = ref("")
const showToast = ref(false)
const toastMessage = ref("")

async function resendEmail() {
  await registerUser()
}

async function registerUser() {
  const { data: user, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });

  await supabase.from('users').insert({
    email: email.value,
    first_name: name.value
  })

  if (error) { toastMessage.value = error.message; }
  else {
    toastMessage.value = "✅ Emailingizga tasdiqlash xabari yuborildi! 📧";
  }
  showToast.value = true

  return { user, error };
}

async function handleRegister() {
  if (!name.value || !email.value || !password.value) { return }
  resendEmail(email.value, password.value, name.value)
}
</script>

<template>
  <div class="relative w-full h-screen flex items-center justify-center"
    style="background: url('/saylov.jpg') no-repeat center center fixed; background-size: cover;">
    <div class="h-[500px] flex flex-col items-center justify-center">
      <div class="bg-gray-500 bg-opacity-20 backdrop-blur-md p-8 rounded-lg w-96 shadow-lg">
        <div class="text-center text-black mb-4">
          <h2 class="text-2xl font-bold">
            Register
          </h2>
        </div>

        <form @submit.prevent="handleRegister">
          <!-- Name Input -->
          <div class="mb-4 relative">
            <input v-model="name" type="text"
              class="w-full pl-4 py-2 rounded border bg-gray-700 bg-opacity-50 text-white placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Ism" required>
          </div>

          <!-- Email Input -->
          <div class="mb-4 relative">
            <input v-model="email" type="email"
              class="w-full pl-4 py-2 rounded border bg-gray-700 bg-opacity-50 text-white placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Email" required>
          </div>

          <!-- Password Input -->
          <div class="mb-6 relative">
            <input v-model="password" type="password"
              class="w-full pl-4 py-2 rounded border bg-gray-700 bg-opacity-50 text-white placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Parol" required>
          </div>

          <!-- Register Button -->
          <button type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
            REGISTER
          </button>

          <p class="bottom-8 text-black p-4">
            Don't have an account?
            <RouterLink to="/" class="font-bold hover:underline">
              Login
            </RouterLink>
          </p>
        </form>
      </div>

      <!-- Toast Message -->
      <transition name="fade">
        <div v-if="showToast" class="absolute top-5 right-5 text-white px-4 py-2 rounded-lg shadow-lg"
          :class="toastMessage === 'Xato email yoki parol!' ? 'bg-red-500' : 'bg-green-500'">
          {{ toastMessage }}
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
