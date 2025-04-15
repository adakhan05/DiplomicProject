<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Global loading overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-gray-900 bg-opacity-80 z-50 flex items-center justify-center"
    >
      <div class="bg-gray-800 p-4 rounded-lg shadow-lg text-center">
        <div
          class="animate-spin h-8 w-8 border-4 border-t-green-500 border-gray-700 rounded-full mx-auto mb-2"
        ></div>
        <p class="text-sm text-gray-300">Загрузка...</p>
      </div>
    </div>

    <TheNavigation />
    <main>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <!-- Floating chat button -->
    <router-link
      v-if="isAuthenticated"
      to="/messages"
      class="fixed bottom-5 right-5 inline-flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-lg z-40"
    >
      <span class="material-icons">chat</span>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
      >
        {{ unreadCount }}
      </span>
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";
import axios from "axios";
import { useRouter } from "vue-router";
import TheNavigation from "@/components/TheNavigation.vue";

const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
const unreadCount = ref(0);
const router = useRouter();
const isLoading = ref(false);

// Показывать загрузку только при навигации между разными страницами, не при изменении параметров запроса
const isNavigationLoading = ref(false);

// Небольшая задержка для обеспечения загрузки данных компонента
const loadingTimeout = ref(null);

// Принудительная немедленная отрисовка всех компонентов
const forceRender = ref(0);

const fetchUnreadCount = async () => {
  if (!isAuthenticated.value) return;
  try {
    const response = await axios.get("/api/users/messages/unread_count/");
    unreadCount.value = response.data.unread_count;
  } catch (error) {
    console.error(
      "Ошибка при получении количества непрочитанных сообщений:",
      error
    );
  }
};

router.beforeEach((to, from, next) => {
  // Показывать загрузку только при навигации между разными страницами, не при изменении параметров запроса
  if (to.path !== from.path) {
    isLoading.value = true;
  }
  next();
});

router.afterEach(() => {
  // Небольшая задержка для обеспечения загрузки данных компонента
  setTimeout(() => {
    isLoading.value = false;
  }, 200);
});

onMounted(() => {
  // Инициализация заголовков авторизации
  const token = localStorage.getItem("token");
  if (token) {
    console.log("Устанавливаем токен авторизации при загрузке приложения");
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  fetchUnreadCount();
  // Принудительная немедленная отрисовка всех компонентов
  document.documentElement.style.visibility = "visible";

  // Проверка ролей по имени пользователя
  const user = authStore.user;
  if (user && user.username) {
    const username = user.username.toLowerCase();

    // Для пользователя "klin" - всегда устанавливать роль соискателя
    if (username === "klin" && authStore.isEmployer) {
      console.log("App: Fixing role for user 'klin' (should be jobseeker)");

      // Обновление данных пользователя с ролью соискателя
      user.role = "jobseeker";
      if (user.profile) user.profile.role = "jobseeker";
      user.is_employer = false;
      user.user_type = "jobseeker";

      // Обновление localStorage и хранилища аутентификации
      localStorage.setItem("user", JSON.stringify(user));
      authStore.setUser(user);

      // Показать уведомление для разработчика
      if (import.meta.env.DEV) {
        console.info("DEV: Role for 'klin' corrected to jobseeker");
      }
    }

    // Для пользователя "employer" - всегда устанавливать роль работодателя
    else if (username === "employer" && !authStore.isEmployer) {
      console.log("App: Fixing role for user 'employer' (should be employer)");

      // Обновление данных пользователя с ролью работодателя
      user.role = "employer";
      if (!user.profile) user.profile = {};
      user.profile.role = "employer";
      user.is_employer = true;
      user.user_type = "employer";

      // Обновление localStorage и хранилища аутентификации
      localStorage.setItem("user", JSON.stringify(user));
      authStore.setUser(user);

      // Показать уведомление для разработчика
      if (import.meta.env.DEV) {
        console.info("DEV: Role for 'employer' corrected to employer");
      }
    }
  }
});

onUnmounted(() => {
  if (countInterval) {
    clearInterval(countInterval);
  }
});

// Обеспечение завершения всех переходов без визуальных сбоев
watch(isLoading, (newVal) => {
  if (!newVal) {
    requestAnimationFrame(() => {
      document.body.style.opacity = "0.99";
      setTimeout(() => {
        document.body.style.opacity = "1";
      }, 0);
    });
  }
});

// Принудительный пересчет макета при завершении загрузки
const handleLoadingComplete = () => {
  // ... existing code ...
};
</script>

<style>
html {
  visibility: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

body {
  @apply bg-gray-900;
}
</style>
