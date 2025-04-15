<template>
  <div
    class="chat-window bg-white rounded-lg shadow-lg p-4 h-[600px] flex flex-col"
  >
    <!-- Chat Header -->
    <div class="chat-header border-b pb-3 mb-4">
      <div
        class="flex justify-between items-center p-4 border-b border-gray-700"
      >
        <div class="flex items-center">
          <h2 class="text-xl font-semibold text-white">
            {{
              conversation?.other_user?.first_name ||
              conversation?.employer_name ||
              conversation?.jobseeker_name ||
              "Чат"
            }}
          </h2>
          <span
            v-if="conversation?.job?.title"
            class="ml-2 text-sm text-gray-400"
          >
            ({{ conversation.job.title }})
          </span>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="$emit('delete-conversation', conversation.id)"
            class="text-gray-400 hover:text-red-500"
          >
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Chat Messages -->
    <div
      class="messages-container flex-grow overflow-y-auto mb-4"
      ref="messagesContainer"
    >
      <div v-if="messages.length === 0" class="text-center text-gray-500 mt-4">
        Нет сообщений. Начните диалог!
      </div>
      <div v-for="message in messages" :key="message.id" class="mb-4">
        <div
          :class="[
            'message',
            'rounded-lg',
            'p-3',
            'max-w-[70%]',
            message.sender.id === currentUser.id
              ? 'ml-auto bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800',
          ]"
        >
          <div
            class="message-text"
            v-html="formatMessageText(message.content)"
          ></div>
          <span class="text-xs opacity-75 block mt-1">
            {{ formatDate(message.created_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input mt-auto">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Введите ваше сообщение..."
          class="flex-grow p-2 border rounded-lg focus:outline-none focus:border-blue-500"
          :disabled="!selectedUser"
        />
        <button
          type="submit"
          class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          :disabled="!selectedUser || !newMessage.trim()"
        >
          Отправить
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";

export default {
  name: "ChatWindow",
  props: {
    selectedUser: {
      type: Object,
      default: null,
    },
    currentUser: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const messages = ref([]);
    const newMessage = ref("");
    const messagesContainer = ref(null);

    const loadMessages = async () => {
      if (!props.selectedUser) return;
      try {
        const response = await axios.get(
          `/api/chat/with_user/?user_id=${props.selectedUser.id}`
        );
        messages.value = response.data;
        scrollToBottom();
      } catch (error) {
        console.error("Ошибка загрузки сообщений:", error);
      }
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !props.selectedUser) return;

      try {
        const response = await axios.post("/api/chat/", {
          content: newMessage.value,
          recipient: props.selectedUser.id,
        });
        messages.value.push(response.data);
        newMessage.value = "";
        scrollToBottom();
      } catch (error) {
        console.error("Ошибка отправки сообщения:", error);
      }
    };

    const scrollToBottom = () => {
      setTimeout(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop =
            messagesContainer.value.scrollHeight;
        }
      }, 100);
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const formatMessageText = (text) => {
      if (!text) return "";

      // Проверяем, содержит ли сообщение информацию о резюме
      if (text.includes("Моё резюме:")) {
        // Разделяем текст на части
        const [message, resume] = text.split("\n\nМоё резюме:");

        // Возвращаем отформатированное сообщение с резюме в стилизованном блоке
        return `
          <div>${message}</div>
          <div class="mt-2 p-2 bg-gray-700 rounded-md">
            <div class="font-medium text-gray-300">Моё резюме:</div>
            ${resume.replace(/\n/g, "<br>")}
          </div>
        `;
      }

      return text;
    };

    watch(
      () => props.selectedUser,
      (newUser) => {
        if (newUser) {
          loadMessages();
        } else {
          messages.value = [];
        }
      }
    );

    onMounted(() => {
      if (props.selectedUser) {
        loadMessages();
      }
    });

    return {
      messages,
      newMessage,
      messagesContainer,
      sendMessage,
      formatDate,
      formatMessageText,
    };
  },
};
</script>

<style scoped>
.messages-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
</style>
