<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Отладочная информация только для режима разработки -->
    <div
      v-if="isDev"
      class="bg-gray-900 p-2 mb-4 rounded text-xs text-gray-400 hidden"
    >
      <p>Помощники режима разработки:</p>
      <ul class="list-disc pl-4 mt-1">
        <li>Двойной щелчок на "0 откликов" для создания тестовой заявки</li>
        <li>Отладочная информация будет выведена в консоли</li>
      </ul>
    </div>

    <div class="px-4 sm:px-0 mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-white">Мои вакансии</h2>
        <p class="mt-2 text-sm text-gray-400">
          Управление созданными вакансиями
        </p>
      </div>
      <router-link
        to="/jobs/create"
        class="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
      >
        <span class="material-icons mr-2 text-sm">add</span>
        Создать вакансию
      </router-link>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-20">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"
      ></div>
      <p class="mt-4 text-gray-400">Загрузка вакансий...</p>
    </div>

    <!-- Пустое состояние -->
    <div
      v-else-if="jobsStore.jobs.length === 0"
      class="bg-gray-800 rounded-lg shadow-sm p-10 text-center"
    >
      <div class="flex justify-center">
        <span class="material-icons text-5xl text-gray-500">work_off</span>
      </div>
      <h3 class="mt-4 text-xl font-medium text-white">
        У вас еще нет вакансий
      </h3>
      <p class="mt-2 text-gray-400">
        Создайте свою первую вакансию, чтобы найти подходящих кандидатов
      </p>
      <div class="mt-6">
        <router-link
          to="/jobs/create"
          class="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <span class="material-icons mr-2">add</span>
          Создать вакансию
        </router-link>
      </div>
    </div>

    <!-- Отображение ошибки при неудачной загрузке -->
    <div
      v-else-if="error"
      class="bg-red-900 rounded-lg shadow-sm p-6 text-center"
    >
      <div class="flex justify-center">
        <span class="material-icons text-5xl text-red-500">error_outline</span>
      </div>
      <h3 class="mt-4 text-xl font-medium text-white">
        Не удалось загрузить вакансии
      </h3>
      <p class="mt-2 text-red-200 whitespace-pre-line">
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

    <!-- Список вакансий -->
    <div v-else class="space-y-4">
      <div
        v-for="job in jobsStore.jobs"
        :key="`job-${job.id}-${updateCounter[job.id] || 0}-${job.is_active}`"
        class="bg-gray-800 rounded-lg shadow-sm overflow-hidden"
      >
        <div class="p-6">
          <div class="flex flex-wrap justify-between items-start gap-4">
            <!-- Информация о вакансии -->
            <div class="flex-grow">
              <h3 class="text-xl font-semibold text-white">
                {{ job.title }}
              </h3>
              <div
                class="mt-2 flex flex-wrap items-center text-sm text-gray-400 gap-x-4 gap-y-2"
              >
                <div class="flex items-center">
                  <span class="material-icons text-sm mr-1">location_on</span>
                  {{ job.location }}
                </div>
                <div class="flex items-center">
                  <span class="material-icons text-sm mr-1">work</span>
                  {{ getEmploymentTypeText(job.employment_type) }}
                </div>
                <div class="flex items-center">
                  <span class="material-icons text-sm mr-1">military_tech</span>
                  {{ getExperienceText(job.experience) }}
                </div>
                <div
                  v-if="job.salary_min || job.salary_max"
                  class="flex items-center"
                >
                  <span class="material-icons text-sm mr-1">payments</span>
                  {{ formatSalary(job.salary_min, job.salary_max) }}
                </div>
              </div>
              <div class="mt-3">
                <p class="text-gray-300 line-clamp-2">{{ job.description }}</p>
              </div>
              <div
                v-if="job.skills && job.skills.length > 0"
                class="mt-3 flex flex-wrap gap-2"
              >
                <span
                  v-for="(skill, index) in job.skills"
                  :key="index"
                  class="inline-flex text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300"
                >
                  {{ skill }}
                </span>
              </div>
              <!-- Статистика по откликам -->
              <div class="mt-4 flex items-center gap-4">
                <div
                  class="flex items-center text-gray-400 cursor-pointer"
                  @click="incrementApplicationCount(job)"
                  title="Нажмите, чтобы принудительно увеличить счетчик заявок (только в режиме разработки)"
                >
                  <span class="material-icons text-sm mr-1">person</span>
                  <span>{{ job.applications_count || 0 }} откликов</span>
                </div>
                <div class="flex items-center">
                  <span
                    :id="`status-${job.id}`"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200"
                    :class="
                      job.is_active
                        ? 'bg-green-900 text-green-300'
                        : 'bg-red-900 text-red-300'
                    "
                  >
                    {{ job.is_active ? "Активна" : "Неактивна" }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Действия -->
            <div class="flex flex-col gap-2">
              <router-link
                :to="`/jobs/${job.id}`"
                class="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <span class="material-icons text-sm mr-1">visibility</span>
                Просмотр
              </router-link>
              <router-link
                :to="`/jobs/${job.id}/edit`"
                class="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <span class="material-icons text-sm mr-1">edit</span>
                Редактировать
              </router-link>
              <button
                :id="`toggle-button-${job.id}`"
                @click="forceToggleJobStatus(job)"
                class="inline-flex items-center px-3 py-1.5"
                :class="
                  job.is_active
                    ? 'bg-yellow-700 text-white hover:bg-yellow-600'
                    : 'bg-green-700 text-white hover:bg-green-600'
                "
              >
                <span class="material-icons text-sm mr-1">{{
                  job.is_active ? "pause" : "play_arrow"
                }}</span>
                <span class="button-text">{{
                  job.is_active ? "Приостановить" : "Активировать"
                }}</span>
              </button>
              <button
                @click="confirmDeleteJob(job)"
                class="inline-flex items-center px-3 py-1.5 bg-red-700 text-white rounded-md hover:bg-red-600"
              >
                <span class="material-icons text-sm mr-1">delete</span>
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold text-white">Подтверждение удаления</h3>
        <p class="mt-2 text-gray-400">
          Вы уверены, что хотите удалить вакансию "{{ jobToDelete?.title }}"?
          Это действие нельзя отменить.
        </p>
        <div class="mt-6 flex justify-center space-x-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            @click="deleteJob"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onActivated } from "vue";
import { useJobsStore } from "@/stores/jobs";
import { useApplicationsStore } from "@/stores/applications";
import { useAuthStore } from "@/stores/auth";
import { showNotification } from "@/utils/notifications";

const jobsStore = useJobsStore();
const applicationsStore = useApplicationsStore();
const authStore = useAuthStore();
const loading = ref(true);
const showDeleteModal = ref(false);
const jobToDelete = ref(null);
const error = ref("");
const isDev = ref(import.meta.env.DEV);

const updateCounter = reactive({});

const fetchJobs = async () => {
  try {
    loading.value = true;
    error.value = null;

    console.log("MyJobs: Загрузка вакансий работодателя");

    // Сначала синхронизируем с localStorage для получения последних изменений
    jobsStore.syncJobsWithLocalStorage();

    // Получаем вакансии работодателя через API
    await jobsStore.getEmployerJobs();

    // Синхронизируем активные состояния с localStorage
    syncJobStates();

    console.log(
      `MyJobs: Получено ${jobsStore.jobs.length} вакансий работодателя`
    );

    // Если не получили вакансии через API, пробуем использовать localStorage как запасной вариант
    if (jobsStore.jobs.length === 0) {
      try {
        const localJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
        if (Array.isArray(localJobs) && localJobs.length > 0) {
          // Если есть локальные данные, используем их
          const employerId = authStore.user?.id || "";
          let employerJobs = localJobs.filter(
            (job) =>
              job.employer_id === employerId || job.employer?.id === employerId
          );

          if (employerJobs.length > 0) {
            console.log(
              `MyJobs: Использование ${employerJobs.length} вакансий из localStorage`
            );
            jobsStore.jobs = employerJobs;

            // Обновляем отфильтрованный список
            jobsStore.updateFilteredJobs();
          }
        }
      } catch (e) {
        console.error("MyJobs: Ошибка при чтении данных из localStorage:", e);
      }
    }
  } catch (err) {
    console.error("MyJobs: Ошибка загрузки вакансий:", err);
    error.value =
      err.message || "Не удалось загрузить вакансии. Попробуйте позже.";
  } finally {
    loading.value = false;
  }
};

const toggleJobStatus = async (job) => {
  try {
    // Отслеживание текущего состояния на случай необходимости отката
    const originalStatus = job.is_active;

    // Оптимистичное обновление интерфейса
    job.is_active = !job.is_active;

    // Отображение временного индикатора статуса
    const statusMessage = job.is_active ? "Активация..." : "Деактивация...";
    console.log(statusMessage);

    try {
      // Вызов метода хранилища для обновления на сервере
      await jobsStore.toggleJobActive(job.id);
      console.log(
        `Статус вакансии успешно обновлен до ${
          job.is_active ? "активна" : "неактивна"
        }`
      );
    } catch (err) {
      console.error("Ошибка при обновлении статуса на сервере:", err);

      // Также сохраняем изменение в localStorage для обеспечения надежности
      try {
        const localJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
        const jobIndex = localJobs.findIndex((j) => j.id === job.id);
        if (jobIndex >= 0) {
          localJobs[jobIndex].is_active = job.is_active;
          localStorage.setItem("jobs", JSON.stringify(localJobs));
          console.log("Изменение статуса сохранено в localStorage");
        }
      } catch (storageError) {
        console.error("Ошибка при сохранении в localStorage:", storageError);
        job.is_active = originalStatus; // Откатываем состояние при ошибках
      }
    }
  } catch (error) {
    console.error("Ошибка при изменении статуса вакансии:", error);
    showNotification("Ошибка при изменении статуса вакансии", "error");
  }
};

const forceToggleJobStatus = async (job) => {
  if (!job || job.id === undefined) {
    console.error("Некорректный объект вакансии");
    return;
  }

  try {
    // Сохраняем текущий статус для отслеживания
    const oldStatus = Boolean(job.is_active);
    const newStatus = !oldStatus;

    console.log(
      `Переключение статуса вакансии ${job.id}: ${
        oldStatus ? "активная" : "неактивная"
      } -> ${newStatus ? "активная" : "неактивная"}`
    );

    // Обновляем в хранилище (не меняем локальный объект заранее)
    const result = await jobsStore.toggleJobActive(job.id);
    console.log("Ответ API:", result);

    // Принудительно обновляем объект в UI
    if (result && result.success) {
      // Обновляем счетчик для принудительного рендеринга компонента
      if (!updateCounter[job.id]) {
        updateCounter[job.id] = 0;
      }
      updateCounter[job.id]++;

      // Ищем индекс вакансии в массиве и обновляем объект
      const index = jobsStore.jobs.findIndex(
        (j) => Number(j.id) === Number(job.id)
      );

      if (index !== -1) {
        // Создаем новую ссылку для реактивности
        jobsStore.jobs[index] = {
          ...jobsStore.jobs[index],
          is_active: result.is_active,
        };

        // Обновляем массив для запуска реактивности
        jobsStore.jobs = [...jobsStore.jobs];

        // Дополнительно обновляем localStorage
        try {
          const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
          const storedJobIndex = storedJobs.findIndex(
            (j) => Number(j.id) === Number(job.id)
          );

          if (storedJobIndex !== -1) {
            storedJobs[storedJobIndex].is_active = result.is_active;
            localStorage.setItem("jobs", JSON.stringify(storedJobs));
            console.log(
              `Статус вакансии [${job.id}] в localStorage изменен на ${
                result.is_active ? "активна" : "неактивна"
              }`
            );
          }
        } catch (err) {
          console.error("Ошибка при обновлении localStorage:", err);
        }
      }
    }
  } catch (error) {
    console.error("Ошибка при изменении статуса вакансии:", error);
    showNotification(
      `Не удалось изменить статус вакансии: ${
        error.message || "Неизвестная ошибка"
      }`,
      "error"
    );
  }
};

const confirmDeleteJob = (job) => {
  jobToDelete.value = job;
  showDeleteModal.value = true;
};

const deleteJob = async () => {
  if (!jobToDelete.value) {
    showDeleteModal.value = false;
    return;
  }

  try {
    const jobId = jobToDelete.value.id;
    console.log(`Удаление вакансии ${jobId}`);

    // 1. Скрываем модальное окно
    showDeleteModal.value = false;

    // 2. Обновляем UI - удаляем вакансию из списка
    jobsStore.jobs = jobsStore.jobs.filter(
      (j) => Number(j.id) !== Number(jobId)
    );

    // 3. Сохраняем информацию об удалении в localStorage
    try {
      // Добавляем ID в список удаленных вакансий
      const deletedJobs = JSON.parse(
        localStorage.getItem("deletedJobs") || "[]"
      );
      if (!deletedJobs.includes(Number(jobId))) {
        deletedJobs.push(Number(jobId));
        localStorage.setItem("deletedJobs", JSON.stringify(deletedJobs));
        console.log(`ID ${jobId} добавлен в список удаленных вакансий`);
      }
    } catch (localError) {
      console.error(
        "Ошибка при обновлении списка удаленных вакансий:",
        localError
      );
    }

    // 4. Запускаем удаление через store API
    try {
      await jobsStore.deleteJob(jobId);
      console.log(`Вакансия ${jobId} успешно удалена`);
    } catch (apiError) {
      console.error("Ошибка при удалении через API:", apiError);
      // Уже обновили UI и добавили в список удаленных
    }

    // 5. Сбрасываем данные
    jobToDelete.value = null;
  } catch (error) {
    console.error("Ошибка при удалении вакансии:", error);
    showNotification(
      `Ошибка при удалении вакансии: ${error.message || "Неизвестная ошибка"}`,
      "error"
    );
    showDeleteModal.value = false;
    jobToDelete.value = null;
  }
};

const getEmploymentTypeText = (type) => {
  const types = {
    full_time: "Полная занятость",
    part_time: "Частичная занятость",
    remote: "Удаленная работа",
    contract: "Контрактная работа",
    internship: "Стажировка",
  };
  return types[type] || type;
};

const getExperienceText = (experience) => {
  const experiences = {
    no_experience: "Без опыта",
    junior: "Младший (1-3 года)",
    middle: "Средний (3-5 лет)",
    senior: "Старший (5+ лет)",
    lead: "Ведущий (7+ лет)",
  };
  return experiences[experience] || experience;
};

const formatSalary = (min, max) => {
  if (min && max) {
    return `${min.toLocaleString("ru-RU")} - ${max.toLocaleString("ru-RU")} ₽`;
  } else if (min) {
    return `от ${min.toLocaleString("ru-RU")} ₽`;
  } else if (max) {
    return `до ${max.toLocaleString("ru-RU")} ₽`;
  }
  return "Не указана";
};

// Метод для создания тестовых заявок в режиме разработки
const createTestApplication = async (jobId) => {
  if (!isDev.value) return;

  console.log(`Создание тестовой заявки для вакансии ${jobId}...`);
  try {
    const result = await applicationsStore.createTestApplication(jobId);
    console.log("Тестовая заявка создана:", result);

    // Безопасное обновление данных о вакансиях для счетчика заявок
    try {
      if (typeof jobsStore.refreshApplicationCounts === "function") {
        await jobsStore.refreshApplicationCounts();
      } else {
        console.warn(
          "Метод refreshApplicationCounts не найден в хранилище вакансий"
        );
        // Альтернативный способ - увеличиваем счетчик напрямую
        const job = jobsStore.jobs.find((j) => j.id === jobId);
        if (job) {
          if (!job.applications_count) job.applications_count = 0;
          job.applications_count++;
          console.log(
            `Счетчик заявок для вакансии ${jobId} увеличен до ${job.applications_count}`
          );
        }
      }
    } catch (refreshError) {
      console.error("Ошибка при обновлении счетчика заявок:", refreshError);
    }
  } catch (err) {
    console.error("Ошибка при создании тестовой заявки:", err);
  }
};

// Функция увеличения счетчика заявок
const incrementApplicationCount = (job) => {
  console.log(`Увеличение счетчика заявок для вакансии ${job.id}`);

  // Увеличиваем счетчик напрямую в интерфейсе
  if (!job.applications_count) {
    job.applications_count = 0;
  }
  job.applications_count += 1;

  // Создаем тестовую заявку
  const testApp = {
    id: Date.now(),
    job: job.id,
    user_id: 999, // Фиктивный ID пользователя
    username: "user" + Date.now().toString().slice(-4),
    status: "pending",
    created_at: new Date().toISOString(),
    message: "Это тестовая заявка",
  };

  // Сохраняем заявку в localStorage
  try {
    let applications = [];
    const stored = localStorage.getItem("mockJobApplications");
    if (stored) {
      applications = JSON.parse(stored);
    }

    // Добавляем новую заявку
    applications.push(testApp);

    // Сохраняем обратно в localStorage
    localStorage.setItem("mockJobApplications", JSON.stringify(applications));
    console.log(
      `Заявка добавлена в localStorage, теперь всего ${applications.length} заявок`
    );

    // Обновляем вакансии в localStorage
    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const jobIndex = storedJobs.findIndex((j) => j.id === job.id);

    if (jobIndex !== -1) {
      storedJobs[jobIndex].applications_count = job.applications_count;
    } else {
      storedJobs.push({ ...job });
    }

    localStorage.setItem("jobs", JSON.stringify(storedJobs));

    alert(
      `Количество заявок обновлено для вакансии "${job.title}". Сейчас: ${job.applications_count} заявок`
    );
  } catch (err) {
    console.error("Ошибка при увеличении количества заявок:", err);
  }
};

// Функция для синхронизации состояния вакансий и обновления только активных
const syncJobStates = () => {
  try {
    console.log("Синхронизация активного состояния вакансий");

    // Проверяем localStorage на наличие сохраненных статусов
    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");

    if (storedJobs.length > 0 && jobsStore.jobs.length > 0) {
      let hasChanges = false;

      // Синхронизируем состояния
      jobsStore.jobs.forEach((job) => {
        const storedJob = storedJobs.find(
          (j) => Number(j.id) === Number(job.id)
        );

        if (
          storedJob &&
          storedJob.is_active !== undefined &&
          storedJob.is_active !== job.is_active
        ) {
          console.log(
            `Обновление статуса вакансии [${job.id}]: ${
              job.is_active ? "активна" : "неактивна"
            } -> ${storedJob.is_active ? "активна" : "неактивна"}`
          );
          job.is_active = storedJob.is_active;
          hasChanges = true;
        }
      });

      // Если были изменения, обновляем фильтрованный список
      if (hasChanges) {
        console.log("Обновление фильтрованного списка вакансий");
        // Используем метод хранилища для обновления фильтрованного списка
        jobsStore.updateFilteredJobs();
      }
    }
  } catch (error) {
    console.error("Ошибка при синхронизации статусов вакансий:", error);
  }
};

// Вызываем синхронизацию при активации компонента
onActivated(() => {
  console.log("Компонент MyJobs активирован");

  // Проверяем флаг недавно созданной вакансии
  const recentlyCreatedJob = localStorage.getItem("recently_created_job");
  if (recentlyCreatedJob) {
    console.log("Обнаружена недавно созданная вакансия, обновляем список");
    jobsStore.syncJobsWithLocalStorage();
    fetchJobs();
    localStorage.removeItem("recently_created_job");
  } else {
    // Обычная синхронизация статусов
    syncJobStates();
  }
});

onMounted(() => {
  // Инициализация localStorage для вакансий при необходимости
  try {
    console.log("Инициализация вакансий в localStorage при необходимости");

    // Проверка наличия вакансий в localStorage
    const storedJobs = localStorage.getItem("jobs");
    if (storedJobs) {
      const jobsFromStorage = JSON.parse(storedJobs);
      console.log("Найдены вакансии в localStorage:", jobsFromStorage.length);
    } else {
      // Инициализация пустого массива вакансий
      localStorage.setItem("jobs", "[]");
      console.log("Создан пустой массив вакансий в localStorage");
    }

    // Создаем массив удаленных вакансий, если его нет
    if (!localStorage.getItem("deletedJobs")) {
      localStorage.setItem("deletedJobs", "[]");
    }

    // Проверка флага недавно созданной вакансии
    const recentlyCreatedJob = localStorage.getItem("recently_created_job");
    if (recentlyCreatedJob) {
      console.log(
        "Найден флаг недавно созданной вакансии, будет выполнено обновление вакансий"
      );
      // Используем улучшенный метод синхронизации
      jobsStore.syncJobsWithLocalStorage();
      localStorage.removeItem("recently_created_job");
    }
  } catch (err) {
    console.error("Ошибка при инициализации вакансий в localStorage:", err);
  }

  // Принудительная перезагрузка данных о вакансиях
  console.log("Обновление данных о вакансиях");
  jobsStore.jobs = [];

  // Загрузка вакансий
  fetchJobs().then(() => {
    console.log(`Получено ${jobsStore.jobs.length} вакансий`);

    // Если вакансии не загрузились, проверяем localStorage напрямую
    if (jobsStore.jobs.length === 0) {
      console.log(
        "Вакансии не найдены при первоначальной загрузке, проверяем localStorage напрямую"
      );
      try {
        const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");

        // Получаем список удаленных вакансий
        const deletedJobs = JSON.parse(
          localStorage.getItem("deletedJobs") || "[]"
        );
        console.log(`Найдено ${deletedJobs.length} удаленных вакансий`);

        // Фильтруем вакансии, исключая удаленные
        const filteredJobs = storedJobs.filter(
          (job) => !deletedJobs.includes(Number(job.id))
        );

        if (filteredJobs.length > 0) {
          console.log(
            `Найдено ${filteredJobs.length} вакансий в localStorage, которые не были загружены правильно`
          );

          // Принудительное обновление вакансий из localStorage
          jobsStore.jobs = filteredJobs.map((job) => ({
            ...job,
            id: Number(job.id),
            applications_count: job.applications_count || 0,
          }));

          console.log(
            "Вакансии вручную загружены из localStorage:",
            jobsStore.jobs.length
          );
        }
      } catch (error) {
        console.error(
          "Ошибка при ручной загрузке вакансий из localStorage:",
          error
        );
      }
    } else {
      // Фильтруем удаленные вакансии
      try {
        const deletedJobs = JSON.parse(
          localStorage.getItem("deletedJobs") || "[]"
        );
        if (deletedJobs.length > 0) {
          console.log(`Фильтрация ${deletedJobs.length} удаленных вакансий`);
          jobsStore.jobs = jobsStore.jobs.filter(
            (job) => !deletedJobs.includes(Number(job.id))
          );
        }
      } catch (error) {
        console.error("Ошибка при фильтрации удаленных вакансий:", error);
      }
    }

    // Применение сохраненных изменений статуса из localStorage
    if (jobsStore.jobs.length > 0) {
      try {
        const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
        if (storedJobs.length > 0) {
          // Обновление статусов вакансий из localStorage
          jobsStore.jobs.forEach((job) => {
            const storedJob = storedJobs.find(
              (j) => Number(j.id) === Number(job.id)
            );
            if (storedJob && storedJob.is_active !== undefined) {
              // Применение сохраненного статуса
              job.is_active = storedJob.is_active;
              console.log(
                `Статус вакансии [${job.id}] изменен на ${
                  job.is_active ? "активна" : "неактивна"
                }`
              );
            }
          });
        }
      } catch (err) {
        console.error(
          "Ошибка при применении сохраненных статусов вакансий:",
          err
        );
      }
    }

    // После загрузки вакансий обновляем счетчики заявок
    if (jobsStore.jobs && jobsStore.jobs.length > 0) {
      console.log("Начальные вакансии загружены, обновляем счетчики заявок...");
      jobsStore.refreshApplicationCounts();
    }
  });
});
</script>
