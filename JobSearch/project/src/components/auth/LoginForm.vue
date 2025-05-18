<template>
  <div
    class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
        Войти в аккаунт
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Или
        <router-link
          to="/register"
          class="font-medium text-green-400 hover:text-green-500"
        >
          зарегистрируйтесь
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div
            v-if="error"
            class="bg-red-500 text-white p-3 rounded-md text-sm"
          >
            {{ error }}
          </div>
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-300"
            >
              Имя пользователя
            </label>
            <div class="mt-1">
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-300"
            >
              Пароль
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm pr-10"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                <span class="material-icons text-gray-400">
                  {{ showPassword ? "visibility_off" : "visibility" }}
                </span>
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {{ loading ? "Загрузка..." : "Войти" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const error = ref("");
const showPassword = ref(false);

const form = ref({
  username: "",
  password: "",
});

const handleSubmit = async () => {
  try {
    // Сброс состояния ошибки
    error.value = "";

    if (!form.value.username || !form.value.password) {
      error.value = "Пожалуйста, заполните все поля";
      return;
    }

    // Начало загрузки
    loading.value = true;

    // Логирование попытки входа
    console.log("Попытка входа с именем пользователя:", form.value.username);

    // Попытка авторизации
    const response = await authStore.login({
      username: form.value.username.trim(),
      password: form.value.password,
    });

    console.log("Вход успешен, данные пользователя:", response.user);

    const redirectPath = route.query.redirect || "/";
    router.push(redirectPath);
  } catch (err) {
    console.error("Ошибка авторизации:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });

    if (err.response?.status === 401) {
      error.value = "Неверное имя пользователя или пароль";
    } else if (err.response?.data?.detail) {
      error.value = `Ошибка: ${err.response.data.detail}`;
    } else if (err.response?.data?.error) {
      error.value = `Ошибка: ${err.response.data.error}`;
    } else {
      error.value = "Произошла ошибка при входе. Пожалуйста, попробуйте позже.";
    }
  } finally {
    loading.value = false;
  }
};
</script>
