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
        :key="job.id"
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
                {{ job.is_active ? "Приостановить" : "Активировать" }}
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
        <div class="mt-6 flex justify-end space-x-3">
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
import { ref, onMounted } from "vue";
import { useJobsStore } from "@/stores/jobs";
import { useApplicationsStore } from "@/stores/applications";

const jobsStore = useJobsStore();
const applicationsStore = useApplicationsStore();
const loading = ref(true);
const showDeleteModal = ref(false);
const jobToDelete = ref(null);
const error = ref("");
const isDev = ref(import.meta.env.DEV);

const fetchJobs = async () => {
  try {
    console.log("Начинаем получать вакансии...");
    loading.value = true;
    error.value = "";

    jobsStore.jobs = [];

    const result = await jobsStore.fetchMyJobs();
    console.log("Вакансии успешно получены:", result);

    if (result.length === 0) {
      console.log(
        "Вакансии не найдены. Если вы создавали вакансии, это может указывать на проблему."
      );
    }
  } catch (err) {
    console.error("Ошибка при получении вакансий:", err);
    console.error("Детали ошибки:", err.response?.data || err.message);

    error.value =
      jobsStore.error || "Не удалось загрузить вакансии. Попробуйте позже.";
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
      // Если есть ошибка от API-вызова, но мы в режиме разработки,
      // хранилище уже обработало это локально, так что нам не нужно откатывать

      if (!import.meta.env.DEV) {
        console.error("Ошибка от API, возвращаем состояние интерфейса");
        job.is_active = originalStatus;
        throw err;
      }
    }
  } catch (error) {
    console.error("Ошибка при изменении статуса вакансии:", error);

    // Показываем предупреждение только в производственном режиме
    if (!import.meta.env.DEV) {
      alert("Ошибка при изменении статуса вакансии");
    }
  }
};

const forceToggleJobStatus = async (job) => {
  console.log(
    `Переключение статуса вакансии из ${
      job.is_active ? "активна" : "неактивна"
    } на ${!job.is_active ? "активна" : "неактивна"}`
  );

  // В режиме разработки напрямую манипулируем статусом вакансии
  if (import.meta.env.DEV) {
    // Непосредственное переключение активного состояния вакансии в интерфейсе
    job.is_active = !job.is_active;

    try {
      // Получаем вакансии из localStorage
      const jobsJson = localStorage.getItem("jobs");
      if (jobsJson) {
        let jobs = JSON.parse(jobsJson);

        if (Array.isArray(jobs)) {
          const initialCount = jobs.length;

          // Отфильтровываем вакансию для удаления
          jobs = jobs.filter((j) => j.id != job.id);

          // Сохранить обратно в localStorage
          localStorage.setItem("jobs", JSON.stringify(jobs));

          console.log(
            `РЕЖИМ РАЗРАБОТКИ: Удалена вакансия ${job.id} из localStorage. До: ${initialCount}, После: ${jobs.length}`
          );

          // Также обновляем массив jobs в хранилище
          jobsStore.jobs = jobsStore.jobs.filter((j) => j.id !== job.id);

          // Также очищаем все заявки для этой вакансии
          try {
            const applicationsJson = localStorage.getItem(
              "mockJobApplications"
            );
            if (applicationsJson) {
              let applications = JSON.parse(applicationsJson);
              if (Array.isArray(applications)) {
                applications = applications.filter((app) => app.job != job.id);
                localStorage.setItem(
                  "mockJobApplications",
                  JSON.stringify(applications)
                );
                console.log(
                  `РЕЖИМ РАЗРАБОТКИ: Удалены заявки для удаленной вакансии ${job.id}`
                );
              }
            }
          } catch (appError) {
            console.error(
              `РЕЖИМ РАЗРАБОТКИ: Ошибка при очистке заявок для вакансии ${job.id}:`,
              appError
            );
          }

          showDeleteModal.value = false;
          jobToDelete.value = null;
          return;
        }
      }
    } catch (localError) {
      console.error(
        "Ошибка при удалении вакансии из localStorage:",
        localError
      );
    }
  }

  // Если операции в режиме разработки не удались или мы в производственном режиме, используем метод хранилища
  await jobsStore.deleteJob(job.id);
  showDeleteModal.value = false;
  jobToDelete.value = null;
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

  const jobId = jobToDelete.value.id;
  const jobTitle = jobToDelete.value.title;

  try {
    console.log(`Попытка удаления вакансии ${jobId}: "${jobTitle}"`);

    // В режиме разработки обрабатываем удаление локально сначала
    if (import.meta.env.DEV) {
      try {
        // Получаем вакансии из localStorage
        const jobsJson = localStorage.getItem("jobs");
        if (jobsJson) {
          let jobs = JSON.parse(jobsJson);

          if (Array.isArray(jobs)) {
            const initialCount = jobs.length;

            // Отфильтровываем вакансию для удаления
            jobs = jobs.filter((j) => j.id != jobId);

            // Сохранить обратно в localStorage
            localStorage.setItem("jobs", JSON.stringify(jobs));

            console.log(
              `РЕЖИМ РАЗРАБОТКИ: Удалена вакансия ${jobId} из localStorage. До: ${initialCount}, После: ${jobs.length}`
            );

            // Также обновляем массив jobs в хранилище
            jobsStore.jobs = jobsStore.jobs.filter((j) => j.id !== jobId);

            // Также очищаем все заявки для этой вакансии
            try {
              const applicationsJson = localStorage.getItem(
                "mockJobApplications"
              );
              if (applicationsJson) {
                let applications = JSON.parse(applicationsJson);
                if (Array.isArray(applications)) {
                  applications = applications.filter((app) => app.job != jobId);
                  localStorage.setItem(
                    "mockJobApplications",
                    JSON.stringify(applications)
                  );
                  console.log(
                    `РЕЖИМ РАЗРАБОТКИ: Удалены заявки для удаленной вакансии ${jobId}`
                  );
                }
              }
            } catch (appError) {
              console.error(
                `РЕЖИМ РАЗРАБОТКИ: Ошибка при очистке заявок для вакансии ${jobId}:`,
                appError
              );
            }

            showDeleteModal.value = false;
            jobToDelete.value = null;
            return;
          }
        }
      } catch (localError) {
        console.error(
          "Ошибка при удалении вакансии из localStorage:",
          localError
        );
      }
    }

    // Если операции в режиме разработки не удались или мы в производственном режиме, используем метод хранилища
    await jobsStore.deleteJob(jobId);
    showDeleteModal.value = false;
    jobToDelete.value = null;
  } catch (error) {
    console.error("Ошибка при удалении вакансии:", error);

    // Показать конкретное сообщение об ошибке вместо общего
    let errorMessage = "Ошибка при удалении вакансии";
    if (error.response?.data?.detail) {
      errorMessage += `: ${error.response.data.detail}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    alert(errorMessage);
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

    // Обновить данные о вакансиях, чтобы показать обновленный счетчик заявок
    await jobsStore.refreshApplicationCounts();
  } catch (err) {
    console.error("Ошибка при создании тестовой заявки:", err);
  }
};

// Функция увеличения счетчика заявок
const incrementApplicationCount = (job) => {
  if (!import.meta.env.DEV) return;

  console.log(
    `Принудительное увеличение счетчика заявок для вакансии ${job.id}`
  );

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
    username: "testuser",
    status: "pending",
    created_at: new Date().toISOString(),
    message: "Это принудительно созданная тестовая заявка",
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
      `Заявка принудительно добавлена в localStorage, теперь всего ${applications.length} заявок`
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
    console.error(
      "Ошибка при принудительном увеличении количества заявок:",
      err
    );
  }
};

onMounted(() => {
  // Инициализация localStorage для вакансий при необходимости
  if (import.meta.env.DEV) {
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

      // Проверка флага недавно созданной вакансии
      const recentlyCreatedJob = localStorage.getItem("recently_created_job");
      if (recentlyCreatedJob) {
        console.log(
          "Найден флаг недавно созданной вакансии, будет выполнено обновление вакансий"
        );
        localStorage.removeItem("recently_created_job");
      }
    } catch (err) {
      console.error("Ошибка при инициализации вакансий в localStorage:", err);
    }
  }

  // Принудительная перезагрузка данных о вакансиях
  console.log("Принудительное полное обновление данных о вакансиях");
  jobsStore.jobs = [];

  // Загрузка вакансий как обычно
  fetchJobs().then(() => {
    console.log(`Получено ${jobsStore.jobs.length} вакансий`);

    // Если мы не получили вакансии, но должны были, проверяем еще раз
    if (jobsStore.jobs.length === 0 && import.meta.env.DEV) {
      console.log(
        "Вакансии не найдены при первоначальной загрузке, проверяем localStorage напрямую"
      );
      try {
        const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
        if (storedJobs.length > 0) {
          console.log(
            `Найдено ${storedJobs.length} вакансий в localStorage, которые не были загружены правильно`
          );

          // Принудительное обновление вакансий из localStorage
          jobsStore.jobs = storedJobs.map((job) => ({
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
    }

    // Применение сохраненных изменений статуса из localStorage в режиме разработки
    if (import.meta.env.DEV && jobsStore.jobs.length > 0) {
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
                `РЕЖИМ РАЗРАБОТКИ: Статус вакансии [${job.id}] изменен на ${
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
