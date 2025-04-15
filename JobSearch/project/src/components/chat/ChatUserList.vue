<template>
  <div
    class="chat-users bg-white rounded-lg shadow-lg p-4 h-[600px] flex flex-col"
  >
    <h3 class="text-lg font-semibold mb-4">Сообщения</h3>

    <!-- Поиск пользователей -->
    <div class="mb-4">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Поиск пользователей..."
        class="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
      />
    </div>

    <!-- Список пользователей -->
    <div class="users-list flex-grow overflow-y-auto">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        @click="$emit('select-user', user)"
        :class="[
          'user-item p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-50',
          selectedUser?.id === user.id ? 'bg-blue-50' : '',
        ]"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium">
              {{ user.first_name }} {{ user.last_name }}
            </h4>
            <p class="text-sm text-gray-600" v-if="user.company_name">
              {{ user.company_name }}
            </p>
            <p class="text-sm text-gray-500" v-if="user.position">
              {{ user.position }}
            </p>
          </div>
          <div v-if="user.unread_count > 0" class="unread-badge">
            <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {{ user.unread_count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

export default {
  name: "ChatUserList",
  props: {
    selectedUser: {
      type: Object,
      default: null,
    },
  },
  emits: ["select-user"],
  setup() {
    const users = ref([]);
    const searchQuery = ref("");

    const loadUsers = async () => {
      try {
        const response = await axios.get("/api/chat/conversations/");
        users.value = response.data;
      } catch (error) {
        console.error("Ошибка загрузки пользователей:", error);
      }
    };

    const filteredUsers = computed(() => {
      const query = searchQuery.value.toLowerCase();
      return users.value.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const company = (user.company_name || "").toLowerCase();
        return fullName.includes(query) || company.includes(query);
      });
    });

    // Загрузка пользователей при монтировании компонента
    onMounted(() => {
      loadUsers();
    });

    return {
      users,
      searchQuery,
      filteredUsers,
    };
  },
};
</script>

<style scoped>
.users-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.users-list::-webkit-scrollbar {
  width: 6px;
}

.users-list::-webkit-scrollbar-track {
  background: transparent;
}

.users-list::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.user-item:hover {
  transition: background-color 0.2s ease;
}
</style>
