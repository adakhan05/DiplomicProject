<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold mb-8 text-white">Сохраненные вакансии</h1>

    <div class="flex flex-col lg:flex-row gap-8">
      <div class="lg:w-1/4">
        <div class="bg-gray-800 rounded-lg shadow p-6 sticky top-6">
          <h2 class="font-bold text-xl mb-4 text-white">Фильтры</h2>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Тип занятости
            </label>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  id="type-full_time"
                  v-model="filters.employmentType"
                  value="full_time"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label
                  for="type-full_time"
                  class="ml-2 block text-sm text-gray-300"
                >
                  Полный день
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="type-part_time"
                  v-model="filters.employmentType"
                  value="part_time"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label
                  for="type-part_time"
                  class="ml-2 block text-sm text-gray-300"
                >
                  Частичная занятость
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="type-remote"
                  v-model="filters.employmentType"
                  value="remote"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label
                  for="type-remote"
                  class="ml-2 block text-sm text-gray-300"
                >
                  Удаленная работа
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="type-contract"
                  v-model="filters.employmentType"
                  value="contract"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label
                  for="type-contract"
                  class="ml-2 block text-sm text-gray-300"
                >
                  Контракт
                </label>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Опыт работы
            </label>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  id="level-no_experience"
                  v-model="filters.experienceLevel"
                  value="no_experience"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label
                  for="level-no_experience"
                  class="ml-2 block text-sm text-gray-300"
                >
                  Без опыта
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="level-1-3"
                  v-model="filters.experienceLevel"
                  value="1-3"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label for="level-1-3" class="ml-2 block text-sm text-gray-300">
                  1-3 года
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="level-3-5"
                  v-model="filters.experienceLevel"
                  value="3-5"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label for="level-3-5" class="ml-2 block text-sm text-gray-300">
                  3-5 лет
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="level-5+"
                  v-model="filters.experienceLevel"
                  value="5+"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
                />
                <label for="level-5+" class="ml-2 block text-sm text-gray-300">
                  Более 5 лет
                </label>
              </div>
            </div>
          </div>

          <button
            @click="resetFilters"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div class="lg:w-3/4">
        <div v-if="loading" class="text-center py-12">
          <div
            class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"
          ></div>
          <p class="mt-2 text-gray-400">Загрузка сохраненных вакансий...</p>
        </div>

        <div
          v-else-if="error && savedJobs.length > 0"
          class="bg-red-900 rounded-lg shadow-sm p-6 text-center"
        >
          <div class="flex justify-center">
            <span class="material-icons text-5xl text-red-500"
              >error_outline</span
            >
          </div>
          <h3 class="mt-4 text-xl font-medium text-white">
            Не удалось загрузить сохраненные вакансии
          </h3>
          <p class="mt-2 text-red-200">
            {{ error }}
          </p>
          <div class="mt-6 flex justify-center space-x-4">
            <button
              @click="loadSavedJobs"
              class="inline-flex items-center px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600"
            >
              <span class="material-icons mr-2 text-sm">refresh</span>
              Попробовать снова
            </button>
            <button
              @click="loadLocalJobs"
              class="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              <span class="material-icons mr-2 text-sm">storage</span>
              Загрузить локальные данные
            </button>
          </div>
        </div>

        <div
          v-else-if="!savedJobs.length"
          class="text-center py-16 bg-gray-800 rounded-lg shadow-md"
        >
          <div class="material-icons text-6xl text-gray-500 mb-4">
            bookmark_border
          </div>
          <h2 class="text-2xl font-semibold text-white mb-2">
            Нет сохраненных вакансий
          </h2>
          <p class="text-gray-400 mb-6 max-w-md mx-auto">
            Сохраняйте интересные вакансии, нажимая на кнопку "Сохранить" в
            деталях вакансии
          </p>
          <router-link
            to="/jobs"
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Просмотреть вакансии
          </router-link>
        </div>

        <div v-else>
          <h2 class="text-xl font-bold text-white mb-4">
            Всего: {{ filteredJobs.length }}
          </h2>

          <div class="space-y-6">
            <div
              v-for="savedJob in filteredJobs"
              :key="savedJob.id"
              class="bg-gray-800 rounded-lg shadow-md overflow-hidden relative hover:bg-gray-750 transition-colors duration-200"
            >
              <div class="p-6">
                <div class="flex flex-wrap justify-between items-start">
                  <div class="mb-3 pr-10">
                    <h2 class="text-xl font-bold text-white mb-2">
                      <router-link
                        :to="`/jobs/${savedJob.job.id}`"
                        class="hover:text-green-500"
                      >
                        <template v-if="savedJob.job.id === 1">
                          {{ savedJob.job.title || "Вакансия #1" }}
                        </template>
                        <template v-else-if="savedJob.job.id === 2">
                          {{ savedJob.job.title || "Вакансия #2" }}
                        </template>
                        <template v-else>
                          {{
                            savedJob.job.title || `Вакансия #${savedJob.job.id}`
                          }}
                        </template>
                      </router-link>
                    </h2>
                    <div class="flex flex-wrap items-center text-gray-300 mb-2">
                      <span class="mr-3 font-medium">
                        {{
                          savedJob.job.company_name || "Неизвестная компания"
                        }}
                      </span>
                      <span v-if="savedJob.job.location" class="mr-3">
                        <span class="material-icons text-sm align-middle mr-1"
                          >location_on</span
                        >
                        {{ savedJob.job.location }}
                      </span>
                    </div>
                    <div class="flex flex-wrap items-center text-gray-300 mb-2">
                      <span class="mr-3 font-medium">Опыт работы:</span>
                      <span class="font-medium">{{
                        getExperienceText(savedJob.job.experience)
                      }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      v-if="
                        savedJob.job.salary ||
                        savedJob.job.salary_min ||
                        savedJob.job.salary_max
                      "
                      class="text-2xl font-bold text-green-500 mb-1"
                    >
                      {{ savedJob.job.salary || formatSalary(savedJob.job) }}
                    </div>
                    <div v-else class="text-xl font-bold text-gray-500 mb-1">
                      З/п не указана
                    </div>
                    <div class="text-gray-500 text-sm">
                      Сохранено {{ formatDate(savedJob.saved_at) }}
                    </div>
                  </div>
                </div>

                <div class="space-y-3 my-3">
                  <div
                    class="flex flex-wrap gap-2 justify-center sm:justify-start button-container"
                  >
                    <span
                      v-if="savedJob.job.employment_type === 'full_time'"
                      class="inline-block bg-gray-700 text-green-500 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      Полный день
                    </span>
                    <span
                      v-else-if="savedJob.job.employment_type === 'part_time'"
                      class="inline-block bg-gray-700 text-green-500 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      Частичная занятость
                    </span>
                    <span
                      v-else-if="savedJob.job.employment_type === 'remote'"
                      class="inline-block bg-gray-700 text-green-500 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      Удаленная работа
                    </span>
                    <span
                      v-else-if="savedJob.job.employment_type === 'contract'"
                      class="inline-block bg-gray-700 text-green-500 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      Контракт
                    </span>

                    <span
                      v-if="savedJob.job.experience === 'no_experience'"
                      class="inline-block bg-gray-700 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      Без опыта
                    </span>
                    <span
                      v-else-if="savedJob.job.experience === '1-3'"
                      class="inline-block bg-gray-700 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      1-3 года
                    </span>
                    <span
                      v-else-if="savedJob.job.experience === '3-5'"
                      class="inline-block bg-gray-700 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      3-5 лет
                    </span>
                    <span
                      v-else-if="savedJob.job.experience === '5+'"
                      class="inline-block bg-gray-700 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      Более 5 лет
                    </span>
                    <span
                      v-else-if="savedJob.job.experience"
                      class="inline-block bg-gray-700 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {{ savedJob.job.experience }}
                    </span>
                    <span
                      v-if="savedJob.job.experience_years"
                      class="inline-block bg-gray-700 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {{ formatExperienceYears(savedJob.job.experience_years) }}
                    </span>

                    <span
                      v-if="savedJob.job.category"
                      class="inline-block bg-gray-700 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {{ savedJob.job.category }}
                    </span>
                  </div>

                  <div
                    v-if="savedJob.job.description"
                    class="text-gray-300 text-sm"
                  >
                    {{ truncateText(savedJob.job.description, 150) }}
                  </div>

                  <div
                    v-if="savedJob.job.skills && savedJob.job.skills.length > 0"
                  >
                    <div class="flex flex-wrap gap-2 mt-2">
                      <span
                        v-for="(tag, index) in (
                          savedJob.job.skills || []
                        ).slice(0, 5)"
                        :key="index"
                        class="inline-block bg-gray-700 text-green-400 text-xs font-normal px-3 py-1 rounded-full"
                      >
                        {{ tag }}
                      </span>
                      <span
                        v-if="(savedJob.job.skills || []).length > 5"
                        class="inline-block text-gray-500 text-xs self-center"
                      >
                        +{{ savedJob.job.skills.length - 5 }} еще
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-center mt-4">
                  <div class="text-gray-500 text-sm">
                    <span v-if="savedJob.job.views" class="mr-3">
                      <span class="material-icons text-xs align-middle mr-1"
                        >visibility</span
                      >
                      {{ savedJob.job.views }} просмотров
                    </span>
                    <span v-if="savedJob.job.published_at">
                      <span class="material-icons text-xs align-middle mr-1"
                        >calendar_today</span
                      >
                      {{ formatDate(savedJob.job.published_at) }}
                    </span>
                  </div>

                  <div class="flex space-x-2">
                    <button
                      v-if="!savedJob.clicked && !isEmployer"
                      class="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      @click="applyToJob(savedJob)"
                    >
                      <span class="material-icons text-sm mr-1">send</span>
                      Откликнуться
                    </button>
                    <div
                      v-else-if="savedJob.clicked"
                      class="inline-flex items-center px-6 py-2 text-sm font-medium rounded-md text-white bg-gray-700"
                    >
                      <span class="material-icons text-green-500 text-sm mr-1"
                        >check</span
                      >
                      Отклик отправлен
                    </div>
                    <router-link
                      :to="`/jobs/${savedJob.job.id}`"
                      class="inline-flex items-center px-6 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <span class="material-icons text-sm mr-1"
                        >visibility</span
                      >
                      Просмотреть
                    </router-link>
                  </div>
                </div>

                <button
                  @click="removeJob(savedJob)"
                  class="absolute top-2 right-2 text-red-400 hover:text-red-500 focus:outline-none bg-gray-700 hover:bg-gray-600 rounded-full p-1"
                  title="Удалить из сохраненных"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="filteredJobs.length === 0 && savedJobs.length > 0"
            class="text-center py-8 bg-gray-800 rounded-lg shadow"
          >
            <div class="material-icons text-4xl text-gray-400 mb-2">
              filter_alt
            </div>
            <h3 class="text-xl font-medium text-white mb-1">
              Нет вакансий, соответствующих фильтрам
            </h3>
            <p class="text-gray-400 mb-4">
              Попробуйте изменить критерии фильтрации
            </p>
            <button
              @click="resetFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";
import { storeToRefs } from "pinia";

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const savedJobsStore = useSavedJobsStore();

    const {
      savedJobs,
      loading,
      error,
      stats: storeStats,
    } = storeToRefs(savedJobsStore);

    const isEmployer = computed(() => authStore.isEmployer);
    const currentUserId = computed(() => authStore.user?.id);

    const filters = reactive({
      search: "",
      employmentType: [],
      experienceLevel: [],
      minSalary: "",
      maxSalary: "",
      sortBy: "date_saved",
      sortDir: "desc",
    });

    const stats = ref({
      by_employment_type: {},
      by_experience: {},
    });

    const filteredJobs = computed(() => {
      let result = [...savedJobs.value];

      if (filters.employmentType.length > 0) {
        result = result.filter(
          (saved) =>
            saved.job &&
            saved.job.employment_type &&
            filters.employmentType.includes(saved.job.employment_type)
        );
      }

      if (filters.experienceLevel.length > 0) {
        result = result.filter(
          (saved) =>
            saved.job &&
            saved.job.experience &&
            filters.experienceLevel.includes(saved.job.experience)
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
          (saved) =>
            saved.job &&
            (saved.job.title.toLowerCase().includes(searchLower) ||
              (saved.job.company_name &&
                saved.job.company_name.toLowerCase().includes(searchLower)) ||
              (saved.job.company?.name &&
                saved.job.company.name.toLowerCase().includes(searchLower)) ||
              (saved.job.description &&
                saved.job.description.toLowerCase().includes(searchLower)))
        );
      }

      if (filters.minSalary) {
        const minSalary = Number(filters.minSalary);
        result = result.filter((saved) => {
          if (!saved.job) return false;

          // Получаем минимальную зарплату из всех возможных источников
          const jobMinSalary =
            saved.job.salary_min ||
            saved.job.min_salary ||
            (saved.job.salary && typeof saved.job.salary === "string"
              ? parseInt(saved.job.salary.replace(/[^\d]/g, ""))
              : 0);

          // Включаем, если зарплата вакансии больше или равна фильтру
          return !isNaN(jobMinSalary) && jobMinSalary >= minSalary;
        });
      }

      if (filters.maxSalary) {
        const maxSalary = Number(filters.maxSalary);
        result = result.filter((saved) => {
          if (!saved.job) return false;

          // Получаем максимальную зарплату из всех возможных источников
          const jobMaxSalary =
            saved.job.salary_max ||
            saved.job.max_salary ||
            (saved.job.salary && typeof saved.job.salary === "string"
              ? parseInt(saved.job.salary.replace(/[^\d]/g, ""))
              : Infinity);

          // Включаем, если зарплата вакансии меньше или равна фильтру
          return !isNaN(jobMaxSalary) && jobMaxSalary <= maxSalary;
        });
      }

      result.sort((a, b) => {
        return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
      });

      return result;
    });

    const loadSavedJobs = async () => {
      if (!authStore.isAuthenticated) {
        router.push("/login");
        return;
      }

      try {
        console.log(
          `SavedJobs.vue: Загрузка сохраненных вакансий для пользователя ${currentUserId.value}`
        );

        await savedJobsStore.fetchSavedJobs();

        console.log(
          `SavedJobs.vue: Загружено ${savedJobsStore.savedJobs.length} вакансий из хранилища для пользователя ${currentUserId.value}`
        );

        calculateStats();
      } catch (err) {
        console.error("Ошибка в loadSavedJobs:", err);
      }
    };

    const loadLocalJobs = () => {
      try {
        // Очищаем ошибку перед загрузкой
        savedJobsStore.error = null;

        // Загружаем вакансии из локального хранилища пользователя
        savedJobsStore.loadSavedJobsFromStorage();

        // Если список все еще пуст после загрузки, показываем уведомление
        if (savedJobsStore.savedJobs.length === 0) {
          savedJobsStore.error =
            "Нет сохраненных вакансий в локальном хранилище";
        } else {
          calculateStats();
        }
      } catch (err) {
        console.error(
          "Ошибка при загрузке вакансий из локального хранилища:",
          err
        );
        savedJobsStore.error =
          "Не удалось загрузить данные из локального хранилища";
      }
    };

    const removeJob = async (savedJob) => {
      if (!savedJob || !savedJob.job) {
        console.error("Некорректные данные вакансии для удаления");
        return;
      }
      const jobId = Number(savedJob.job.id);
      console.log(
        `Запрос на удаление вакансии ID=${jobId} из компонента для пользователя ${currentUserId.value}`
      );
      await savedJobsStore.unsaveJob(jobId);
      calculateStats();
    };

    const resetFilters = () => {
      filters.search = "";
      filters.employmentType = [];
      filters.experienceLevel = [];
      filters.minSalary = "";
      filters.maxSalary = "";
    };

    const formatSalary = (job) => {
      if (!job) return "";

      if (job.salary && typeof job.salary === "string") {
        return job.salary;
      }

      const min =
        job.salary_min || job.min_salary || (job.salary && job.salary.min);
      const max =
        job.salary_max || job.max_salary || (job.salary && job.salary.max);

      if (!min && !max) return "З/п не указана";
      if (!max) return `от ${Number(min).toLocaleString()} ₽`;
      if (!min) return `до ${Number(max).toLocaleString()} ₽`;
      return `${Number(min).toLocaleString()} - ${Number(
        max
      ).toLocaleString()} ₽`;
    };

    const formatDate = (dateString) => {
      if (!dateString) return "Неизвестная дата";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn(
            "Некорректная строка даты передана в formatDate:",
            dateString
          );
          return "Неверная дата";
        }
        return new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date);
      } catch (e) {
        console.error("Ошибка форматирования даты:", dateString, e);
        return "Ошибка даты";
      }
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

    const calculateStats = () => {
      const employmentStats = {};
      const experienceStats = {};

      savedJobs.value.forEach((saved) => {
        if (saved?.job?.employment_type) {
          employmentStats[saved.job.employment_type] =
            (employmentStats[saved.job.employment_type] || 0) + 1;
        }
        if (saved?.job?.experience) {
          experienceStats[saved.job.experience] =
            (experienceStats[saved.job.experience] || 0) + 1;
        }
      });

      stats.value = {
        by_employment_type: employmentStats,
        by_experience: experienceStats,
      };
    };

    const truncateText = (text, maxLength) => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    };

    const applyToJob = (savedJob) => {
      if (!savedJob || !savedJob.job) return;
      // Navigate to job detail page and open apply modal automatically
      router.push({
        name: "job-detail",
        params: { id: savedJob.job.id },
        query: { apply: "true" },
      });
    };

    const formatExperienceYears = (years) => {
      if (years === undefined || years === null) return "Опыт не указан";
      if (years < 1) return "Менее года";
      if (years === 1) return "1 год";
      if (years > 1 && years < 5) return `${years} года`;
      return `${years} лет`;
    };

    // Отслеживаем изменения пользователя для перезагрузки сохраненных вакансий
    watch(
      () => currentUserId.value,
      (newUserId, oldUserId) => {
        if (newUserId !== oldUserId) {
          console.log(
            `Пользователь изменился с ${oldUserId} на ${newUserId}, перезагрузка сохраненных вакансий`
          );
          loadSavedJobs();
        }
      }
    );

    // Отслеживаем изменения savedJobs для автоматического обновления представления
    watch(
      () => savedJobs.value,
      () => {
        console.log(
          "Представление SavedJobs обнаружило изменения в сохраненных вакансиях, обновляем статистику"
        );
        calculateStats();
      },
      { deep: true }
    );

    onMounted(() => {
      loadSavedJobs();
    });

    return {
      savedJobs,
      loading,
      error,
      filters,
      filteredJobs,
      stats,
      isEmployer,
      loadSavedJobs,
      loadLocalJobs,
      removeJob,
      resetFilters,
      formatSalary,
      formatDate,
      getEmploymentTypeText,
      getExperienceText,
      truncateText,
      applyToJob,
      formatExperienceYears,
      calculateStats,
    };
  },
};
</script>
