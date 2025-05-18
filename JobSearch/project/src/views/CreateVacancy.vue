<template>
  <div
    v-if="!authStore.isEmployer"
    class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="bg-red-500 bg-opacity-10 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
      role="alert"
    >
      <strong class="font-bold">Ошибка доступа!</strong>
      <span class="block sm:inline">
        Ваша учетная запись не определена как работодатель.</span
      >
      <div class="mt-4">
        <p>Текущий статус аккаунта:</p>
        <ul class="list-disc ml-5 mt-2">
          <li>
            Роль пользователя: {{ authStore.user?.role || "не определена" }}
          </li>
          <li>
            Роль в профиле:
            {{ authStore.user?.profile?.role || "не определена" }}
          </li>
          <li>IsEmployer: {{ authStore.isEmployer }}</li>
        </ul>

        <button
          @click="fixEmployerRole"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Исправить статус работодателя
        </button>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 sm:px-0 mb-8">
      <h2 class="text-2xl font-bold text-white">
        {{ isEditing ? "Редактировать вакансию" : "Создать вакансию" }}
      </h2>
      <p class="mt-2 text-sm text-gray-400">Заполните информацию о вакансии</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Display generic error message at the top of the form -->
      <p class="mt-1 text-sm text-red-400" v-if="errors.general">
        {{ errors.general }}
      </p>

      <div class="bg-gray-800 shadow-sm rounded-lg p-6">
        <!-- Основная информация -->
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-300">
              Название вакансии *
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              placeholder="Например: Senior Python Developer"
            />
            <p class="mt-1 text-sm text-red-400" v-if="errors.title">
              {{ errors.title }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Описание *
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              placeholder="Подробное описание вакансии, обязанности, требования"
            ></textarea>
            <p class="mt-1 text-sm text-red-400" v-if="errors.description">
              {{ errors.description }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Требования к кандидату *
            </label>
            <textarea
              v-model="form.requirements"
              rows="4"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              placeholder="Опишите требования к кандидату, необходимые навыки и опыт"
            ></textarea>
            <p class="mt-1 text-sm text-red-400" v-if="errors.requirements">
              {{ errors.requirements }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-300">
                Минимальная зарплата (₽)
              </label>
              <input
                v-model.number="form.salary_min"
                type="number"
                min="0"
                step="1000"
                class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              />
              <p class="mt-1 text-sm text-red-400" v-if="errors.salary_min">
                {{ errors.salary_min }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300">
                Максимальная зарплата (₽)
              </label>
              <input
                v-model.number="form.salary_max"
                type="number"
                min="0"
                step="1000"
                class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              />
              <p class="mt-1 text-sm text-red-400" v-if="errors.salary_max">
                {{ errors.salary_max }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-300">
                Тип занятости *
              </label>
              <select
                v-model="form.employment_type"
                required
                class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              >
                <option value="full_time">Полная занятость</option>
                <option value="part_time">Частичная занятость</option>
                <option value="remote">Удаленная работа</option>
                <option value="contract">Контрактная работа</option>
                <option value="internship">Стажировка</option>
              </select>
              <p
                class="mt-1 text-sm text-red-400"
                v-if="errors.employment_type"
              >
                {{ errors.employment_type }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300">
                Требуемый опыт *
              </label>
              <select
                v-model="form.experience"
                required
                class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              >
                <option value="no_experience">Без опыта</option>
                <option value="1-3">Младший (1-3 года)</option>
                <option value="3-5">Средний (3-5 лет)</option>
                <option value="5+">Старший (5+ лет)</option>
              </select>
              <p class="mt-1 text-sm text-red-400" v-if="errors.experience">
                {{ errors.experience }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Местоположение *
            </label>
            <input
              v-model="form.location"
              type="text"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              placeholder="Например: Москва, Россия"
            />
            <p class="mt-1 text-sm text-red-400" v-if="errors.location">
              {{ errors.location }}
            </p>
          </div>

          <!-- Навыки -->
          <div>
            <label class="block text-sm font-medium text-gray-300"
              >Требуемые навыки</label
            >
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="(skill, index) in form.skills"
                :key="index"
                class="inline-flex items-center bg-gray-700 px-3 py-1 rounded-full"
              >
                <span class="text-white">{{ skill }}</span>
                <button
                  type="button"
                  @click="removeSkill(index)"
                  class="ml-2 text-gray-400 hover:text-red-400"
                >
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="newSkill"
                  @keydown.enter.prevent="addSkill"
                  type="text"
                  placeholder="Добавить навык"
                  class="inline-flex items-center bg-gray-700 px-3 py-1 rounded-full text-white focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  @click="addSkill"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
            <p class="mt-1 text-sm text-red-400" v-if="errors.skills">
              {{ errors.skills }}
            </p>
          </div>
        </div>
      </div>

      <!-- Видимость вакансии -->
      <div class="bg-gray-800 shadow-sm rounded-lg p-6 mt-4">
        <h3 class="text-lg font-medium text-white mb-4">Видимость вакансии</h3>
        <div class="flex items-center">
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="form.is_active"
              class="sr-only peer"
            />
            <div
              class="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"
            ></div>
            <span class="ml-3 text-sm font-medium text-gray-300">
              {{ form.is_active ? "Активна" : "Неактивна" }}
            </span>
          </label>
          <span class="ml-6 text-sm text-gray-400">
            {{
              form.is_active
                ? "Ваша вакансия будет видна всем соискателям"
                : "Ваша вакансия будет скрыта от соискателей"
            }}
          </span>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$router.back()"
          class="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Сохранение..." : isEditing ? "Сохранить" : "Создать" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useJobsStore } from "@/stores/jobs";
import { useJobStore } from "@/stores/job";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import { showNotification } from "@/utils/notifications";

const route = useRoute();
const router = useRouter();
const jobStore = useJobStore();
const jobsStore = useJobsStore();
const authStore = useAuthStore();

const isEditing = computed(() => route.params.id !== undefined);
const loading = ref(false);
const newSkill = ref("");

// Состояние формы
const form = ref({
  title: "",
  description: "",
  requirements: "",
  salary_min: null,
  salary_max: null,
  employment_type: "full_time",
  experience: "no_experience",
  location: "",
  skills: [],
  is_active: true,
});

// Ошибки формы
const errors = ref({
  title: "",
  description: "",
  requirements: "",
  salary_min: "",
  salary_max: "",
  employment_type: "",
  experience: "",
  location: "",
  skills: "",
  general: "",
});

// Сброс ошибок при изменении формы
watch(
  form,
  () => {
    Object.keys(errors.value).forEach((key) => {
      errors.value[key] = "";
    });
  },
  { deep: true }
);

// Управление навыками
const addSkill = () => {
  if (newSkill.value.trim()) {
    form.value.skills.push(newSkill.value.trim());
    newSkill.value = "";
  }
};

const removeSkill = (index) => {
  form.value.skills.splice(index, 1);
};

// Получение данных вакансии при редактировании
onMounted(async () => {
  // Получение деталей вакансии, если редактируем
  if (route.params.id) {
    isEditing.value = true;
    loading.value = true;

    // Установка таймаута загрузки для предотвращения бесконечного состояния загрузки
    const loadingTimeout = setTimeout(() => {
      // Подготовка значений по умолчанию при истечении времени ожидания
      loading.value = false;
      form.value = getDefaultFormValues();
      errors.value.general =
        "Не удалось загрузить данные вакансии. Используются значения по умолчанию.";
    }, 5000);

    try {
      // Попытка использования нескольких конечных точек для загрузки деталей вакансии
      const jobId = route.params.id;
      let jobData = null;

      if (jobData) {
        // Заполнение формы существующими данными вакансии
        populateFormWithJobData(jobData);
      } else {
        // Добавление значений по умолчанию для новой вакансии
        form.value = getDefaultFormValues();
      }

      // Очистка таймаута после завершения загрузки
      clearTimeout(loadingTimeout);
    } catch (error) {
    } finally {
      loading.value = false;
    }
  }
});

// Вспомогательная функция для заполнения значений формы
const populateFormWithJobData = (jobData) => {};

// Значения формы по умолчанию
const getDefaultFormValues = () => {};

// Отправка формы
const handleSubmit = async () => {
  try {
    loading.value = true;

    // Сброс ошибок
    Object.keys(errors.value).forEach((key) => {
      errors.value[key] = "";
    });

    // Проверка обязательных полей
    if (!form.value.title.trim()) {
      errors.value.title = "Название вакансии обязательно";
      throw new Error("Название вакансии обязательно");
    }

    if (!form.value.description.trim()) {
      errors.value.description = "Описание вакансии обязательно";
      throw new Error("Описание вакансии обязательно");
    }

    if (!form.value.requirements.trim()) {
      errors.value.requirements = "Требования к кандидату обязательны";
      throw new Error("Требования к кандидату обязательны");
    }

    if (!form.value.location.trim()) {
      errors.value.location = "Местоположение обязательно";
      throw new Error("Местоположение обязательно");
    }

    // Проверка диапазона зарплаты, если указано
    if (
      form.value.salary_min &&
      form.value.salary_max &&
      form.value.salary_min > form.value.salary_max
    ) {
      errors.value.salary_min =
        "Минимальная зарплата не может быть больше максимальной";
      throw new Error("Минимальная зарплата не может быть больше максимальной");
    }

    const jobData = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      requirements: form.value.requirements.trim(),
      salary_min: form.value.salary_min || 0,
      salary_max: form.value.salary_max || 0,
      employment_type: form.value.employment_type,
      experience: form.value.experience,
      location: form.value.location.trim(),
      skills: form.value.skills.filter((skill) => skill.trim()),
      is_active: form.value.is_active,
    };

    console.log("Данные вакансии для отправки:", jobData);

    let createdJob = null;

    // В режиме разработки создаем вакансию напрямую в localStorage
    if (import.meta.env.DEV) {
      console.log(
        "РЕЖИМ РАЗРАБОТКИ: Создание/обновление вакансии в localStorage"
      );

      // Получение информации о текущем пользователе
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const now = new Date().toISOString();

      try {
        if (isEditing.value) {
          // Обновление существующей вакансии
          const updatedJobData = {
            ...jobData,
            updated_at: now,
            employer_id: user.id || 1,
            company_name: user.company_name || "Ваша компания",
          };

          // Используем обновленный метод из хранилища jobs
          createdJob = await jobsStore.updateJob(
            Number(route.params.id),
            updatedJobData
          );
          console.log("РЕЖИМ РАЗРАБОТКИ: Вакансия обновлена:", createdJob);
        } else {
          // Создание новой вакансии с расширенными данными
          const newJobData = {
            ...jobData,
            created_at: now,
            updated_at: now,
            employer_id: user.id || 1,
            company_name: user.company_name || "Ваша компания",
          };

          // Используем обновленный метод из хранилища jobs
          createdJob = await jobsStore.createJob(newJobData);
          console.log("РЕЖИМ РАЗРАБОТКИ: Новая вакансия создана:", createdJob);
        }

        // Показать сообщение об успехе
        showNotification(
          isEditing.value
            ? "Вакансия успешно обновлена!"
            : "Вакансия успешно создана!",
          "success"
        );
      } catch (storeError) {
        console.error(
          "РЕЖИМ РАЗРАБОТКИ: Ошибка работы с хранилищем:",
          storeError
        );
      }
    } else {
      // Также выполнить API-вызов для рабочей среды
      if (isEditing.value) {
        console.log(`Обновление вакансии с ID: ${route.params.id}`);
        createdJob = await jobsStore.updateJob(
          Number(route.params.id),
          jobData
        );
        console.log("Вакансия успешно обновлена:", createdJob);
      } else {
        console.log("Создание новой вакансии");
        createdJob = await jobsStore.createJob(jobData);
        console.log("Вакансия успешно создана:", createdJob);
      }
    }

    // Обновляем отфильтрованные списки для гарантии отображения
    jobsStore.updateFilteredJobs();
    // Перезагружаем вакансии с бэкенда, чтобы новое появилось в списке
    await jobsStore.getEmployerJobs();

    // Установим флаг недавно созданной вакансии
    localStorage.setItem("recently_created_job", "true");

    // Навигация через Vue Router
    await router.push({ path: "/jobs/my" });
  } catch (error) {
    console.error("Ошибка сохранения вакансии:", error);

    // Подробное журналирование ошибок
    if (error.response) {
      console.error("Данные ответа сервера:", error.response.data);
      console.error("Статус ответа сервера:", error.response.status);

      if (typeof error.response.data === "object") {
        // Обработка ошибок валидации
        Object.entries(error.response.data).forEach(([key, value]) => {
          if (key in errors.value) {
            errors.value[key] = Array.isArray(value) ? value.join(", ") : value;
          }
        });

        // Создание читаемого сообщения об ошибке
        const errorMessage = Object.entries(error.response.data)
          .map(([key, value]) => {
            const fieldNames = {
              title: "Название вакансии",
              description: "Описание",
              requirements: "Требования к кандидату",
              salary_min: "Минимальная зарплата",
              salary_max: "Максимальная зарплата",
              employment_type: "Тип занятости",
              experience: "Требуемый опыт",
              location: "Местоположение",
              skills: "Навыки",
            };
            const fieldName = fieldNames[key] || key;
            return `${fieldName}: ${
              Array.isArray(value) ? value.join(", ") : value
            }`;
          })
          .join("\n");

        errors.value.general = errorMessage;
      } else {
        errors.value.general = error.response.data || "Ошибка сервера";
      }
    } else if (error.message) {
      errors.value.general = error.message;
    } else {
      errors.value.general = "Неизвестная ошибка при сохранении вакансии";
    }
  } finally {
    loading.value = false;
  }
};

const fixEmployerRole = () => {
  // Эта функция обновляет объект пользователя в localStorage и в хранилище аутентификации
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Установка всех возможных флагов работодателя
  user.role = "employer";
  if (user.profile) user.profile.role = "employer";
  user.is_employer = true;
  user.user_type = "employer";

  // Обновление localStorage
  localStorage.setItem("user", JSON.stringify(user));

  // Обновление хранилища аутентификации
  authStore.setUser(user);

  // Принудительная перезагрузка для применения изменений
  window.location.reload();
};
</script>
