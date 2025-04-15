<template>
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold text-white mb-6">Мои отклики на вакансии</h1>

    <div v-if="loading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"
      ></div>
      <p class="mt-2 text-gray-400">Загрузка откликов...</p>
    </div>

    <div v-else-if="error" class="bg-red-900 rounded-lg p-4 mb-6">
      <p class="text-white">{{ error }}</p>
    </div>

    <div v-else-if="applications.length === 0" class="text-center py-12">
      <div class="flex justify-center">
        <span class="material-icons text-5xl text-gray-600">work_off</span>
      </div>
      <h2 class="mt-4 text-xl font-medium text-white">
        У вас пока нет откликов
      </h2>
      <p class="mt-2 text-gray-400">
        Начните искать вакансии и отправляйте отклики
      </p>
      <div class="mt-6">
        <router-link
          to="/jobs"
          class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <span class="material-icons mr-2 text-sm">search</span>
          Искать вакансии
        </router-link>
      </div>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
      <div
        v-for="application in applications"
        :key="application.id"
        class="bg-gray-800 rounded-lg shadow-md overflow-hidden"
      >
        <div class="p-6">
          <div class="flex justify-between items-start">
            <div>
              <router-link
                :to="`/jobs/${application.job?.id || application.job}`"
                class="text-xl font-semibold text-white hover:text-green-400 transition-colors"
              >
                {{ application.job?.title || `Вакансия #${application.job}` }}
              </router-link>
              <p class="text-gray-400 mt-1">
                Компания: {{ application.job?.company_name || "Не указана" }}
              </p>
            </div>
            <div
              :class="{
                'px-3 py-1 rounded-full text-xs font-medium': true,
                'bg-yellow-900 text-yellow-300':
                  application.status === 'pending',
                'bg-green-900 text-green-300':
                  application.status === 'accepted',
                'bg-red-900 text-red-300': application.status === 'rejected',
                'bg-gray-700 text-gray-300': application.status === 'cancelled',
              }"
            >
              {{ getStatusText(application.status) }}
            </div>
          </div>

          <div class="mt-4 text-gray-300">
            <p class="text-sm">
              <span class="font-semibold">Дата отклика:</span>
              {{ formatDate(application.created_at) }}
            </p>
            <p v-if="application.expected_salary" class="text-sm mt-1">
              <span class="font-semibold">Ожидаемая зарплата:</span>
              {{ application.expected_salary }}
            </p>
            <div
              v-if="application.message"
              class="mt-2 border-l-2 border-gray-700 pl-3"
            >
              <p class="text-sm italic">{{ application.message }}</p>
            </div>
          </div>

          <div class="mt-4 flex justify-end space-x-3">
            <router-link
              :to="`/messages`"
              class="inline-flex items-center px-3 py-1 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <span class="material-icons text-sm mr-1">chat</span>
              Чат
            </router-link>

            <!-- Показываем кнопку отмены только если статус не "cancelled" -->
            <button
              v-if="application.status !== 'cancelled'"
              @click="showCancelConfirmation(application)"
              class="inline-flex items-center px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <span class="material-icons text-sm mr-1">cancel</span>
              Отменить отклик
            </button>

            <!-- Показываем кнопку восстановления только если статус "cancelled" -->
            <button
              v-else
              @click="restoreApplication(application)"
              class="inline-flex items-center px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span class="material-icons text-sm mr-1">restore</span>
              Восстановить отклик
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения отмены -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold text-white">
          Подтверждение отмены отклика
        </h3>
        <p class="mt-2 text-gray-400">
          Вы уверены, что хотите отменить отклик? Вы сможете восстановить его
          позже.
        </p>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showCancelModal = false"
            class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            @click="cancelApplication"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useApplicationsStore } from "@/stores/applications";

const applicationsStore = useApplicationsStore();

const applications = ref([]);
const loading = ref(true);
const error = ref(null);
const showCancelModal = ref(false);
const applicationToCancel = ref(null);

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("ru-RU", options);
};

// Получение текстового представления статуса
const getStatusText = (status) => {
  const statusMap = {
    pending: "На рассмотрении",
    accepted: "Принят",
    rejected: "Отклонен",
    cancelled: "Отменен",
  };
  return statusMap[status] || status;
};

// Загрузка откликов
const loadApplications = async () => {
  loading.value = true;
  error.value = null;

  try {
    const myApplications = await applicationsStore.fetchMyApplications();

    // Получаем данные из localStorage для совмещения
    const storedApplications = loadStoredApplications();

    // Соединяем данные из API и localStorage
    const mergedApplications = mergeApplications(
      myApplications,
      storedApplications
    );

    applications.value = mergedApplications;
  } catch (err) {
    console.error("Ошибка при загрузке откликов:", err);
    error.value = "Не удалось загрузить отклики. Пожалуйста, попробуйте позже.";
  } finally {
    loading.value = false;
  }
};

// Загрузка сохраненных локально откликов
const loadStoredApplications = () => {
  try {
    const storedData = localStorage.getItem("mockJobApplications");
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (err) {
    console.error("Ошибка при чтении данных из localStorage:", err);
  }
  return [];
};

// Объединение откликов из API и localStorage
const mergeApplications = (apiApplications, storedApplications) => {
  const mergedApps = [...apiApplications];

  // Обновляем статусы из localStorage если они там есть
  for (let i = 0; i < mergedApps.length; i++) {
    const app = mergedApps[i];
    const storedApp = storedApplications.find(
      (sa) =>
        String(sa.id) === String(app.id) ||
        String(sa.job) === String(app.job?.id || app.job)
    );

    if (storedApp && storedApp.status) {
      app.status = storedApp.status;
    }
  }

  // Добавляем недостающие отклики из localStorage
  storedApplications.forEach((storedApp) => {
    const exists = mergedApps.some(
      (app) =>
        String(app.id) === String(storedApp.id) ||
        String(app.job?.id || app.job) === String(storedApp.job)
    );

    if (!exists) {
      mergedApps.push(storedApp);
    }
  });

  return mergedApps;
};

// Показ диалога для подтверждения отмены отклика
const showCancelConfirmation = (application) => {
  applicationToCancel.value = application;
  showCancelModal.value = true;
};

// Отмена отклика
const cancelApplication = async () => {
  if (!applicationToCancel.value) return;

  try {
    const appId = applicationToCancel.value.id;

    // Сначала обновляем в UI
    const index = applications.value.findIndex((a) => a.id === appId);
    if (index !== -1) {
      applications.value[index].status = "cancelled";
    }

    // Сохраняем в localStorage измененный статус
    saveApplicationStatus(applicationToCancel.value, "cancelled");

    // Закрываем модальное окно
    showCancelModal.value = false;
    applicationToCancel.value = null;

    // Опционально: отправляем запрос на API
    if (import.meta.env.PROD) {
      try {
        await applicationsStore.updateApplicationStatus(appId, "cancelled");
      } catch (apiError) {
        console.error("Ошибка при обновлении статуса на сервере:", apiError);
        // Данные уже сохранены локально, так что игнорируем ошибку API
      }
    }
  } catch (err) {
    console.error("Ошибка при отмене отклика:", err);
  }
};

// Восстановление отклика
const restoreApplication = async (application) => {
  try {
    const appId = application.id;

    // Сначала обновляем в UI
    const index = applications.value.findIndex((a) => a.id === appId);
    if (index !== -1) {
      applications.value[index].status = "pending";
    }

    // Сохраняем в localStorage измененный статус
    saveApplicationStatus(application, "pending");

    // Опционально: отправляем запрос на API
    if (import.meta.env.PROD) {
      try {
        await applicationsStore.updateApplicationStatus(appId, "pending");
      } catch (apiError) {
        console.error("Ошибка при обновлении статуса на сервере:", apiError);
      }
    }
  } catch (err) {
    console.error("Ошибка при восстановлении отклика:", err);
  }
};

// Сохранение статуса отклика в localStorage
const saveApplicationStatus = (application, newStatus) => {
  try {
    // Получаем текущие данные
    let storedApplications = loadStoredApplications();

    // Находим существующий отклик или создаем новый
    const appId = application.id;
    const jobId = application.job?.id || application.job;

    const existingIndex = storedApplications.findIndex(
      (a) => String(a.id) === String(appId) || String(a.job) === String(jobId)
    );

    if (existingIndex !== -1) {
      // Обновляем существующий
      storedApplications[existingIndex].status = newStatus;
    } else {
      // Создаем новый
      storedApplications.push({
        id: appId,
        job: jobId,
        status: newStatus,
        created_at: application.created_at || new Date().toISOString(),
      });
    }

    // Сохраняем обратно в localStorage
    localStorage.setItem(
      "mockJobApplications",
      JSON.stringify(storedApplications)
    );
    console.log(`Статус отклика сохранен в localStorage: ${newStatus}`);
  } catch (err) {
    console.error("Ошибка при сохранении статуса отклика:", err);
  }
};

onMounted(() => {
  loadApplications();
});
</script>
