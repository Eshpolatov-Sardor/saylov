<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { supabase } from "../../Supabase"

const router = useRouter()
const email: any = ref("")
const password: any = ref("")
const showToast = ref(false)
const toastMessage = ref("")

async function login(): Promise<{
  success: boolean;
  message: string;
  user?: any;
} | {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    role: string;
  };
}> {

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (!data.user?.email_confirmed_at) {
    return { success: false, message: "📩 Emailingiz hali tasdiqlanmagan. Iltimos, pochtangizni tekshiring." }
  }

  if (error) { return { success: false, message: error.message } }

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
  if (!email.value || !password.value) { return }

  const data = await login()

  const { data: user, error } = await supabase.rpc('check_admin_access', {
    input_email: email.value,
  });

  if (error) {
    toastMessage.value = error.message
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }

  if (!data.success || !user || user.length === 0) {
    toastMessage.value = "Xato email yoki parol!"
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
  } else if (user && user.length > 0 && user[0].role === "ADMIN") {
    toastMessage.value = "Muvaffaqiyatli tasdiqlandi. Admin panelga yo‘naltirilmoqdasiz..."
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
      router.push("/home")
    }, 3000)
  }
}
</script>

<template>
  <div class="relative w-full h-screen flex items-center justify-center"
    style="background: url('/saylov.jpg') no-repeat center center fixed; background-size: cover;">
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

          <!-- Login Button -->
          <button type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
            LOGIN
          </button>
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
