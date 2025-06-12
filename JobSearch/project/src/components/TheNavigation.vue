<template>
  <nav class="bg-gray-800 shadow">
    <div class="container mx-auto px-4">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center">
            <span class="text-2xl font-bold text-green-400">JobSearch</span>
          </router-link>

          <!-- Кнопка мобильного меню -->
          <button
            @click.stop="toggleMobileMenu"
            class="ml-4 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white md:hidden"
            type="button"
            aria-expanded="false"
          >
            <span class="sr-only">Открыть меню</span>
            <span class="material-icons" v-if="!mobileMenuOpen">menu</span>
            <span class="material-icons" v-else>close</span>
          </button>

          <!-- Десктопная навигационная меню - скрывается на мобильных устройствах -->
          <div class="hidden md:ml-6 md:flex md:space-x-8">
            <!-- Показывает "Создать вакансию" для работодателей с выделенным стилем -->
            <router-link
              v-if="isEmployer"
              to="/jobs/create"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Создать вакансию
            </router-link>

            <!-- Мои вакансии - с постоянным стилем -->
            <router-link
              v-if="isEmployer"
              to="/jobs/my"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Мои вакансии
            </router-link>

            <!-- Найти соискателя -->
            <router-link
              v-if="isEmployer"
              to="/candidates"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Найти соискателя
            </router-link>

            <!-- Показывает "Вакансии" для всех -->
            <router-link
              to="/jobs"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Вакансии
            </router-link>

            <!-- Мои резюме -->
            <router-link
              v-if="isJobseeker"
              to="/resumes"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Мои резюме
            </router-link>

            <router-link
              to="/saved-jobs"
              v-if="isAuthenticated"
              class="inline-flex items-center px-1 pt-1 text-gray-300 hover:text-green-400"
            >
              Сохраненные
            </router-link>
          </div>
        </div>

        <!-- Профиль/авторизация -->
        <div class="flex items-center px-2 justify-end">
          <router-link
            v-if="!isAuthenticated"
            to="/login"
            class="text-gray-300 hover:text-green-400 px-2 py-2 rounded-md text-sm font-medium sm:px-3"
          >
            Войти
          </router-link>
          <router-link
            v-if="!isAuthenticated"
            to="/register"
            class="bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded-md text-xs font-medium ml-1 mr-1 whitespace-nowrap sm:text-sm sm:px-3 sm:ml-2 sm:mr-2"
          >
            Регистрация
          </router-link>
          <div v-else class="ml-3 relative">
            <button
              @click="isProfileOpen = !isProfileOpen"
              class="flex items-center text-gray-300 hover:text-green-400 profile-menu"
            >
              <span class="mr-2">{{ username }}</span>
              <UserAvatar
                :username="username"
                :imageUrl="userAvatar"
                size="sm"
                class="ml-1"
              />
            </button>

            <div
              v-if="isProfileOpen"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50 profile-menu"
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

      <!-- Мобильное меню, показывается/скрывается в зависимости от состояния меню -->
      <div class="md:hidden mobile-menu-container" v-show="mobileMenuOpen">
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
            v-if="isEmployer"
            to="/candidates"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Найти соискателя
          </router-link>

          <router-link
            to="/jobs"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Вакансии
          </router-link>

          <router-link
            v-if="isJobseeker"
            to="/resumes"
            class="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
            @click="mobileMenuOpen = false"
          >
            Мои резюме
          </router-link>

          <router-link
            to="/saved-jobs"
            v-if="isAuthenticated"
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
import UserAvatar from "@/components/UserAvatar.vue";

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

const userAvatar = computed(() => authStore.userAvatar);

const hasUnreadMessages = computed(() => chatStore.hasUnread);

// Метод для переключения мобильного меню
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  console.log(
    "Мобильное меню: " + (mobileMenuOpen.value ? "открыто" : "закрыто")
  );
};

const handleLogout = async () => {
  await authStore.logout();
  isProfileOpen.value = false;
  router.push("/");
};

const handleClickOutside = (event) => {
  // Закрываем мобильное меню при клике вне его
  if (
    mobileMenuOpen.value &&
    !event.target.closest(".mobile-menu-container") &&
    !event.target.closest("button[aria-expanded]")
  ) {
    mobileMenuOpen.value = false;
  }

  // Закрываем профиль при клике вне его
  if (isProfileOpen.value && !event.target.closest(".profile-menu")) {
    isProfileOpen.value = false;
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
