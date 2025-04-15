<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="bg-gray-800 shadow sm:rounded-lg overflow-hidden">
      <div class="flex h-[calc(100vh-12rem)]">
        <!-- Conversation list -->
        <div class="w-1/3 border-r border-gray-700 flex flex-col">
          <div
            class="p-4 border-b border-gray-700 bg-gray-900 flex items-center justify-between"
          >
            <h2 class="text-lg font-medium text-white">Сообщения</h2>
            <div class="flex items-center">
              <button
                @click="refreshConversations"
                class="text-gray-300 hover:text-white mr-2"
                :disabled="loading"
              >
                <span class="material-icons text-lg">refresh</span>
              </button>
              <button
                v-if="isDev"
                @click="fullReload"
                class="text-green-500 hover:text-green-400 text-xs mr-2"
                title="Принудительная перезагрузка всех данных чата"
              >
                ПЕРЕЗАГРУЗИТЬ
              </button>
              <span
                v-if="totalUnread > 0"
                class="bg-green-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full"
              >
                {{ totalUnread }}
              </span>
            </div>
          </div>

          <div class="overflow-y-auto flex-grow">
            <div v-if="loading" class="p-4 text-center">
              <div
                class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"
              ></div>
              <p class="mt-2 text-sm text-gray-400">Загрузка сообщений...</p>
            </div>

            <div
              v-else-if="conversations.length === 0"
              class="p-4 text-center text-gray-400"
            >
              <span class="material-icons text-4xl mb-2">forum</span>
              <p>У вас пока нет сообщений</p>
              <p class="text-sm mt-1">
                Начните диалог с работодателем или соискателем
              </p>
            </div>

            <div v-else>
              <div
                v-for="(conversation, index) in conversations"
                :key="conversation.id"
                @click="selectConversation(conversation.id)"
                class="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700"
                :class="{
                  'bg-gray-700': selectedConversationId === conversation.id,
                }"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium text-white">
                      {{ getUserName(conversation) }}
                    </p>
                    <p
                      v-if="conversation.job"
                      class="text-sm text-gray-400 mt-1"
                    >
                      {{ conversation.job.title }}
                    </p>
                  </div>
                  <div class="flex flex-col items-end">
                    <span class="text-xs text-gray-400">
                      {{ formatTime(conversation.last_message_time) }}
                    </span>
                    <span
                      v-if="conversation.unread > 0"
                      class="bg-green-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full mt-1"
                    >
                      {{ conversation.unread }}
                    </span>
                    <button
                      @click.stop="deleteConversation(conversation.id)"
                      class="text-gray-400 hover:text-red-500"
                    >
                      <span class="material-icons text-base">delete</span>
                    </button>
                  </div>
                </div>
                <p class="text-gray-300 text-sm truncate mt-1">
                  {{ conversation.last_message }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Message area -->
        <div class="w-2/3 flex flex-col">
          <!-- Conversation header -->
          <div
            v-if="selectedConversation"
            class="p-4 border-b border-gray-700 bg-gray-900"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-medium text-white">
                  {{ getUserName(selectedConversation) }}
                </h3>
                <p
                  v-if="selectedConversation.job"
                  class="text-sm text-gray-400"
                >
                  {{ selectedConversation.job.title }}
                  <button
                    v-if="selectedConversation.job.id !== 9999"
                    @click="viewJob(selectedConversation.job.id)"
                    class="text-green-500 hover:underline ml-2"
                  >
                    Открыть вакансию
                  </button>
                  <span
                    v-else
                    class="ml-2 text-xs px-2 py-1 bg-yellow-800 text-yellow-300 rounded-full"
                    title="Тестовая вакансия, созданная для демонстрации функциональности"
                  >
                    DEMO
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Message content area -->
          <div
            v-if="!selectedConversation"
            class="flex-grow flex items-center justify-center p-4 text-center text-gray-400"
          >
            <div>
              <span class="material-icons text-5xl mb-3">chat</span>
              <p>Выберите диалог для просмотра сообщений</p>
            </div>
          </div>

          <div
            v-else
            class="flex-grow overflow-y-auto p-4"
            ref="messagesContainer"
          >
            <!-- Messages content -->
            <div v-if="loadingMessages" class="text-center p-4">
              <div
                class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"
              ></div>
              <p class="mt-2 text-sm text-gray-400">Загрузка сообщений...</p>
            </div>

            <div
              v-else-if="messages.length === 0"
              class="text-center p-4 text-gray-400"
            >
              <p>Нет сообщений в этом диалоге</p>
              <p class="text-sm mt-1">Напишите первое сообщение ниже</p>
            </div>

            <div v-else>
              <div
                v-for="(message, index) in messages"
                :key="message.id"
                class="mb-4 max-w-[75%]"
                :style="{
                  marginLeft: isEmployer
                    ? message.sender === 1
                      ? 'auto'
                      : '0'
                    : message.sender === 2
                    ? 'auto'
                    : '0',
                }"
              >
                <div class="flex items-start">
                  <div
                    class="p-3 rounded-lg inline-block relative group"
                    :style="{
                      backgroundColor: isEmployer
                        ? message.sender === 1
                          ? '#059669'
                          : '#374151'
                        : message.sender === 2
                        ? '#059669'
                        : '#374151',
                      color: 'white',
                      borderRadius: '12px',
                      border: isEmployer
                        ? message.sender === 1
                          ? '1px solid #047857'
                          : '1px solid #4b5563'
                        : message.sender === 2
                        ? '1px solid #047857'
                        : '1px solid #4b5563',
                    }"
                  >
                    <div
                      v-html="formatMessageWithLinks(message.text)"
                      class="message-content"
                    ></div>

                    <!-- Delete button only for user's messages -->
                    <button
                      v-if="
                        (isEmployer && message.sender === 1) ||
                        (!isEmployer && message.sender === 2)
                      "
                      @click.stop="showDeleteConfirm(message)"
                      class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white/100 transition-opacity"
                      title="Удалить сообщение"
                    >
                      <span class="material-icons text-xs">delete</span>
                    </button>
                  </div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ formatTime(message.created_at) }}
                  <span
                    v-if="
                      (isEmployer && message.sender === 1) ||
                      (!isEmployer && message.sender === 2)
                    "
                    class="ml-1"
                  >
                    <span v-if="message.is_read" class="material-icons text-xs"
                      >done_all</span
                    >
                    <span v-else class="material-icons text-xs">done</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Message input area -->
          <div
            v-if="selectedConversation"
            class="p-4 border-t border-gray-700 bg-gray-900"
          >
            <form @submit.prevent="sendMessage" class="flex">
              <input
                v-model="newMessage"
                type="text"
                class="flex-grow rounded-l-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                placeholder="Введите сообщение..."
                :disabled="sendingMessage"
              />
              <button
                type="submit"
                class="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                :disabled="!newMessage.trim() || sendingMessage"
              >
                <span v-if="sendingMessage" class="flex items-center">
                  <svg
                    class="animate-spin h-5 w-5 mr-2"
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
                <span v-else class="material-icons">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Custom confirmation dialog -->
  <div v-if="showConfirmDialog" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 text-center">
      <div
        class="fixed inset-0 transition-opacity"
        @click="showConfirmDialog = false"
      >
        <div class="absolute inset-0 bg-gray-900 opacity-75"></div>
      </div>

      <div
        class="bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full border border-gray-700"
      >
        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-white">
                Подтвердите действие на localhost:5173
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-300">
                  {{ confirmMessage }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            @click="handleConfirm"
          >
            OK
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            @click="showConfirmDialog = false"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const conversations = ref([]);
const messages = ref([]);
const selectedConversationId = ref(null);
const selectedConversation = ref(null);
const newMessage = ref("");
const loading = ref(false);
const loadingMessages = ref(false);
const sendingMessage = ref(false);
const messagesContainer = ref(null);
const showConfirmDialog = ref(false);
const confirmMessage = ref("");
const messageToDelete = ref(null);
const isEmployer = computed(() => authStore.isEmployer);
const isDev = ref(import.meta.env.DEV);

const totalUnread = computed(() => {
  return conversations.value.reduce((sum, conv) => sum + (conv.unread || 0), 0);
});

const formatTime = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Вчера, ${date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

const getUserName = (conversation) => {
  if (!conversation || !authStore.user) return "";

  if (conversation.employer_name) {
    return conversation.employer_name;
  }

  if (conversation.jobseeker_name) {
    return conversation.jobseeker_name;
  }

  if (conversation.participants && Array.isArray(conversation.participants)) {
    const otherParticipant = conversation.participants.find(
      (p) => p.username !== "Вы" && p.username !== authStore.user?.username
    );
    if (otherParticipant) {
      return otherParticipant.username;
    }
  }

  if (authStore.user.profile?.role === "jobseeker") {
    return "Работодатель";
  }

  return "Соискатель";
};

const loadConversations = async (forceRefresh = false) => {
  try {
    loading.value = true;
    await chatStore.fetchConversations(forceRefresh);
    conversations.value = chatStore.conversations;
    console.log("Загруженные диалоги:", conversations.value);
  } catch (error) {
    console.error("Ошибка загрузки диалогов:", error);
  } finally {
    loading.value = false;
  }
};

const ensureConversationsExist = () => {
  if (isDev.value && conversations.value.length === 0) {
    console.log(
      "РЕЖИМ РАЗРАБОТКИ: Создаем тестовый диалог, так как нет существующих"
    );

    setTimeout(() => {
      loadConversations();
    }, 1000);
  }
};

const selectConversation = async (conversationId) => {
  if (selectedConversationId.value === conversationId) return;

  try {
    selectedConversationId.value = conversationId;
    loadingMessages.value = true;

    selectedConversation.value = conversations.value.find(
      (c) => c.id === conversationId
    );

    messages.value = [];

    router.replace({
      path: route.path,
      query: { conversation: conversationId },
    });

    if (
      chatStore.messages[conversationId] &&
      chatStore.messages[conversationId].length > 0
    ) {
      console.log(
        "Используем кэшированные сообщения из хранилища:",
        chatStore.messages[conversationId]
      );
      messages.value = chatStore.messages[conversationId];
    } else {
      const result = await chatStore.fetchMessages(conversationId);
      messages.value = result;
    }

    if (selectedConversation.value.unread > 0) {
      try {
        await chatStore.markAsRead(conversationId);

        const index = conversations.value.findIndex(
          (c) => c.id === conversationId
        );
        if (index !== -1) {
          conversations.value[index].unread = 0;
        }
      } catch (error) {
        console.error("Ошибка при отметке сообщений как прочитанных:", error);
      }
    }

    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error("Ошибка при загрузке сообщений:", error);
  } finally {
    loadingMessages.value = false;
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversationId.value) return;

  try {
    sendingMessage.value = true;

    // Проверяем, нужно ли включить информацию о резюме
    let messageText = newMessage.value;
    if (
      !isEmployer.value &&
      (messageText.toLowerCase().includes("резюме") ||
        messageText.toLowerCase().includes("опыт") ||
        messageText.toLowerCase().includes("resume"))
    ) {
      try {
        const resumes = JSON.parse(localStorage.getItem("resumes") || "[]");
        if (resumes && resumes.length > 0) {
          const selectedResume = resumes[0];
          const resumeTitle =
            selectedResume.title || selectedResume.name || "Моё резюме";
          messageText += `\n\nМоё резюме ${resumeTitle}:\nОпыт: ${
            selectedResume.experience || "5+ лет"
          }\nНавыки: ${
            selectedResume.skills?.join(", ") || "JavaScript, Vue.js, Node.js"
          }`;
        }
      } catch (err) {
        console.error("Ошибка при добавлении резюме к сообщению:", err);
      }
    }

    const message = await chatStore.sendMessage({
      text: messageText,
      conversation_id: selectedConversationId.value,
    });

    newMessage.value = "";
    messages.value.push(message);

    await nextTick();
    scrollToBottom();

    // Перемещение беседы в начало списка
    const index = conversations.value.findIndex(
      (c) => c.id === selectedConversationId.value
    );
    if (index !== -1) {
      const conversation = { ...conversations.value[index] };
      conversations.value.splice(index, 1);
      conversations.value.unshift(conversation);

      // Обновляем последнее сообщение
      conversations.value[0].last_message = message.text;
      conversations.value[0].last_message_text = message.text;
      conversations.value[0].last_message_time = message.created_at;
    }

    // Сохраняем в localStorage
    if (chatStore.persistState) {
      chatStore.persistState();
    }
  } catch (error) {
    console.error("Ошибка при отправке сообщения:", error);
    alert(
      "Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте снова."
    );
  } finally {
    sendingMessage.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const viewJob = (jobId) => {
  // Prevent trying to view the special Senior Developer job that doesn't actually exist
  if (jobId === 9999) {
    alert(
      "Это специальная вакансия Senior Developer, созданная системой для демонстрации функциональности чата. Реальная страница вакансии недоступна."
    );
    return;
  }
  router.push(`/jobs/${jobId}`);
};

// Наблюдаем за изменениями в URL
watch(
  [() => route.params.id, () => route.query.conversation],
  async ([newParamId, newQueryId]) => {
    const newId = newParamId || newQueryId;
    if (!newId) return;

    if (String(newId) !== String(selectedConversationId.value)) {
      // Проверяем, есть ли этот диалог в списке
      let conversation = conversations.value.find(
        (c) => String(c.id) === String(newId)
      );

      // Если диалога нет в списке, пробуем обновить список
      if (!conversation) {
        try {
          // Обновляем список диалогов
          const conversationsData = await chatStore.fetchConversations(true);
          conversations.value = conversationsData;

          // Ищем диалог снова
          conversation = conversations.value.find(
            (c) => String(c.id) === String(newId)
          );

          if (!conversation) {
            // Проверяем localStorage
            const storedConversationsRaw =
              localStorage.getItem("chatConversations");
            if (storedConversationsRaw) {
              try {
                const storedConversations = JSON.parse(storedConversationsRaw);
                const storedConversation = storedConversations.find(
                  (c) => String(c.id) === String(newId)
                );

                if (storedConversation) {
                  conversation = storedConversation;
                  conversations.value = [
                    storedConversation,
                    ...conversations.value,
                  ];
                }
              } catch (e) {
                console.error("Ошибка при разборе JSON из localStorage", e);
              }
            }

            // В режиме разработки, если диалог все еще не найден, создаем его на лету
            if (!conversation && import.meta.env.DEV) {
              conversation = {
                id: newId,
                job_id: "1",
                job: { id: "1", title: "Тестовая вакансия" },
                unread: 0,
                last_message: "Тестовый диалог",
                last_message_text: "Тестовый диалог",
                last_message_time: new Date().toISOString(),
                last_message_date: new Date().toISOString(),
                employer_name: "Тестовый работодатель",
                jobseeker_name: "Вы",
              };

              conversations.value = [conversation, ...conversations.value];
              localStorage.setItem(
                "chatConversations",
                JSON.stringify(conversations.value)
              );
              chatStore.messages[newId] = chatStore.messages[newId] || [];
              localStorage.setItem(
                "chatMessages",
                JSON.stringify(chatStore.messages)
              );
            }
          }
        } catch (error) {
          console.error("Ошибка при обновлении списка диалогов:", error);
        }
      }

      if (conversation) {
        await selectConversation(newId);
        // Обновляем URL на единый формат
        if (route.query.conversation) {
          router.replace(`/messages/${newId}`);
        }
      }
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (!authStore.isAuthenticated) return;

  loading.value = true;

  try {
    // Получаем ID диалога из URL или localStorage
    const urlConversationId = route.params.id || route.query.conversation;
    const lastCreatedChatId = localStorage.getItem("lastCreatedChatId");
    const targetConversationId = urlConversationId || lastCreatedChatId;

    // Загружаем диалоги
    const conversationsData = await chatStore.fetchConversations(true);
    conversations.value = conversationsData;

    // Если диалоги не загрузились, проверяем localStorage
    if (conversations.value.length === 0) {
      const storedConversations = JSON.parse(
        localStorage.getItem("chatConversations") || "[]"
      );
      if (storedConversations.length > 0) {
        conversations.value = storedConversations;
      }
    }

    // Выбираем целевой диалог или первый доступный
    if (targetConversationId) {
      const targetConversation = conversations.value.find(
        (c) => String(c.id) === String(targetConversationId)
      );

      if (targetConversation) {
        selectedConversationId.value = targetConversation.id;
        selectedConversation.value = targetConversation;

        // Загружаем сообщения
        loadingMessages.value = true;
        try {
          const messagesData = await chatStore.fetchMessages(
            targetConversation.id,
            true
          );
          messages.value = messagesData;
          await chatStore.markAsRead(targetConversation.id);
        } finally {
          loadingMessages.value = false;
        }

        // Обновляем URL
        router.replace(`/messages/${targetConversation.id}`);
        await nextTick();
        scrollToBottom();
        return;
      }
    }

    // Если нет целевого диалога, но есть доступные - выбираем первый
    if (conversations.value.length > 0) {
      selectedConversationId.value = conversations.value[0].id;
      selectedConversation.value = conversations.value[0];

      // Загружаем сообщения для первого диалога
      loadingMessages.value = true;
      try {
        const messagesData = await chatStore.fetchMessages(
          conversations.value[0].id,
          true
        );
        messages.value = messagesData;
        await chatStore.markAsRead(conversations.value[0].id);
      } finally {
        loadingMessages.value = false;
      }

      // Обновляем URL
      router.replace(`/messages/${conversations.value[0].id}`);
    }
  } catch (error) {
    console.error("Ошибка при инициализации чата:", error);
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
});

const refreshConversations = async () => {
  console.log("Ручное обновление диалогов");
  await loadConversations();

  if (isDev.value && conversations.value.length === 0) {
    ensureConversationsExist();
  }
};

const showDeleteConfirm = (message) => {
  messageToDelete.value = message;
  confirmMessage.value = "Вы уверены, что хотите удалить это сообщение?";
  showConfirmDialog.value = true;
};

const handleConfirm = () => {
  if (messageToDelete.value) {
    deleteMessage(messageToDelete.value);
    messageToDelete.value = null;
  }
  showConfirmDialog.value = false;
};

const deleteMessage = async (message) => {
  try {
    if (!selectedConversationId.value) return;

    const success = await chatStore.deleteMessage(
      selectedConversationId.value,
      message.id
    );

    if (success) {
      // Удаление сообщения из локального массива сообщений
      messages.value = messages.value.filter((msg) => msg.id !== message.id);

      // Если это было последнее сообщение, обновляем последнее сообщение беседы
      if (messages.value.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1];

        // Обновляем данные в текущем разговоре
        const index = conversations.value.findIndex(
          (c) => c.id === selectedConversationId.value
        );

        if (index !== -1) {
          conversations.value[index].last_message = lastMessage.text;
          conversations.value[index].last_message_text = lastMessage.text;
          conversations.value[index].last_message_time = lastMessage.created_at;

          // Сохраняем в localStorage
          if (chatStore.persistState) {
            chatStore.persistState();
          }
        }
      }
    }
  } catch (error) {
    console.error("Ошибка при удалении сообщения:", error);
    alert("Произошла ошибка при удалении сообщения");
  }
};

const fullReload = async () => {
  try {
    console.log("Принудительная перезагрузка всех данных чата...");
    // Очистка локальных сообщений
    messages.value = [];
    conversations.value = [];
    selectedConversationId.value = null;
    selectedConversation.value = null;

    // Очистка chatStore
    chatStore.$reset();

    // Перезагрузка данных
    await loadConversations();
    console.log("Данные чата перезагружены");
  } catch (error) {
    console.error("Ошибка во время полной перезагрузки:", error);
  }
};

const deleteConversation = async (conversationId) => {
  try {
    if (confirm("Вы действительно хотите удалить эту переписку?")) {
      loading.value = true;

      console.log(
        `РЕЖИМ РАЗРАБОТКИ: Ручное удаление диалога ${conversationId}`
      );

      // Remove from local state first
      conversations.value = conversations.value.filter(
        (conv) => conv.id !== conversationId
      );

      // Clear messages if it was the selected conversation
      if (selectedConversationId.value === conversationId) {
        selectedConversation.value = null;
        selectedConversationId.value = null;
        messages.value = [];

        // Update URL
        router.replace({
          path: route.path,
          query: {},
        });

        // If we have other conversations, select the first one
        if (conversations.value.length > 0) {
          setTimeout(() => {
            selectConversation(conversations.value[0].id);
          }, 100);
        }
      }

      // Remove from store
      if (chatStore.messages[conversationId]) {
        delete chatStore.messages[conversationId];
      }

      // Update localStorage directly in dev mode
      localStorage.setItem(
        "chatConversations",
        JSON.stringify(conversations.value)
      );
      localStorage.setItem("chatMessages", JSON.stringify(chatStore.messages));

      // Also try the store method
      try {
        await chatStore.deleteConversation(conversationId);
      } catch (e) {
        console.log(
          "Метод хранилища не сработал, но разговор был удален вручную"
        );
      }
    }
  } catch (error) {
    console.error("Ошибка при удалении чата:", error);
    alert("Ошибка при удалении чата");
  } finally {
    loading.value = false;
  }
};

// Метод для форматирования сообщений с кликабельными ссылками
const formatMessageWithLinks = (text) => {
  if (!text) return "";

  let processedText = text;

  // Общий шаблон для ссылки на резюме
  const resumeLinkTemplate =
    '<div class="mt-3 p-3 bg-indigo-900 rounded-md">' +
    '<div class="font-bold text-indigo-100 mb-2">Резюме соискателя</div>' +
    '<a href="/chat" onclick="window.location.href=\'/chat\'; return false;" class="block w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors">' +
    '<span class="flex items-center justify-center">' +
    '<span class="material-icons mr-2">description</span> Открыть полное резюме' +
    "</span></a></div>";

  // Заменяем обе формы ссылок на резюме
  processedText = processedText.replace(
    /👉 Открыть полное резюме: (\/resumes\/\d+)/g,
    resumeLinkTemplate
  );
  processedText = processedText.replace(
    /Ссылка на резюме: (\/resumes\/\d+)/g,
    resumeLinkTemplate
  );

  // Форматируем информацию о резюме
  processedText = processedText.replace(
    /Резюме: (.+?)\n(.*?)(?=\n\n|$)/gs,
    '<div class="mt-2 p-3 bg-gray-700 rounded-md">' +
      '<div class="font-bold text-green-300 mb-1">$1</div>' +
      '<div class="text-gray-200">$2</div></div>'
  );

  // Обрабатываем URL
  processedText = processedText.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" class="text-blue-400 hover:underline" target="_blank">$1</a>'
  );

  // Форматируем текст в абзацы
  return processedText
    .split("\n")
    .map((line) =>
      line.trim() ? `<div>${line}</div>` : '<div class="h-2"></div>'
    )
    .join("");
};
</script>

<style scoped>
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 5px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

.group:hover .opacity-0 {
  opacity: 0.7 !important;
}

.group .opacity-0:hover {
  opacity: 1 !important;
}

.bg-green-600 {
  background-color: #059669 !important;
  border: 1px solid #047857 !important;
}

.bg-gray-700 {
  background-color: #374151 !important;
  border: 1px solid #4b5563 !important;
}

.rounded-lg {
  border-radius: 12px !important;
}

.ml-auto {
  margin-left: auto !important;
}

.text-white {
  color: white !important;
}

.message-content a {
  color: #60a5fa !important;
  text-decoration: none;
  font-weight: 500;
}

.message-content a:hover {
  text-decoration: underline;
}

.message-content div {
  margin-bottom: 0.25rem;
}

.message-content div:last-child {
  margin-bottom: 0;
}
</style>
