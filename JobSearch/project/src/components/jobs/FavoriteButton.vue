<template>
  <button
    @click.stop="toggleSave"
    :class="[
      buttonClasses,
      isSaved ? savedClasses : notSavedClasses,
      variant === 'icon-only' ? 'p-2' : 'px-4 py-2',
      loading ? 'opacity-50 cursor-not-allowed' : '',
      'hover:bg-gray-600 hover:bg-opacity-50',
    ]"
    :disabled="loading"
    :title="isSaved ? 'Удалить из сохраненных' : 'Сохранить вакансию'"
    :aria-label="isSaved ? 'Удалить из сохраненных' : 'Сохранить вакансию'"
  >
    <!-- Loading Indicator -->
    <div v-if="loading" class="animate-spin">
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

    <!-- Saved Icon -->
    <svg
      v-else-if="isSaved"
      class="w-6 h-6"
      :class="variant === 'icon-only' ? '' : 'mr-2'"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </svg>

    <!-- Unsaved Icon -->
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
      isSaved ? "Сохранено" : "Сохранить"
    }}</span>
  </button>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";

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

const emit = defineEmits(["saved", "unsaved", "error"]);

const router = useRouter();
const authStore = useAuthStore();
const savedJobsStore = useSavedJobsStore();
const loading = ref(false);

const localSaved = ref(savedJobsStore.isSaved(props.job.id));

watch(
  () => savedJobsStore.isSaved(props.job.id),
  (newValue) => {
    localSaved.value = newValue;
  }
);

const isSaved = computed(() => localSaved.value);

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

onMounted(() => {
  localSaved.value = savedJobsStore.isSaved(props.job.id);
  console.log(
    `FavoriteButton установлен для вакансии: ${
      props.job.id
    }, Начальное состояние: ${localSaved.value ? "СОХРАНЕНО" : "НЕ СОХРАНЕНО"}`
  );
});

const toggleSave = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!authStore.isAuthenticated) {
    router.push({
      path: "/login",
      query: { redirect: router.currentRoute.value.fullPath },
    });
    return;
  }

  if (loading.value) return;

  const jobId = props.job.id;
  const currentlySaved = localSaved.value;

  console.log(
    `Переключение сохранения для вакансии ${jobId}. Текущий статус: ${currentlySaved}`
  );
  loading.value = true;

  try {
    // Немедленное обновление состояния интерфейса для лучшей обратной связи
    localSaved.value = !currentlySaved;

    // Использование нового метода toggleSaved, если он доступен
    if (typeof savedJobsStore.toggleSaved === "function") {
      const result = await savedJobsStore.toggleSaved(jobId, props.job);
      console.log(
        `Вакансия ${jobId} результат переключения: ${
          result ? "сохранена" : "удалена из сохраненных"
        }`
      );

      // Убедиться, что локальное состояние соответствует фактическому результату
      localSaved.value = result;

      // Вызвать соответствующее событие
      if (result) {
        emit("saved", jobId);
      } else {
        emit("unsaved", jobId);
      }
    } else {
      // Запасной вариант со старой логикой
      if (currentlySaved) {
        console.log(`Вызов метода хранилища unsaveJob(${jobId})`);
        await savedJobsStore.unsaveJob(jobId);
        console.log(`Вакансия ${jobId} успешно удалена из сохраненных.`);
        emit("unsaved", jobId);
      } else {
        if (!props.job || !props.job.id) {
          throw new Error("Данные о вакансии отсутствуют или некорректны.");
        }
        console.log(`Вызов метода хранилища saveJob с данными:`, props.job);
        await savedJobsStore.saveJob(props.job);
        console.log(`Вакансия ${jobId} успешно сохранена.`);
        emit("saved", jobId);
      }
    }
  } catch (error) {
    console.error(
      `Ошибка при переключении состояния сохранения для вакансии ${jobId}:`,
      error
    );
    // Возврат к исходному состоянию при ошибке
    localSaved.value = currentlySaved;
    emit("error", error.message || "Не удалось обновить статус сохранения");
  } finally {
    loading.value = false;
  }
};
</script>
