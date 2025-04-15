<template>
  <nav class="bg-gray-800 shadow">
    <div class="container mx-auto px-4">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center">
            <span class="text-2xl font-bold text-green-400">JobSearch</span>
          </router-link>

          <!-- Mobile menu button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="ml-4 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white md:hidden"
          >
            <span class="sr-only">Открыть меню</span>
            <span class="material-icons" v-if="!mobileMenuOpen">menu</span>
            <span class="material-icons" v-else>close</span>
          </button>

          <!-- Desktop navigation menu - hide on mobile -->
          <div class="hidden md:ml-6 md:flex md:space-x-8">
            <!-- Show "Создать вакансию" for employers with prominent styling -->
            <router-link
              v-if="isEmployer"
              to="/jobs/create"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Создать вакансию
            </router-link>

            <!-- Мои вакансии - with consistent styling -->
            <router-link
              v-if="isEmployer"
              to="/jobs/my"
              class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Мои вакансии
            </router-link>

            <!-- Show "Вакансии" for everyone -->
            <router-link
              to="/jobs"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Вакансии
            </router-link>

            <!-- Only show "Мои резюме" for jobseekers, make sure employers never see this -->
            <router-link
              v-if="isJobseeker && !isEmployer"
              to="/resumes"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Мои резюме
            </router-link>

            <router-link
              to="/saved-jobs"
              v-if="isJobseeker && isAuthenticated && !isEmployer"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Сохраненные
            </router-link>
          </div>
        </div>

        <!-- User profile/auth section -->
        <div class="flex items-center">
          <router-link
            v-if="!isAuthenticated"
            to="/login"
            class="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium"
          >
            Войти
          </router-link>
          <router-link
            v-if="!isAuthenticated"
            to="/register"
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium ml-3"
          >
            Регистрация
          </router-link>
          <div v-else class="ml-3 relative">
            <button
              @click="isProfileOpen = !isProfileOpen"
              class="flex items-center text-gray-300 hover:text-green-400"
            >
              <span class="mr-2">{{ username }}</span>
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              v-if="isProfileOpen"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50"
              style="top: 100%"
            >
              <div class="py-1">
                <router-link
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                >
                  Профиль
                </router-link>
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state -->
      <div class="md:hidden" v-show="mobileMenuOpen">
        <div class="pt-2 pb-3 space-y-1">
          <router-link
            v-if="isEmployer"
            to="/jobs/create"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Создать вакансию
          </router-link>

          <router-link
            v-if="isEmployer"
            to="/jobs/my"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Мои вакансии
          </router-link>

          <router-link
            to="/jobs"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Вакансии
          </router-link>

          <router-link
            v-if="isJobseeker && !isEmployer"
            to="/resumes"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Мои резюме
          </router-link>

          <router-link
            to="/saved-jobs"
            v-if="isJobseeker && isAuthenticated && !isEmployer"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Сохраненные
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import axios from "axios";
import { storeToRefs } from "pinia";
import { useChatStore } from "@/stores/chat";

const router = useRouter();
const authStore = useAuthStore();
const { isAuthenticated, isJobseeker, isEmployer } = storeToRefs(authStore);
const isProfileOpen = ref(false);
const chatStore = useChatStore();
const isDev = ref(import.meta.env.DEV);
const mobileMenuOpen = ref(false);

const username = computed(
  () => authStore.username || authStore.user?.username || "Профиль"
);

const hasUnreadMessages = computed(() => chatStore.hasUnread);

const handleLogout = async () => {
  await authStore.logout();
  isProfileOpen.value = false;
  router.push("/");
};

const handleClickOutside = (event) => {
  if (mobileMenuOpen.value && !event.target.closest("nav")) {
    mobileMenuOpen.value = false;
  }
};

onMounted(async () => {
  if (isAuthenticated.value && !authStore.user?.username) {
    await authStore.getUserProfile();
  }

  // Добавление отладочных логов
  console.log("Auth status:", {
    isAuthenticated: isAuthenticated.value,
    isJobseeker: isJobseeker.value,
    isEmployer: isEmployer.value,
    user: authStore.user,
    username: username.value,
  });

  if (isAuthenticated.value) {
    try {
      await chatStore.fetchUnreadCount();
    } catch (error) {
      console.error(
        "Ошибка при получении количества непрочитанных сообщений в чате:",
        error
      );
    }
  }

  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
