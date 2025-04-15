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

                      <!-- Loading indicator -->
                      <div
                        v-if="resumesLoading"
                        class="mt-2 text-sm text-blue-400"
                      >
                        Загрузка резюме...
                      </div>

                      <!-- Add "No resumes" message and create button -->
                      <div v-else-if="resumes.length === 0" class="mt-2">
                        <p class="text-amber-400 text-sm">
                          У вас нет резюме. Создайте одно сейчас.
                        </p>
                        <button
                          type="button"
                          @click="showQuickResumeForm = true"
                          class="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          :disabled="creatingResume"
                        >
                          Создать резюме
                        </button>
                      </div>

                      <!-- Add button to create another resume if they have some -->
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

                      <!-- Resume creation error -->
                      <p v-if="resumeError" class="mt-2 text-sm text-red-500">
                        {{ resumeError }}
                      </p>
                    </div>

                    <!-- Quick Resume Creation Form -->
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

                  <!-- Message to Employer -->
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

                  <!-- Cover Letter -->
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

                  <!-- Expected Salary -->
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

                  <!-- Contact Preference -->
                  <div>
                    <label class="block text-sm font-medium text-gray-300">
                      Предпочтительный способ связи
                    </label>
                    <select
                      v-model="formData.contact_preference"
                      class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500"
                      required
                    >
                      <option value="email">Email</option>
                      <option value="phone">Телефон</option>
                      <option value="telegram">Telegram</option>
                    </select>
                    <p
                      v-if="errors.contact_preference"
                      class="mt-1 text-sm text-red-500"
                    >
                      {{ errors.contact_preference }}
                    </p>
                  </div>

                  <!-- Start Chat Option -->
                  <div class="flex items-center">
                    <input
                      id="start_chat"
                      v-model="formData.start_chat"
                      type="checkbox"
                      class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600 rounded"
                    />
                    <label
                      for="start_chat"
                      class="ml-2 block text-sm text-gray-300"
                    >
                      Начать чат с работодателем после отправки отклика
                    </label>
                  </div>
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

          <!-- Display general errors -->
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
  contact_preference: "email",
  message: "",
  start_chat: true,
});
const errors = ref({});
const quickResume = ref({
  title: "",
  desired_position: "",
  experience_years: 0,
});

const isDev = ref(import.meta.env.DEV);

// Функция загрузки резюме - отдельная для возможности повторной попытки
const loadResumes = async () => {
  console.log("Начало загрузки резюме");
  resumesLoading.value = true;
  try {
    console.log("Получение резюме");

    // Попробуем несколько подходов для получения резюме
    let foundResumes = false;

    // Первый подход: Прямой вызов API с правильной авторизацией
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get("/api/resumes/", { headers });
      console.log("Ответ API:", response);

      const resumesData = response.data.results || response.data;
      console.log("Резюме из прямого API:", resumesData);

      if (resumesData && resumesData.length > 0) {
        resumes.value = resumesData;
        formData.value.resume = resumesData[0].id;
        console.log(
          "Выбранный ID резюме из прямого API:",
          formData.value.resume
        );
        foundResumes = true;
      }
    } catch (apiError) {
      console.error("Прямой вызов API не удался:", apiError);
    }

    // Второй подход: Использовать хранилище, если первый подход не удался
    if (!foundResumes) {
      try {
        const storeResumes = await resumesStore.fetchResumes();
        console.log("Резюме из хранилища:", storeResumes);

        if (storeResumes && storeResumes.length > 0) {
          resumes.value = storeResumes;
          formData.value.resume = storeResumes[0].id;
          console.log(
            "Выбранный ID резюме из хранилища:",
            formData.value.resume
          );
          foundResumes = true;
        }
      } catch (storeError) {
        console.error("Получение из хранилища не удалось:", storeError);
      }
    }

    // Третий подход: Попробовать другой эндпоинт API
    if (!foundResumes) {
      try {
        const response = await axios.get("/api/users/resumes/");
        console.log("Ответ альтернативного API:", response);

        const resumesData = response.data.results || response.data;
        console.log("Резюме из альтернативного API:", resumesData);

        if (resumesData && resumesData.length > 0) {
          resumes.value = resumesData;
          formData.value.resume = resumesData[0].id;
          console.log(
            "Выбранный ID резюме из альтернативного API:",
            formData.value.resume
          );
          foundResumes = true;
        }
      } catch (altApiError) {
        console.error("Вызов альтернативного API не удался:", altApiError);
      }
    }

    // Последнее средство - тестовые данные, если мы в режиме разработки и не смогли получить реальные данные
    if (!foundResumes && isDev.value) {
      console.log("Создание тестовых данных резюме для разработки");
      resumes.value = [
        { id: 1, title: "Основное резюме" },
        { id: 2, title: "Java разработчик" },
      ];
      formData.value.resume = 1;
      foundResumes = true;
    }
  } catch (error) {
    console.error("Ошибка при получении резюме:", error);
  } finally {
    resumesLoading.value = false;
    console.log(
      "Загрузка резюме завершена, найдено",
      resumes.value.length,
      "резюме"
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

  // Добавляем задержку для уверенности, что хранилище готово
  setTimeout(() => {
    loadResumes();

    // Отладочный вывод
    console.log("Статус авторизации:", {
      token: localStorage.getItem("token") ? "присутствует" : "отсутствует",
      tokenLength: localStorage.getItem("token")?.length || 0,
    });
  }, 100);
});

// Отслеживание изменений в выбранном резюме
watch(
  () => formData.value.resume,
  (newValue) => {
    console.log("Выбранное резюме изменено:", newValue);
  }
);

const handleSubmit = async () => {
  console.log("Отправка заявки с данными:", formData.value);

  // Базовая валидация
  if (!formData.value.resume) {
    errors.value.resume = "Выберите резюме";
    return;
  }

  loading.value = true;
  errors.value = {};

  try {
    const jobId = props.job.id;
    const applicationData = {
      job: jobId,
      resume: formData.value.resume,
      cover_letter: formData.value.cover_letter || "",
      expected_salary: formData.value.expected_salary || "",
      message: formData.value.message || "",
      contact_preference: formData.value.contact_preference || "email",
      start_chat: formData.value.start_chat !== false,
    };

    console.log("Отправка заявки:", applicationData);

    // Показать отладочное уведомление в режиме разработки
    if (isDev.value) {
      console.log("РЕЖИМ РАЗРАБОТКИ: Отправка заявки начата");
    }

    const result = await applicationsStore.applyForJob(jobId, applicationData);
    console.log("Заявка успешно отправлена:", result);

    // Показать сообщение об успехе в режиме разработки
    if (isDev.value) {
      alert("Заявка успешно отправлена! ID: " + result.id);
    }

    // Отправляем событие успеха с ID заявки
    emit("success", {
      withChat: formData.value.start_chat,
      conversation_id: result.conversation_id,
      applicationId: result.id,
    });
    emit("close");

    // Переход в чат с небольшой задержкой для гарантии, что модальное окно закрыто
    setTimeout(async () => {
      if (formData.value.start_chat) {
        console.log("СОЗДАНИЕ ЧАТА: Начинаем создание чата после отклика");

        try {
          // Получаем необходимые параметры
          const jobId = props.job.id;
          let employerId =
            props.job.employer_id ||
            props.job.user?.id ||
            props.job.user_id ||
            1;

          console.log(
            `СОЗДАНИЕ ЧАТА: jobId=${jobId}, employerId=${employerId}`
          );

          // Проверяем, есть ли ID диалога в результате отправки заявки
          let conversationId = result.conversation_id;

          if (conversationId) {
            console.log(
              `СОЗДАНИЕ ЧАТА: Найден ID диалога в результате: ${conversationId}`
            );

            // Сохраняем ID диалога в localStorage для надежности
            localStorage.setItem("lastCreatedChatId", conversationId);

            // Переходим в чат с этим диалогом
            console.log(
              `СОЗДАНИЕ ЧАТА: Переходим в чат с ID=${conversationId}`
            );
            router.push(`/messages/${conversationId}`);
            return;
          }

          // Если диалога нет в результате, явно создаем его через chatStore
          console.log(`СОЗДАНИЕ ЧАТА: Создаем диалог через chatStore`);

          // Обновляем список диалогов перед созданием нового
          await chatStore.fetchConversations(true);

          // Создаем новый диалог
          const conversation = await chatStore.startChatWithEmployer(
            jobId,
            employerId
          );

          if (!conversation) {
            throw new Error("Не удалось создать диалог");
          }

          conversationId = conversation.id;
          console.log(`СОЗДАНИЕ ЧАТА: Диалог создан, ID=${conversationId}`);

          if (!conversationId) {
            throw new Error("ID диалога не определен");
          }

          // Сохраняем ID диалога в localStorage
          localStorage.setItem("lastCreatedChatId", conversationId);

          // Принудительно обновляем список диалогов после создания
          await chatStore.fetchConversations(true);

          // Переходим в чат с этим диалогом
          console.log(`СОЗДАНИЕ ЧАТА: Переходим в чат с ID=${conversationId}`);
          router.push(`/messages/${conversationId}`);
        } catch (error) {
          console.error("СОЗДАНИЕ ЧАТА: Ошибка:", error);

          // Пробуем получить последний созданный диалог из localStorage
          const lastChatId = localStorage.getItem("lastCreatedChatId");
          if (lastChatId) {
            console.log(
              `СОЗДАНИЕ ЧАТА: Используем резервный ID из localStorage: ${lastChatId}`
            );
            router.push(`/messages/${lastChatId}`);
          } else {
            // В крайнем случае переходим на общую страницу чата
            console.log(
              `СОЗДАНИЕ ЧАТА: Не удалось определить ID диалога, переходим в список сообщений`
            );
            router.push("/messages");
          }
        }
      }
    }, 500);
  } catch (error) {
    console.error("Ошибка при отклике на вакансию:", error);

    if (isDev.value) {
      alert("Ошибка при отправке заявки. Проверьте консоль для деталей.");
    }

    errors.value.general =
      "Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.";
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

    const newResume = await resumesStore.createResume(resumeData);
    console.log("Резюме успешно создано:", newResume);

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
</script>
