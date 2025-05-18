<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <div
        class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <div class="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-white">
                Отклик на вакансию "{{ job.title }}"
              </h3>
              <div class="mt-4">
                <form @submit.prevent="handleSubmit">
                  <div class="space-y-4">
                    <!-- Resume Selection -->
                    <div>
                      <label class="block text-sm font-medium text-gray-300">
                        Резюме
                      </label>
                      <select
                        v-model="formData.resume"
                        class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                        :disabled="resumesLoading || creatingResume"
                      >
                        <option value="">Выберите резюме</option>
                        <option
                          v-for="resume in resumes"
                          :key="resume.id"
                          :value="resume.id"
                        >
                          {{ resume.title || `Резюме #${resume.id}` }}
                        </option>
                      </select>

                      <!-- Загрузка резюме -->
                      <div
                        v-if="resumesLoading"
                        class="mt-2 text-sm text-blue-400"
                      >
                        Загрузка резюме...
                      </div>

                      <!-- Сообщение о том, что у вас нет активных резюме -->
                      <div v-else-if="resumes.length === 0" class="mt-2">
                        <p class="text-amber-400 text-sm">
                          У вас нет активных резюме. Пожалуйста, создайте новое
                          резюме или активируйте существующее в разделе резюме.
                        </p>
                        <button
                          type="button"
                          @click="showQuickResumeForm = true"
                          class="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          :disabled="creatingResume"
                        >
                          Создать резюме
                        </button>
                        <button
                          type="button"
                          @click="goToResumesPage"
                          class="mt-2 ml-2 inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          :disabled="creatingResume"
                        >
                          Перейти к резюме
                        </button>
                      </div>

                      <!-- Кнопка для создания нового резюме -->
                      <div v-else-if="!showQuickResumeForm" class="mt-2">
                        <button
                          type="button"
                          @click="showQuickResumeForm = true"
                          class="text-sm text-green-400 hover:text-green-300"
                          :disabled="creatingResume"
                        >
                          + Создать новое резюме
                        </button>
                      </div>

                      <!-- Ошибка создания резюме -->
                      <p v-if="resumeError" class="mt-2 text-sm text-red-500">
                        {{ resumeError }}
                      </p>
                    </div>

                    <!-- Быстрое создание резюме -->
                    <div
                      v-if="showQuickResumeForm"
                      class="mt-3 border border-gray-600 rounded-md p-3 bg-gray-700"
                    >
                      <h4 class="text-sm font-medium text-white mb-2">
                        Быстрое создание резюме
                      </h4>
                      <div class="space-y-3">
                        <div>
                          <label
                            class="block text-xs font-medium text-gray-300"
                          >
                            Название резюме
                          </label>
                          <input
                            v-model="quickResume.title"
                            type="text"
                            class="mt-1 block w-full rounded-md bg-gray-600 border-gray-600 text-white text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                            placeholder="Например: Главное резюме"
                            required
                          />
                        </div>
                        <div>
                          <label
                            class="block text-xs font-medium text-gray-300"
                          >
                            Желаемая должность
                          </label>
                          <input
                            v-model="quickResume.desired_position"
                            type="text"
                            class="mt-1 block w-full rounded-md bg-gray-600 border-gray-600 text-white text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                            :placeholder="
                              props.job?.title || 'Например: Разработчик Java'
                            "
                            required
                          />
                        </div>
                        <div>
                          <label
                            class="block text-xs font-medium text-gray-300"
                          >
                            Опыт работы (лет)
                          </label>
                          <input
                            v-model="quickResume.experience_years"
                            type="number"
                            min="0"
                            max="50"
                            class="mt-1 block w-full rounded-md bg-gray-600 border-gray-600 text-white text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div class="flex space-x-2 pt-2">
                          <button
                            type="button"
                            @click="createQuickResume"
                            class="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            :disabled="creatingResume"
                          >
                            <span v-if="creatingResume" class="mr-2">
                              <svg
                                class="animate-spin h-4 w-4 text-white"
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
                            Создать
                          </button>
                          <button
                            type="button"
                            @click="showQuickResumeForm = false"
                            class="inline-flex justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            :disabled="creatingResume"
                          >
                            Отмена
                          </button>
                        </div>
                        <p v-if="resumeError" class="text-red-500 text-sm mt-1">
                          {{ resumeError }}
                        </p>
                      </div>
                    </div>

                    <p v-if="errors.resume" class="mt-1 text-sm text-red-500">
                      {{ errors.resume }}
                    </p>
                  </div>

                  <!-- Сообщение работодателю -->
                  <div>
                    <label class="block text-sm font-medium text-gray-300">
                      Сообщение работодателю
                    </label>
                    <textarea
                      v-model="formData.message"
                      rows="3"
                      class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
                      placeholder="Опишите, почему вы подходите на эту должность..."
                      required
                    ></textarea>
                    <p v-if="errors.message" class="mt-1 text-sm text-red-500">
                      {{ errors.message }}
                    </p>
                  </div>

                  <!-- Сопроводительное письмо -->
                  <div>
                    <label class="block text-sm font-medium text-gray-300">
                      Сопроводительное письмо
                    </label>
                    <textarea
                      v-model="formData.cover_letter"
                      rows="4"
                      class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
                      required
                    ></textarea>
                    <p
                      v-if="errors.cover_letter"
                      class="mt-1 text-sm text-red-500"
                    >
                      {{ errors.cover_letter }}
                    </p>
                  </div>

                  <!-- Ожидаемая зарплата -->
                  <div>
                    <label class="block text-sm font-medium text-gray-300">
                      Ожидаемая зарплата
                    </label>
                    <input
                      type="number"
                      v-model="formData.expected_salary"
                      class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <p
                      v-if="errors.expected_salary"
                      class="mt-1 text-sm text-red-500"
                    >
                      {{ errors.expected_salary }}
                    </p>
                  </div>

                  <!-- Блоки выбора предпочтительного способа связи и чекбокс начала чата удалены,
                       но значения по умолчанию остаются в formData -->
                </form>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 px-4 pb-5 sm:px-6 sm:pb-4">
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="$emit('close')"
              class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-transparent rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Отмена
            </button>
            <button
              type="button"
              @click="handleSubmit"
              :disabled="loading || !formData.resume"
              class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <span v-if="loading" class="mr-2">
                <svg
                  class="animate-spin h-4 w-4 text-white"
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
              Отправить
            </button>
          </div>

          <!-- Общие ошибки -->
          <div v-if="errors.general" class="mt-3 px-4 text-center">
            <p class="text-red-500 text-sm">{{ errors.general }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useApplicationsStore } from "@/stores/applications";
import { useResumesStore } from "@/stores/resumes";
import { useChatStore } from "@/stores/chat";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { safeLocalStorage } from "@/plugins/localStorage";
import { showNotification } from "@/utils/notifications";
import { useJobStore } from "@/stores/job";
import { storeToRefs } from "pinia";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  job: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "success"]);

const applicationsStore = useApplicationsStore();
const resumesStore = useResumesStore();
const chatStore = useChatStore();
const router = useRouter();
const authStore = useAuthStore();
const jobStore = useJobStore();

const loading = ref(false);
const resumesLoading = ref(false);
const creatingResume = ref(false);
const showQuickResumeForm = ref(false);
const resumeError = ref("");
const resumes = ref([]);
const formData = ref({
  resume: "",
  cover_letter: "",
  expected_salary: "",
  message: "",
});
const errors = ref({});
const quickResume = ref({
  title: "",
  desired_position: "",
  experience_years: 0,
});

const isDev = ref(import.meta.env.DEV);

const loadResumes = async () => {
  console.log("Начало загрузки резюме");
  resumesLoading.value = true;
  try {
    console.log("Получение резюме");

    // Попробуем несколько подходов для получения резюме
    let foundResumes = false;

    // Первый подход: Прямой вызов API с правильной авторизацией
    try {
      const token = safeLocalStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get("/api/users/resumes/", { headers });
      console.log("Ответ API:", response);

      const resumesData = response.data.results || response.data;
      console.log("Резюме из прямого API:", resumesData);

      if (resumesData && resumesData.length > 0) {
        // Фильтруем только активные резюме
        const activeResumes = resumesData.filter(
          (resume) => resume.is_active !== false
        );
        resumes.value = activeResumes;

        if (activeResumes.length > 0) {
          formData.value.resume = activeResumes[0].id;
          console.log(
            "Выбранный ID резюме из прямого API:",
            formData.value.resume
          );
          foundResumes = true;
        }
      }
    } catch (apiError) {
      console.error("Прямой вызов API не удался:", apiError);
    }

    // Второй подход: Проверить localStorage
    if (!foundResumes) {
      try {
        const storedResumes = safeLocalStorage.getObject("resumesCache");
        if (storedResumes) {
          console.log("Резюме из localStorage:", storedResumes);

          if (storedResumes && storedResumes.length > 0) {
            // Фильтруем только активные резюме
            const activeResumes = storedResumes.filter(
              (resume) => resume.is_active !== false
            );
            resumes.value = activeResumes;

            if (activeResumes.length > 0) {
              formData.value.resume = activeResumes[0].id;
              console.log(
                "Выбранный ID резюме из localStorage:",
                formData.value.resume
              );
              foundResumes = true;
            }
          }
        }
      } catch (localStorageError) {
        console.error("Ошибка при чтении из localStorage:", localStorageError);
      }
    }

    // Третий подход: Используем хранилище, если первый подход не удался
    if (!foundResumes) {
      try {
        const storeResumes = await resumesStore.fetchResumes();
        console.log("Резюме из хранилища:", storeResumes);

        if (storeResumes && storeResumes.length > 0) {
          // Фильтруем только активные резюме
          const activeResumes = storeResumes.filter(
            (resume) => resume.is_active !== false
          );
          resumes.value = activeResumes;

          if (activeResumes.length > 0) {
            formData.value.resume = activeResumes[0].id;
            console.log(
              "Выбранный ID резюме из хранилища:",
              formData.value.resume
            );
            foundResumes = true;
          }
        }
      } catch (storeError) {
        console.error("Получение из хранилища не удалось:", storeError);
      }
    }

    // Четвертый подход: Попробовать другой эндпоинт API
    if (!foundResumes) {
      try {
        const response = await axios.get("/api/users/resumes/");
        console.log("Ответ альтернативного API:", response);

        const resumesData = response.data.results || response.data;
        console.log("Резюме из альтернативного API:", resumesData);

        if (resumesData && resumesData.length > 0) {
          // Фильтруем только активные резюме
          const activeResumes = resumesData.filter(
            (resume) => resume.is_active !== false
          );
          resumes.value = activeResumes;

          if (activeResumes.length > 0) {
            formData.value.resume = activeResumes[0].id;
            console.log(
              "Выбранный ID резюме из альтернативного API:",
              formData.value.resume
            );
            foundResumes = true;
          }
        }
      } catch (altApiError) {
        console.error("Вызов альтернативного API не удался:", altApiError);
      }
    }

    // Последнее средство - тестовые данные для режима разработки
    if (!foundResumes && isDev.value) {
      console.log("Все резюме отключены или не найдены");
      // Не создаем тестовые резюме, как запросил пользователь
      resumes.value = []; // Убедимся, что массив резюме пуст

      // Добавим сообщение в консоль для разработчиков
      console.log(
        "Пользователь отключил все резюме. Тестовые резюме не будут созданы."
      );
    }
  } catch (error) {
    console.error("Ошибка при получении резюме:", error);
  } finally {
    resumesLoading.value = false;
    console.log(
      "Загрузка резюме завершена, найдено",
      resumes.value.length,
      "активных резюме"
    );
  }
};

// Получение резюме при монтировании компонента
onMounted(() => {
  console.log("ApplyJobModal смонтирован", props.job);

  // Инициализация quickResume с названием вакансии, если доступно
  if (props.job && props.job.title) {
    quickResume.value.desired_position = props.job.title;
    quickResume.value.title = `Резюме для ${props.job.title}`;
  }

  // Загружаем резюме немедленно при открытии модального окна
  loadResumes();

  // Отладочный вывод
  console.log("Статус авторизации:", {
    token: localStorage.getItem("token") ? "присутствует" : "отсутствует",
    tokenLength: localStorage.getItem("token")?.length || 0,
  });

  // Проверка, что пользователь не является работодателем
  if (authStore.user?.profile?.role === "employer" || authStore.isEmployer) {
    console.log("Работодатели не могут откликаться на вакансии");
    // Закрываем модальное окно
    emit("close");
    // Можно также показать уведомление пользователю
    showNotification("Работодатели не могут откликаться на вакансии", "error");
  }
});

// Наблюдаем за изменением props.show и перезагружаем резюме при открытии модального окна
watch(
  () => props.show,
  (newValue) => {
    console.log("Modal visibility changed:", newValue);
    if (newValue) {
      // Загружаем резюме немедленно при открытии модального окна
      loadResumes();
    }
  }
);

// Отслеживание изменений в выбранном резюме
watch(
  () => formData.value.resume,
  (newValue) => {
    console.log("Выбранное резюме изменено:", newValue);
  }
);

const handleSubmit = async () => {
  try {
    loading.value = true;
    errors.value = {}; // Сбрасываем ошибки перед отправкой

    // Проверяем наличие ID вакансии
    if (!props.job || !props.job.id) {
      errors.value.general = "Не указан ID вакансии";
      console.error("Отсутствует ID вакансии:", props.job);
      return;
    }

    // Проверка наличия резюме
    if (!formData.value.resume) {
      errors.value.general = "Не выбрано резюме";
      return;
    }

    // Устанавливаем заголовки авторизации для всех запросов
    const token = safeLocalStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    console.log(
      "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Токен авторизации:",
      token ? "Присутствует" : "Отсутствует"
    );

    // Проверяем наличие флага отмены отклика
    const jobId = props.job.id;
    const wasCanceled =
      localStorage.getItem(`job_application_${jobId}_canceled`) === "true";

    const applicationData = {
      job: props.job.id,
      resume_id: parseInt(formData.value.resume, 10),
      cover_letter: formData.value.cover_letter || "",
      expected_salary: formData.value.expected_salary
        ? parseInt(formData.value.expected_salary, 10)
        : null,
      message: formData.value.message || "",
      create_conversation: true, // Всегда создаем чат при отклике
      force: wasCanceled, // Устанавливаем force=true если отклик был отменен
    };

    console.log("[ОТЛАДКА СОЗДАНИЯ ЧАТА] Отправка заявки:", applicationData);

    try {
      // Отправляем заявку
      const result = await applicationsStore.applyForJob(applicationData);
      console.log("[ОТЛАДКА СОЗДАНИЯ ЧАТА] Результат заявки:", result);

      // Попытка получить ID чата из результата
      let conversationId = result.conversation_id || null;
      console.log("[ОТЛАДКА СОЗДАНИЯ ЧАТА] ID чата из ответа:", conversationId);

      // Если чат не был создан автоматически, попробуем прямые вызовы API
      if (!conversationId) {
        // Получаем детали вакансии, чтобы убедиться, что у нас есть ID работодателя
        let employerId = props.job.employer?.id || props.job.user?.id;

        try {
          console.log("[ОТЛАДКА СОЗДАНИЯ ЧАТА] Получение данных вакансии");
          // Получаем детали вакансии, чтобы убедиться, что у нас есть ID работодателя
          const jobResponse = await axios.get(`/api/jobs/${props.job.id}/`, {
            headers,
          });
          const jobData = jobResponse.data;
          employerId = jobData.employer?.id || jobData.user?.id || employerId;
          console.log("[ОТЛАДКА СОЗДАНИЯ ЧАТА] ID работодателя:", employerId);
        } catch (err) {
          console.error(
            "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка получения данных вакансии:",
            err
          );
        }

        // Подготавливаем начальное сообщение
        const initialMessage =
          formData.value.message ||
          "Здравствуйте, я отправил отклик на вашу вакансию и хотел бы обсудить детали.";

        //Попытка использовать job-specific chat endpoint
        try {
          console.log(
            "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Попытка 1: Создание чата через job-specific endpoint"
          );
          const chatResponse = await axios.post(
            `/api/jobs/${props.job.id}/chat/`,
            { message: initialMessage },
            { headers }
          );

          if (
            chatResponse.data &&
            (chatResponse.data.id || chatResponse.data.conversation_id)
          ) {
            conversationId =
              chatResponse.data.id || chatResponse.data.conversation_id;
            console.log(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Чат успешно создан (подход 1), ID:",
              conversationId
            );
          }
        } catch (err) {
          console.error(
            "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка подхода 1:",
            err.response?.status,
            err.response?.data
          );
        }

        // Попробуем использовать direct chat creation
        if (!conversationId && employerId) {
          try {
            console.log(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Попытка 2: Создание чата через conversations API"
            );
            const payload = {
              employer_id: employerId,
              job_id: props.job.id,
              message: initialMessage,
            };

            const chatResponse = await axios.post("/api/chats/", payload, {
              headers,
            });

            if (
              chatResponse.data &&
              (chatResponse.data.id || chatResponse.data.conversation_id)
            ) {
              conversationId =
                chatResponse.data.id || chatResponse.data.conversation_id;
              console.log(
                "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Чат успешно создан (подход 2), ID:",
                conversationId
              );
            }
          } catch (err) {
            console.error(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка подхода 2:",
              err.response?.status,
              err.response?.data
            );
          }
        }

        // Попробуем использовать chatStore (с правильной обработкой ошибок)
        if (!conversationId && employerId) {
          try {
            console.log(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Попытка 3: Создание чата через chatStore"
            );
            const chatResponse = await chatStore.createOrGetConversation(
              employerId,
              props.job.id,
              initialMessage
            );

            console.log(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ответ chatStore:",
              chatResponse
            );

            if (
              chatResponse &&
              (chatResponse.id || chatResponse.conversation_id)
            ) {
              conversationId = chatResponse.id || chatResponse.conversation_id;
              console.log(
                "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Чат успешно создан (подход 3), ID:",
                conversationId
              );
            }
          } catch (err) {
            console.error("[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка подхода 3:", err);
          }
        }

        // Последний вариант - использовать direct message API
        if (!conversationId && employerId) {
          try {
            console.log(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Попытка 4: Создание сообщения напрямую"
            );

            // Сначала попробуем создать диалог
            const convResponse = await axios.post(
              "/api/messages/conversations/",
              { recipient_id: employerId, job_id: props.job.id },
              { headers }
            );

            if (convResponse.data && convResponse.data.id) {
              conversationId = convResponse.data.id;

              // Затем отправляем сообщение в этот диалог
              await axios.post(
                "/api/messages/",
                {
                  conversation_id: conversationId,
                  content: initialMessage,
                },
                { headers }
              );

              console.log(
                "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Чат успешно создан (подход 4), ID:",
                conversationId
              );
            }
          } catch (err) {
            console.error(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка подхода 4:",
              err.response?.status,
              err.response?.data
            );
          }
        }
      }

      // Сохраняем ID чата независимо от того, как он был создан
      if (conversationId) {
        console.log(
          "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Сохранение ID чата:",
          conversationId
        );
        localStorage.setItem(
          `job_conversation_${props.job.id}`,
          conversationId
        );
        localStorage.setItem("lastCreatedChatId", conversationId);
      } else {
        console.warn(
          "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Не удалось создать чат ни одним из способов"
        );
      }

      // Обновляем список диалогов в chat store
      if (conversationId) {
        // Добавляем задержку, чтобы дать бэкенду время на завершение транзакции и сохранение чата
        console.log(
          "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ожидаем 1 секунду перед обновлением списка диалогов"
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Принудительно инициализируем хранилище чатов перед обновлением списка диалогов
        console.log("[ОТЛАДКА СОЗДАНИЯ ЧАТА] Инициализация хранилища чатов");
        await chatStore.init();

        await chatStore.fetchConversations(true);
        console.log(
          "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Список диалогов обновлен после создания чата"
        );
      } else {
        console.warn(
          "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Не обновляем список диалогов, т.к. чат не был создан"
        );
      }

      // Показываем уведомление о успешном отправлении
      let successMessage = "Отклик успешно отправлен!";
      if (conversationId) {
        successMessage +=
          " Чат с работодателем создан. Вы можете перейти в раздел 'Чаты' для общения.";
      }
      showNotification(successMessage, "success");

      // Закрываем модальное окно и отправляем результат родительскому компоненту
      emit("success", {
        success: true,
        applicationId: result.applicationId || null,
        withChat: !!conversationId,
        conversation_id: conversationId,
      });
      emit("close");

      // Перенаправляем в чат, если запрошено
      if (conversationId) {
        console.log(
          "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Перенаправление в чат:",
          conversationId
        );

        // Проверяем, мобильное ли устройство
        const isMobile = window.innerWidth < 768;
        console.log("[ОТЛАДКА СОЗДАНИЯ ЧАТА] Мобильное устройство:", isMobile);

        // Задержка для завершения операций перед переадресацией
        setTimeout(async () => {
          try {
            // Перед переходом в чат, обновляем список диалогов в chatStore
            console.log(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Принудительное обновление списка диалогов"
            );
            await chatStore.fetchConversations(true);

            // Для мобильной версии делаем задержку немного больше
            const mobileDelay = isMobile ? 300 : 0;

            setTimeout(() => {
              // Сначала пробуем самый вероятный маршрут
              router
                .push({
                  name: "chat-detail",
                  params: { id: conversationId },
                  query: { forceMobile: isMobile ? "true" : undefined },
                })
                .catch((error) => {
                  console.log(
                    "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Перенаправление на chat не удалось:",
                    error
                  );

                  // Пробуем альтернативный путь с параметром для мобильной версии
                  router
                    .push(
                      `/chat/${conversationId}${
                        isMobile ? "?forceMobile=true" : ""
                      }`
                    )
                    .catch(() => {
                      // Показываем уведомление, если не удалось перейти в чат
                      showNotification(
                        "Чат создан, но не удалось перейти в него автоматически. Пожалуйста, посетите раздел 'Чаты'",
                        "info"
                      );
                    });
                });
            }, mobileDelay);
          } catch (routeError) {
            console.error(
              "[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка при перенаправлении:",
              routeError
            );
            showNotification(
              "Чат создан, но не удалось перейти в него автоматически. Пожалуйста, посетите раздел 'Чаты'",
              "info"
            );
          }
        }, 800); // Увеличиваем общую задержку для всех устройств
      }
    } catch (error) {
      console.error("[ОТЛАДКА СОЗДАНИЯ ЧАТА] Критическая ошибка:", error);
      errors.value.general =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Произошла ошибка при отправке заявки";
    }
  } catch (finalError) {
    console.error("Критическая ошибка при отправке заявки:", finalError);
    errors.value.general =
      "Произошла неожиданная ошибка. Пожалуйста, попробуйте позже.";
  } finally {
    loading.value = false;
  }
};

// Создание быстрого резюме
const createQuickResume = async () => {
  if (!quickResume.value.title || !quickResume.value.desired_position) {
    resumeError.value = "Все поля обязательны для заполнения";
    return;
  }

  creatingResume.value = true;
  resumeError.value = "";

  try {
    console.log("Создание быстрого резюме:", quickResume.value);

    // Установка значений по умолчанию на основе вакансии, если доступно
    if (!quickResume.value.desired_position && props.job.title) {
      quickResume.value.desired_position = props.job.title;
    }

    // Создание резюме
    const resumeData = {
      title: quickResume.value.title,
      desired_position: quickResume.value.desired_position,
      experience_years: quickResume.value.experience_years,
      education: [
        {
          institution: "Не указано",
          degree: "Не указано",
          field_of_study: "Не указано",
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date().toISOString().split("T")[0],
        },
      ],
      is_active: true,
    };

    let newResume;
    try {
      // Пытаемся создать через хранилище
      newResume = await resumesStore.createResume(resumeData);
      console.log("Резюме успешно создано через хранилище:", newResume);
    } catch (storeError) {
      console.error("Ошибка при создании резюме через хранилище:", storeError);

      if (isDev.value) {
        console.log("РЕЖИМ РАЗРАБОТКИ: Создание тестового резюме локально");

        // Создаем тестовое резюме с уникальным ID
        newResume = {
          ...resumeData,
          id: Date.now(),
          skills: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Получаем существующие резюме из localStorage
        let existingResumes = [];
        try {
          const cachedResumes = safeLocalStorage.getObject("resumesCache");
          if (cachedResumes) {
            existingResumes = cachedResumes;
          }
        } catch (e) {
          console.error("Ошибка при чтении кэша резюме:", e);
        }

        // Добавляем новое резюме и сохраняем обратно
        existingResumes.push(newResume);
        safeLocalStorage.setObject("resumesCache", existingResumes);

        console.log("РЕЖИМ РАЗРАБОТКИ: Тестовое резюме создано:", newResume);
      } else {
        throw storeError;
      }
    }

    // Добавление в список резюме и выбор его
    resumes.value.push(newResume);
    formData.value.resume = newResume.id;

    // Закрытие формы
    showQuickResumeForm.value = false;
  } catch (error) {
    console.error("Ошибка при создании резюме:", error);

    if (error.response?.data) {
      const errorData = error.response.data;
      // Форматирование сообщений об ошибках
      if (typeof errorData === "object") {
        const errorMessages = [];
        for (const [field, msgs] of Object.entries(errorData)) {
          const message = Array.isArray(msgs) ? msgs.join(". ") : msgs;
          errorMessages.push(`${field}: ${message}`);
        }
        resumeError.value = errorMessages.join("\n");
      } else {
        resumeError.value = String(errorData);
      }
    } else {
      resumeError.value =
        "Не удалось создать резюме. Пожалуйста, попробуйте позже.";
    }
  } finally {
    creatingResume.value = false;
  }
};

// Функция для перехода на страницу резюме
const goToResumesPage = () => {
  // Закрываем модальное окно
  emit("close");
  // Перенаправляем на страницу резюме
  router.push("/resumes");
};

const validateForm = () => {
  // Реализация валидации формы
  return true; // Замените на фактическую логику валидации
};

// В методе checkIfUserHasApplied, добавим проверку флага отмены отклика
const checkIfUserHasApplied = () => {
  if (!props.job || !props.job.id) {
    return false;
  }

  const jobId = props.job.id;

  // Сначала проверяем, был ли отклик отменен
  const wasCanceled =
    localStorage.getItem(`job_application_${jobId}_canceled`) === "true";
  if (wasCanceled) {
    console.log(
      `ApplyJobModal: Найден флаг отмены для job ${jobId}, разрешаем повторный отклик`
    );
    // Если отклик был отменен, удаляем флаг и разрешаем снова откликнуться
    localStorage.removeItem(`job_application_${jobId}_canceled`);
    return false;
  }

  // Проверяем в activeApplicationsMap
  const hasActiveApplication = !!applicationsStore.activeApplicationsMap[jobId];

  // Проверяем в localStorage
  const hasLocalStorageApplication = !!localStorage.getItem(
    `job_application_${jobId}`
  );

  return hasActiveApplication || hasLocalStorageApplication;
};

// В методе applyForJob, после успешного отклика удаляем флаг отмены отклика
const applyForJob = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Проверяем, если пользователь уже откликался на эту вакансию ранее
    const jobId = props.job.id;
    const userHasApplied = checkIfUserHasApplied();

    if (userHasApplied && !forceReapply.value) {
      console.warn(`Пользователь уже откликнулся на вакансию ${jobId}`);
      showAlreadyAppliedWarning.value = true;
      return;
    }

    // Остальной код существующего метода applyForJob...

    // После успешного отклика, удаляем флаг отмены (если он был)
    localStorage.removeItem(`job_application_${jobId}_canceled`);

    // Остальной код метода...
  } catch (error) {
    // Обработка ошибок...
  } finally {
    loading.value = false;
  }
};
</script>
