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
        <div class="mt-6 flex justify-end space-x-3">
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { useResumeStore } from "@/stores/resume";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";

const resumeStore = useResumeStore();
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
const resumes = ref([]);
const loading = ref(true);
const showDeleteModal = ref(false);
const resumeToDelete = ref(null);
const unreadCount = ref(0);
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
    alert("Ошибка при загрузке резюме");
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

    alert("Ошибка при изменении статуса резюме");
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
  } catch (error) {
    console.error("Error deleting resume:", error);
    alert("Ошибка при удалении резюме");
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
