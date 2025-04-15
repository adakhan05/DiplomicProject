<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 sm:px-0 mb-8">
      <h2 class="text-2xl font-bold text-white">
        {{ isEditing ? "Редактировать резюме" : "Создать резюме" }}
      </h2>
      <p class="mt-2 text-sm text-gray-400">
        Заполните информацию о себе и своем опыте
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-gray-800 shadow-sm rounded-lg p-6">
        <!-- Основная информация -->
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-300">
              Название резюме *
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              placeholder="Например: Senior Python Developer"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Желаемая должность *
            </label>
            <input
              v-model="form.desired_position"
              type="text"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              placeholder="Например: Frontend Developer"
            />
            <p class="mt-1 text-sm text-red-400" v-if="errors.desired_position">
              {{ errors.desired_position }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Профессиональное резюме *
            </label>
            <textarea
              v-model="form.professional_summary"
              rows="4"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
              placeholder="Опишите ваш опыт и ключевые достижения"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Ожидаемая зарплата (₽)
            </label>
            <input
              v-model.number="form.salary_expectation"
              type="number"
              min="0"
              step="1000"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Предпочитаемый тип занятости *
            </label>
            <select
              v-model="form.preferred_employment"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            >
              <option value="full_time">Полная занятость</option>
              <option value="part_time">Частичная занятость</option>
              <option value="remote">Удаленная работа</option>
              <option value="contract">Контракт</option>
            </select>
          </div>

          <!-- Навыки -->
          <div>
            <label class="block text-sm font-medium text-gray-300"
              >Навыки</label
            >
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="(skill, index) in form.skills"
                :key="index"
                class="inline-flex items-center bg-gray-700 px-3 py-1 rounded-full"
              >
                <span class="text-white">{{ skill }}</span>
                <button
                  type="button"
                  @click="removeSkill(index)"
                  class="ml-2 text-gray-400 hover:text-red-400"
                >
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="newSkill"
                  @keydown.enter.prevent="addSkill"
                  type="text"
                  placeholder="Добавить навык"
                  class="inline-flex items-center bg-gray-700 px-3 py-1 rounded-full text-white focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  @click="addSkill"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Языки -->
          <div>
            <label class="block text-sm font-medium text-gray-300">Языки</label>
            <div class="mt-2 space-y-3">
              <div
                v-for="(lang, index) in form.languages"
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="lang.language"
                  type="text"
                  placeholder="Язык"
                  class="flex-1 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                />
                <select
                  v-model="lang.level"
                  class="rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                >
                  <option value="beginner">Начальный</option>
                  <option value="intermediate">Средний</option>
                  <option value="advanced">Продвинутый</option>
                  <option value="native">Родной</option>
                </select>
                <button
                  type="button"
                  @click="removeLanguage(index)"
                  class="text-gray-400 hover:text-red-400"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
              <button
                type="button"
                @click="addLanguage"
                class="inline-flex items-center text-green-400 hover:text-green-500"
              >
                <span class="material-icons text-sm mr-1">add</span>
                Добавить язык
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Загрузка PDF резюме -->
      <div class="bg-gray-800 shadow-sm rounded-lg p-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300">
              Загрузить резюме (PDF)
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Загрузите ваше резюме в формате PDF (макс. 5MB)
            </p>
            <div class="flex items-center space-x-4">
              <label
                for="resume-file"
                class="cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center"
              >
                <span class="material-icons mr-2">upload_file</span>
                Выбрать файл
              </label>
              <input
                type="file"
                id="resume-file"
                ref="fileInput"
                @change="handleFileUpload"
                accept="application/pdf"
                class="hidden"
              />
              <span v-if="form.resume_file" class="text-green-400 text-sm">
                {{ form.resume_file.name }}
              </span>
              <button
                v-if="form.resume_file"
                @click="removeFile"
                type="button"
                class="text-red-400 hover:text-red-300"
              >
                <span class="material-icons">delete</span>
              </button>
            </div>
            <div v-if="fileError" class="mt-2 text-red-500 text-sm">
              {{ fileError }}
            </div>
            <div v-if="form.resume_url" class="mt-2">
              <p class="text-sm text-gray-300">Текущий файл резюме:</p>
              <div class="flex items-center mt-1">
                <a
                  :href="form.resume_url"
                  target="_blank"
                  class="text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <span class="material-icons mr-1">description</span>
                  Просмотреть PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$router.back()"
          class="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Сохранение..." : isEditing ? "Сохранить" : "Создать" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

const route = useRoute();
const router = useRouter();
const isEditing = computed(() => !!route.params.id);
const loading = ref(false);
const errors = ref({});
const newSkill = ref("");
const fileError = ref("");
const fileInput = ref(null);

const form = ref({
  title: "",
  desired_position: "",
  professional_summary: "",
  salary_expectation: null,
  preferred_employment: "full_time",
  skills: [],
  languages: [],
  resume_file: null,
  resume_url: null,
});

watch(
  form,
  () => {
    errors.value = {
      desired_position: "",
      title: "",
      professional_summary: "",
    };
  },
  { deep: true }
);

const addSkill = () => {
  if (newSkill.value.trim()) {
    form.value.skills.push(newSkill.value.trim());
    newSkill.value = "";
  }
};

const removeSkill = (index) => {
  form.value.skills.splice(index, 1);
};

const addLanguage = () => {
  form.value.languages.push({
    language: "",
    level: "beginner",
  });
};

const removeLanguage = (index) => {
  form.value.languages.splice(index, 1);
};

// Обработка загрузки файла
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  fileError.value = "";

  if (!file) return;

  // Проверяем, что файл в формате PDF
  if (file.type !== "application/pdf") {
    fileError.value = "Файл должен быть в формате PDF";
    return;
  }

  // Проверяем размер файла (максимум 5MB)
  if (file.size > 5 * 1024 * 1024) {
    fileError.value = "Размер файла не должен превышать 5MB";
    return;
  }

  form.value.resume_file = file;
};

const removeFile = () => {
  form.value.resume_file = null;
  if (form.value.resume_url && !isEditing.value) {
    form.value.resume_url = null;
  }
  // Сбрасываем поле ввода файла
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const handleSubmit = async () => {
  try {
    loading.value = true;
    errors.value = {};

    // Создаем объект FormData для поддержки загрузки файлов
    const formData = new FormData();

    // Добавляем все поля формы в FormData
    for (const key in form.value) {
      if (key === "skills") {
        formData.append(key, JSON.stringify(form.value.skills));
      } else if (key === "languages") {
        formData.append(key, JSON.stringify(form.value.languages));
      } else if (key === "resume_file" && form.value.resume_file) {
        // Используем имя файла с временной меткой, чтобы избежать конфликтов
        const timestamp = new Date().getTime();
        const fileName = `resume_${timestamp}_${form.value.resume_file.name}`;

        // Добавляем файл с правильным именем
        formData.append("resume_file", form.value.resume_file, fileName);
      } else if (
        key !== "resume_file" &&
        form.value[key] !== null &&
        form.value[key] !== undefined
      ) {
        formData.append(key, form.value[key]);
      }
    }

    // Логируем данные формы для отладки (только в режиме разработки)
    if (import.meta.env.DEV) {
      console.log("Отправка данных формы:");
      for (const pair of formData.entries()) {
        console.log(
          pair[0] + ": " + (pair[1] instanceof File ? pair[1].name : pair[1])
        );
      }
    }

    let response;
    if (isEditing.value) {
      response = await axios.put(
        `/api/users/resumes/${route.params.id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } else {
      response = await axios.post("/api/users/resumes/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    if (response && response.data) {
      // Проверяем, содержит ли ответ URL загруженного файла резюме
      if (response.data.resume_file_url) {
        // Сохраняем сообщение об успешной загрузке, если нужно
        console.log(
          "Файл резюме успешно загружен:",
          response.data.resume_file_url
        );
      }
    }

    // Переходим к списку резюме после успешного сохранения
    router.push("/resumes");
  } catch (error) {
    console.error("Ошибка загрузки данных резюме:", error);

    if (error.response && error.response.data) {
      errors.value = error.response.data;

      // Проверяем наличие ошибок при загрузке файла
      if (error.response.data.resume_file) {
        fileError.value = Array.isArray(error.response.data.resume_file)
          ? error.response.data.resume_file.join(", ")
          : error.response.data.resume_file;
      }
    } else {
      // Общая ошибка
      alert(
        "Произошла ошибка при сохранении резюме. Пожалуйста, попробуйте снова."
      );
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // Если редактируем, загружаем существующие данные резюме
  if (isEditing.value) {
    try {
      loading.value = true;
      // Убеждаемся, что используем правильный API-эндпоинт
      const response = await axios.get(
        `/api/users/resumes/${route.params.id}/`
      );
      const resumeData = response.data;

      // Заполняем форму существующими данными
      form.value.title = resumeData.title || "";
      form.value.desired_position = resumeData.desired_position || "";
      form.value.professional_summary = resumeData.professional_summary || "";
      form.value.salary_expectation = resumeData.salary_expectation || null;
      form.value.preferred_employment =
        resumeData.preferred_employment || "full_time";

      // Обрабатываем массив навыков
      form.value.skills = Array.isArray(resumeData.skills)
        ? resumeData.skills
        : typeof resumeData.skills === "string"
        ? JSON.parse(resumeData.skills)
        : [];

      // Обрабатываем массив языков
      form.value.languages = Array.isArray(resumeData.languages)
        ? resumeData.languages
        : typeof resumeData.languages === "string"
        ? JSON.parse(resumeData.languages)
        : [];

      // Проверяем, есть ли URL файла резюме в формате PDF
      if (resumeData.resume_file_url) {
        form.value.resume_url = resumeData.resume_file_url;
      }
    } catch (error) {
      console.error("Error loading resume data:", error);
      alert("Не удалось загрузить данные резюме");
    } finally {
      loading.value = false;
    }
  }
});
</script>
