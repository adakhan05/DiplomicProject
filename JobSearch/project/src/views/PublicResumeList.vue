<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 sm:px-0 mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-white">Найти соискателя</h2>
        <p class="mt-2 text-sm text-gray-400">
          Просмотр резюме и связь с потенциальными кандидатами
        </p>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="bg-gray-800 shadow sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
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
              placeholder="Username или должность"
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

          <!-- Должность -->
          <div>
            <label
              for="position"
              class="block text-sm font-medium text-gray-300"
              >Должность</label
            >
            <input
              type="text"
              id="position"
              v-model="filters.position"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Например: Разработчик"
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
        </div>

        <div class="mt-4">
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              @click="applyFilters"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span class="material-icons mr-1">search</span>
              Найти соискателей
            </button>
            <button
              type="button"
              @click="resetFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span class="material-icons mr-1">refresh</span>
              Сбросить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Список резюме -->
    <div class="bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div v-if="loading" class="text-center py-12">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"
          ></div>
          <p class="mt-2 text-sm text-gray-400">Загрузка резюме...</p>
        </div>

        <div v-else-if="filteredResumes.length === 0" class="text-center py-12">
          <p class="text-gray-300">Резюме не найдены</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="resume in filteredResumes"
            :key="resume.id"
            class="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
          >
            <div class="flex flex-col sm:flex-row justify-between">
              <div class="flex-grow">
                <div class="flex items-start">
                  <div class="mr-4">
                    <UserAvatar
                      :username="resume.user.username"
                      :imageUrl="resume.user.avatar"
                      size="md"
                    />
                  </div>
                  <div class="flex-grow min-w-0">
                    <h3 class="text-lg font-medium text-white">
                      {{ resume.title }}
                    </h3>
                    <p class="mt-1 text-sm text-gray-300 break-words">
                      {{ resume.user.username }} •
                      {{ resume.desired_position }}
                    </p>

                    <div
                      v-if="resume.salary_expectation"
                      class="mt-1 text-sm text-gray-400"
                    >
                      Ожидаемая зарплата:
                      {{ formatSalary(resume.salary_expectation) }} ₽
                    </div>

                    <div class="mt-2">
                      <p class="text-sm text-gray-300 line-clamp-2 break-words">
                        {{ resume.professional_summary }}
                      </p>
                    </div>

                    <div
                      v-if="resume.skills && resume.skills.length"
                      class="mt-2 flex flex-wrap gap-2"
                    >
                      <span
                        v-for="(skill, index) in resume.skills.slice(0, 5)"
                        :key="index"
                        class="inline-flex text-xs px-2 py-1 rounded-full bg-gray-600 text-gray-300"
                      >
                        {{ skill }}
                      </span>
                      <span
                        v-if="resume.skills.length > 5"
                        class="text-xs text-gray-400"
                      >
                        +{{ resume.skills.length - 5 }} еще
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="mt-4 sm:mt-0 flex flex-wrap gap-2 justify-start sm:justify-end sm:flex-col"
              >
                <button
                  @click="openResumeDetails(resume)"
                  class="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm"
                >
                  <span class="material-icons text-sm mr-1">visibility</span>
                  Открыть резюме
                </button>

                <button
                  @click="startChat(resume.user.id)"
                  class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-500 text-sm"
                >
                  <span class="material-icons text-sm mr-1">chat</span>
                  Написать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно детальной информации о резюме -->
    <div
      v-if="showResumeModal && selectedResume"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-y-auto"
    >
      <div
        class="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto my-4"
      >
        <div class="flex justify-between items-start mb-4">
          <h3
            class="text-xl sm:text-2xl font-semibold text-white break-words pr-8"
          >
            {{ selectedResume.title }}
          </h3>
          <button
            @click="showResumeModal = false"
            class="text-gray-400 hover:text-white flex-shrink-0"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="space-y-6">
          <!-- Информация о соискателе -->
          <div class="flex flex-col sm:flex-row sm:items-start">
            <UserAvatar
              :username="selectedResume.user.username"
              :imageUrl="selectedResume.user.avatar"
              size="lg"
              class="mb-4 sm:mb-0 sm:mr-4"
            />
            <div>
              <h4 class="text-lg sm:text-xl font-medium text-white break-words">
                {{ selectedResume.user.first_name }}
                {{ selectedResume.user.last_name }}
              </h4>
              <p class="text-gray-300 break-words">
                {{ selectedResume.desired_position }}
              </p>

              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  @click="startChat(selectedResume.user.id)"
                  class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-500 text-sm"
                >
                  <span class="material-icons text-sm mr-1">chat</span>
                  Написать сообщение
                </button>
              </div>
            </div>
          </div>

          <!-- Основная информация -->
          <div>
            <div class="flex flex-wrap items-center gap-3 mb-2">
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
              <p class="text-gray-300 break-words">
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
              selectedResume.experiences &&
              selectedResume.experiences.length > 0
            "
          >
            <h4 class="text-lg font-medium text-white mb-2">Опыт работы</h4>
            <div class="space-y-4">
              <div
                v-for="(job, index) in selectedResume.experiences"
                :key="index"
                class="bg-gray-750 rounded-md p-4"
              >
                <div class="font-medium text-white">{{ job.position }}</div>
                <div class="text-gray-400">{{ job.company_name }}</div>
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
                <p v-if="edu.field_of_study" class="mt-2 text-gray-300">
                  {{ edu.field_of_study }}
                </p>
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

        <div class="mt-6 flex justify-end space-x-3">
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { usePublicResumesStore } from "@/stores/public-resumes";
import { useChatStore } from "@/stores/chat";
import UserAvatar from "@/components/UserAvatar.vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { showNotification } from "@/utils/notifications";

const router = useRouter();
const publicResumesStore = usePublicResumesStore();
const chatStore = useChatStore();
const authStore = useAuthStore();
const loading = ref(false);
const showResumeModal = ref(false);
const selectedResume = ref(null);
const error = ref(null);

// Получаем состояние фильтров из store для реактивного обновления
const filters = computed(() => publicResumesStore.filters);
const filteredResumes = computed(() => publicResumesStore.filteredResumes);

const applyFilters = () => {
  // Фильтры автоматически применяются через computed property
  console.log("Применены фильтры:", filters.value);
};

const resetFilters = () => {
  publicResumesStore.resetFilters();
};

const formatSalary = (salary) => {
  if (!salary) return "Не указана";
  return new Intl.NumberFormat("ru-RU").format(salary);
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

const getEmploymentTypeText = (type) => {
  const types = {
    full_time: "Полная занятость",
    part_time: "Частичная занятость",
    remote: "Удаленная работа",
    contract: "Контракт",
  };
  return types[type] || type;
};

const openResumeDetails = (resume) => {
  selectedResume.value = resume;
  showResumeModal.value = true;
};

const startChat = async (candidateId) => {
  console.log(
    `PublicResumeList.vue: Попытка начать чат с кандидатом ID: ${candidateId}`
  );
  if (!authStore.isAuthenticated || authStore.user?.role !== "employer") {
    showNotification(
      "Только авторизованные работодатели могут начинать чат.",
      "error"
    );
    return;
  }

  try {
    loading.value = true; // Можно использовать для индикатора загрузки
    // Можно добавить поле для ввода первого сообщения работодателем или использовать стандартное
    const initialMessage =
      "Здравствуйте, я ознакомился с вашим резюме и хотел бы обсудить детали.";

    const result = await chatStore.initiateDirectChat(
      candidateId,
      initialMessage
    );

    console.log(
      "PublicResumeList.vue: Результат запроса:",
      JSON.stringify(result)
    );

    // Проверяем, что получили объект с ID диалога
    if (result && typeof result === "object" && result.id) {
      console.log(
        `PublicResumeList.vue: Чат успешно инициирован, ID диалога: ${result.id}`
      );

      // Перенаправляем на страницу чата с ID нового/существующего диалога
      router.push({
        name: "chat-detail",
        params: { id: String(result.id) },
      });
    } else {
      // Более детальная информация об ошибке
      console.error(
        "PublicResumeList.vue: Не удалось инициировать чат. Результат:",
        result,
        "Error from chatStore:",
        chatStore.error
      );

      showNotification(
        chatStore.error ||
          "Не удалось начать чат с кандидатом. Проверьте консоль для деталей.",
        "error"
      );
    }
  } catch (err) {
    console.error("PublicResumeList.vue: Ошибка при начале чата:", err);
    showNotification(
      err.message || "Произошла неизвестная ошибка при попытке начать чат.",
      "error"
    );
  } finally {
    loading.value = false;
  }
};

const viewPdf = async (url) => {
  if (!url) {
    showNotification("PDF файл не найден или не загружен.", "error");
    return;
  }

  try {
    // Добавляем метку времени для предотвращения кэширования
    const pdfUrl = `${url}?t=${new Date().getTime()}`;

    // Проверяем доступность файла перед открытием
    const response = await fetch(pdfUrl, { method: "HEAD" });

    if (response.ok) {
      // Файл существует, открываем его в новой вкладке
      window.open(pdfUrl, "_blank");
    } else {
      // Файл не найден
      showNotification(
        "PDF файл не найден на сервере. Возможно, он был удален.",
        "error"
      );

      // Если файл не существует, обновляем локальные данные
      if (selectedResume.value) {
        selectedResume.value.resume_file_url = null;
      }
    }
  } catch (error) {
    console.error("Ошибка при проверке PDF-файла:", error);
    showNotification(
      "Не удалось проверить наличие PDF файла. Пожалуйста, попробуйте позже.",
      "error"
    );
  }
};

// Загружаем резюме при монтировании компонента
onMounted(async () => {
  try {
    loading.value = true;
    await publicResumesStore.fetchPublicResumes();
  } catch (error) {
    console.error("Ошибка при загрузке публичных резюме:", error);
  } finally {
    loading.value = false;
  }
});
</script>
