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

      <!-- Сообщение об ошибке -->
      <div
        v-if="Object.keys(errors).length > 0 || errorMessage"
        class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6 shadow-lg"
      >
        <p v-if="errorMessage" class="font-bold mb-2">{{ errorMessage }}</p>
        <ul v-if="Object.keys(errors).length > 0" class="list-disc pl-5">
          <li v-for="(message, field) in errors" :key="field" class="mb-1">
            {{ getFieldDisplayName(field) }}: {{ message }}
          </li>
        </ul>
      </div>

      <!-- Сообщение об успехе -->
      <div
        v-if="successMessage"
        class="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded mb-6 shadow-lg"
      >
        {{ successMessage }}
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="submitForm">
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
              :class="{
                'border-red-500 focus:border-red-500 focus:ring-red-500':
                  errors.username,
              }"
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
              :class="{
                'border-red-500 focus:border-red-500 focus:ring-red-500':
                  errors.role,
              }"
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
              :class="{
                'border-red-500 focus:border-red-500 focus:ring-red-500':
                  errors.email,
              }"
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
              :class="{
                'border-red-500 focus:border-red-500 focus:ring-red-500':
                  errors.first_name,
              }"
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
              :class="{
                'border-red-500 focus:border-red-500 focus:ring-red-500':
                  errors.last_name,
              }"
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
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-500':
                    errors.company_name,
                }"
              />
              <p v-if="errors.company_name" class="mt-1 text-sm text-red-400">
                {{ errors.company_name }}
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
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-500':
                    errors.password,
                }"
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
                v-model="formData.password2"
                required
                class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Повторите пароль"
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-500':
                    errors.password2,
                }"
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
            :disabled="isSubmitting"
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
import { ref, reactive, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import { safeStorage, attemptMultipleEndpoints } from "@/utils/api-helper";
import { post } from "@/utils/api";

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
  password2: "",
  first_name: "",
  last_name: "",
  company_name: "",
  industry: "",
  company_size: "",
  role: registrationType,
});

// Синхронизируем поля password_confirmation и password2 в обе стороны
watch(
  () => formData.password_confirmation,
  (newVal) => {
    formData.password2 = newVal;
  }
);

watch(
  () => formData.password2,
  (newVal) => {
    formData.password_confirmation = newVal;
  }
);

// Отслеживаем изменения формы для очистки связанных ошибок
watch(
  formData,
  (newVal, oldVal) => {
    // Очищаем ошибки при изменении полей
    for (const field in newVal) {
      if (newVal[field] !== oldVal[field] && errors.value[field]) {
        delete errors.value[field];
      }
    }
    // Очищаем общее сообщение об ошибке при изменении любого поля
    if (
      errorMessage.value &&
      Object.keys(newVal).some((key) => newVal[key] !== oldVal[key])
    ) {
      errorMessage.value = "";
    }
  },
  { deep: true }
);

// Вспомогательная функция для получения читаемых имен полей для ошибок
const getFieldDisplayName = (field) => {
  const fieldMap = {
    username: "Логин",
    email: "Email",
    password: "Пароль",
    password_confirmation: "Подтверждение пароля",
    password2: "Подтверждение пароля",
    first_name: "Имя",
    last_name: "Фамилия",
    company_name: "Название компании",
    non_field_errors: "Ошибка",
    detail: "Ошибка",
  };

  return fieldMap[field] || field;
};

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

const validateForm = () => {
  errors.value = {}; // Reset errors
  let isValid = true;

  if (!formData.username) {
    errors.value.username = "Логин обязателен";
    isValid = false;
  }

  if (!formData.email) {
    errors.value.email = "Email обязателен";
    isValid = false;
  } else if (!validateEmail(formData.email)) {
    errors.value.email = "Введите корректный email";
    isValid = false;
  }

  if (!formData.password) {
    errors.value.password = "Пароль обязателен";
    isValid = false;
  } else if (!validatePassword(formData.password)) {
    errors.value.password = "Пароль должен быть не менее 8 символов";
    isValid = false;
  }

  if (!formData.password2) {
    errors.value.password2 = "Подтверждение пароля обязательно";
    isValid = false;
  } else if (formData.password !== formData.password2) {
    errors.value.password2 = "Пароли не совпадают";
    isValid = false;
  }

  // Синхронизируем значения перед отправкой
  formData.password_confirmation = formData.password2;

  if (registrationType.value === "jobseeker") {
    if (!formData.first_name) {
      errors.value.first_name = "Имя обязательно";
      isValid = false;
    }
    if (!formData.last_name) {
      errors.value.last_name = "Фамилия обязательна";
      isValid = false;
    }
  } else {
    if (!formData.company_name) {
      errors.value.company_name = "Название компании обязательно";
      isValid = false;
    }
  }

  return isValid;
};

// Включаем режим отладки для запросов и ответов
axios.interceptors.request.use(
  (request) => {
    console.log("Запрос отправлен:", request);
    return request;
  },
  (error) => {
    console.error("Ошибка запроса:", error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log("Ответ получен:", response);
    return response;
  },
  (error) => {
    console.error("Ошибка ответа:", error);
    return Promise.reject(error);
  }
);

const submitForm = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!validateForm()) {
    errorMessage.value = "Пожалуйста, исправьте ошибки в форме";
    return;
  }

  try {
    isSubmitting.value = true;
    formData.role = registrationType.value;

    // Убедимся что оба поля подтверждения пароля заполнены
    formData.password_confirmation = formData.password2;

    console.log("Отправка данных регистрации:", formData);

    // Подготавливаем данные для отправки
    const requestData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password2: formData.password2,
      password_confirmation: formData.password2,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
    };

    // Добавляем поля для работодателя если нужны
    if (registrationType.value === "employer") {
      requestData.company_name = formData.company_name;
    }

    console.log("Финальные данные для отправки:", requestData);

    // Используем прямой вызов через axios вместо attemptMultipleEndpoints
    try {
      console.log(
        "Отправка прямого запроса регистрации на /api/users/register/"
      );
      const response = await axios.post("/api/users/register/", requestData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
      });

      console.log("Ответ от сервера:", response);

      if (response.status === 201 || response.status === 200) {
        // Сохраняем данные пользователя и токены
        handleSuccessResponse(response.data);
      } else {
        // Если статус не соответствует успешному созданию ресурса
        errorMessage.value =
          "Ошибка при регистрации. Пожалуйста, попробуйте позже.";
      }
    } catch (axiosError) {
      console.error("Ошибка при прямом запросе регистрации:", axiosError);

      // Обрабатываем ошибки от API
      if (axiosError.response && axiosError.response.data) {
        const responseErrors = axiosError.response.data;

        if (typeof responseErrors === "object") {
          // Обрабатываем объект ошибок
          Object.entries(responseErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              errors.value[field] = messages.join(", ");
            } else if (typeof messages === "string") {
              errors.value[field] = messages;
            } else if (typeof messages === "object") {
              // Для вложенных объектов ошибок
              Object.entries(messages).forEach(
                ([nestedField, nestedErrors]) => {
                  errors.value[`${field}_${nestedField}`] = Array.isArray(
                    nestedErrors
                  )
                    ? nestedErrors.join(", ")
                    : nestedErrors;
                }
              );
            }
          });

          // Специальная обработка для password2
          if (responseErrors.password2) {
            errors.value.password2 = Array.isArray(responseErrors.password2)
              ? responseErrors.password2.join(", ")
              : responseErrors.password2;
          }

          // Если есть non_field_errors, показываем их в общем сообщении
          if (Object.keys(errors.value).length === 0) {
            errorMessage.value =
              "Ошибка при регистрации. Пожалуйста, проверьте введенные данные и попробуйте снова.";
          }
        } else {
          // Для любого другого формата ошибки
          errorMessage.value =
            "Ошибка при регистрации. Пожалуйста, попробуйте позже.";
        }
      } else {
        // Для всех остальных случаев показываем общее сообщение
        errorMessage.value =
          "Сервер временно недоступен. Пожалуйста, попробуйте позже.";
      }

      // Если прямой запрос не сработал, пробуем другие эндпоинты
      try {
        console.log("Пробуем альтернативные эндпоинты");
        const result = await attemptMultipleEndpoints(
          ["/api/register/", "/api/auth/register/"],
          requestData
        );

        if (result.success && result.data) {
          console.log("Успешная регистрация через эндпоинт:", result.endpoint);
          // Обрабатываем успешную регистрацию
          handleSuccessResponse(result.data);
        } else {
          errorMessage.value =
            "Не удалось выполнить регистрацию через доступные эндпоинты.";
        }
      } catch (altError) {
        console.error(
          "Ошибка при попытке регистрации через альтернативные эндпоинты:",
          altError
        );
      }
    }
  } catch (error) {
    console.error("Критическая ошибка при регистрации:", error);
    errorMessage.value =
      "Произошла непредвиденная ошибка. Пожалуйста, обновите страницу и попробуйте снова.";
  } finally {
    isSubmitting.value = false;
  }
};

// Добавляем функцию для обработки успешного ответа
const handleSuccessResponse = (responseData) => {
  // Проверяем, что это действительно успешный ответ, а не ошибка
  if (!responseData || responseData.error) {
    errorMessage.value = responseData?.error || "Ошибка при регистрации";
    return; // Прерываем выполнение, не делаем перенаправление
  }

  // Сохраняем токен, если он был в ответе
  if (responseData.token || responseData.access) {
    const token = responseData.token || responseData.access;
    safeStorage.setItem("token", token);

    if (responseData.refresh) {
      safeStorage.setItem("refreshToken", responseData.refresh);
    }

    // Сохраняем данные пользователя
    const user = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      id:
        responseData.user_id ||
        responseData.id ||
        (responseData.user ? responseData.user.id : null),
    };

    safeStorage.setItem("user", JSON.stringify(user));

    // Устанавливаем состояние авторизации в хранилище
    authStore.setToken(token);
    authStore.setUser(user);

    // Оповещаем об успехе
    successMessage.value = "Регистрация прошла успешно!";

    // Перенаправляем пользователя
    setTimeout(() => {
      router.push("/");
    }, 1500);
  } else {
    // Если токена нет, но регистрация успешна
    successMessage.value =
      "Регистрация прошла успешно! Теперь вы можете войти в систему.";

    // Перенаправляем на страницу входа
    setTimeout(() => {
      router.push("/login");
    }, 1500);
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
