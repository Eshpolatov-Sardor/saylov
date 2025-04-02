<template>
  <footer class="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-10">
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <!-- Saylov haqida qisqa ma'lumot -->
        <div>
          <h3 class="text-2xl font-bold">
            Saylov Tizimi
          </h3>
          <p class="text-gray-200 mt-2">
            O‘zbekiston Respublikasi saylov tizimi haqida batafsil ma’lumot va qonun-qoidalar.
          </p>
        </div>

        <!-- Foydali havolalar -->
        <div>
          <h3 class="text-xl font-semibold">
            Foydali havolalar
          </h3>
          <ul class="mt-3 space-y-2">
            <li><a href="#" class="hover:text-gray-300 transition">Saylov Qoidalari</a></li>
            <li><a href="#" class="hover:text-gray-300 transition">Maxfiylik Siyosati</a></li>
            <li><a href="#" class="hover:text-gray-300 transition">Yordam</a></li>
            <li><a href="#" class="hover:text-gray-300 transition">Aloqa</a></li>
          </ul>
        </div>

        <!-- Ijtimoiy tarmoqlar -->
        <div class="text-center">
          <h3 class="text-xl font-semibold">
            Biz bilan bog‘laning
          </h3>
          <div class="flex justify-center md:justify-start mt-3 space-x-4">
            <a href="#" class="text-2xl hover:text-gray-300 transition"><i class="fab fa-facebook" /></a>
            <a href="#" class="text-2xl hover:text-gray-300 transition"><i class="fab fa-twitter" /></a>
            <a href="#" class="text-2xl hover:text-gray-300 transition"><i class="fab fa-telegram" /></a>
            <a href="#" class="text-2xl hover:text-gray-300 transition"><i class="fab fa-instagram" /></a>
          </div>
        </div>
      </div>

      <!-- Pastki qismini ajratish -->
      <div class="border-t border-gray-400 mt-6 pt-4 text-center text-sm">
        <p>© 2025 Saylov Tizimi. Barcha huquqlar himoyalangan.</p>
      </div>
    </div>
  </footer>
</template>

  <style scoped>
  i {
  transition: transform 0.3s;
}
i:hover {
  transform: scale(1.2);
}
</style>
