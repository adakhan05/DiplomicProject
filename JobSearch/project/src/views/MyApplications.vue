<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Заголовок -->
    <div class="bg-gray-800 shadow sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-xl font-semibold text-white">
          Мои отклики на вакансии
        </h2>
        <p class="mt-1 text-sm text-gray-400">
          Здесь вы можете отслеживать статус своих откликов на вакансии
        </p>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="bg-gray-800 shadow sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <!-- Поиск -->
          <div>
            <label for="search" class="block text-sm font-medium text-gray-300"
              >Поиск по вакансии или компании</label
            >
            <input
              type="text"
              id="search"
              v-model="filters.search"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Введите название вакансии или компании"
            />
          </div>

          <!-- Фильтр по статусу -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-300"
              >Статус отклика</label
            >
            <select
              id="status"
              v-model="filters.status"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Все статусы</option>
              <option value="pending">В ожидании</option>
              <option value="accepted">Принят</option>
              <option value="rejected">Отклонен</option>
              <option value="interview">Назначено интервью</option>
            </select>
          </div>

          <!-- Сортировка -->
          <div>
            <label for="sort" class="block text-sm font-medium text-gray-300"
              >Сортировка</label
            >
            <select
              id="sort"
              v-model="filters.sort"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="created_at_desc">Сначала новые</option>
              <option value="created_at_asc">Сначала старые</option>
              <option value="status">По статусу</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Список откликов -->
    <div class="bg-gray-800 shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div v-if="loading" class="text-center py-12">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"
          ></div>
          <p class="mt-2 text-sm text-gray-400">Загрузка откликов...</p>
        </div>

        <div
          v-else-if="filteredApplications.length === 0"
          class="text-center py-12"
        >
          <div class="text-center">
            <span class="material-icons text-4xl text-gray-500">
              work_off
            </span>
            <p class="mt-2 text-lg text-gray-300">Нет откликов</p>
            <p class="mt-1 text-sm text-gray-400">
              Вы еще не откликнулись ни на одну вакансию
            </p>
            <router-link
              to="/jobs"
              class="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Найти вакансии
            </router-link>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="application in filteredApplications"
            :key="application.id"
            class="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
          >
            <div class="flex flex-col md:flex-row justify-between">
              <div class="flex-grow">
                <!-- Заголовок вакансии и компания -->
                <div class="flex flex-col md:flex-row md:items-center">
                  <h3
                    class="text-lg font-medium text-white hover:text-green-500 cursor-pointer"
                    @click="viewJob(application.job)"
                  >
                    {{ application.job_title }}
                  </h3>
                  <span class="hidden md:inline mx-2 text-gray-400">•</span>
                  <p class="text-sm text-gray-300">
                    {{ application.company_name }}
                  </p>
                </div>

                <!-- Статус -->
                <div class="mt-2 flex items-center">
                  <span class="text-sm text-gray-400 mr-2">Статус:</span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(application.status)"
                  >
                    {{ getStatusText(application.status) }}
                  </span>
                </div>

                <!-- Дата отклика -->
                <p class="mt-1 text-sm text-gray-400">
                  Дата отклика: {{ formatDate(application.created_at) }}
                </p>

                <!-- Сопроводительное письмо (с возможностью раскрытия) -->
                <div class="mt-3">
                  <button
                    @click="toggleCoverLetter(application.id)"
                    class="text-sm text-green-500 hover:text-green-400 flex items-center"
                  >
                    <span class="material-icons text-sm mr-1">
                      {{
                        expandedApplications.includes(application.id)
                          ? "expand_less"
                          : "expand_more"
                      }}
                    </span>
                    {{
                      expandedApplications.includes(application.id)
                        ? "Скрыть сопроводительное письмо"
                        : "Показать сопроводительное письмо"
                    }}
                  </button>
                  <div
                    v-if="expandedApplications.includes(application.id)"
                    class="mt-2 text-sm text-gray-300 bg-gray-750 p-3 rounded"
                  >
                    {{ application.cover_letter }}
                  </div>
                </div>
              </div>

              <!-- Действия -->
              <div class="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                <div class="flex space-x-2">
                  <button
                    @click="viewJob(application.job)"
                    class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <span class="material-icons text-sm mr-1">visibility</span>
                    Вакансия
                  </button>
                  <button
                    v-if="application.status !== 'rejected'"
                    @click="startChat(application)"
                    class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span class="material-icons text-sm mr-1">chat</span>
                    Чат
                  </button>
                  <button
                    @click="withdrawApplication(application)"
                    class="inline-flex items-center px-3 py-1 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <span class="material-icons text-sm mr-1">delete</span>
                    Отозвать
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения отзыва заявки -->
    <div v-if="showConfirmDialog" class="fixed inset-0 z-50 overflow-y-auto">
      <div
        class="flex items-center justify-center min-h-screen px-4 text-center"
      >
        <div
          class="fixed inset-0 transition-opacity"
          @click="showConfirmDialog = false"
        >
          <div class="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <div
          class="bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full border border-gray-700"
        >
          <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-white">
                  Подтвердите действие
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-300">
                    Вы уверены, что хотите отозвать этот отклик? Это действие
                    нельзя отменить.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              @click="confirmWithdraw"
            >
              Отозвать
            </button>
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="showConfirmDialog = false"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useApplicationsStore } from "@/stores/applications";
import { useChatStore } from "@/stores/chat";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

const router = useRouter();
const applicationsStore = useApplicationsStore();
const chatStore = useChatStore();

// Состояние
const loading = ref(false);
const error = ref(null);
const expandedApplications = ref([]);
const showConfirmDialog = ref(false);
const applicationToWithdraw = ref(null);

// Фильтры
const filters = ref({
  search: "",
  status: "",
  sort: "created_at_desc",
});

// Получаем отклики
const applications = computed(() => applicationsStore.getMyApplications);

// Отфильтрованные отклики
const filteredApplications = computed(() => {
  let result = [...applications.value];

  // Фильтр по поиску
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    result = result.filter(
      (app) =>
        app.job_title?.toLowerCase().includes(searchLower) ||
        app.company_name?.toLowerCase().includes(searchLower)
    );
  }

  // Фильтр по статусу
  if (filters.value.status) {
    result = result.filter((app) => app.status === filters.value.status);
  }

  // Сортировка
  if (filters.value.sort === "created_at_desc") {
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (filters.value.sort === "created_at_asc") {
    result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (filters.value.sort === "status") {
    const statusOrder = {
      interview: 1,
      accepted: 2,
      pending: 3,
      rejected: 4,
    };
    result.sort(
      (a, b) =>
        statusOrder[a.status || "pending"] - statusOrder[b.status || "pending"]
    );
  }

  return result;
});

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return "";

  try {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: ru,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

// Получение текста статуса
const getStatusText = (status) => {
  const statusMap = {
    pending: "В ожидании",
    accepted: "Принят",
    rejected: "Отклонен",
    interview: "Интервью",
  };
  return statusMap[status] || "Неизвестно";
};

// Получение класса стиля для статуса
const getStatusClass = (status) => {
  const statusClass = {
    pending: "bg-yellow-900 text-yellow-300",
    accepted: "bg-green-900 text-green-300",
    rejected: "bg-red-900 text-red-300",
    interview: "bg-blue-900 text-blue-300",
  };
  return statusClass[status] || "bg-gray-900 text-gray-300";
};

// Переключение отображения сопроводительного письма
const toggleCoverLetter = (applicationId) => {
  const index = expandedApplications.value.indexOf(applicationId);
  if (index === -1) {
    expandedApplications.value.push(applicationId);
  } else {
    expandedApplications.value.splice(index, 1);
  }
};

// Переход к просмотру вакансии
const viewJob = (jobId) => {
  router.push({ name: "job-detail", params: { id: jobId } });
};

// Запуск чата с работодателем
const startChat = async (application) => {
  try {
    // Найти или создать диалог с работодателем
    const conversation = await chatStore.findOrCreateConversation({
      job_id: application.job,
      employer_id: application.employer_id, // Предполагаем, что это поле есть
    });

    // Перейти к чату
    if (conversation && conversation.id) {
      router.push({
        name: "chat-conversation",
        params: { id: conversation.id },
      });
    }
  } catch (error) {
    console.error("Ошибка при создании чата:", error);
  }
};

// Показать диалог подтверждения отзыва заявки
const withdrawApplication = (application) => {
  applicationToWithdraw.value = application;
  showConfirmDialog.value = true;
};

// Подтверждение отзыва заявки
const confirmWithdraw = async () => {
  if (!applicationToWithdraw.value) {
    showConfirmDialog.value = false;
    return;
  }

  try {
    await applicationsStore.withdrawApplication(applicationToWithdraw.value.id);
    showConfirmDialog.value = false;
    applicationToWithdraw.value = null;
    // Перезагрузка списка заявок
    loadApplications();
  } catch (error) {
    console.error("Ошибка при отзыве заявки:", error);
  }
};

// Загрузка списка заявок
const loadApplications = async () => {
  loading.value = true;
  error.value = null;

  try {
    await applicationsStore.fetchMyApplications();
  } catch (err) {
    console.error("Ошибка при загрузке заявок:", err);
    error.value = "Не удалось загрузить список заявок";
  } finally {
    loading.value = false;
  }
};

// Инициализация компонента
onMounted(() => {
  loadApplications();
});
</script>

<style scoped></style>
