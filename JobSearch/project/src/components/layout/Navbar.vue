<template>
  <nav class="bg-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <router-link to="/" class="text-white font-bold text-xl">
              JobSearch
            </router-link>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <router-link
                v-for="item in navigationItems"
                :key="item.name"
                :to="item.href"
                :class="[
                  $route.path === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'px-3 py-2 rounded-md text-sm font-medium',
                ]"
                @click="handleNavigation(item.href)"
              >
                {{ item.name }}
              </router-link>
            </div>
          </div>
        </div>
        <div class="flex items-center">
          <div v-if="isAuthenticated" class="flex items-center space-x-4">
            <router-link
              :to="profileLink"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              {{ username }}
            </router-link>
            <button
              @click="logout"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Выйти
            </button>
          </div>
          <div v-else class="flex items-center space-x-4">
            <router-link
              to="/login"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Войти
            </router-link>
            <router-link
              to="/register"
              class="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Регистрация
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const navigationItems = ref([{ name: "Вакансии", href: "/jobs" }]);

const updateNavigation = () => {
  const items = [{ name: "Вакансии", href: "/jobs" }];

  if (authStore.isAuthenticated) {
    items.push({ name: "Сообщения", href: "/messages" });

    if (authStore.isEmployer) {
      items.push(
        { name: "Мои вакансии", href: "/jobs/my" },
        { name: "Найти соискателя", href: "/candidates" },
        { name: "Отклики", href: "/applications" }
      );
    } else {
      items.push(
        { name: "Сохраненные", href: "/saved-jobs" },
        { name: "Мои резюме", href: "/resumes" },
        { name: "Мои отклики", href: "/applications" }
      );
    }
  }

  navigationItems.value = items;
};

const isAuthenticated = computed(() => authStore.isAuthenticated);
const username = computed(() => authStore.username || "Профиль");
const profileLink = computed(() =>
  authStore.isEmployer ? "/employer/profile" : "/profile"
);

const handleNavigation = (href) => {
  if (route.path === href) {
    router.go(0);
  }
};

const logout = async () => {
  try {
    await authStore.logout();
    router.push("/login");
  } catch (error) {
    console.error("Ошибка при выходе:", error);
  }
};

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.getUserProfile();
  }
  updateNavigation();
});

watch(
  () => authStore.isAuthenticated,
  () => {
    updateNavigation();
  }
);
</script>
