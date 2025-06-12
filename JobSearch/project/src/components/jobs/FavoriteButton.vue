<template>
  <button
    @click.stop="toggleSave"
    :class="[
      buttonClasses,
      buttonState === 'saved' ? savedClasses : notSavedClasses,
      variant === 'icon-only' ? 'p-2' : 'px-4 py-2',
      isLoading ? 'opacity-50 cursor-not-allowed' : '',
      'hover:bg-gray-600 hover:bg-opacity-50',
    ]"
    :disabled="isLoading"
    :title="
      buttonState === 'saved' ? 'Удалить из сохраненных' : 'Сохранить вакансию'
    "
    :aria-label="
      buttonState === 'saved' ? 'Удалить из сохраненных' : 'Сохранить вакансию'
    "
    :data-job-id="jobId"
  >
    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="animate-spin">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24">
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
    </div>

    <!-- Сохраненный иконка -->
    <svg
      v-else-if="buttonState === 'saved'"
      class="w-6 h-6"
      :class="variant === 'icon-only' ? '' : 'mr-2'"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </svg>

    <!-- Несохраненная иконка -->
    <svg
      v-else
      class="w-6 h-6"
      :class="variant === 'icon-only' ? '' : 'mr-2'"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>

    <span v-if="variant !== 'icon-only'">{{
      buttonState === "saved" ? "Сохранено" : "Сохранить"
    }}</span>
  </button>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";

// Пропсы
const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) =>
      ["default", "outline", "text", "icon-only"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
});

// Выпускаем события
const emit = defineEmits(["saved", "unsaved", "error", "jobStateChanged"]);

// Сервисы
const router = useRouter();
const authStore = useAuthStore();
const savedJobsStore = useSavedJobsStore();

// Локальное состояние
const jobId = props.job.id?.toString() || "";
const isLoading = ref(false);
const buttonState = ref("unsaved");

// Классы
const buttonClasses = computed(() => {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return [
    "inline-flex items-center justify-center rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors",
    sizeClasses[props.size] || "text-sm",
  ];
});

const savedClasses = computed(() => {
  switch (props.variant) {
    case "outline":
      return "border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20";
    case "text":
      return "border-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20";
    case "icon-only":
      return "border-transparent text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800";
    default:
      return "border-transparent bg-red-600 text-white hover:bg-red-700";
  }
});

const notSavedClasses = computed(() => {
  switch (props.variant) {
    case "outline":
      return "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";
    case "text":
      return "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";
    case "icon-only":
      return "border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800";
    default:
      return "border-transparent bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600";
  }
});

// Инициализация состояния кнопки при монтировании
onMounted(() => {
  // Проверяем, сохранена ли эта конкретная вакансия
  const checkSaved = () => {
    // Проверяем наличие корректного ID вакансии
    if (!jobId) return false;

    // Проверяем массив сохраненных вакансий напрямую
    return savedJobsStore.savedJobs.some((savedJob) => {
      if (!savedJob) return false;

      const savedJobId = savedJob.id?.toString() || "";
      const nestedJobId = savedJob.job?.id?.toString() || "";

      return savedJobId === jobId || nestedJobId === jobId;
    });
  };

  // Устанавливаем начальное состояние
  buttonState.value = checkSaved() ? "saved" : "unsaved";

  console.log(
    `Компонент FavoriteButton смонтирован для вакансии ${jobId}, начальное состояние: ${buttonState.value}`
  );
});

// Обработка сохранения/отмены сохранения
const toggleSave = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Перенаправление на страницу входа, если пользователь не аутентифицирован
  if (!authStore.isAuthenticated) {
    router.push({
      path: "/login",
      query: { redirect: router.currentRoute.value.fullPath },
    });
    return;
  }

  // Предотвращение множественных кликов
  if (isLoading.value) return;

  // Получение текущего состояния
  const currentState = buttonState.value;
  const isSaved = currentState === "saved";

  console.log(
    `Переключение сохранения для вакансии ${jobId}. Текущее состояние: ${currentState}`
  );
  isLoading.value = true;

  try {
    // Переключение состояния мгновенно для отзывчивости интерфейса
    buttonState.value = isSaved ? "unsaved" : "saved";

    // Взаимодействие с хранилищем
    if (isSaved) {
      // Отменяем сохранение вакансии
      await savedJobsStore.unsaveJob(props.job.id);
      console.log(`Вакансия ${jobId} успешно удалена из сохраненных`);
      emit("unsaved", props.job.id);
    } else {
      // Сохраняем вакансию
      if (!props.job || !jobId) {
        throw new Error("Неверные данные вакансии");
      }
      await savedJobsStore.saveJob(props.job);
      console.log(`Вакансия ${jobId} успешно сохранена`);
      emit("saved", props.job.id);
    }

    // Отправляем событие об изменении состояния вакансии для родительских компонентов
    emit("jobStateChanged", {
      jobId: props.job.id,
      isSaved: buttonState.value === "saved",
    });

    // Обновляем хранилище сохраненных вакансий для обеспечения актуальности данных во всех компонентах
    savedJobsStore.refreshSavedJobs();
  } catch (error) {
    console.error(
      `Ошибка при переключении состояния сохранения вакансии ${jobId}:`,
      error
    );

    // Возвращаем предыдущее состояние при ошибке
    buttonState.value = currentState;
    emit("error", error.message || "Не удалось обновить статус сохранения");
  } finally {
    isLoading.value = false;
  }
};
</script>
