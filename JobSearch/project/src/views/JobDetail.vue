<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div v-if="job" class="bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6 flex justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">
            {{ job.title || "Неизвестная вакансия" }}
          </h1>
          <p class="mt-1 text-sm text-gray-300">
            {{ job.company_name }} • {{ job.location }}
          </p>
        </div>
        <div v-if="isAuthenticated">
          <FavoriteButton
            :job="job"
            variant="default"
            @saved="isSaved = true"
            @unsaved="isSaved = false"
          />
        </div>
      </div>
      <div class="border-t border-gray-700">
        <dl>
          <div
            class="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-400">Компания</dt>
            <dd class="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {{ job.company_name }}
            </dd>
          </div>
          <div
            class="bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-400">Местоположение</dt>
            <dd class="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {{ job.location }}
            </dd>
          </div>
          <div
            class="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-400">Зарплата</dt>
            <dd class="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {{ formatSalary(job.salary_min, job.salary_max) }}
            </dd>
          </div>
          <div
            class="bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-400">Тип занятости</dt>
            <dd class="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {{ getEmploymentTypeText(job.employment_type) }}
            </dd>
          </div>
          <div
            class="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-400">Требуемый опыт</dt>
            <dd class="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {{ getExperienceText(job.experience) }}
            </dd>
          </div>
          <div
            class="bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-400">Описание вакансии</dt>
            <dd
              class="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 prose prose-sm prose-invert max-w-none"
              v-html="job.description"
            ></dd>
          </div>
          <div
            class="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-400">
              Требования к кандидату
            </dt>
            <dd
              class="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 prose prose-sm prose-invert max-w-none"
              v-html="job.requirements"
            ></dd>
          </div>
          <div
            v-if="!isAuthenticated"
            class="bg-gray-700 px-4 py-5 sm:px-6 text-center"
          >
            <p class="text-gray-300 mb-4">
              Чтобы откликнуться на вакансию, необходимо войти в систему
            </p>
            <router-link
              to="/login"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span class="material-icons mr-1">login</span>
              Войти
            </router-link>
            <router-link
              to="/register"
              class="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <span class="material-icons mr-1">person_add</span>
              Регистрация
            </router-link>
          </div>
        </dl>
      </div>

      <div class="px-4 py-5 sm:px-6 bg-gray-800 border-t border-gray-700">
        <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
          <button
            v-if="isAuthenticated && isJobseeker && !hasApplied && !isEmployer"
            @click="openApplyModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <span class="material-icons mr-1">send</span>
            Откликнуться
          </button>
          <button
            v-if="isAuthenticated && isJobseeker && hasApplied && !isEmployer"
            @click="startChat"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span class="material-icons mr-1">chat</span>
            Написать работодателю
          </button>
          <button
            @click="shareJob"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <span class="material-icons mr-1">share</span>
            Поделиться
          </button>
          <button
            @click="router.go(-1)"
            class="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <span class="material-icons mr-1">arrow_back</span>
            Назад
          </button>
          <button
            v-if="isAuthenticated && isJobseeker && hasApplied && !isEmployer"
            @click="showCancelJobModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <span class="material-icons mr-1">cancel</span>
            Отменить отклик
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"
      ></div>
      <p class="mt-2 text-gray-400">Загрузка вакансии...</p>
    </div>

    <div v-else-if="error" class="py-12">
      <div class="bg-red-900 rounded-lg shadow-sm p-6 text-center">
        <div class="flex justify-center">
          <span class="material-icons text-5xl text-red-500"
            >error_outline</span
          >
        </div>
        <h3 class="mt-4 text-xl font-medium text-white">
          Не удалось загрузить вакансию
        </h3>
        <p class="mt-2 text-red-200">
          {{ error }}
        </p>
        <div class="mt-6">
          <button
            @click="loadJob"
            class="inline-flex items-center px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600"
          >
            <span class="material-icons mr-2 text-sm">refresh</span>
            Попробовать снова
          </button>
          <button
            @click="router.go(-1)"
            class="ml-4 inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            <span class="material-icons mr-2 text-sm">arrow_back</span>
            Назад
          </button>
        </div>
      </div>
    </div>

    <ApplyJobModal
      :show="showApplyModal"
      :job="job || {}"
      @close="showApplyModal = false"
      @success="handleApplicationSuccess"
    />

    <!-- Модальное окно подтверждения отмены -->
    <div
      v-if="showCancelJobModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold text-white">
          Подтверждение отмены отклика
        </h3>
        <p class="mt-2 text-gray-400">
          Вы уверены, что хотите отменить отклик на вакансию "{{ job?.title }}"?
          Вы можете восстановить отклик позже в разделе "Мои отклики".
        </p>
        <div class="mt-6 flex justify-center space-x-3">
          <button
            @click="showCancelJobModal = false"
            class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            :disabled="loading"
          >
            Назад
          </button>
          <button
            @click="cancelApplication"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            :disabled="loading"
          >
            <span v-if="loading" class="mr-2">
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
            Подтвердить отмену
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onActivated } from "vue";
import { useJobStore } from "@/stores/job";
import { useApplicationsStore } from "@/stores/applications";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";
import { useChatStore } from "@/stores/chat";
import { useRoute, useRouter } from "vue-router";
import FavoriteButton from "@/components/jobs/FavoriteButton.vue";
import ApplyJobModal from "@/components/jobs/ApplyJobModal.vue";
import axios from "axios";
import { showNotification } from "@/utils/notifications";

const route = useRoute();
const router = useRouter();
const jobStore = useJobStore();
const applicationsStore = useApplicationsStore();
const authStore = useAuthStore();
const savedJobsStore = useSavedJobsStore();
const chatStore = useChatStore();

const job = ref(null);
const loading = ref(true);
const error = ref(null);
const applications = ref([]);
const hasApplied = ref(false);
const showApplyModal = ref(false);
const showCancelJobModal = ref(false);
const resumes = ref([]);
const applicationId = ref(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isJobseeker = computed(() => authStore.isJobseeker);
const isEmployer = computed(() => authStore.isEmployer);

const isSaved = ref(false);

// Функция для санитизации ID чата для WebSocket
const sanitizeConversationId = (id) => {
  if (!id) return "";
  // Удаляем все, кроме букв, цифр, дефисов, подчеркиваний и точек
  const sanitized = String(id).replace(/[^a-zA-Z0-9\-_\.]/g, "_");
  // Ограничиваем длину
  return sanitized.length > 99 ? sanitized.substring(0, 99) : sanitized;
};

// Безопасная работа с localStorage
const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Ошибка при чтении ${key} из localStorage:`, error);
      return null;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Ошибка при записи ${key} в localStorage:`, error);
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Ошибка при удалении ${key} из localStorage:`, error);
      return false;
    }
  },
};

const checkAppliedStatus = () => {
  if (!job.value || !authStore.isAuthenticated) return;

  const jobId = job.value.id;

  // Сначала проверяем наличие флага отмены отклика
  const wasCanceled =
    localStorage.getItem(`job_application_${jobId}_canceled`) === "true";

  if (wasCanceled) {
    console.log(`[Debug] Найден флаг отмены для job_application_${jobId}`);
    // Если отклик был отменен, устанавливаем hasApplied в false независимо от других проверок
    hasApplied.value = false;
    applicationId.value = null;
    return;
  }

  // Проверяем стстус отклика через хранилище (которое также проверяет localStorage)
  const storeHasApplied = applicationsStore.hasApplied(jobId);
  const localStorageApplied = !!localStorage.getItem(
    `job_application_${jobId}`
  );
  const activeMapApplied = !!applicationsStore.activeApplicationsMap[jobId];

  console.log(`[Debug] checkAppliedStatus for job ${jobId}:`);
  console.log(`- Store hasApplied: ${storeHasApplied}`);
  console.log(`- localStorage applied: ${localStorageApplied}`);
  console.log(`- activeMap applied: ${activeMapApplied}`);

  // Проверяем URL-параметр - если мы на странице с параметром apply=true,
  // то предполагаем, что пользователь только что откликнулся
  const urlIndicatesApplied = route.query.apply === "true";
  console.log(`- URL indicates applied: ${urlIndicatesApplied}`);

  // Обновляем статус отклика, учитывая только реальные источники информации
  // Не учитываем URL-параметр, чтобы кнопка отмены отклика появлялась только после фактического отклика
  hasApplied.value = storeHasApplied || localStorageApplied || activeMapApplied;

  // Если определяем, что пользователь откликнулся, но в localStorage нет записи,
  // сохраняем информацию в localStorage
  if (hasApplied.value && !localStorageApplied && jobId) {
    // Используем ID отклика, если он есть, иначе используем временное значение
    const appId = applicationId.value || `temp_${Date.now()}`;
    localStorage.setItem(`job_application_${jobId}`, appId);
    console.log(
      `[Debug] Saved application ID ${appId} to localStorage for job ${jobId}`
    );

    // Обновляем applicationId если он не был установлен
    if (!applicationId.value) {
      applicationId.value = appId;
    }

    // Обновляем карту активных откликов в хранилище
    applicationsStore.updateActiveApplicationsMap();
  }

  // Получаем ID отклика
  if (!applicationId.value) {
    applicationId.value = applicationsStore.getApplicationId(jobId);
  }

  console.log(
    `Статус отклика для вакансии ${jobId}: ${
      hasApplied.value ? "Откликнулся" : "Не откликнулся"
    }`
  );
  if (applicationId.value) {
    console.log(`ID отклика: ${applicationId.value}`);
  }
};

const loadApplications = async () => {
  try {
    if (!job.value || !job.value.id) return;

    const jobId = job.value.id;
    const jobApplications = await applicationsStore.getApplicationsByJob(jobId);
    applications.value = jobApplications;

    // После загрузки проверяем статус отклика
    checkAppliedStatus();
  } catch (error) {
    // Тихая обработка ошибки
    console.error("Ошибка при загрузке откликов:", error);

    // Используем локальные данные при ошибке API
    checkAppliedStatus();
  }
};

const startChat = async () => {
  if (!authStore.isAuthenticated) {
    showNotification(
      "Пожалуйста, войдите в систему, чтобы начать чат с работодателем",
      "error"
    );
    router.push({ name: "Login", query: { redirect: route.fullPath } });
    return;
  }

  try {
    loading.value = true;
    const jobId = route.params.id;
    const employerId = job.value.employer?.id || job.value.user?.id || null;

    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Начинаем для вакансии ${jobId}, работодатель ${employerId}`
    );

    // Сначала проверяем наличие ID диалога в localStorage
    const savedConversationId = safeLocalStorage.getItem(
      `job_conversation_${jobId}`
    );

    if (savedConversationId) {
      console.log(
        `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Найден сохраненный ID диалога ${savedConversationId} в localStorage`
      );
      // Попытка обновить список диалогов перед переходом
      try {
        await chatStore.fetchConversations(true);
        console.log(
          "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Список диалогов обновлен перед переходом"
        );
      } catch (fetchError) {
        console.warn(
          "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Не удалось обновить список диалогов перед переходом:",
          fetchError
        );
      }
      // Переходим к сохраненному диалогу, предварительно санитизировав ID
      const safeId = sanitizeConversationId(savedConversationId);
      console.log(
        `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Переход к сохраненному диалогу ${safeId}`
      );
      router.push(`/messages/${safeId}`);
      return;
    }

    // Создаем новый диалог через ApplicationStore (предпочтительно)
    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Создаем диалог через ApplicationStore для вакансии ${jobId}`
    );

    let conversationId = null;

    // Первая попытка - через ApplicationStore
    try {
      const result = await applicationsStore.startChatWithEmployer(
        jobId,
        employerId,
        job.value.title
      );
      console.log(
        "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Результат от ApplicationStore:",
        result
      );

      if (result && (result.conversation_id || result.id)) {
        conversationId = String(result.conversation_id || result.id);
        console.log(
          `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Успешно создан диалог через ApplicationStore, ID=${conversationId}`
        );
      } else {
        console.warn(
          "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: ApplicationStore вернул неполные данные"
        );
      }
    } catch (appStoreError) {
      console.error(
        "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Ошибка ApplicationStore:",
        appStoreError
      );
    }

    // Если не получилось через ApplicationStore, попробуем ChatStore
    if (!conversationId) {
      console.log("СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Пробуем через ChatStore");
      try {
        const conversation = await chatStore.startChatWithEmployer(
          jobId,
          employerId,
          job.value.title
        );
        conversationId = conversation?.id ? String(conversation.id) : null;
        console.log(
          `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Результат от ChatStore, ID=${
            conversationId || "не получен"
          }`
        );
      } catch (chatStoreError) {
        console.error(
          "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Ошибка ChatStore:",
          chatStoreError
        );
      }
    }

    // Если ID диалога всё еще не получен, пробуем запасные варианты
    if (!conversationId) {
      console.warn(
        "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: conversation ID отсутствует, используем fallback"
      );

      // Пробуем найти уже существующий диалог для этой вакансии
      try {
        await chatStore.fetchConversations(true);
        const conversations = chatStore.getConversations;

        // Улучшенный поиск существующего диалога
        let existingConv = conversations.find(
          (conv) =>
            conv.job_id === parseInt(jobId) ||
            (conv.job && conv.job.id === parseInt(jobId))
        );

        // Если не найден напрямую, ищем диалог с составным ID в формате user_id_job_id
        if (!existingConv) {
          existingConv = conversations.find((conv) => {
            const id = String(conv.id);
            if (id.includes("_")) {
              const parts = id.split("_");
              return parts.length > 1 && parts[1] === String(jobId);
            }
            return false;
          });
        }

        if (existingConv) {
          conversationId = String(existingConv.id);
          console.log(
            `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Найден существующий диалог ${conversationId} для вакансии ${jobId}`
          );
        }
      } catch (findError) {
        console.error(
          "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Ошибка при поиске существующего диалога:",
          findError
        );
      }

      // Если всё еще нет ID, используем lastCreatedChatId
      if (!conversationId) {
        const lastChatId = safeLocalStorage.getItem("lastCreatedChatId");
        if (lastChatId) {
          console.log(
            `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Используем резервный ID из localStorage: ${lastChatId}`
          );
          // Санитизируем ID перед использованием
          const safeId = sanitizeConversationId(lastChatId);
          router.push(`/messages/${safeId}`);
          return;
        }

        // Если совсем ничего не нашли, переходим в общий список
        console.log(
          "СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Резервный ID не найден, переходим к общему списку"
        );
        router.push("/messages");
        return;
      }
    }

    // Санитизируем ID перед сохранением и использованием
    const safeConversationId = sanitizeConversationId(conversationId);

    // Сохраняем ID диалога для вакансии
    safeLocalStorage.setItem(`job_conversation_${jobId}`, safeConversationId);
    // Сохраняем последний созданный ID диалога
    safeLocalStorage.setItem("lastCreatedChatId", safeConversationId);
    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Диалог создан/найден, ID=${safeConversationId}`
    );

    // Переходим на страницу чата с указанным диалогом
    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Переход к /messages/${safeConversationId}`
    );
    router.push(`/messages/${safeConversationId}`);
  } catch (error) {
    console.error("СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Критическая ошибка:", error);

    // Пробуем использовать резервный ID из localStorage
    const lastChatId = safeLocalStorage.getItem("lastCreatedChatId");
    if (lastChatId) {
      console.log(
        `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Используем резервный ID из localStorage при ошибке: ${lastChatId}`
      );
      router.push(`/messages/${lastChatId}`);
      return;
    }

    // При любой ошибке показываем уведомление и переходим в чат
    showNotification(
      "Произошла ошибка при создании диалога. Вы будете перенаправлены в общий список диалогов.",
      "error"
    );
    router.push("/messages");
  } finally {
    loading.value = false;
  }
};

const loadJob = async () => {
  try {
    loading.value = true;
    error.value = null;

    const jobId = route.params.id;

    console.log(`JobDetail: Загрузка вакансии с ID ${jobId}`);

    // Получаем данные о вакансии напрямую из бэкенда
    const loadedJob = await jobStore.getJob(jobId);

    if (loadedJob) {
      job.value = loadedJob;

      if (authStore.isAuthenticated) {
        // Загружаем отклики пользователя для обновления статуса
        await applicationsStore.fetchMyApplications();

        // Явно проверяем наличие отклика для текущей вакансии
        await loadApplications();

        // Вторая проверка статуса после загрузки
        checkAppliedStatus();

        await loadResumes();
        await checkSavedStatus();
      }
    } else {
      error.value = "Вакансия не найдена";
    }
  } catch (err) {
    console.error("Ошибка в loadJob:", err);
    // Показываем ошибку напрямую без создания тестовых данных
    error.value =
      err.response?.data?.detail ||
      err.message ||
      "Не удалось загрузить вакансию. Проверьте соединение с сервером.";
  } finally {
    loading.value = false;
  }
};

const loadResumes = async () => {
  try {
    // Сначала пытаемся загрузить из хранилища
    try {
      const storeResumes = await resumesStore.fetchResumes();
      if (storeResumes && storeResumes.length > 0) {
        resumes.value = storeResumes;
        return;
      }
    } catch (storeError) {
      // Запасной вариант - API-запрос
    }

    // Запасной вариант - прямой запрос к API
    const response = await axios.get("/api/resumes/");
    const resumesData = response.data.results || response.data;

    if (Array.isArray(resumesData)) {
      resumes.value = resumesData;
    } else {
      resumes.value = [];
    }
  } catch (error) {
    resumes.value = [];
  }
};

const shareJob = () => {
  // Всегда используем копирование в буфер обмена независимо от устройства
  fallbackCopyToClipboard();
};

// Функция-помощник для резервного копирования ссылки в буфер обмена
const fallbackCopyToClipboard = () => {
  const url = window.location.href;
  // Пробуем использовать современный API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showNotification("Ссылка скопирована в буфер обмена", "success");
      })
      .catch((error) => {
        console.error("Ошибка при копировании в буфер обмена:", error);
        // Если не удалось, используем запасной вариант
        fallbackCopyWithExecCommand(url);
      });
  } else {
    // Для старых браузеров или небезопасного контекста используем запасной вариант
    fallbackCopyWithExecCommand(url);
  }
};

// Запасной вариант копирования для старых браузеров
const fallbackCopyWithExecCommand = (text) => {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Делаем элемент невидимым
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      showNotification("Ссылка скопирована в буфер обмена", "success");
    } else {
      showNotification("Не удалось скопировать ссылку", "error");
    }
  } catch (err) {
    console.error("Ошибка при копировании в буфер обмена:", err);
    showNotification(
      "Не удалось скопировать ссылку. Проверьте разрешения браузера.",
      "error"
    );
  }
};

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

const openApplyModal = async () => {
  // Сначала показываем модальное окно
  showApplyModal.value = true;

  // Проверяем аутентификацию параллельно
  if (!authStore.isAuthenticated) {
    showNotification("Для отклика необходимо войти в систему.", "error");
    router.push({ name: "Login", query: { redirect: route.fullPath } });
    return;
  }

  // Загружаем резюме в фоновом режиме, если нужно
  if (resumes.value.length === 0) {
    try {
      await loadResumes();
    } catch (error) {
      // Не закрываем модальное окно, позволяем пользователям создать резюме, если нужно
    }
  }
};

// Функция для полной перезагрузки данных о вакансии и откликах
const reloadJobData = async () => {
  try {
    console.log("Полная перезагрузка данных о вакансии и откликах");
    // Перезагружаем данные о вакансии
    await loadJob();
  } catch (err) {
    console.error("Ошибка при перезагрузке данных:", err);
  }
};

// Отмена отклика
const cancelApplication = async () => {
  try {
    if (!job.value) return;

    loading.value = true; // Добавляем индикатор загрузки

    // Получаем ID вакансии и ID заявки
    const jobId = job.value.id;
    const appId = applicationId.value;

    console.log(
      `Отмена отклика: JobID=${jobId}, ApplicationID=${appId || "не определен"}`
    );

    // Проверяем, является ли это временным ID (начинается с temp_)
    const isTempId = appId && String(appId).startsWith("temp_");

    if (isTempId) {
      console.log(
        `Обнаружен временный ID отклика (${appId}), выполняем только локальную очистку`
      );
    }

    if (!appId) {
      console.warn("ID отклика не определен, выполняем локальную очистку");
      // Даже если нет ID отклика, очищаем localStorage
      if (jobId) {
        localStorage.removeItem(`job_application_${jobId}`);
        // Обновляем карту активных откликов в хранилище
        applicationsStore.updateActiveApplicationsMap();

        // Обновляем статус на странице
        hasApplied.value = false;
        applicationId.value = null;

        // Явно записываем в localStorage флаг, что отклик был отменен
        localStorage.setItem(`job_application_${jobId}_canceled`, "true");

        // Закрываем модальное окно
        showCancelJobModal.value = false;

        showNotification("Отклик локально отменен", "success");

        // Удаляем параметр apply=true из URL, если он присутствует
        if (route.query.apply === "true") {
          router.replace({ query: { ...route.query, apply: undefined } });
        }

        return;
      }

      showNotification("Не удалось определить ID отклика для отмены", "error");
      loading.value = false;
      return;
    }

    // Если ID вакансии есть, сохраняем локальную копию applicationId
    // для очистки localStorage в случае ошибки API
    if (jobId) {
      console.log("Сохраняем копию applicationId для аварийной очистки");
      window.tempApplicationId = appId;
      window.tempJobId = jobId;
    }

    try {
      // Отменяем отклик через хранилище - теперь функция всегда возвращает true,
      // даже если API запрос не удался, но локальное состояние обновлено
      const result = await applicationsStore.withdrawApplication(appId);

      // Закрываем модальное окно
      showCancelJobModal.value = false;

      // Обновляем статус на странице
      hasApplied.value = false;
      applicationId.value = null;

      // Обновляем localStorage и состояние приложения, чтобы отразить отмену отклика
      if (jobId) {
        localStorage.removeItem(`job_application_${jobId}`);
        // Явно записываем в localStorage флаг, что отклик был отменен
        localStorage.setItem(`job_application_${jobId}_canceled`, "true");
        // Обновляем карту активных откликов в хранилище
        applicationsStore.updateActiveApplicationsMap();
      }

      // Удаляем параметр apply=true из URL, если он присутствует
      if (route.query.apply === "true") {
        router.replace({ query: { ...route.query, apply: undefined } });
      }

      // Показываем сообщение
      if (applicationsStore.error && !isTempId) {
        // Если есть ошибка, показываем её, но продолжаем как при успешной отмене
        showNotification(applicationsStore.error, "info");
      } else {
        // Для временных ID или если ошибок нет, показываем сообщение об успехе
        showNotification("Отклик успешно отменен", "success");
      }
    } catch (apiError) {
      console.error("Ошибка API при отмене отклика:", apiError);

      // Проверяем, была ли ошибка 404 (отклик не найден)
      if (apiError.response && apiError.response.status === 404) {
        console.log("Отклик не найден на сервере, выполняем локальную очистку");

        // Обновляем UI, как если бы отклик был успешно отменен
        hasApplied.value = false;
        applicationId.value = null;

        // Закрываем модальное окно
        showCancelJobModal.value = false;

        // Очищаем localStorage
        if (jobId) {
          localStorage.removeItem(`job_application_${jobId}`);
          // Явно записываем в localStorage флаг, что отклик был отменен
          localStorage.setItem(`job_application_${jobId}_canceled`, "true");
          applicationsStore.updateActiveApplicationsMap();
        }

        // Удаляем параметр apply=true из URL, если он присутствует
        if (route.query.apply === "true") {
          router.replace({ query: { ...route.query, apply: undefined } });
        }

        if (isTempId) {
          showNotification("Отклик успешно отменен", "success");
        } else {
          showNotification(
            "Отклик уже был отменен или не найден. Локальное состояние обновлено.",
            "info"
          );
        }
      } else {
        // Для других ошибок показываем сообщение, но всё равно выполняем локальную очистку
        hasApplied.value = false;
        applicationId.value = null;

        // Закрываем модальное окно
        showCancelJobModal.value = false;

        // Очищаем localStorage
        if (jobId) {
          localStorage.removeItem(`job_application_${jobId}`);
          // Явно записываем в localStorage флаг, что отклик был отменен
          localStorage.setItem(`job_application_${jobId}_canceled`, "true");
          applicationsStore.updateActiveApplicationsMap();
        }

        // Удаляем параметр apply=true из URL, если он присутствует
        if (route.query.apply === "true") {
          router.replace({ query: { ...route.query, apply: undefined } });
        }

        if (applicationsStore.error) {
          showNotification(
            `${applicationsStore.error}. Локальное состояние обновлено.`,
            "info"
          );
        } else {
          showNotification(
            "Не удалось отменить отклик на сервере. Локальное состояние обновлено.",
            "info"
          );
        }
      }
    }
  } catch (error) {
    console.error("Ошибка при отмене отклика:", error);

    // Аварийная очистка localStorage если есть временные данные
    if (window.tempApplicationId && window.tempJobId) {
      console.log("Выполняем аварийную очистку localStorage");
      localStorage.removeItem(`job_application_${window.tempJobId}`);
      // Явно записываем в localStorage флаг, что отклик был отменен
      localStorage.setItem(
        `job_application_${window.tempJobId}_canceled`,
        "true"
      );

      // Обновляем UI
      hasApplied.value = false;
      applicationId.value = null;

      showNotification(
        "Отклик локально отменен, но возникла ошибка на сервере.",
        "info"
      );

      // Очищаем временные данные
      delete window.tempApplicationId;
      delete window.tempJobId;
    } else {
      // Если нет временных данных, показываем стандартное сообщение об ошибке
      if (applicationsStore.error) {
        showNotification(`Ошибка: ${applicationsStore.error}`, "error");
      } else {
        showNotification(
          "Не удалось отменить отклик. Пожалуйста, попробуйте позже.",
          "error"
        );
      }
    }
  } finally {
    loading.value = false;
  }
};

const handleApplicationSuccess = async (result) => {
  console.log("Отклик успешно отправлен, устанавливаем hasApplied = true");
  hasApplied.value = true;
  showApplyModal.value = false;

  // Сохраняем ID отклика для потенциальной отмены
  if (result && result.applicationId) {
    console.log("Сохраняем ID отклика:", result.applicationId);
    applicationId.value = result.applicationId;

    // Явно сохраняем в localStorage для обеспечения постоянства статуса
    if (job.value && job.value.id) {
      localStorage.setItem(
        `job_application_${job.value.id}`,
        result.applicationId
      );
      console.log(
        `Сохранено в localStorage: job_application_${job.value.id}=${result.applicationId}`
      );

      // Обновляем карту активных откликов
      applicationsStore.updateActiveApplicationsMap();
    }
  } else {
    console.log("ID отклика не получен в результате");

    // Даже если ID не получен, сохраняем временный ID для поддержания статуса
    if (job.value && job.value.id) {
      const tempId = `temp_${Date.now()}`;
      localStorage.setItem(`job_application_${job.value.id}`, tempId);
      applicationId.value = tempId;
      console.log(
        `Сохранен временный ID в localStorage: job_application_${job.value.id}=${tempId}`
      );

      // Обновляем карту активных откликов
      applicationsStore.updateActiveApplicationsMap();
    }
  }

  // Проверяем обновленный статус отклика
  checkAppliedStatus();

  // Если сервер вернул ID диалога, переходим сразу к нему
  if (result.conversation_id) {
    // Санитизируем ID для корректной работы с WebSocket
    const convId = sanitizeConversationId(String(result.conversation_id));
    console.log(`handleApplicationSuccess: Сервер вернул ID диалога ${convId}`);

    // Сохраняем связь диалога с вакансией и последний созданный диалог
    safeLocalStorage.setItem(`job_conversation_${job.value.id}`, convId);
    safeLocalStorage.setItem("lastCreatedChatId", convId);

    console.log(
      `handleApplicationSuccess: Подготовка к переходу в чат ${convId}`
    );

    // Убедимся, что диалог будет доступен при загрузке чата
    try {
      await chatStore.fetchConversations(true);
      console.log(
        `handleApplicationSuccess: обновлены диалоги перед переходом`
      );

      // Проверим существование диалога в списке
      const conversations = chatStore.getConversations;

      // Улучшенная проверка существования диалога, учитывая формат ID "user_id_job_id"
      let conversationExists = conversations.some(
        (conv) => String(conv.id) === convId
      );

      // Если прямого соответствия не найдено, ищем по job_id, который может быть частью сложного ID
      if (!conversationExists && convId.includes("_")) {
        const parts = convId.split("_");
        if (parts.length > 1) {
          const jobIdPart = parts[1]; // Извлекаем job_id из формата "user_id_job_id"

          conversationExists = conversations.some(
            (conv) =>
              conv.job_id === Number(jobIdPart) ||
              (conv.job && conv.job.id === Number(jobIdPart))
          );
        }
      }

      if (!conversationExists) {
        console.log(
          `handleApplicationSuccess: диалог ${convId} не найден в списке бесед, но продолжаем навигацию`
        );
      } else {
        console.log(
          `handleApplicationSuccess: диалог ${convId} найден в списке бесед`
        );
      }
    } catch (error) {
      console.warn(
        `handleApplicationSuccess: не удалось обновить диалоги:`,
        error
      );
    }

    // Навигация в чат
    console.log(`handleApplicationSuccess: переход к /messages/${convId}`);
    router.push(`/messages/${convId}`);
  } else {
    console.log(
      `handleApplicationSuccess: Сервер не вернул ID диалога, создаем стандартным путем`
    );
    // Иначе продолжаем стандартный процесс создания чата
    await startChat();
  }
};

const checkSavedStatus = async () => {
  if (!authStore.isAuthenticated || !job.value) return;

  try {
    const savedStatus = savedJobsStore.isSaved(job.value.id);
    console.log(
      `Статус сохранения вакансии ${job.value.id} из хранилища:`,
      savedStatus
    );
    isSaved.value = savedStatus;
  } catch (error) {
    console.error("Ошибка при проверке статуса сохранения:", error);
    isSaved.value = false;
  }
};

onMounted(async () => {
  await loadJob();

  // Проверяем, нужно ли показать модальное окно отклика автоматически
  if (route.query.apply === "true") {
    // Если URL содержит параметр apply=true, значит пользователь только что откликнулся
    // Установим hasApplied = true независимо от состояния хранилища
    hasApplied.value = true;

    // Принудительно обновляем localStorage и applicationId если его нет
    if (job.value && job.value.id) {
      if (!applicationId.value) {
        const tempId = `temp_${Date.now()}`;
        localStorage.setItem(`job_application_${job.value.id}`, tempId);
        applicationId.value = tempId;
        console.log(`Установлен временный ID отклика при загрузке: ${tempId}`);
      }
      // Обновляем карту активных откликов
      applicationsStore.updateActiveApplicationsMap();
    }

    // Всегда отображаем модальное окно, когда URL содержит параметр apply
    showApplyModal.value = true;

    if (!isAuthenticated.value) {
      // Сначала показываем модальное окно, затем перенаправляем на логин
      setTimeout(() => {
        showNotification("Для отклика необходимо войти в систему.", "error");
        router.push({
          name: "Login",
          query: {
            redirect: route.fullPath,
          },
        });
      }, 500);
    } else {
      // Предварительно загружаем резюме в фоновом режиме
      loadResumes();
    }
  }
});

watch(
  () => savedJobsStore.savedJobs,
  () => {
    if (job.value) {
      const saved = savedJobsStore.isSaved(job.value.id);
      if (isSaved.value !== saved) {
        isSaved.value = saved;
      }
    }
  },
  { deep: true }
);

// Добавляем watcher для перезагрузки при изменении параметра маршрута
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId !== oldId) {
      await loadJob();
    }
  }
);
</script>
