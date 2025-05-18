<template>
  <div
    class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-md">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
          Вход в систему
        </h2>
        <p class="mt-2 text-center text-sm text-gray-400">
          Или
          <router-link
            to="/register"
            class="font-medium text-green-500 hover:text-green-400"
          >
            зарегистрируйтесь
          </router-link>
          если у вас еще нет аккаунта
        </p>
      </div>
      <form
        class="mt-8 space-y-6"
        @submit.prevent="login"
        :class="{ 'opacity-70': loading }"
      >
        <div v-if="error" class="bg-red-900 text-red-200 p-3 rounded-md">
          {{ error }}
        </div>
        <div
          v-if="successMessage"
          class="bg-green-900 text-green-200 p-3 rounded-md"
        >
          {{ successMessage }}
        </div>
        <div class="rounded-md -space-y-px">
          <div class="mb-4">
            <label for="username" class="sr-only">Логин</label>
            <input
              id="username"
              name="username"
              type="text"
              v-model="form.username"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Логин"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Пароль</label>
            <div class="relative">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                required
                class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Пароль"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                <span class="material-icons">{{
                  showPassword ? "visibility_off" : "visibility"
                }}</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !form.username || !form.password"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="loading"
              class="absolute left-0 inset-y-0 flex items-center pl-3"
            >
              <svg
                class="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            {{ loading ? "Вход..." : "Войти" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);
const isDev = ref(import.meta.env.DEV);
const successMessage = ref("");

const form = ref({
  username: "",
  password: "",
});

// Сбросить форму при монтировании компонента
onMounted(() => {
  // Очищаем форму при каждом монтировании компонента
  form.value.username = "";
  form.value.password = "";
  error.value = "";
  successMessage.value = "";
});

// Добавим метод сброса формы, который можно вызывать при необходимости
const resetForm = () => {
  form.value.username = "";
  form.value.password = "";
  error.value = "";
  successMessage.value = "";
};

// Сброс формы при изменении маршрута на /login
watch(
  () => route.path,
  (newPath) => {
    if (newPath === "/login") {
      resetForm();
    }
  }
);

// Также отслеживаем изменение в query параметрах
// Это позволит перехватить случай когда пользователь был перенаправлен на логин после выхода
watch(
  () => route.query,
  () => {
    if (route.path === "/login") {
      resetForm();
    }
  },
  { deep: true }
);

const login = async () => {
  try {
    loading.value = true;
    error.value = "";
    successMessage.value = "";

    // Проверим данные формы перед отправкой
    if (!form.value.username || !form.value.password) {
      error.value = "Пожалуйста, введите логин и пароль";
      return;
    }

    // Вызываем метод авторизации из хранилища
    const loginResult = await authStore.login({
      username: form.value.username,
      password: form.value.password,
    });

    // authStore.login возвращает true при успехе и false при ошибке
    if (!loginResult) {
      // Если авторизация не удалась, показываем ошибку из хранилища
      error.value = authStore.error || "Неверный логин или пароль";
      return;
    }

    // Проверяем, действительно ли пользователь авторизован
    if (!authStore.isAuthenticated || !authStore.token) {
      error.value = "Ошибка авторизации. Токен не получен.";
      return;
    }

    // Сообщение об успешном входе (вместо alert)
    successMessage.value = "Успешный вход в систему!";

    // Автоматически скрыть сообщение через 3 секунды
    setTimeout(() => {
      successMessage.value = "";
    }, 3000);

    // Небольшая задержка перед перенаправлением
    setTimeout(() => {
      router.push("/");
    }, 1000);
  } catch (err) {
    console.error("Критическая ошибка авторизации:", err);
    // Обработка ошибок API
    if (err.response?.data?.detail) {
      error.value = err.response.data.detail;
    } else if (err.response?.data?.non_field_errors) {
      error.value = err.response.data.non_field_errors.join(", ");
    } else {
      error.value = "Ошибка при входе. Пожалуйста, проверьте ваши данные.";
    }
  } finally {
    loading.value = false;
  }
};

const resetLocalStorage = () => {
  if (confirm("Это очистит все данные в localStorage. Вы уверены?")) {
    // Очистить все данные localStorage
    localStorage.clear();
    console.log("Все данные localStorage очищены");

    // Принудительное обновление страницы
    window.location.reload();
  }
};
</script>

<style>
.min-h-screen {
  min-height: 100vh !important;
}

.flex {
  display: flex !important;
}

.items-center {
  align-items: center !important;
}

.justify-center {
  justify-content: center !important;
}

.max-w-md {
  max-width: 28rem !important;
  position: relative !important;
  z-index: 50 !important;
}
</style>
