<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import bcrypt from 'bcryptjs'
import { supabase } from "../../Supabase"

const email = ref("")
const password = ref("")
const errorMessage = ref("")
const showToast = ref(false)
const router = useRouter()

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!data.user?.email_confirmed_at) {
    return { success: false, message: "📩 Emailingiz hali tasdiqlanmagan. Iltimos, pochtangizni tekshiring." }
  }

  if (error) {
    return { success: false, message: error.message }
  }

  return {
    success: true,
    message: "Login muvaffaqiyatli",
    user: {
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.user_metadata.first_name,
      role: data.user.user_metadata.role
    }
  }
}

async function handleLogin() {
  const data = await login(email.value, password.value);

  if (!data.success) {
    errorMessage.value = data.message
    showToast.value = false
  } else {
    errorMessage.value = ""
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000)

    localStorage.setItem("user", JSON.stringify(data.user))

    router.push("/dashboard") // dashboardga yo'naltirish
  }
}
</script>

<template>
  <div class="relative w-full h-screen flex items-center justify-center" style="
      background: url('/saylov.jpg') no-repeat center center fixed;
      background-size: cover;
    ">
    <div class="h-[500px] flex flex-col items-center justify-center">
      <div class="bg-emerald-100 bg-opacity-20 backdrop-blur-md p-8 rounded-lg w-96 shadow-lg">
        <div class="text-center text-black mb-4">
          <h2 class="text-2xl font-bold">
            Login
          </h2>
        </div>

        <form @submit.prevent="handleLogin">
          <!-- Email Input -->
          <div class="mb-4 relative">
            <input v-model="email" type="email"
              class="w-full pl-4 py-2 rounded border bg-gray-700 bg-opacity-50 text-white placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Email" required>
          </div>

          <!-- Parol Input -->
          <div class="mb-6 relative">
            <input v-model="password" type="password"
              class="w-full pl-4 py-2 rounded border bg-gray-700 bg-opacity-50 text-white placeholder-gray-300 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Parol" required>
          </div>

          <!-- Xato xabari -->
          <p v-if="errorMessage" class="text-red-500 mb-2 text-sm">
            {{ errorMessage }}
          </p>

          <!-- Login Button -->
          <button type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
            LOGIN
          </button>
          <p class="bottom-8 text-black p-4">
            Don't have an account?
            <RouterLink to="/signup" class="font-bold hover:underline">
              Register
            </RouterLink>
          </p>
        </form>
      </div>

      <!-- Toast Message -->
      <transition name="fade">
        <div v-if="showToast" class="absolute top-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Muvaffaqiyatli tizimga kirdingiz.
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
