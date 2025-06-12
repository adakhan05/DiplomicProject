<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 sm:px-0 mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-white">Мои резюме</h2>
        <p class="mt-2 text-sm text-gray-400">Управление созданными резюме</p>
      </div>
      <div>
        <router-link
          to="/resumes/create"
          class="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <span class="material-icons mr-2 text-sm">add</span>
          Создать резюме
        </router-link>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-20">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"
      ></div>
      <p class="mt-4 text-gray-400">Загрузка резюме...</p>
    </div>

    <!-- Пустое состояние -->
    <div
      v-else-if="resumes.length === 0"
      class="bg-gray-800 rounded-lg shadow-sm p-10 text-center"
    >
      <div class="flex justify-center">
        <span class="material-icons text-5xl text-gray-500">description</span>
      </div>
      <h3 class="mt-4 text-xl font-medium text-white">У вас еще нет резюме</h3>
      <p class="mt-2 text-gray-400">
        Создайте свое первое резюме, чтобы откликаться на вакансии
      </p>
    </div>

    <!-- Список резюме -->
    <div v-else class="space-y-4">
      <div
        v-for="resume in resumes"
        :key="resume.id"
        class="bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:bg-gray-750 transition-colors duration-200"
      >
        <div class="p-6">
          <div class="flex flex-wrap justify-between items-start gap-4">
            <!-- Информация о резюме -->
            <div class="flex-grow">
              <div class="flex items-center">
                <h3 class="text-xl font-semibold text-white mr-3">
                  {{ resume.title }}
                </h3>
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="
                    resume.is_active
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  "
                >
                  {{ resume.is_active ? "Активно" : "Неактивно" }}
                </span>
              </div>
              <div
                class="mt-2 flex flex-wrap items-center text-sm text-gray-400 gap-x-4 gap-y-2"
              >
                <div class="flex items-center">
                  <span class="material-icons text-sm mr-1">work</span>
                  {{ resume.desired_position }}
                </div>
                <div class="flex items-center">
                  <span class="material-icons text-sm mr-1">schedule</span>
                  {{ getEmploymentTypeText(resume.preferred_employment) }}
                </div>
                <div v-if="resume.salary_expectation" class="flex items-center">
                  <span class="material-icons text-sm mr-1">payments</span>
                  {{ formatSalary(resume.salary_expectation) }} ₽
                </div>
              </div>
              <div class="mt-3">
                <p class="text-gray-300 line-clamp-2">
                  {{ resume.professional_summary }}
                </p>
              </div>
              <div
                v-if="resume.skills && resume.skills.length > 0"
                class="mt-3 flex flex-wrap gap-2"
              >
                <span
                  v-for="(skill, index) in resume.skills"
                  :key="index"
                  class="inline-flex text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300"
                >
                  {{ skill }}
                </span>
              </div>
              <div class="mt-3 text-sm text-gray-500">
                <span>Создано: {{ formatDate(resume.created_at) }}</span>
                <span class="mx-2">•</span>
                <span>Обновлено: {{ formatDate(resume.updated_at) }}</span>
              </div>
            </div>

            <!-- Действия -->
            <div class="flex flex-col gap-2">
              <router-link
                :to="`/resumes/${resume.id}/edit`"
                class="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <span class="material-icons text-sm mr-1">edit</span>
                Редактировать
              </router-link>
              <button
                @click="openResumeDetails(resume)"
                class="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <span class="material-icons text-sm mr-1">visibility</span>
                Открыть резюме
              </button>
              <button
                @click="toggleResumeActive(resume)"
                class="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <span class="material-icons text-sm mr-1">{{
                  resume.is_active ? "visibility_off" : "visibility"
                }}</span>
                {{ resume.is_active ? "Скрыть" : "Показать" }}
              </button>
              <button
                @click="confirmDeleteResume(resume)"
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
          Вы уверены, что хотите удалить резюме "{{ resumeToDelete?.title }}"?
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
            @click="deleteResume"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно детальной информации о резюме -->
    <div
      v-if="showResumeModal && selectedResume"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-2xl font-semibold text-white">
            {{ selectedResume.title }}
          </h3>
          <button
            @click="showResumeModal = false"
            class="text-gray-400 hover:text-white"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="space-y-6">
          <!-- Основная информация -->
          <div>
            <div class="flex flex-wrap items-center gap-3 mb-2">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="
                  selectedResume.is_active
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                "
              >
                {{ selectedResume.is_active ? "Активно" : "Неактивно" }}
              </span>
              <div class="flex items-center text-gray-400">
                <span class="material-icons text-sm mr-1">work</span>
                {{ selectedResume.desired_position }}
              </div>
              <div class="flex items-center text-gray-400">
                <span class="material-icons text-sm mr-1">schedule</span>
                {{ getEmploymentTypeText(selectedResume.preferred_employment) }}
              </div>
              <div
                v-if="selectedResume.salary_expectation"
                class="flex items-center text-gray-400"
              >
                <span class="material-icons text-sm mr-1">payments</span>
                {{ formatSalary(selectedResume.salary_expectation) }} ₽
              </div>
            </div>

            <div class="mt-4">
              <h4 class="text-lg font-medium text-white mb-2">О себе</h4>
              <p class="text-gray-300">
                {{ selectedResume.professional_summary }}
              </p>
            </div>
          </div>

          <!-- Навыки -->
          <div v-if="selectedResume.skills && selectedResume.skills.length > 0">
            <h4 class="text-lg font-medium text-white mb-2">Навыки</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(skill, index) in selectedResume.skills"
                :key="index"
                class="inline-flex text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300"
              >
                {{ skill }}
              </span>
            </div>
          </div>

          <!-- Опыт работы -->
          <div
            v-if="
              selectedResume.experience && selectedResume.experience.length > 0
            "
          >
            <h4 class="text-lg font-medium text-white mb-2">Опыт работы</h4>
            <div class="space-y-4">
              <div
                v-for="(job, index) in selectedResume.experience"
                :key="index"
                class="bg-gray-750 rounded-md p-4"
              >
                <div class="font-medium text-white">{{ job.position }}</div>
                <div class="text-gray-400">{{ job.company }}</div>
                <div class="text-sm text-gray-500">
                  {{ formatDate(job.start_date) }} -
                  {{
                    job.end_date
                      ? formatDate(job.end_date)
                      : "По настоящее время"
                  }}
                </div>
                <p v-if="job.description" class="mt-2 text-gray-300">
                  {{ job.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- Образование -->
          <div
            v-if="
              selectedResume.education && selectedResume.education.length > 0
            "
          >
            <h4 class="text-lg font-medium text-white mb-2">Образование</h4>
            <div class="space-y-4">
              <div
                v-for="(edu, index) in selectedResume.education"
                :key="index"
                class="bg-gray-750 rounded-md p-4"
              >
                <div class="font-medium text-white">{{ edu.degree }}</div>
                <div class="text-gray-400">{{ edu.institution }}</div>
                <div class="text-sm text-gray-500">
                  {{ formatDate(edu.start_date) }} -
                  {{
                    edu.end_date
                      ? formatDate(edu.end_date)
                      : "По настоящее время"
                  }}
                </div>
                <p v-if="edu.description" class="mt-2 text-gray-300">
                  {{ edu.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- Контактная информация -->
          <div>
            <div class="space-y-2">
              <div
                v-if="selectedResume.phone"
                class="flex items-center text-gray-300"
              >
                <span class="material-icons text-gray-500 mr-2">phone</span>
                {{ selectedResume.phone }}
              </div>
              <div
                v-if="selectedResume.email"
                class="flex items-center text-gray-300"
              >
                <span class="material-icons text-gray-500 mr-2">email</span>
                {{ selectedResume.email }}
              </div>
              <div
                v-if="selectedResume.location"
                class="flex items-center text-gray-300"
              >
                <span class="material-icons text-gray-500 mr-2"
                  >location_on</span
                >
                {{ selectedResume.location }}
              </div>
            </div>
          </div>

          <!-- Просмотр PDF резюме -->
          <div v-if="selectedResume.resume_file_url" class="mt-4">
            <h4 class="text-lg font-medium text-white mb-2">PDF резюме</h4>
            <button
              @click="viewPdf(selectedResume.resume_file_url)"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <span class="material-icons mr-2">visibility</span>
              Просмотреть PDF
            </button>
          </div>
        </div>

        <div class="mt-6 flex justify-center space-x-3">
          <button
            @click="showResumeModal = false"
            class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { useResumeStore } from "@/stores/resume";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";
import { showNotification } from "@/utils/notifications";
import { getFileUrl } from "@/utils/fileHelper";

const resumeStore = useResumeStore();
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
const resumes = ref([]);
const loading = ref(true);
const showDeleteModal = ref(false);
const resumeToDelete = ref(null);
const unreadCount = ref(0);
const showResumeModal = ref(false);
const selectedResume = ref(null);
let countInterval; // Переменная таймера для обновления количества непрочитанных сообщений

const fetchUnreadCount = async () => {
  if (!isAuthenticated.value) return;
  try {
    const response = await axios.get("/api/users/messages/unread_count/");
    unreadCount.value = response.data.unread_count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
  }
};

const fetchResumes = async () => {
  try {
    // Проверяем, установлен ли токен авторизации
    const token = localStorage.getItem("token");
    if (token && !axios.defaults.headers.common["Authorization"]) {
      console.log("Устанавливаем токен авторизации при загрузке резюме");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    loading.value = true;
    const response = await resumeStore.fetchResumes();
    resumes.value = response || [];
  } catch (error) {
    console.error("Error fetching resumes:", error);
    showNotification("Ошибка при загрузке резюме", "error");
  } finally {
    loading.value = false;
  }
};

const toggleResumeActive = async (resume) => {
  try {
    // Обновляем UI перед запросом к API
    const index = resumes.value.findIndex((r) => r.id === resume.id);
    if (index !== -1) {
      resumes.value[index].is_active = !resumes.value[index].is_active;
    }
    const response = await resumeStore.toggleResumeActive(resume.id);

    // Обновляем UI в соответствии с результатом от API
    if (index !== -1) {
      resumes.value[index].is_active = response.is_active;
    }

    console.log(
      `Резюме "${resume.title}" ${
        response.is_active ? "активировано" : "деактивировано"
      }`
    );
  } catch (error) {
    console.error("Error toggling resume status:", error);

    // Возвращаем исходное состояние в случае ошибки
    const index = resumes.value.findIndex((r) => r.id === resume.id);
    if (index !== -1) {
      resumes.value[index].is_active = resume.is_active;
    }

    showNotification("Ошибка при изменении статуса резюме", "error");
  }
};

const confirmDeleteResume = (resume) => {
  resumeToDelete.value = resume;
  showDeleteModal.value = true;
};

const deleteResume = async () => {
  try {
    await resumeStore.deleteResume(resumeToDelete.value.id);
    resumes.value = resumes.value.filter(
      (resume) => resume.id !== resumeToDelete.value.id
    );
    showDeleteModal.value = false;
    resumeToDelete.value = null;
    showNotification("Резюме успешно удалено", "success");
  } catch (error) {
    console.error("Error deleting resume:", error);
    showNotification("Ошибка при удалении резюме", "error");
  }
};

const getEmploymentTypeText = (type) => {
  const types = {
    full_time: "Полная занятость",
    part_time: "Частичная занятость",
    remote: "Удаленная работа",
    contract: "Контракт",
  };
  return types[type] || type;
};

const formatSalary = (salary) => {
  return salary.toLocaleString("ru-RU");
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const openResumeDetails = (resume) => {
  selectedResume.value = resume;
  showResumeModal.value = true;
};

const viewPdf = async (url) => {
  if (!url) {
    showNotification("PDF файл не найден или не загружен.", "error");
    return;
  }

  try {
    // Добавляем метку времени для предотвращения кэширования
    const pdfUrl = `${url}?t=${new Date().getTime()}`;

    // Всегда используем getFileUrl для преобразования localhost в IP-адрес
    const fullPdfUrl = getFileUrl(pdfUrl);
    console.log("Полный URL PDF:", fullPdfUrl);

    // Показываем уведомление
    showNotification("PDF файл открывается...", "info");

    // Открываем PDF в новой вкладке
    window.open(fullPdfUrl, "_blank");
    console.log("PDF открыт в новой вкладке");
  } catch (error) {
    console.error("Ошибка при обработке PDF-файла:", error);
    showNotification(
      "Не удалось открыть PDF файл. Пожалуйста, попробуйте позже.",
      "error"
    );
  }
};

onMounted(() => {
  fetchResumes();
  fetchUnreadCount();
  // Обновление счетчика непрочитанных сообщений каждые 30 секунд
  countInterval = setInterval(fetchUnreadCount, 30000);
});

onUnmounted(() => {
  // Очистка интервала при размонтировании компонента
  if (countInterval) {
    clearInterval(countInterval);
  }
});
</script>
