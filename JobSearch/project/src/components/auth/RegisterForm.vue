<template>
  <div
    class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
        Регистрация
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Уже есть аккаунт?
        <router-link
          to="/login"
          class="font-medium text-green-400 hover:text-green-500"
        >
          Войти
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
            <label for="email" class="block text-sm font-medium text-gray-300"
              >Email</label
            >
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label for="role" class="block text-sm font-medium text-gray-300"
              >Роль</label
            >
            <div class="mt-1">
              <select
                id="role"
                v-model="form.role"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="jobseeker">Соискатель</option>
                <option value="employer">Работодатель</option>
              </select>
            </div>
          </div>

          <div v-if="form.role === 'employer'">
            <label
              for="company_name"
              class="block text-sm font-medium text-gray-300"
              >Название компании</label
            >
            <div class="mt-1">
              <input
                id="company_name"
                v-model="form.company_name"
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
            <label
              for="password_confirm"
              class="block text-sm font-medium text-gray-300"
            >
              Подтверждение пароля
            </label>
            <div class="mt-1 relative">
              <input
                id="password_confirm"
                v-model="form.password_confirm"
                :type="showPasswordConfirm ? 'text' : 'password'"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm pr-10"
              />
              <button
                type="button"
                @click="showPasswordConfirm = !showPasswordConfirm"
                class="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                <span class="material-icons text-gray-400">
                  {{ showPasswordConfirm ? "visibility_off" : "visibility" }}
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
              {{ loading ? "Загрузка..." : "Зарегистрироваться" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);
const showPasswordConfirm = ref(false);

const form = ref({
  username: "",
  email: "",
  password: "",
  password_confirm: "",
  role: "jobseeker",
  company_name: "",
});

const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = "";

    if (form.value.password !== form.value.password_confirm) {
      error.value = "Пароли не совпадают";
      return;
    }

    const registrationData = {
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      password2: form.value.password_confirm,
      role: form.value.role,
      company_name: form.value.company_name,
    };

    console.log("Отправка данных регистрации:", registrationData);
    await authStore.register(registrationData);
    router.push("/");
  } catch (err) {
    if (err.response?.data) {
      // Обработка ошибок валидации Django
      const errors = err.response.data;
      const errorMessages = [];
      for (const field in errors) {
        errorMessages.push(`${field}: ${errors[field].join(", ")}`);
      }
      error.value = errorMessages.join("\n");
    } else {
      error.value = "Ошибка при регистрации";
    }
    console.error("Ошибка регистрации:", err);
  } finally {
    loading.value = false;
  }
};

const isEmployer = computed(() => form.value.role === "employer");
</script>
