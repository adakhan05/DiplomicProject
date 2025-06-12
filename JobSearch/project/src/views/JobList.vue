<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Фильтры -->
    <div class="bg-gray-800 shadow sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <!-- Поиск -->
          <div>
            <label for="search" class="block text-sm font-medium text-gray-300"
              >Поиск</label
            >
            <input
              type="text"
              id="search"
              v-model="filters.search"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Название или компания"
            />
          </div>

          <!-- Город -->
          <div>
            <label
              for="location"
              class="block text-sm font-medium text-gray-300"
              >Город</label
            >
            <input
              type="text"
              id="location"
              v-model="filters.location"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Город"
            />
          </div>

          <!-- Тип занятости -->
          <div>
            <label
              for="employment_type"
              class="block text-sm font-medium text-gray-300"
              >Тип занятости</label
            >
            <select
              id="employment_type"
              v-model="filters.employment_type"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Все типы</option>
              <option value="full_time">Полный день</option>
              <option value="part_time">Частичная занятость</option>
              <option value="remote">Удаленная работа</option>
              <option value="contract">Контракт</option>
            </select>
          </div>

          <!-- Опыт работы -->
          <div>
            <label
              for="experience_level"
              class="block text-sm font-medium text-gray-300"
              >Опыт работы</label
            >
            <select
              id="experience_level"
              v-model="filters.experience_level"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Любой опыт</option>
              <option value="no_experience">Без опыта</option>
              <option value="1-3">1-3 года</option>
              <option value="3-5">3-5 лет</option>
              <option value="5+">Более 5 лет</option>
            </select>
          </div>

          <!-- Минимальная зарплата -->
          <div>
            <label
              for="salary_min"
              class="block text-sm font-medium text-gray-300"
              >Минимальная зарплата</label
            >
            <input
              type="number"
              id="salary_min"
              v-model.number="filters.salary_min"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
              step="5000"
            />
          </div>

          <!-- Максимальная зарплата -->
          <div>
            <label
              for="salary_max"
              class="block text-sm font-medium text-gray-300"
              >Максимальная зарплата</label
            >
            <input
              type="number"
              id="salary_max"
              v-model.number="filters.salary_max"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
              step="5000"
            />
          </div>
        </div>

        <div class="mt-4">
          <div class="sm:flex sm:items-center sm:justify-between">
            <div class="mt-4 sm:mt-0">
              <button
                type="button"
                @click="applyFilters"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <span class="material-icons mr-1">search</span>
                Найти вакансии
              </button>
              <button
                type="button"
                @click="resetFilters"
                class="ml-3 inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <span class="material-icons mr-1">refresh</span>
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список вакансий -->
    <div class="bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div v-if="loading" class="text-center py-12">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"
          ></div>
          <p class="mt-2 text-sm text-gray-400">Загрузка вакансий...</p>
        </div>

        <div v-else-if="activeJobs.length === 0" class="text-center py-12">
          <p class="text-gray-300">Вакансии не найдены</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="job in activeJobs"
            :key="job.id"
            :data-job-id="job.id"
            class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors relative job-card"
          >
            <div class="flex justify-between items-start">
              <div class="flex-grow">
                <div class="flex items-center justify-between">
                  <router-link :to="'/jobs/' + job.id">
                    <h3
                      class="text-lg font-medium text-white hover:text-green-500 job-title"
                    >
                      {{ job.title }}
                    </h3>
                  </router-link>
                </div>

                <p class="mt-1 text-sm text-gray-300 job-company-location">
                  {{ job.company_name }} • {{ job.location }}
                </p>
                <p class="mt-2 text-sm text-gray-400">
                  {{ formatSalary(job.salary_min, job.salary_max) }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-if="job.employment_type === 'full_time'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-green-500"
                  >
                    Полный день
                  </span>
                  <span
                    v-else-if="job.employment_type === 'part_time'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-green-500"
                  >
                    Частичная занятость
                  </span>
                  <span
                    v-else-if="job.employment_type === 'remote'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-green-500"
                  >
                    Удаленная работа
                  </span>
                  <span
                    v-else-if="job.employment_type === 'contract'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-green-500"
                  >
                    Контракт
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300"
                  >
                    {{ getEmploymentTypeText(job.employment_type) }}
                  </span>

                  <span
                    v-if="job.experience_level === 'no_experience'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-blue-400"
                  >
                    Без опыта
                  </span>
                  <span
                    v-else-if="job.experience_level === '1-3'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-blue-400"
                  >
                    1-3 года
                  </span>
                  <span
                    v-else-if="job.experience_level === '3-5'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-blue-400"
                  >
                    3-5 лет
                  </span>
                  <span
                    v-else-if="job.experience_level === '5+'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-blue-400"
                  >
                    Более 5 лет
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-blue-400"
                  >
                    {{ getExperienceText(job.experience_level) }}
                  </span>

                  <!-- Категории или дополнительные навыки, если доступны -->
                  <span
                    v-if="job.category"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-amber-400"
                  >
                    {{ job.category }}
                  </span>

                  <!-- Work experience badge -->
                  <span
                    v-if="job.experience"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-blue-400"
                  >
                    {{ getExperienceText(job.experience) }}
                  </span>
                </div>

                <div v-if="isAuthenticated && !isEmployer" class="mt-4">
                  <router-link
                    :to="`/jobs/${job.id}?apply=true`"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <span class="material-icons text-sm mr-1">send</span>
                    Откликнуться
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Save Button - Properly positioned -->
            <div class="absolute top-4 right-4 z-10">
              <FavoriteButton
                v-if="isAuthenticated"
                :job="job"
                variant="icon-only"
                @saved="handleJobSaved"
                @unsaved="handleJobUnsaved"
                @jobStateChanged="handleJobStateChanged"
                @error="handleFavoriteError"
              />
            </div>
          </div>
        </div>

        <div
          v-if="error"
          class="bg-red-900 rounded-lg shadow-sm p-6 text-center mt-4"
        >
          <div class="flex justify-center">
            <span class="material-icons text-5xl text-red-500"
              >error_outline</span
            >
          </div>
          <h3 class="mt-4 text-xl font-medium text-white">
            Не удалось загрузить вакансии
          </h3>
          <p class="mt-2 text-red-200">
            {{ error }}
          </p>
          <div class="mt-6">
            <button
              @click="fetchJobs"
              class="inline-flex items-center px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600"
            >
              <span class="material-icons mr-2 text-sm">refresh</span>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onActivated } from "vue";
import { useJobsStore } from "@/stores/jobs";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";
import axios from "axios";
import FavoriteButton from "@/components/jobs/FavoriteButton.vue";

// Используем общий магазин вакансий для загрузки вакансий из бэкенда
const jobsStore = useJobsStore();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const savedJobsStore = useSavedJobsStore();

// Локальный список вакансий, синхронизированный с jobsStore
const jobs = ref([]);
const activeJobs = computed(() => {
  const storeJobs = jobsStore.activeJobs;
  return Array.isArray(storeJobs) ? storeJobs : [];
});
const loading = ref(false);
const error = ref(null);

// Отслеживание сохраненных вакансий в компоненте
const savedJobsMap = ref({});

// Фильтры поиска
const filters = ref({
  search: "",
  location: "",
  employment_type: "",
  experience_level: "",
  salary_min: null,
  salary_max: null,
});

// Аутентификация и пагинация
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isEmployer = computed(() => authStore.isEmployer);
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const pageSize = ref(10);

// Инициализация фильтров из URL и загрузка сохраненных вакансий
onMounted(async () => {
  // Установка начальных фильтров из параметров URL
  if (route.query.search) filters.value.search = route.query.search;
  if (route.query.location) filters.value.location = route.query.location;
  if (route.query.employment_type)
    filters.value.employment_type = route.query.employment_type;
  if (route.query.experience_level)
    filters.value.experience_level = route.query.experience_level;
  if (route.query.salary_min)
    filters.value.salary_min = Number(route.query.salary_min);
  if (route.query.salary_max)
    filters.value.salary_max = Number(route.query.salary_max);

  // Загрузка вакансий с начальными фильтрами
  await fetchJobs();

  // Загрузка сохраненных вакансий, если пользователь аутентифицирован
  if (isAuthenticated.value) {
    try {
      // Очистка карты сохраненных вакансий
      savedJobsMap.value = {};

      // Загрузка только если аутентифицирован
      await savedJobsStore.fetchSavedJobs();

      // Отметка вакансий как сохраненных только если они действительно в списке с действительными ID
      savedJobsStore.savedJobs.forEach((item) => {
        if (item && item.job && item.job.id) {
          console.log("Отметка вакансии как сохраненной:", item.job.id);
          savedJobsMap.value[item.job.id] = true;
        }
      });

      console.log(
        "Сохраненные вакансии загружены:",
        savedJobsStore.savedJobs.length
      );
      console.log("Карта сохраненных вакансий:", savedJobsMap.value);
    } catch (error) {
      console.error("Ошибка загрузки сохраненных вакансий:", error);
      // При ошибке не отмечаем никакие вакансии как сохраненные
      savedJobsMap.value = {};
    }
  }

  // Проверяем флаг недавно созданной вакансии
  const recentlyCreated = localStorage.getItem("recently_created_job");
  if (recentlyCreated) {
    console.log("Обнаружена недавно созданная вакансия, перезагружаем список");
    jobsStore.syncJobsWithLocalStorage();
    fetchJobs();
    // Удаляем флаг после использования
    localStorage.removeItem("recently_created_job");
  }
});

// Добавляем обработку активации компонента
onActivated(() => {
  console.log("JobList активирован, проверка обновлений");
  // Проверяем, если есть недавно созданные вакансии
  jobsStore.syncJobsWithLocalStorage();

  // Обновляем список
  if (jobsStore.filteredJobs.length > 0) {
    jobs.value = jobsStore.filteredJobs;
  }
});

// Применение фильтров - вызывается кнопкой поиска
const applyFilters = () => {
  console.log("Применение фильтров:", filters.value);

  // Сброс на первую страницу при применении фильтров
  currentPage.value = 1;

  // Очистка пустых значений для избежания ненужных параметров запроса
  const queryParams = {};
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value !== "" && value !== null) {
      queryParams[key] = value;
    }
  });

  // Обновление параметров URL
  router.push({
    path: "/jobs",
    query: queryParams,
  });

  // Загрузка вакансий с новыми фильтрами
  fetchJobs();
};

// Сброс фильтров - вызывается кнопкой сброса
const resetFilters = () => {
  console.log("Сброс фильтров");

  // Сброс всех значений фильтров
  filters.value = {
    search: "",
    location: "",
    employment_type: "",
    experience_level: "",
    salary_min: null,
    salary_max: null,
  };

  // Сброс на первую страницу
  currentPage.value = 1;

  // Обновление URL (очистка параметров запроса)
  router.push({ path: "/jobs" });

  // Повторная загрузка вакансий без фильтров
  fetchJobs();
};

// Наблюдение за изменениями параметров URL для синхронизации с состоянием фильтров
watch(
  () => route.query,
  (newQuery) => {
    // Обновление только при наличии реальных изменений для избежания циклов
    let hasChanges = false;

    if (
      newQuery.search !== undefined &&
      filters.value.search !== newQuery.search
    ) {
      filters.value.search = newQuery.search || "";
      hasChanges = true;
    }

    if (
      newQuery.location !== undefined &&
      filters.value.location !== newQuery.location
    ) {
      filters.value.location = newQuery.location || "";
      hasChanges = true;
    }

    if (
      newQuery.employment_type !== undefined &&
      filters.value.employment_type !== newQuery.employment_type
    ) {
      filters.value.employment_type = newQuery.employment_type || "";
      hasChanges = true;
    }

    if (
      newQuery.experience_level !== undefined &&
      filters.value.experience_level !== newQuery.experience_level
    ) {
      filters.value.experience_level = newQuery.experience_level || "";
      hasChanges = true;
    }

    if (newQuery.salary_min !== undefined) {
      const newMin =
        newQuery.salary_min === "" ? null : Number(newQuery.salary_min);
      if (filters.value.salary_min !== newMin) {
        filters.value.salary_min = newMin;
        hasChanges = true;
      }
    }

    if (newQuery.salary_max !== undefined) {
      const newMax =
        newQuery.salary_max === "" ? null : Number(newQuery.salary_max);
      if (filters.value.salary_max !== newMax) {
        filters.value.salary_max = newMax;
        hasChanges = true;
      }
    }

    // Повторная загрузка только при наличии изменений и не вызванных нашими обновлениями фильтров
    if (hasChanges) {
      console.log("Состояние фильтров обновлено из URL:", filters.value);
      fetchJobs();
    }
  },
  { deep: true }
);

// Модифицированная версия наблюдения за фильтрами
watch(
  filters,
  () => {
    // Обработка загрузки в функции applyFilters вместо этого
    // Это позволяет избежать автоматической загрузки при каждом нажатии клавиши
  },
  { deep: true }
);

// Следим за изменениями страницы
watch(currentPage, () => {
  fetchJobs();
});

// Загрузка сохраненных вакансий с использованием хранилища напрямую
const fetchSavedJobs = async () => {
  try {
    console.log("Загрузка сохраненных вакансий в JobList");

    if (!authStore.isAuthenticated) {
      console.log(
        "Пользователь не аутентифицирован, пропуск загрузки сохраненных вакансий"
      );
      return;
    }

    // Использование хранилища для загрузки сохраненных вакансий
    await savedJobsStore.fetchSavedJobs();

    // Обновление нашей локальной карты из хранилища
    savedJobsStore.savedJobs.forEach((item) => {
      if (item.job && item.job.id) {
        savedJobsMap.value[item.job.id] = true;
      }
    });

    console.log("Карта сохраненных вакансий обновлена:", savedJobsMap.value);
  } catch (error) {
    console.error("Ошибка загрузки сохраненных вакансий:", error);
  }
};

// Методы обработки сохранения/отмены сохранения вакансий
const handleJobSaved = (jobId) => {
  console.log(`Вакансия ${jobId} отмечена как сохраненная в JobList`);
  updateSavedJobsMap(jobId, true);
};

const handleJobUnsaved = (jobId) => {
  console.log(`Вакансия ${jobId} отмечена как несохраненная в JobList`);
  updateSavedJobsMap(jobId, false);
};

const handleJobStateChanged = ({ jobId, isSaved }) => {
  console.log(
    `Состояние вакансии ${jobId} изменено на ${
      isSaved ? "сохранено" : "не сохранено"
    } в JobList`
  );
  updateSavedJobsMap(jobId, isSaved);

  // Принудительная перезагрузка данных сохраненных вакансий во всех компонентах
  savedJobsStore.refreshSavedJobs();
};

const handleFavoriteError = (errorMessage) => {
  console.error("Ошибка в действии кнопки избранного:", errorMessage);
  // При необходимости показать сообщение об ошибке пользователю
};

const updateSavedJobsMap = (jobId, isSaved) => {
  if (jobId) {
    savedJobsMap.value[jobId] = isSaved;
  }
};

// Вспомогательные функции для форматирования данных
const formatSalary = (min, max) => {
  if (!min && !max) return "З/п не указана";
  if (!max) return `от ${min.toLocaleString()} ₽`;
  if (!min) return `до ${max.toLocaleString()} ₽`;
  return `${min.toLocaleString()} - ${max.toLocaleString()} ₽`;
};

const getEmploymentTypeText = (type) => {
  const types = {
    full_time: "Полный день",
    part_time: "Частичная занятость",
    remote: "Удаленная работа",
    contract: "Контракт",
  };
  return types[type] || type;
};

const getExperienceText = (experience) => {
  const experiences = {
    no_experience: "Без опыта",
    "1-3": "1-3 года",
    "3-5": "3-5 лет",
    "5+": "Более 5 лет",
  };
  return experiences[experience] || experience;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const truncateText = (text, length) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

// Загрузка данных
const fetchJobs = async () => {
  try {
    console.log(
      "JobList: Начало загрузки вакансий с фильтрами:",
      filters.value
    );
    loading.value = true;
    error.value = null;

    // Проверяем и синхронизируем с localStorage перед загрузкой
    jobsStore.syncJobsWithLocalStorage();

    // Подготовка фильтров для API
    const apiFilters = {};

    // Properly prepare filters
    if (filters.value.search && filters.value.search.trim() !== "") {
      apiFilters.search = filters.value.search.trim();
    }

    if (filters.value.location && filters.value.location.trim() !== "") {
      apiFilters.location = filters.value.location.trim();
    }

    if (filters.value.employment_type && filters.value.employment_type !== "") {
      apiFilters.employment_type = filters.value.employment_type;
    }

    if (
      filters.value.experience_level &&
      filters.value.experience_level !== ""
    ) {
      apiFilters.experience_level = filters.value.experience_level;
    }

    if (filters.value.salary_min && !isNaN(Number(filters.value.salary_min))) {
      apiFilters.salary_min = Number(filters.value.salary_min);
    }

    if (filters.value.salary_max && !isNaN(Number(filters.value.salary_max))) {
      apiFilters.salary_max = Number(filters.value.salary_max);
    }

    // Всегда запрашиваем только активные вакансии
    apiFilters.is_active = true;

    console.log("JobList: Отправка фильтров в API:", apiFilters);

    // Запрашиваем вакансии через общий store
    await jobsStore.fetchJobs(apiFilters);

    // Безопасное копирование в локальный массив для рендеринга
    jobs.value = Array.isArray(jobsStore.jobs) ? jobsStore.jobs : [];

    // Безопасное получение количества активных вакансий
    const activeJobsCount = Array.isArray(jobsStore.activeJobs)
      ? jobsStore.activeJobs.length
      : 0;
    totalItems.value = activeJobsCount;

    totalPages.value = Math.ceil(totalItems.value / pageSize.value) || 1;

    // Сохраняем результат в URL для возможности поделиться ссылкой
    updateUrlWithFilters();
  } catch (err) {
    console.error("JobList: Ошибка при загрузке вакансий:", err);
    const errorDetail = err.response?.data?.detail || "";
    const errorMessage = err.message || "Неизвестная ошибка";
    error.value =
      errorDetail || errorMessage || "Не удалось загрузить вакансии";
  } finally {
    loading.value = false;
  }
};

// Сохраняем результат в URL для возможности поделиться ссылкой
const updateUrlWithFilters = () => {
  const queryParams = {
    search: filters.value.search,
    location: filters.value.location,
    employment_type: filters.value.employment_type,
    experience_level: filters.value.experience_level,
    salary_min: filters.value.salary_min,
    salary_max: filters.value.salary_max,
  };

  router.push({
    path: "/jobs",
    query: queryParams,
  });
};
</script>
