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

        <div v-else-if="jobs.length === 0" class="text-center py-12">
          <p class="text-gray-300">Вакансии не найдены</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="job in jobs"
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
                </div>

                <div v-if="isAuthenticated" class="mt-4">
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
                @saved="handleJobSaved(job.id)"
                @unsaved="handleJobUnsaved(job.id)"
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
import { ref, computed, watch, onMounted } from "vue";
import { useJobStore } from "@/stores/job";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";
import axios from "axios";
import FavoriteButton from "@/components/jobs/FavoriteButton.vue";

const jobStore = useJobStore();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const savedJobsStore = useSavedJobsStore();

// Список вакансий
const jobs = ref([]);
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
  fetchJobs();

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

// Обработка события сохранения вакансии от FavoriteButton
const handleJobSaved = (jobId) => {
  console.log(`Вакансия ${jobId} была сохранена`);
  savedJobsMap.value[jobId] = true;
};

// Обработка события отмены сохранения вакансии от FavoriteButton
const handleJobUnsaved = (jobId) => {
  console.log(`Вакансия ${jobId} была удалена из сохраненных`);
  savedJobsMap.value[jobId] = false;
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
      "СписокВакансий: Начало загрузки вакансий с фильтрами:",
      filters.value
    );
    loading.value = true;
    error.value = "";

    // Очистка фильтров перед отправкой в API
    const apiFilters = { ...filters.value };
    Object.keys(apiFilters).forEach((key) => {
      if (apiFilters[key] === null || apiFilters[key] === "") {
        delete apiFilters[key];
      }
    });

    // Добавление отладочных логов для отслеживания значений фильтров
    console.log("Фильтр типа занятости:", filters.value.employment_type);
    console.log("Фильтр уровня опыта:", filters.value.experience_level);

    // Убедимся, что employment_type и experience_level включены правильно
    console.log("Отправка фильтров в API:", apiFilters);

    const response = await jobStore.getJobs({
      ...apiFilters,
      page: currentPage.value,
      per_page: pageSize.value,
    });

    console.log("СписокВакансий: Вакансии успешно загружены:", response);

    // Безопасное извлечение данных о вакансиях
    let jobsData = [];
    let jobsCount = 0;

    if (response && response.results && Array.isArray(response.results)) {
      jobsData = response.results;
      jobsCount = response.count || response.results.length;
    } else if (Array.isArray(response)) {
      jobsData = response;
      jobsCount = response.length;
    } else {
      console.warn(
        "СписокВакансий: Неожиданный формат ответа, использование запасного варианта"
      );
      if (jobStore.jobs && jobStore.jobs.length) {
        jobsData = jobStore.jobs;
        jobsCount = jobStore.jobs.length;
      } else {
        jobsData = generateMockJobs(5);
        jobsCount = 5;
        error.value =
          "API вакансий недоступен. Отображаются тестовые данные для отладки.";
      }
    }

    // Применение фильтрации на стороне клиента, если необходимо
    if (filters.value.employment_type && filters.value.employment_type !== "") {
      console.log(
        "Применение фильтра типа занятости на стороне клиента:",
        filters.value.employment_type
      );
      jobsData = jobsData.filter(
        (job) => job.employment_type === filters.value.employment_type
      );
      jobsCount = jobsData.length;
    }

    if (
      filters.value.experience_level &&
      filters.value.experience_level !== ""
    ) {
      console.log(
        "Применение фильтра уровня опыта на стороне клиента:",
        filters.value.experience_level
      );
      jobsData = jobsData.filter(
        (job) => job.experience_level === filters.value.experience_level
      );
      jobsCount = jobsData.length;
    }

    if (filters.value.salary_min || filters.value.salary_max) {
      jobsData = jobsData.filter((job) => {
        const min = filters.value.salary_min
          ? Number(filters.value.salary_min)
          : 0;
        const max = filters.value.salary_max
          ? Number(filters.value.salary_max)
          : Infinity;
        const jobMin = job.salary_min || 0;
        const jobMax = job.salary_max || jobMin;
        return jobMin >= min && jobMax <= max;
      });
      jobsCount = jobsData.length;
    }

    jobs.value = jobsData;
    totalPages.value = Math.ceil(jobsCount / pageSize.value);
    totalItems.value = jobsCount;
  } catch (err) {
    console.error("Ошибка загрузки вакансий:", err);
    console.error("Детали ошибки:", err.response?.data || err.message);
    error.value =
      err.message || "Не удалось загрузить вакансии. Попробуйте позже.";

    // Генерация тестовых вакансий для тестирования интерфейса при сбое API
    jobs.value = generateMockJobs(5);
    totalPages.value = 1;
    totalItems.value = 5;
  } finally {
    loading.value = false;
  }
};
</script>
