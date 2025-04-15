<template>
  <div
    class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-md">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
          Регистрация
        </h2>
        <p class="mt-2 text-center text-sm text-gray-400">
          Или
          <router-link
            to="/login"
            class="font-medium text-green-500 hover:text-green-400"
          >
            войдите
          </router-link>
          если у вас уже есть аккаунт
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="submitForm">
        <div v-if="errorMessage" class="bg-red-900 text-red-200 p-3 rounded-md">
          {{ errorMessage }}
        </div>
        <div
          v-if="successMessage"
          class="bg-green-900 text-green-200 p-3 rounded-md"
        >
          {{ successMessage }}
        </div>

        <div class="space-y-4">
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-400"
              >Логин</label
            >
            <input
              id="username"
              name="username"
              type="text"
              v-model="formData.username"
              required
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Введите логин"
            />
            <p v-if="errors.username" class="mt-1 text-sm text-red-400">
              {{ errors.username }}
            </p>
          </div>

          <div>
            <label for="role" class="block text-sm font-medium text-gray-400"
              >Роль</label
            >
            <select
              id="role"
              name="role"
              v-model="registrationType"
              required
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
            >
              <option value="jobseeker">Соискатель</option>
              <option value="employer">Работодатель</option>
            </select>
            <p v-if="errors.role" class="mt-1 text-sm text-red-400">
              {{ errors.role }}
            </p>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-400"
              >Email</label
            >
            <input
              id="email"
              name="email"
              type="email"
              v-model="formData.email"
              required
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Электронная почта"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-400">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label
              for="first_name"
              class="block text-sm font-medium text-gray-400"
              >Имя</label
            >
            <input
              id="first_name"
              name="first_name"
              type="text"
              v-model="formData.first_name"
              required
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Имя"
            />
            <p v-if="errors.first_name" class="mt-1 text-sm text-red-400">
              {{ errors.first_name }}
            </p>
          </div>

          <div>
            <label
              for="last_name"
              class="block text-sm font-medium text-gray-400"
              >Фамилия</label
            >
            <input
              id="last_name"
              name="last_name"
              type="text"
              v-model="formData.last_name"
              required
              class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Фамилия"
            />
            <p v-if="errors.last_name" class="mt-1 text-sm text-red-400">
              {{ errors.last_name }}
            </p>
          </div>

          <!-- Дополнительные поля для работодателя -->
          <div v-if="registrationType === 'employer'" class="space-y-4">
            <div>
              <label
                for="company_name"
                class="block text-sm font-medium text-gray-400"
                >Название компании</label
              >
              <input
                id="company_name"
                name="company_name"
                type="text"
                v-model="formData.company_name"
                required
                class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Название вашей компании"
              />
              <p v-if="errors.company_name" class="mt-1 text-sm text-red-400">
                {{ errors.company_name }}
              </p>
            </div>

            <div>
              <label
                for="company_website"
                class="block text-sm font-medium text-gray-400"
                >Сайт компании</label
              >
              <input
                id="company_website"
                name="company_website"
                type="url"
                v-model="formData.company_website"
                class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="https://пример.com"
              />
              <p
                v-if="errors.company_website"
                class="mt-1 text-sm text-red-400"
              >
                {{ errors.company_website }}
              </p>
            </div>
          </div>

          <!-- Поля пароля перемещены в конец формы -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-400"
              >Пароль</label
            >
            <div class="relative mt-1">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="formData.password"
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
            <p v-if="errors.password" class="mt-1 text-sm text-red-400">
              {{ errors.password }}
            </p>
          </div>

          <div>
            <label
              for="password2"
              class="block text-sm font-medium text-gray-400"
              >Подтверждение пароля</label
            >
            <div class="relative mt-1">
              <input
                id="password2"
                name="password2"
                :type="showPassword2 ? 'text' : 'password'"
                v-model="formData.password_confirmation"
                required
                class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Повторите пароль"
              />
              <button
                type="button"
                @click="showPassword2 = !showPassword2"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                <span class="material-icons">{{
                  showPassword2 ? "visibility_off" : "visibility"
                }}</span>
              </button>
            </div>
            <p v-if="errors.password2" class="mt-1 text-sm text-red-400">
              {{ errors.password2 }}
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="isSubmitting"
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
            {{ isSubmitting ? "Регистрация..." : "Зарегистрироваться" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const registrationType = ref("jobseeker");
const showPassword = ref(false);
const showPassword2 = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const isSubmitting = ref(false);
const errors = ref({});

const formData = reactive({
  username: "",
  email: "",
  password: "",
  password_confirmation: "",
  first_name: "",
  last_name: "",
  company_name: "",
  company_website: "",
  industry: "",
  company_size: "",
  role: registrationType,
});

const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const isFormValid = computed(() => {
  const commonFieldsValid =
    formData.username &&
    formData.email &&
    validateEmail(formData.email) &&
    formData.password &&
    validatePassword(formData.password) &&
    formData.password === formData.password_confirmation;

  if (registrationType.value === "jobseeker") {
    return commonFieldsValid && formData.first_name && formData.last_name;
  } else {
    return commonFieldsValid && formData.company_name;
  }
});

const submitForm = async () => {
  errors.value = {};

  if (!isFormValid.value) {
    errorMessage.value = "Пожалуйста, заполните все обязательные поля";

    if (!formData.username) {
      errors.value.username = "Логин обязателен";
    }

    if (!formData.email) {
      errors.value.email = "Email обязателен";
    } else if (!validateEmail(formData.email)) {
      errors.value.email = "Введите корректный email";
    }

    if (!formData.password) {
      errors.value.password = "Пароль обязателен";
    } else if (!validatePassword(formData.password)) {
      errors.value.password = "Пароль должен быть не менее 8 символов";
    }

    if (formData.password !== formData.password_confirmation) {
      errors.value.password2 = "Пароли не совпадают";
    }

    if (registrationType.value === "jobseeker") {
      if (!formData.first_name) {
        errors.value.first_name = "Имя обязательно";
      }
      if (!formData.last_name) {
        errors.value.last_name = "Фамилия обязательна";
      }
    } else {
      if (!formData.company_name) {
        errors.value.company_name = "Название компании обязательно";
      }
    }

    return;
  }

  try {
    isSubmitting.value = true;
    errorMessage.value = "";

    formData.role = registrationType.value;

    const success = await authStore.register(formData);

    if (success) {
      successMessage.value = "Регистрация прошла успешно!";

      // Автоматическая авторизация пользователя и перенаправление на главную
      await authStore.login({
        username: formData.username,
        password: formData.password,
      });

      router.push("/");
    }
  } catch (error) {
    console.error("Ошибка регистрации:", error);

    if (error.response && error.response.data) {
      const responseErrors = error.response.data;

      if (typeof responseErrors === "object") {
        let errorMsg = "";

        // Обработка ошибок от API
        for (const field in responseErrors) {
          if (Array.isArray(responseErrors[field])) {
            errorMsg += `${field}: ${responseErrors[field].join(", ")}\n`;
            errors.value[field] = responseErrors[field].join(", ");
          } else if (typeof responseErrors[field] === "string") {
            errorMsg += `${field}: ${responseErrors[field]}\n`;
            errors.value[field] = responseErrors[field];
          }
        }

        errorMessage.value = errorMsg.trim() || "Ошибка при регистрации";
      } else {
        errorMessage.value =
          "Ошибка при регистрации. Пожалуйста, попробуйте позже.";
      }
    } else {
      errorMessage.value =
        "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.";
    }
  } finally {
    isSubmitting.value = false;
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
