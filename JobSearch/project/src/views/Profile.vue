<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="text-gray-400 mb-4">Информация о вашем профиле</div>

    <div class="bg-gray-800 rounded-lg shadow-sm p-6 relative">
      <!-- Заголовок -->
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white">Профиль</h3>
        <div class="flex space-x-2">
          <button
            v-if="!isEditing"
            @click="startEditing"
            class="text-green-400 hover:text-green-500"
          >
            Редактировать
          </button>
        </div>
      </div>

      <!-- Форма редактирования -->
      <form v-if="isEditing" @submit.prevent="saveProfile" class="space-y-6">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-300">
              Имя пользователя
            </label>
            <input
              v-model="form.username"
              type="text"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300"> Имя </label>
            <input
              v-model="form.first_name"
              type="text"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Фамилия
            </label>
            <input
              v-model="form.last_name"
              type="text"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Телефон
            </label>
            <input
              v-model="form.phone"
              type="tel"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div v-if="isEmployer">
            <label class="block text-sm font-medium text-gray-300">
              Название компании
            </label>
            <input
              v-model="form.company_name"
              type="text"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Должность
            </label>
            <input
              v-model="form.position"
              type="text"
              class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300">О себе</label>
          <textarea
            v-model="form.bio"
            rows="4"
            class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="cancelEditing"
            class="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
          >
            Отмена
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            {{ loading ? "Сохранение..." : "Сохранить" }}
          </button>
        </div>
      </form>

      <!-- Информация профиля -->
      <div v-else class="space-y-6">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-300">
              Имя пользователя
            </label>
            <p class="mt-1 text-sm text-white">{{ username }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">Email</label>
            <p class="mt-1 text-sm text-white">{{ user.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">Имя</label>
            <p class="mt-1 text-sm text-white">
              {{ user.first_name || "Не указано" }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Фамилия
            </label>
            <p class="mt-1 text-sm text-white">
              {{ user.last_name || "Не указана" }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Телефон
            </label>
            <p class="mt-1 text-sm text-white">
              {{ user.phone || "Не указан" }}
            </p>
          </div>

          <div v-if="isEmployer">
            <label class="block text-sm font-medium text-gray-300">
              Название компании
            </label>
            <p class="mt-1 text-sm text-white">
              {{ user.company_name || "Не указано" }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">
              Должность
            </label>
            <p class="mt-1 text-sm text-white">
              {{ user.position || "Не указана" }}
            </p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300">О себе</label>
          <p class="mt-1 text-sm text-white">{{ user.bio || "Не указано" }}</p>
        </div>
      </div>
    </div>

    <!-- Сообщение об успешном сохранении -->
    <div
      v-if="showSuccess"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg"
    >
      Профиль успешно обновлен
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";

const authStore = useAuthStore();
const user = ref(authStore.user || {});
const isEditing = ref(false);
const loading = ref(false);
const showSuccess = ref(false);

// Убедитесь, что мы получаем последние данные пользователя
onMounted(async () => {
  await authStore.getUserProfile();
  user.value = authStore.user || {};
});

const isEmployer = computed(() => authStore.isEmployer);
const username = computed(
  () => authStore.username || user.value?.username || "Требуется логин"
);

const form = ref({
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  company_name: "",
  position: "",
  bio: "",
});

const startEditing = () => {
  form.value = { ...user.value };
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  form.value = { ...user.value };
};

const saveProfile = async () => {
  try {
    loading.value = true;
    const response = await axios.put(
      `/api/users/profile/${authStore.user.id}/`,
      form.value
    );
    user.value = response.data;
    authStore.setUser(response.data);
    isEditing.value = false;
    showSuccess.value = true;
    setTimeout(() => {
      showSuccess.value = false;
    }, 3000);
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error);
  } finally {
    loading.value = false;
  }
};
</script>
