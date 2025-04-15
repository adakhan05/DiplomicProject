<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="bg-gray-900 rounded-lg overflow-hidden">
      <!-- Hero Section -->
      <div class="px-6 py-12 md:py-16 lg:py-20 text-center sm:text-left">
        <h1
          class="text-4xl sm:text-5xl font-extrabold tracking-tight text-white"
        >
          Найдите работу вашей мечты
        </h1>
        <p class="mt-6 text-xl text-gray-300 max-w-3xl">
          Сервис поиска работы, который поможет вам найти идеальную вакансию или
          отличного кандидата
        </p>
        <div
          class="mt-8 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start"
        >
          <router-link
            v-if="isEmployer"
            to="/jobs/create"
            class="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Создать вакансию
          </router-link>
          <router-link
            v-else
            to="/jobs"
            class="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Найти вакансии
          </router-link>
          <router-link
            to="/register"
            v-if="!isAuthenticated"
            class="px-8 py-3 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Создать аккаунт
          </router-link>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="mt-12 px-4 sm:px-0">
      <h2 class="text-3xl font-bold text-white text-center">
        Возможности платформы
      </h2>
      <div class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <!-- For Job Seekers -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <div
            class="h-12 w-12 flex items-center justify-center rounded-md bg-green-500 text-white"
          >
            <span class="material-icons">search</span>
          </div>
          <h3 class="mt-4 text-xl font-medium text-white">Для соискателей</h3>
          <ul class="mt-4 space-y-3 text-gray-400">
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Создание резюме с подробной информацией</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Поиск вакансий по разным критериям</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Сохранение интересных вакансий</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Общение с работодателями</span>
            </li>
          </ul>
        </div>

        <!-- For Employers -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <div
            class="h-12 w-12 flex items-center justify-center rounded-md bg-green-500 text-white"
          >
            <span class="material-icons">business</span>
          </div>
          <h3 class="mt-4 text-xl font-medium text-white">Для работодателей</h3>
          <ul class="mt-4 space-y-3 text-gray-400">
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Публикация вакансий с детальным описанием</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Поиск кандидатов по навыкам и опыту</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Управление откликами на вакансии</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Связь с потенциальными сотрудниками</span>
            </li>
          </ul>
        </div>

        <!-- Additional Features -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <div
            class="h-12 w-12 flex items-center justify-center rounded-md bg-green-500 text-white"
          >
            <span class="material-icons">forum</span>
          </div>
          <h3 class="mt-4 text-xl font-medium text-white">Дополнительно</h3>
          <ul class="mt-4 space-y-3 text-gray-400">
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Удобный чат для общения</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Статистика по вашим резюме и вакансиям</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Рекомендации подходящих вакансий</span>
            </li>
            <li class="flex items-start">
              <span class="material-icons text-green-500 mr-2">check</span>
              <span>Уведомления о новых сообщениях и откликах</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isEmployer = computed(
  () => isAuthenticated.value && authStore.user?.profile?.role === "employer"
);
</script>
