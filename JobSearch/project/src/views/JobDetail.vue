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
            @saved="handleJobSaved"
            @unsaved="handleJobUnsaved"
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
              {{ getExperienceText(job.experience_level) }}
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
            v-if="isAuthenticated && isJobseeker"
            class="bg-gray-700 px-4 py-5 sm:px-6"
          >
            <div class="flex justify-end items-center">
              <div v-if="hasApplied" class="flex items-center text-green-500">
                <span class="material-icons mr-1">check_circle</span>
                <span>Вы уже откликнулись</span>
              </div>
            </div>
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
        <div class="flex flex-wrap gap-2">
          <button
            v-if="isAuthenticated && isJobseeker && !hasApplied"
            @click="openApplyModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <span class="material-icons mr-1">send</span>
            Откликнуться
          </button>
          <button
            v-if="isAuthenticated && hasApplied"
            @click="startChat"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span class="material-icons mr-1">chat</span>
            Написать работодателю
          </button>
          <button
            v-if="isAuthenticated && hasApplied"
            @click="showCancelJobModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <span class="material-icons mr-1">cancel</span>
            Отменить отклик
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
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showCancelJobModal = false"
            class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Назад
          </button>
          <button
            @click="cancelApplication"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Подтвердить отмену
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useJobStore } from "@/stores/job";
import { useApplicationsStore } from "@/stores/applications";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";
import { useChatStore } from "@/stores/chat";
import { useRoute, useRouter } from "vue-router";
import FavoriteButton from "@/components/jobs/FavoriteButton.vue";
import ApplyJobModal from "@/components/jobs/ApplyJobModal.vue";
import axios from "axios";

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
const isJobseeker = computed(
  () => isAuthenticated.value && authStore.user?.profile?.role === "jobseeker"
);
const isEmployer = computed(
  () => isAuthenticated.value && authStore.user?.profile?.role === "employer"
);

const isSaved = ref(false);

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

const handleJobUnsaved = (jobId) => {
  // Не нужно обновлять локальное состояние, FavoriteButton делает это сам
};

const handleApplicationSuccess = (result) => {
  hasApplied.value = true;
  showApplyModal.value = false;

  // Store the application ID for potential cancellation
  if (result && result.applicationId) {
    applicationId.value = result.applicationId;
  }

  // Если чат был начат, перенаправляем в чат
  if (result && result.withChat) {
    if (result.conversation_id) {
      router.push(`/messages/${result.conversation_id}`);
    }
  }
};

const startChat = async () => {
  console.log("СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Начинаем...");

  // Проверка авторизации
  if (!authStore.isAuthenticated) {
    console.log(
      "Пользователь не авторизован, перенаправляем на страницу входа"
    );
    router.push("/login");
    return;
  }

  try {
    loading.value = true;

    // Проверяем наличие данных о вакансии
    if (!job.value) {
      console.error("Отсутствуют данные о вакансии");
      throw new Error("Информация о вакансии недоступна");
    }

    // Определяем параметры
    const jobId = job.value.id;
    let employerId =
      job.value.employer_id || job.value.user?.id || job.value.user_id || 1;

    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: jobId=${jobId}, employerId=${employerId}`
    );

    // Обновляем список существующих диалогов
    await chatStore.fetchConversations(true);

    // Проверяем, существует ли уже диалог для этой вакансии
    const existingConversation = chatStore.conversations.find(
      (c) => String(c.job_id) === String(jobId)
    );

    if (existingConversation) {
      console.log(
        `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Найден существующий диалог ${existingConversation.id}`
      );

      // Сохраняем ID и переходим к нему
      localStorage.setItem("lastCreatedChatId", existingConversation.id);
      router.push(`/messages/${existingConversation.id}`);
      return;
    }

    // Создаем новый диалог
    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Создаем новый диалог для вакансии ${jobId}`
    );
    const conversation = await chatStore.startChatWithEmployer(
      jobId,
      employerId
    );

    if (!conversation) {
      throw new Error("Не удалось создать диалог");
    }

    const conversationId = conversation.id;

    if (!conversationId) {
      throw new Error("Не удалось получить ID созданного диалога");
    }

    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Диалог создан, ID=${conversationId}`
    );

    // Сохраняем ID диалога отдельно для надежности
    localStorage.setItem("lastCreatedChatId", conversationId);

    // Обновляем список диалогов в хранилище
    await chatStore.fetchConversations(true);

    // Переходим на страницу чата с указанным диалогом
    console.log(
      `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Переходим в чат с ID=${conversationId}`
    );
    setTimeout(() => {
      router.push(`/messages/${conversationId}`);
    }, 300);
  } catch (error) {
    console.error("СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Ошибка:", error);

    // Пробуем использовать резервный ID из localStorage
    const lastChatId = localStorage.getItem("lastCreatedChatId");
    if (lastChatId) {
      console.log(
        `СОЗДАНИЕ ЧАТА ИЗ JOBDETAIL: Используем резервный ID из localStorage: ${lastChatId}`
      );
      router.push(`/messages/${lastChatId}`);
      return;
    }

    // При любой ошибке показываем уведомление и переходим в чат
    alert(
      "Произошла ошибка при создании диалога. Вы будете перенаправлены в общий список диалогов."
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
        await loadApplications();
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

const loadApplications = async () => {
  try {
    const jobApplications = await applicationsStore.getApplicationsByJob(
      job.value.id
    );
    applications.value = jobApplications;

    const userApplications = applications.value.filter(
      (app) => app.user_id === authStore.user.id
    );
    hasApplied.value = userApplications.length > 0;
  } catch (error) {
    // Тихая обработка ошибки
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
  if (navigator.share) {
    navigator
      .share({
        title: job.value.title,
        text: `Вакансия: ${job.value.title} в компании ${job.value.company_name}`,
        url: window.location.href,
      })
      .catch((error) => {});
  } else {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        const notification = document.createElement("div");
        notification.className =
          "fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-md shadow-lg z-50";
        notification.innerHTML = `
          <div class="flex items-center">
            <span class="material-icons mr-2">content_copy</span>
            <span>Ссылка скопирована в буфер обмена</span>
          </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 3000);
      })
      .catch((error) => {});
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
    alert("Для отклика необходимо войти в систему.");
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

// Отмена отклика непосредственно после его создания
const cancelApplication = async () => {
  try {
    if (!job.value) return;

    // Находим ID заявки, если не сохранен непосредственно
    const appId = applicationId.value;

    if (appId) {
      // Отменяем заявку через store
      await applicationsStore.updateApplicationStatus(appId, "cancelled");
    } else {
      // В режиме разработки можем просто использовать локальное хранилище
      const jobId = job.value.id;
      const storedApps = JSON.parse(
        localStorage.getItem("mockJobApplications") || "[]"
      );
      const appIndex = storedApps.findIndex(
        (a) => String(a.job) === String(jobId)
      );

      if (appIndex !== -1) {
        storedApps[appIndex].status = "cancelled";
        localStorage.setItem("mockJobApplications", JSON.stringify(storedApps));
      }
    }

    // Закрываем модальное окно
    showCancelJobModal.value = false;

    // Показываем уведомление
    alert("Отклик успешно отменен");

    // Обновляем статус на странице
    hasApplied.value = false;
  } catch (err) {
    console.error("Ошибка при отмене отклика:", err);
    alert("Произошла ошибка при отмене отклика");
  }
};

onMounted(async () => {
  await loadJob();

  // Проверяем, нужно ли показать модальное окно отклика автоматически
  if (route.query.apply === "true") {
    // Всегда отображаем модальное окно, когда URL содержит параметр apply
    showApplyModal.value = true;

    if (!isAuthenticated.value) {
      // Сначала показываем модальное окно, затем перенаправляем на логин
      setTimeout(() => {
        alert("Для отклика необходимо войти в систему.");
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
</script>
