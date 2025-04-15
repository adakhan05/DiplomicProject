<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-6">Создать вакансию</h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700"
          >Название должности</label
        >
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Например: Senior Python Developer"
        />
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            for="salary_min"
            class="block text-sm font-medium text-gray-700"
            >Минимальная зарплата</label
          >
          <input
            id="salary_min"
            v-model.number="form.salary_min"
            type="number"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            for="salary_max"
            class="block text-sm font-medium text-gray-700"
            >Максимальная зарплата</label
          >
          <input
            id="salary_max"
            v-model.number="form.salary_max"
            type="number"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label for="location" class="block text-sm font-medium text-gray-700"
          >Местоположение</label
        >
        <input
          id="location"
          v-model="form.location"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Например: Москва"
        />
      </div>

      <div>
        <label
          for="employment_type"
          class="block text-sm font-medium text-gray-700"
          >Тип занятости</label
        >
        <select
          id="employment_type"
          v-model="form.employment_type"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="full_time">Полный день</option>
          <option value="part_time">Частичная занятость</option>
          <option value="remote">Удаленная работа</option>
          <option value="contract">Контракт</option>
        </select>
      </div>

      <div>
        <label for="experience" class="block text-sm font-medium text-gray-700"
          >Требуемый опыт</label
        >
        <select
          id="experience"
          v-model="form.experience"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="no_experience">Без опыта</option>
          <option value="1-3">1-3 года</option>
          <option value="3-5">3-5 лет</option>
          <option value="5+">Более 5 лет</option>
        </select>
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700"
          >Описание вакансии</label
        >
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Опишите обязанности и условия работы"
        ></textarea>
      </div>

      <div>
        <label
          for="requirements"
          class="block text-sm font-medium text-gray-700"
          >Требования к кандидату</label
        >
        <textarea
          id="requirements"
          v-model="form.requirements"
          rows="4"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Перечислите необходимые навыки и требования"
        ></textarea>
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {{ loading ? "Создание..." : "Создать вакансию" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useJobStore } from "@/stores/job";

const router = useRouter();
const jobStore = useJobStore();
const loading = ref(false);

const form = ref({
  title: "",
  location: "",
  salary_min: "",
  salary_max: "",
  description: "",
  requirements: "",
  employment_type: "full_time",
  experience: "no_experience",
});

const handleSubmit = async () => {
  try {
    loading.value = true;
    await jobStore.createJob(form.value);
    router.push("/jobs");
  } catch (error) {
    console.error("Error creating job:", error);
    // Здесь можно добавить обработку ошибок и показ уведомлений
  } finally {
    loading.value = false;
  }
};
</script>
