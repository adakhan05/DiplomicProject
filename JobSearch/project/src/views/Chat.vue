<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="bg-gray-800 shadow sm:rounded-lg">
      <div
        class="flex flex-col md:flex-row h-[calc(100vh-12rem)] min-h-0 relative"
      >
        <!-- Список диалога -->
        <div
          v-if="!isMobileView || !selectedConversationId"
          class="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col min-h-0"
        >
          <div
            class="p-4 border-b border-gray-700 bg-gray-900 flex items-center justify-between"
          >
            <div>
              <h2 class="text-lg font-medium text-white">
                <span v-if="!selectedConversation">Сообщения</span>
                <span v-else>
                  <span class="text-green-500 font-bold text-lg">{{
                    selectedConversation.job?.title || "Беседа"
                  }}</span>
                  <span
                    v-if="
                      selectedConversation.participants_info &&
                      selectedConversation.participants_info.length > 0
                    "
                    class="block text-sm text-gray-300"
                  >
                    {{ selectedConversation.participants_info[0]?.username }}
                  </span>
                </span>
              </h2>
            </div>
            <div class="flex items-center">
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
              v-else-if="visibleConversations.length === 0"
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
                v-for="(conversation, index) in visibleConversations"
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
                      {{ conversation.job?.title }}
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
                      @click.stop="confirmDeleteConversation(conversation.id)"
                      class="text-gray-400 hover:text-red-500"
                    >
                      <span class="material-icons">delete</span>
                    </button>
                  </div>
                </div>
                <p class="text-gray-300 text-sm truncate mt-1">
                  {{ partidosLastMessage(conversation) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Содержимое сообщений -->
        <div
          v-if="!isMobileView || selectedConversationId"
          class="w-full md:w-2/3 flex flex-col min-h-0"
        >
          <!-- Conversation header -->
          <div
            v-if="selectedConversation"
            class="p-4 border-b border-gray-700 bg-gray-900 flex items-center"
          >
            <!-- Back button on mobile -->
            <button
              v-if="isMobileView"
              @click="goBack"
              class="mr-4 text-green-500 hover:text-green-400"
            >
              <span class="material-icons">arrow_back</span>
            </button>
            <div class="flex-grow">
              <h3 class="text-xl font-bold text-green-500">
                {{
                  selectedConversation.job
                    ? selectedConversation.job.title
                    : "Беседа"
                }}
              </h3>
              <p class="text-md text-white">
                {{ getUserUsername(selectedConversation) }}
                <router-link
                  v-if="selectedConversation.job && selectedConversation.job.id"
                  :to="{
                    name: 'job-detail',
                    params: { id: selectedConversation.job.id },
                  }"
                  class="text-green-500 hover:underline ml-2"
                >
                  Открыть вакансию
                </router-link>
              </p>
            </div>
            <!-- Кнопка перезагрузки чата -->
            <button
              @click="fullReload"
              class="text-green-500 hover:text-green-400 ml-2"
              title="Обновить чат"
            >
              <span class="material-icons">sync</span>
            </button>
          </div>

          <!-- Содержимое сообщений -->
          <div
            v-if="!selectedConversation"
            :key="selectedConversationId || 'empty'"
            class="flex-grow flex items-center justify-center p-4 text-center text-gray-400"
          >
            <div>
              <span class="material-icons text-5xl mb-3">chat</span>
              <p>Выберите диалог для просмотра сообщений</p>
            </div>
          </div>

          <div
            v-else
            :key="selectedConversationId || 'empty'"
            class="flex-grow overflow-y-auto p-4 min-h-0 messages-container pb-0"
            ref="messagesContainer"
          >
            <!-- Содержимое сообщений -->
            <div v-if="loadingMessages" class="text-center p-4">
              <div
                class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"
              ></div>
              <p class="mt-2 text-sm text-gray-400">Загрузка сообщений...</p>
            </div>

            <div
              v-else-if="currentMessages.length === 0"
              class="text-center p-4 text-gray-400"
            >
              <p>Нет сообщений в этом диалоге</p>
              <p class="text-sm mt-1">Напишите первое сообщение ниже</p>
            </div>

            <div v-else>
              <div
                v-for="(message, index) in currentMessages"
                :key="message.id"
                class="mb-6 max-w-[75%]"
                :style="{
                  marginLeft:
                    message.sender === (isEmployer.value ? 1 : 2)
                      ? 'auto'
                      : '0',
                }"
              >
                <div class="flex items-start">
                  <div
                    class="p-3 rounded-lg inline-block relative group message-container"
                    :class="{
                      'bg-green-600 text-white': isEmployer.value
                        ? message.sender !== authStore.userId
                        : message.sender === authStore.userId,
                      'bg-gray-700 text-gray-200': isEmployer.value
                        ? message.sender === authStore.userId
                        : message.sender !== authStore.userId,
                      'is-pending': message.is_pending,
                      'has-error': message.has_error,
                    }"
                  >
                    <!-- УСЛОВНЫЙ РЕНДЕРИНГ ДЛЯ РЕЗЮМЕ -->
                    <template v-if="isResumeMessage(message.content)">
                      <resume-message-card
                        :resume="parseResumeMessage(message.content)"
                        @view-resume="handleViewResume"
                        @view-pdf="handleViewPdf"
                      />
                    </template>
                    <!-- ОБЫЧНОЕ ТЕКСТОВОЕ СООБЩЕНИЕ -->
                    <template v-else>
                      <p class="text-white whitespace-pre-wrap break-words">
                        {{ message.content }}
                      </p>
                    </template>
                    <!-- / УСЛОВНЫЙ РЕНДЕРИНГ -->

                    <!-- Кнопка удаления только для сообщений пользователя -->
                    <button
                      v-if="isCurrentUserSender(message)"
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
                  <span v-if="isCurrentUserSender(message)" class="ml-1">
                    <span v-if="message.is_read" class="material-icons text-xs"
                      >done_all</span
                    >
                    <span v-else class="material-icons text-xs">done</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Поле ввода для сообщения -->
          <div
            v-if="selectedConversation && !loadingMessages"
            class="p-4 border-t border-gray-700 bg-gray-900 sticky bottom-0 left-0 right-0 z-10 w-full message-input-wrapper"
          >
            <form
              @submit.prevent="sendMessage"
              class="flex message-input-container"
            >
              <input
                v-model="messageText"
                type="text"
                class="flex-grow rounded-l-md bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500"
                placeholder="Введите сообщение..."
                :disabled="sendingMessage"
              />
              <button
                type="submit"
                class="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                :disabled="!messageText.trim() || sendingMessage"
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

  <!-- Модальное окно для подтверждения действия -->
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
                Подтвердите действие
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

  <!-- Модальное окно для просмотра резюме -->
  <div
    v-if="showResumeModal && selectedResume"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div
      class="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
    >
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-2xl font-semibold text-white">
          {{ selectedResume.title }}
        </h3>
        <button
          @click="showResumeModal = false"
          class="text-gray-400 hover:text-white"
        >
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Основная информация -->
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <span
              v-if="selectedResume.is_active !== undefined"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="
                selectedResume.is_active
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
              "
            >
              {{ selectedResume.is_active ? "Активно" : "Неактивно" }}
            </span>
          </div>
          <div class="mt-3">
            <p class="text-gray-300">
              {{ selectedResume.professional_summary }}
            </p>
          </div>
        </div>

        <!-- Желаемая должность -->
        <div v-if="selectedResume.desired_position" class="mt-4">
          <h4 class="text-lg font-medium text-white mb-2">
            Желаемая должность
          </h4>
          <p class="text-gray-300">{{ selectedResume.desired_position }}</p>
        </div>

        <!-- Ожидаемая зарплата -->
        <div v-if="selectedResume.salary_expectation" class="mt-4">
          <h4 class="text-lg font-medium text-white mb-2">
            Ожидаемая зарплата
          </h4>
          <p class="text-gray-300">
            {{ formatSalary(selectedResume.salary_expectation) }}
          </p>
        </div>

        <!-- Тип занятости -->
        <div v-if="selectedResume.preferred_employment" class="mt-4">
          <h4 class="text-lg font-medium text-white mb-2">Тип занятости</h4>
          <p class="text-gray-300">
            {{ formatEmploymentType(selectedResume.preferred_employment) }}
          </p>
        </div>

        <!-- Сопроводительное письмо -->
        <div v-if="selectedResume.cover_letter" class="mt-4">
          <h4 class="text-lg font-medium text-white mb-2">
            Сопроводительное письмо
          </h4>
          <div class="bg-gray-700 p-3 rounded">
            <p class="text-gray-300">{{ selectedResume.cover_letter }}</p>
          </div>
        </div>

        <!-- Навыки -->
        <div v-if="selectedResume.skills && selectedResume.skills.length">
          <h4 class="text-lg font-medium text-white mb-2">Навыки</h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, index) in selectedResume.skills"
              :key="index"
              class="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
            >
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- Опыт работы -->
        <div
          v-if="selectedResume.experience && selectedResume.experience.length"
        >
          <h4 class="text-lg font-medium text-white mb-2">Опыт работы</h4>
          <div class="space-y-4">
            <div
              v-for="(exp, index) in selectedResume.experience"
              :key="index"
              class="border-l-2 border-gray-700 pl-4"
            >
              <div class="font-medium text-white">{{ exp.position }}</div>
              <div class="text-gray-400">{{ exp.company }}</div>
              <div class="text-sm text-gray-500">
                {{ exp.start_date }} -
                {{ exp.end_date || "По настоящее время" }}
              </div>
              <p class="mt-1 text-gray-300">
                {{ exp.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Образование -->
        <div v-if="selectedResume.education && selectedResume.education.length">
          <h4 class="text-lg font-medium text-white mb-2">Образование</h4>
          <div class="space-y-4">
            <div
              v-for="(edu, index) in selectedResume.education"
              :key="index"
              class="border-l-2 border-gray-700 pl-4"
            >
              <div class="font-medium text-white">{{ edu.degree }}</div>
              <div class="text-gray-400">{{ edu.institution }}</div>
              <div class="text-sm text-gray-500">
                {{ edu.start_date }} -
                {{ edu.end_date || "По настоящее время" }}
              </div>
              <p class="mt-1 text-gray-300">
                {{ edu.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Контактная информация -->
        <div>
          <div class="space-y-2">
            <div
              v-if="selectedResume.phone"
              class="flex items-center text-gray-300"
            >
              <span class="material-icons text-gray-500 mr-2">phone</span>
              {{ selectedResume.phone }}
            </div>
            <div
              v-if="selectedResume.email"
              class="flex items-center text-gray-300"
            >
              <span class="material-icons text-gray-500 mr-2">email</span>
              {{ selectedResume.email }}
            </div>
            <div
              v-if="selectedResume.location"
              class="flex items-center text-gray-300"
            >
              <span class="material-icons text-gray-500 mr-2">location_on</span>
              {{ selectedResume.location }}
            </div>
          </div>
        </div>

        <!-- Просмотр PDF резюме -->
        <div v-if="selectedResume.resume_file_url" class="mt-4">
          <h4 class="text-lg font-medium text-white mb-2">PDF резюме</h4>
          <button
            @click="() => handleViewPdf(selectedResume.resume_id)"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <span class="material-icons mr-2">visibility</span>
            Просмотреть PDF
          </button>
        </div>
      </div>

      <div class="mt-6 flex justify-center space-x-3">
        <button
          @click="showResumeModal = false"
          class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  computed,
  watch,
  onUnmounted,
  nextTick,
  onActivated,
  onDeactivated,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";
import { storeToRefs } from "pinia";
import { formatDistance, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import axios from "axios";
import { ref as vueRef } from "vue";
import { safeLocalStorage } from "@/plugins/localStorage";
import ResumeMessageCard from "@/components/chat/ResumeMessageCard.vue";
import { showNotification } from "@/utils/notifications";
import { getFileUrl } from "@/utils/fileHelper";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

// Извлечение ссылок из хранилища (storeToRefs)
const { conversations, getMessages, unreadCount, isDev } =
  storeToRefs(chatStore);

// Локальное состояние загрузки интерфейса
const loading = ref(false);
const isLoading = ref(false);
const loadingMessages = ref(false);
const loadingConversations = ref(false);
const sendingMessage = ref(false);
const isSending = ref(false);
const error = ref(null);
const errorMessage = ref("");

// Локальное состояние
const selectedConversationId = ref(null);
const messageText = ref("");
const messagesContainer = ref(null);
const showResumeModal = ref(false);
const selectedResume = ref(null);
const resumeId = ref(null);
const silentRefresh = ref(false);
const lastMessageSentAt = ref(null);
const isUserActive = ref(true);
const notificationSound = ref(null);
const showMessages = ref(false);

// Обнаружение мобильного режима
const isMobileView = ref(window.innerWidth < 768);
const updateMobile = () => {
  isMobileView.value = window.innerWidth < 768;
};

// Настройка подключения WebSocket
const socket = ref(null);
const isSocketConnected = ref(false);
const socketRetryCount = ref(0);
const heartbeatIntervalId = ref(null);

// Подтверждение удаления
const showConfirmDialog = ref(false);
const confirmMessage = ref("");
const confirmAction = ref(null);
const messageToDelete = ref(null);
const conversationToDelete = ref(null);

// Уведомления и автоматическое обновление
const notificationsSocket = vueRef(null);
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 5;
const reconnectTimeout = ref(null);
const refreshInterval = ref(null);

// Возврат к списку диалогов на мобильных устройствах
const goBack = () => {
  closeWebSocket();
  selectedConversationId.value = null;
  selectedConversation.value = null;
};

// Вычисляемые свойства
const isEmployer = computed(() => authStore.isEmployer);
const messages = computed(() => {
  if (!selectedConversationId.value) return [];
  const dialogMessages =
    getMessages.value(String(selectedConversationId.value)) || [];
  // Порядок: сначала старые сообщения, потом новые
  return dialogMessages.slice().reverse();
});
const totalUnread = computed(() => unreadCount.value);

// Отфильтрованный список диалогов для отображения
const visibleConversations = computed(() => {
  return chatStore.conversations;
});

// Сообщения текущего диалога
const currentMessages = computed(() => {
  if (!selectedConversationId.value) return [];
  return chatStore.getMessages(selectedConversationId.value) || [];
});

// Наблюдение за currentMessages
watch(
  currentMessages,
  (newMessages, oldMessages) => {
    console.log("[DEBUG] Chat.vue: currentMessages изменились");
    console.log(
      "[DEBUG] Chat.vue: Новые currentMessages:",
      JSON.parse(JSON.stringify(newMessages))
    );

    // Если количество сообщений увеличилось, прокручиваем вниз
    if (newMessages.length > (oldMessages ? oldMessages.length : 0)) {
      console.log(
        "[DEBUG] Chat.vue: Добавлено новое сообщение, пытаюсь прокрутить вниз."
      );
      nextTick(() => {
        scrollToBottom();
      });
    }

    // Проверяем, есть ли новые сообщения с флагом is_new или is_pending
    const hasNewOrPendingMessage = newMessages.some(
      (msg) => msg.is_new === true || msg.is_pending === true
    );

    if (hasNewOrPendingMessage) {
      console.log(
        "[DEBUG] Chat.vue: Обнаружено новое или ожидающее сообщение, прокручиваю вниз."
      );
      nextTick(() => {
        scrollToBottom();
      });
    }
  },
  { deep: true }
);

// Наблюдение за флагом newMessageReceived в хранилище
watch(
  () => chatStore.newMessageReceived,
  (newValue) => {
    if (newValue === true) {
      console.log(
        "[DEBUG] Chat.vue: Обнаружен флаг нового сообщения, прокручиваю вниз."
      );
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
);

// Текущий диалог
const selectedConversation = computed(() => {
  if (!selectedConversationId.value) return null;
  return chatStore.getConversation(selectedConversationId.value);
});

// Отметка сообщений диалога как прочитанных
const markMessagesAsRead = async (conversationId) => {
  if (!conversationId) return;

  try {
    await chatStore.markMessagesAsRead(conversationId);
  } catch (error) {
    console.error("Ошибка при отметке сообщений как прочитанных:", error);
  }
};

// Функция для закрытия WebSocket соединения
const closeWebSocket = () => {
  console.log("[DEBUG] Chat.vue: закрытие WebSocket соединения");
  try {
    chatStore.disconnectWebSocket();
  } catch (error) {
    console.error("[DEBUG] Chat.vue: ошибка при закрытии WebSocket", error);
  }
};

// Обновление функции setupChatWebSocket для предотвращения попыток подключения с пустым идентификатором комнаты
const setupChatWebSocket = () => {
  try {
    // Закрываем существующее соединение, если оно есть
    if (socket.value && socket.value.readyState !== WebSocket.CLOSED) {
      socket.value.close();
    }

    // Пропускаем подключение WebSocket, если нет выбранного диалога
    if (!selectedConversationId.value) {
      console.log(
        "[ОТЛАДКА ЧАТА] Нет выбранного диалога, WebSocket не подключается"
      );
      return;
    }

    // Определяем протокол (ws или wss)
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";

    // Определяем хост с учетом режима разработки
    let host;
    if (import.meta.env.DEV) {
      // В режиме разработки подключаемся к Django (порт 8000)
      host = window.location.hostname + ":8000";
    } else {
      // В продакшене используем текущий хост
      host = window.location.host;
    }

    // Получаем токен авторизации
    const token = localStorage.getItem("token");

    // Используем упрощенный формат URL для WebSocket
    // Формат должен соответствовать настройкам роутинга Django Channels
    let roomName = "";

    // Получаем детали выбранного диалога
    const selectedConv = conversations.value.find(
      (c) => String(c.id) === String(selectedConversationId.value)
    );

    if (selectedConv && selectedConv.job && selectedConv.job.id) {
      // Для диалогов связанных с вакансиями используем формат "job-{id}"
      roomName = `job-${selectedConv.job.id}`;
    } else if (selectedConversationId.value) {
      // Для прямых диалогов используем ID диалога
      roomName = `chat-${selectedConversationId.value}`;
    }

    // Проверяем, что у нас есть корректное имя комнаты перед подключением
    if (!roomName) {
      console.error(
        "[ОТЛАДКА ЧАТА] Не удалось определить имя комнаты для WebSocket"
      );
      return; // Пропускаем подключение, если нет корректного имени комнаты
    }

    // Формируем URL для WebSocket с упрощенным форматом
    const wsUrl = `${protocol}${host}/ws/chat/${roomName}/`;
    console.log(`[ОТЛАДКА ЧАТА] Подключение к WebSocket: ${wsUrl}`);

    // Создаем соединение WebSocket
    socket.value = new WebSocket(wsUrl);

    // Добавляем токен авторизации к соединению, если он доступен
    if (token) {
      // Некоторые бэкенды ожидают токен при соединении
      socket.value.onopen = () => {
        console.log("[ОТЛАДКА ЧАТА] WebSocket соединение установлено");
        socket.value.send(
          JSON.stringify({
            type: "authenticate",
            token: token,
          })
        );
        isSocketConnected.value = true;
        socketRetryCount.value = 0;
        startHeartbeat();
      };
    } else {
      socket.value.onopen = () => {
        console.log("[ОТЛАДКА ЧАТА] WebSocket соединение установлено");
        isSocketConnected.value = true;
        socketRetryCount.value = 0;
        startHeartbeat();
      };
    }

    // Событие при получении сообщения
    socket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(
          "[DEBUG] Chat.vue (room WebSocket): получено сообщение:",
          data
        );

        if (data.type === "chat_message") {
          // Используем унифицированный обработчик из chatStore
          chatStore.handleWebSocketMessage(data);

          // Если это сообщение для текущего открытого диалога
          if (
            selectedConversationId.value &&
            String(selectedConversationId.value) ===
              String(data.conversation_id)
          ) {
            console.log(
              "[DEBUG] Chat.vue (room WebSocket): Сообщение для текущего диалога. Отмечаю как прочитанное и прокручиваю."
            );
            // Даем Vue время обновить DOM после изменения в store
            nextTick(() => {
              chatStore.markMessagesAsRead(selectedConversationId.value);
              scrollToBottom();
            });
          }

          // Воспроизводим звук уведомления, если сообщение не от текущего пользователя и вкладка не активна
          if (
            String(data.sender_id) !== String(authStore.user?.id) &&
            document.hidden
          ) {
            playNotificationSound();
          }
        } else if (data.type === "messages_read") {
          // Обновляем статус прочтения сообщений в store
          if (selectedConversationId.value) {
            chatStore.markMessagesAsReadByRecipient(
              selectedConversationId.value,
              data.reader_id
            );
          }
        } else if (data.type === "heartbeat_response") {
          console.log(
            "[DEBUG] Chat.vue (room WebSocket): Heartbeat response received"
          );
        } else if (data.type === "connection_established") {
          console.log(
            "[DEBUG] Chat.vue (room WebSocket): Connection established -",
            data.message
          );
        } else if (data.type === "new_conversation") {
          // Это событие должно обрабатываться глобальным WebSocket в chatStore
          // но если оно пришло сюда, можно на всякий случай обновить список диалогов
          console.warn(
            "[DEBUG] Chat.vue (room WebSocket): Получено new_conversation, хотя ожидалось через глобальный WS. Обновляю диалоги."
          );
          loadConversations();
        }
      } catch (err) {
        console.error(
          "[DEBUG] Chat.vue (room WebSocket): Ошибка обработки сообщения:",
          err
        );
      }
    };

    // Событие при ошибке
    socket.value.onerror = (error) => {
      console.error("WebSocket ошибка:", error);
      isSocketConnected.value = false;
    };

    // Событие при закрытии соединения
    socket.value.onclose = (event) => {
      console.log(`WebSocket соединение закрыто, код: ${event.code}`);
      isSocketConnected.value = false;

      // Останавливаем heartbeat
      if (heartbeatIntervalId.value) {
        clearInterval(heartbeatIntervalId.value);
        heartbeatIntervalId.value = null;
      }

      // Повторное подключение с экспоненциальной задержкой
      if (socketRetryCount.value < chatStore.maxRetries) {
        const delay =
          chatStore.basePollingDelay * Math.pow(1.5, socketRetryCount.value);
        console.log(`Попытка переподключения через ${delay}ms...`);

        setTimeout(() => {
          if (document.visibilityState === "visible") {
            socketRetryCount.value++;
            setupChatWebSocket();
          }
        }, delay);
      }
    };

    // Сохраняем ссылку на WebSocket в глобальной переменной для отладки
    window.chatSocket = socket.value;
  } catch (error) {
    console.error("Ошибка при создании WebSocket соединения:", error);
  }
};

// Heartbeat для поддержания соединения
const startHeartbeat = () => {
  // Останавливаем существующий heartbeat если он есть
  if (heartbeatIntervalId.value) {
    clearInterval(heartbeatIntervalId.value);
  }

  // Устанавливаем новый интервал
  heartbeatIntervalId.value = setInterval(() => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ type: "heartbeat" }));
    } else {
      // Если соединение закрыто, пытаемся переподключиться
      clearInterval(heartbeatIntervalId.value);
      setupChatWebSocket();
    }
  }, 30000); // 30 секунд
};

// Воспроизведение звука уведомления
const playNotificationSound = () => {
  try {
    if (notificationSound.value && !isUserActive.value) {
      notificationSound.value.currentTime = 0;
      notificationSound.value.play();
    }
  } catch (error) {
    console.error("Ошибка при воспроизведении звука уведомления:", error);
  }
};

// Прокрутка к последнему сообщению
const scrollToBottom = () => {
  console.log("[DEBUG] Chat.vue: прокрутка к последнему сообщению");
  try {
    // Используем ref вместо querySelector для более надежного доступа к элементу
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;

      // Дополнительная проверка для мобильных устройств
      if (window.innerWidth < 768) {
        // Добавляем небольшую задержку для мобильных устройств
        setTimeout(() => {
          messagesContainer.value.scrollTop =
            messagesContainer.value.scrollHeight;
        }, 100);
      }
    } else {
      // Запасной вариант, если ref не доступен
      const container = document.querySelector(".flex-grow.overflow-y-auto");
      if (container) {
        container.scrollTop = container.scrollHeight;

        // Дополнительная проверка для мобильных устройств
        if (window.innerWidth < 768) {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 100);
        }
      }
    }
  } catch (error) {
    console.error(
      "[DEBUG] Chat.vue: ошибка при прокрутке к последнему сообщению",
      error
    );
  }
};

// Загрузка диалогов
const loadConversations = async () => {
  loadingConversations.value = true;
  try {
    console.log("Chat.vue: Загрузка диалогов из API");
    const conversations = await chatStore.fetchConversations();
    console.log(`Chat.vue: Загружено ${conversations.length} диалогов`);

    // Если есть ID последнего выбранного диалога, выбираем его
    if (selectedConversationId.value) {
      selectConversation(selectedConversationId.value);
    }
    // Иначе, если есть диалоги, выбираем первый
    else if (conversations && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }

    return conversations;
  } catch (error) {
    console.error("Chat.vue: Ошибка при загрузке диалогов:", error);
    errorMessage.value = chatStore.error || "Не удалось загрузить диалоги";
    return [];
  } finally {
    loadingConversations.value = false;
  }
};

// Выбор диалога
const selectConversation = async (id) => {
  if (!id) return;

  console.log(`Chat.vue: Выбор диалога ${id}`);

  // Сохраняем ID выбранного диалога
  selectedConversationId.value = id;
  localStorage.setItem("selectedConversationId", id);

  // На мобильных устройствах показываем сообщения вместо списка диалогов
  if (isMobileView.value) {
    showMessages.value = true;
  }

  // Загружаем сообщения из выбранного диалога
  try {
    console.log(`Chat.vue: Загрузка сообщений диалога ${id}`);
    loadingMessages.value = true;
    errorMessage.value = null;

    await chatStore.fetchMessages(id);

    // Прокручиваем к последнему сообщению
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    // Отмечаем сообщения как прочитанные
    await chatStore.markMessagesAsRead(id);
  } catch (error) {
    console.error("Chat.vue: Ошибка при загрузке сообщений:", error);
    errorMessage.value = chatStore.error || "Не удалось загрузить сообщения";
  } finally {
    loadingMessages.value = false;
  }
};

// Отправка сообщения
const sendMessage = async () => {
  if (!messageText.value.trim() || !selectedConversationId.value) return;

  try {
    sendingMessage.value = true;

    const message = {
      conversation_id: selectedConversationId.value,
      content: messageText.value.trim(),
      // Добавляем метаданные для обработки на бэкенде
      is_system_message: false,
    };

    // Отправляем сообщение через хранилище
    await chatStore.sendMessage(message);

    // Очищаем поле ввода
    messageText.value = "";

    // Прокручиваем к последнему сообщению
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  } catch (error) {
    console.error("Ошибка при отправке сообщения:", error);
    errorMessage.value = "Не удалось отправить сообщение";
  } finally {
    sendingMessage.value = false;
  }
};

// Вспомогательные методы
const formatTime = (dateString) => {
  if (!dateString) return "";
  try {
    const date =
      typeof dateString === "string" ? parseISO(dateString) : dateString;
    return formatDistance(date, new Date(), {
      addSuffix: true,
      locale: ru,
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

const getUserName = (conversation) => {
  if (!conversation) return "";
  return isEmployer.value
    ? conversation.job_seeker_name
    : conversation.employer_name;
};

const getUserUsername = (conversation) => {
  if (
    !conversation ||
    !conversation.participants_info ||
    conversation.participants_info.length === 0
  )
    return "";
  return (
    conversation.participants_info[0]?.username ||
    conversation.participants_info[0]?.name ||
    ""
  );
};

const isCurrentUserSender = (message) => {
  if (!message) return false;

  // Проверяем, есть ли свойство sender, которое является числом (ID пользователя)
  if (typeof message.sender === "number") {
    return message.sender === authStore.userId;
  }

  // Если sender_id доступен (от WebSocket), используйте его
  if (message.sender_id) {
    return Number(message.sender_id) === authStore.userId;
  }

  // Откат к старому методу
  return message.sender === (isEmployer.value ? 1 : 2);
};

const formatMessageWithLinks = (text) => {
  if (!text) return "";
  // Заменяем URL на кликабельные ссылки
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      urlRegex,
      '<a href="$1" target="_blank" class="text-blue-300 underline">$1</a>'
    )
    .replace(/\n/g, "<br>");
};

// Удаление сообщения
const showDeleteConfirm = (message) => {
  try {
    messageToDelete.value = message;
    confirmMessage.value = "Вы уверены, что хотите удалить это сообщение?";
    confirmAction.value = "deleteMessage";
    showConfirmDialog.value = true;
  } catch (err) {
    console.error("Ошибка при показе диалога удаления сообщения:", err);
  }
};

const confirmDeleteConversation = (id) => {
  try {
    conversationToDelete.value = id;
    confirmMessage.value = "Вы уверены, что хотите удалить этот диалог?";
    confirmAction.value = "deleteConversation";
    showConfirmDialog.value = true;
  } catch (err) {
    console.error("Ошибка при показе диалога удаления беседы:", err);
  }
};

const handleConfirm = () => {
  try {
    if (confirmAction.value === "deleteMessage" && messageToDelete.value) {
      deleteMessage(messageToDelete.value);
    } else if (
      confirmAction.value === "deleteConversation" &&
      conversationToDelete.value
    ) {
      deleteConversation(conversationToDelete.value);
    }

    // Сбрасываем состояние подтверждения
    showConfirmDialog.value = false;
    confirmAction.value = null;
    messageToDelete.value = null;
    conversationToDelete.value = null;
  } catch (err) {
    console.error("Ошибка при обработке подтверждения:", err);
    // Сбрасываем состояние в случае ошибки
    showConfirmDialog.value = false;
  }
};

const deleteMessage = async (message) => {
  console.log("deleteMessage called for message:", message);
  try {
    const success = await chatStore.deleteMessage(
      selectedConversationId.value,
      message.id
    );
    if (success) {
      console.log("Сообщение успешно удалено через store");
      // Обновляем список сообщений после успешного удаления
      await chatStore.fetchMessages(selectedConversationId.value);
    } else {
      console.error("Не удалось удалить сообщение, ответ не success");
    }
  } catch (error) {
    console.error("Ошибка при удалении сообщения через store:", error);
  }
};

const deleteConversation = async (conversationId) => {
  console.log("deleteConversation called for conversation:", conversationId);
  try {
    closeWebSocket();
    const success = await chatStore.deleteConversation(conversationId);
    if (success) {
      console.log("Диалог успешно удален, перенаправление к списку чатов");
      selectedConversationId.value = null;
      selectedConversation.value = null;
      router.push({ name: "chat" });
    }
    if (isMobileView.value) goBack();
  } catch (error) {
    console.error("Ошибка при удалении диалога:", error);
  }
};

// Обработка клика по сообщению для открытия резюме
const handleMessageClick = (event) => {
  try {
    if (event.target.tagName === "A" && event.target.dataset.resumeId) {
      event.preventDefault();
      const resumeId = parseInt(event.target.dataset.resumeId);
      openResumePreview(resumeId);
    }
  } catch (err) {
    console.error("Ошибка при обработке клика по сообщению:", err);
  }
};

const openResumePreview = async (id) => {
  try {
    const response = await axios.get(`/api/resumes/${id}/`);
    selectedResume.value = response.data;
    showResumeModal.value = true;
  } catch (error) {
    console.error("Ошибка при загрузке резюме:", error);
  }
};

// Обработчик изменения размера окна
const handleResize = () => {
  isMobileView.value = window.innerWidth < 768;
};

// Инициализация WebSocket соединения
const initializeWebSocket = () => {
  console.log("[DEBUG] Chat.vue: инициализация WebSocket соединения");
  try {
    // Используем метод хранилища для подключения WebSocket
    if (authStore.isAuthenticated) {
      chatStore.connectWebSocket();
    }
  } catch (error) {
    console.error(
      "[DEBUG] Chat.vue: ошибка при инициализации WebSocket",
      error
    );
  }
};

// Функция для настройки автоматического обновления диалогов
const setupAutoRefresh = () => {
  // Очищаем предыдущий интервал, если он был
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }

  // Устанавливаем новый интервал для периодического обновления диалогов
  // Будем проверять новые диалоги каждые 10 секунд
  refreshInterval.value = setInterval(async () => {
    console.log(
      "[DEBUG] Chat.vue: выполняем автоматическое обновление диалогов"
    );
    try {
      // Проверка авторизации
      if (!authStore.isAuthenticated) return;

      // Загружаем актуальный список диалогов с сервера
      await chatStore.fetchConversations();
    } catch (err) {
      console.error(
        "[DEBUG] Chat.vue: ошибка при автоматическом обновлении диалогов",
        err
      );
    }
  }, 10000); // 10 секунд

  console.log("[DEBUG] Chat.vue: настроено автоматическое обновление диалогов");
};

// Инициализация и загрузка чатов
onMounted(async () => {
  try {
    await chatStore.init();
    if (chatStore.initialized) {
      isLoading.value = false;

      // Включаем автоматическое обновление диалогов
      setupAutoRefresh();

      // Проверяем наличие параметра forceMobile
      const forceMobile = route.query.forceMobile === "true";

      // Получаем id из параметра маршрута
      const conversationId = route.params.id;

      if (conversationId) {
        await chatStore.selectConversation(conversationId);
        // Если передан forceMobile=true, устанавливаем отображение диалога
        // даже на мобильной версии
        if (forceMobile) {
          console.log(
            "[ОТЛАДКА ЧАТА] Принудительное отображение диалога на мобильной версии"
          );
          selectedConversationId.value = conversationId;
        }
      } else {
        // Попробуем загрузить последний созданный чат, если он есть
        const lastCreatedChatId = localStorage.getItem("lastCreatedChatId");
        if (lastCreatedChatId && !selectedConversationId.value) {
          console.log(
            "[ОТЛАДКА ЧАТА] Загрузка последнего созданного чата:",
            lastCreatedChatId
          );
          await chatStore.selectConversation(lastCreatedChatId);
          // Проверяем forceMobile также и для этого случая
          if (forceMobile) {
            selectedConversationId.value = lastCreatedChatId;
          }
        }
      }
    }
  } catch (error) {
    console.error("Ошибка при загрузке чатов:", error);
    errorMessage.value =
      "Не удалось загрузить чаты. Пожалуйста, попробуйте позже.";
  }
});

// Обработка изменения размера окна
const updateMobileView = () => {
  isMobileView.value = window.innerWidth < 768;

  // Если мы в мобильном режиме и у нас есть forceMobile в query параметрах,
  // убедимся, что диалог отображается
  if (isMobileView.value && route.query.forceMobile === "true") {
    const id = route.params.id || localStorage.getItem("lastCreatedChatId");
    if (id) {
      selectedConversationId.value = id;
    }
  }
};

// Добавляем слушатель изменения размера окна
onMounted(() => {
  updateMobileView();
  window.addEventListener("resize", updateMobileView);

  // Инициализируем автоматическое обновление диалогов (дополнительная страховка)
  setupAutoRefresh();

  // Очистка query параметра forceMobile после успешной загрузки
  if (route.query.forceMobile) {
    nextTick(() => {
      router.replace({ query: { ...route.query, forceMobile: undefined } });
    });
  }
});

const partidosLastMessage = (conversation) => {
  if (!conversation || !conversation.last_message) return "";
  let lastMessageContent = conversation.last_message;

  // Попытка распарсить JSON, если это строка
  if (typeof lastMessageContent === "string") {
    try {
      const parsed = JSON.parse(lastMessageContent);
      // Если парсинг успешен и есть content, используем его
      if (parsed && typeof parsed.content === "string") {
        lastMessageContent = parsed.content;
      }
    } catch (e) {
      // Оставляем как есть, если это не JSON или ошибка парсинга
    }
  }
  // Если это объект и у него есть content, используем его
  else if (
    typeof lastMessageContent === "object" &&
    lastMessageContent !== null &&
    typeof lastMessageContent.content === "string"
  ) {
    lastMessageContent = lastMessageContent.content;
  }

  return lastMessageContent;
};

// Определяет, является ли сообщение резюме
const isResumeMessage = (content) => {
  if (!content) return false;

  try {
    // Проверяем, является ли сообщение JSON-объектом с типом "resume_attached"
    const data = JSON.parse(content);
    return data && data.type === "resume_attached";
  } catch (e) {
    // Если содержимое не является JSON, возвращаем false
    return false;
  }
};

// Парсит JSON-сообщение с резюме
const parseResumeMessage = (content) => {
  try {
    // Пытаемся распарсить JSON-сообщение
    const data = JSON.parse(content);
    if (data && data.type === "resume_attached") {
      return {
        resume_id: data.resume_id,
        title: data.resume_title || "Резюме",
        applicant_name: data.applicant_name || "Соискатель",
        skills: data.skills || [],
        desired_position: data.desired_position || "",
        professional_summary: data.professional_summary || "",
        salary_expectation: data.salary_expectation || "",
        preferred_employment: data.preferred_employment || "",
        resume_file_url: data.resume_file_url || "",
      };
    }
  } catch (e) {
    console.log("Ошибка при парсинге сообщения о резюме:", e);
    return null;
  }
  return null;
};

// Открывает резюме в новой вкладке
const openResume = (resumeId) => {
  if (resumeId) {
    window.open(`/resumes/${resumeId}`, "_blank");
  }
};

// Обработка события view-resume в компоненте ResumeMessageCard
const handleViewResume = async (resume) => {
  try {
    console.log("Showing resume details:", resume);

    // Используем данные, которые уже есть в объекте resume
    selectedResume.value = {
      ...resume,
      // Добавляем дополнительные поля для отображения в модальном окне
      title: resume.title || "Резюме",
      professional_summary: resume.professional_summary || "",
      skills: resume.skills || [],
      desired_position: resume.desired_position || "",
      salary_expectation: resume.salary_expectation || "",
      preferred_employment: resume.preferred_employment || "",
      cover_letter: resume.cover_letter || "",
      phone: resume.phone || "",
      email: resume.email || "",
      location: resume.location || "",
    };

    // Если у нас есть ID резюме, можно дополнительно запросить полные данные
    if (resume.resume_id) {
      try {
        const response = await axios.get(`/api/resumes/${resume.resume_id}/`);
        // Объединяем полученные данные с тем, что уже есть
        selectedResume.value = {
          ...selectedResume.value,
          ...response.data,
        };
      } catch (fetchError) {
        console.warn("Couldn't fetch additional resume details:", fetchError);
        // Продолжаем с тем, что есть
      }
    }

    showResumeModal.value = true;
  } catch (error) {
    console.error("Ошибка при отображении данных резюме:", error);
    errorMessage.value = "Не удалось отобразить данные резюме";
  }
};

// Обработчик для просмотра PDF резюме
const handleViewPdf = async (resumeId) => {
  try {
    console.log("Chat.vue: Fetching PDF for resume ID:", resumeId);

    // Если нет ID резюме, показываем уведомление
    if (!resumeId) {
      showNotification("Невозможно найти PDF для этого резюме", "warning");
      return;
    }

    let pdfUrl = null;
    let apiError = null;

    try {
      // Прямое получение информации о файле PDF через стандартный API
      console.log(`Chat.vue: Запрос PDF через API для ID: ${resumeId}`);

      // Здесь нет проверки на роль, API доступен для всех пользователей
      const response = await axios.get(`/api/resumes/${resumeId}/`);

      // Логируем весь ответ для отладки проблем на мобильном
      console.log("Chat.vue: Полный ответ API:", JSON.stringify(response.data));

      if (response.data) {
        // Проверяем разные поля, где может быть URL PDF файла
        if (response.data.resume_file_url) {
          pdfUrl = response.data.resume_file_url;
          console.log(
            "Chat.vue: Получен URL PDF из поля resume_file_url:",
            pdfUrl
          );
        } else if (response.data.resume_file) {
          pdfUrl = response.data.resume_file;
          console.log("Chat.vue: Получен URL PDF из поля resume_file:", pdfUrl);
        }
      }
    } catch (error) {
      console.error("Chat.vue: Ошибка API при получении PDF:", error);
      console.log(
        "Chat.vue: Подробная информация об ошибке:",
        error.response || error.message
      );
      apiError = error;

      // Пробуем альтернативный способ получения URL резюме
      try {
        console.log("Chat.vue: Пробуем API публичных резюме");
        const fileResponse = await axios.get(
          `/api/public-resumes/?id=${resumeId}`
        );
        console.log(
          "Chat.vue: Ответ API публичных резюме:",
          JSON.stringify(fileResponse.data)
        );

        if (fileResponse.data && fileResponse.data.length > 0) {
          const resumeData = fileResponse.data[0];
          if (resumeData.resume_file_url) {
            pdfUrl = resumeData.resume_file_url;
            console.log(
              "Chat.vue: Получен URL PDF из API публичных резюме:",
              pdfUrl
            );
          } else if (resumeData.resume_file) {
            pdfUrl = resumeData.resume_file;
            console.log(
              "Chat.vue: Получен URL PDF из поля resume_file публичных резюме:",
              pdfUrl
            );
          }
        }
      } catch (fileError) {
        console.error(
          "Chat.vue: Ошибка при получении из публичных резюме:",
          fileError
        );
      }
    }

    if (pdfUrl) {
      // Добавляем метку времени для предотвращения кэширования
      const pdfUrl2 = `${pdfUrl}?t=${new Date().getTime()}`;

      // Всегда используем getFileUrl для преобразования localhost в IP-адрес
      const fullPdfUrl = getFileUrl(pdfUrl2);
      console.log("Chat.vue: Полный URL PDF:", fullPdfUrl);

      // Показываем уведомление
      showNotification("PDF файл открывается...", "info");

      // Определяем мобильное устройство
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (isMobile) {
        console.log("Chat.vue: Обнаружено мобильное устройство, открываем PDF");

        // Упрощенный подход для мобильных - прямой переход по URL
        try {
          // Наиболее надежный метод для мобильных устройств
          window.location.href = fullPdfUrl;

          // Для отладки
          console.log("Chat.vue: Перенаправление на PDF URL:", fullPdfUrl);
        } catch (mobileError) {
          console.error("Chat.vue: Ошибка при открытии PDF:", mobileError);

          // В случае ошибки показываем уведомление со ссылкой
          showNotification(
            `Ошибка открытия PDF. Попробуйте открыть напрямую: ${fullPdfUrl}`,
            "error",
            10000
          );
        }
      } else {
        // На десктопе используем улучшенный метод с проверкой на блокировку всплывающих окон
        const newWindow = window.open(fullPdfUrl, "_blank");

        // Если не сработало окно (блокировка попапов), пробуем создать ссылку
        if (
          !newWindow ||
          newWindow.closed ||
          typeof newWindow.closed === "undefined"
        ) {
          console.log(
            "Chat.vue: Открытие окна заблокировано, пробуем альтернативный метод"
          );
          const link = document.createElement("a");
          link.href = fullPdfUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      console.log("Chat.vue: PDF открыт");
    } else {
      // Если URL не найден
      console.error("Chat.vue: URL PDF не найден");
      if (apiError) {
        showNotification(
          `PDF-файл для данного резюме не найден. Пожалуйста, свяжитесь с соискателем для получения резюме.`,
          "warning"
        );
      } else {
        showNotification("PDF-файл для данного резюме не найден", "warning");
      }
    }
  } catch (error) {
    console.error("Chat.vue: Ошибка при получении PDF-файла резюме:", error);
    showNotification("Не удалось получить PDF-файл резюме", "error");
  }
};

// Функция для полной перезагрузки чата
const fullReload = async () => {
  try {
    // Показываем индикатор загрузки
    loading.value = true;

    // Закрываем текущее WebSocket соединение
    closeWebSocket();

    // Очищаем текущие данные
    if (selectedConversationId.value) {
      const currentId = selectedConversationId.value;
      selectedConversationId.value = null;

      // Загружаем свежие данные диалогов
      await chatStore.fetchConversations(true);

      // Если был выбран диалог, загружаем для него свежие сообщения
      if (currentId) {
        selectedConversationId.value = currentId;
        await chatStore.fetchMessages(currentId);

        // Прокручиваем к последнему сообщению после обновления
        // Увеличиваем задержку для гарантии загрузки сообщений и перерисовки DOM
        setTimeout(() => {
          scrollToBottom();
          // Дополнительная проверка через еще одну задержку для надежности
          setTimeout(() => {
            scrollToBottom();
          }, 300);
        }, 300);
      }
    } else {
      // Просто загружаем свежие данные диалогов
      await chatStore.fetchConversations(true);
    }

    // Обновляем счетчик непрочитанных сообщений
    await chatStore.fetchUnreadCount();

    // Восстанавливаем соединение WebSocket
    chatStore.connectWebSocket();

    // Сообщаем пользователю об успешном обновлении
    showNotification("Чат успешно обновлен", "success");
  } catch (error) {
    console.error("Ошибка при перезагрузке чата:", error);
    showNotification("Произошла ошибка при обновлении чата", "error");
  } finally {
    // Скрываем индикатор загрузки
    loading.value = false;
  }
};

// Форматирование зарплаты с разделителями тысяч
const formatSalary = (salary) => {
  if (!salary) return "Не указана";

  // Пробуем преобразовать в число, если это строка
  const salaryNum = typeof salary === "string" ? parseInt(salary, 10) : salary;

  // Если удалось преобразовать, форматируем с разделителями тысяч
  if (!isNaN(salaryNum)) {
    return salaryNum.toLocaleString() + " ₽";
  }

  // Если не удалось преобразовать, возвращаем как есть
  return salary;
};

// Форматирование типа занятости
const formatEmploymentType = (type) => {
  const employmentTypes = {
    full_time: "Полный рабочий день",
    part_time: "Частичная занятость",
    project: "Проектная работа",
    internship: "Стажировка",
    remote: "Удаленная работа",
    flexible: "Гибкий график",
  };

  return employmentTypes[type] || type;
};
</script>

<style scoped>
.message-content a {
  color: #10b981;
  text-decoration: underline;
}

/* Стили для временных сообщений */
.message-container.is-pending {
  opacity: 0.8;
  position: relative;
}

.message-container.is-pending::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -20px;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: 2px solid #6b7280;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.message-container.has-error {
  border: 1px solid #ef4444;
  position: relative;
}

.message-container.has-error::after {
  content: "!";
  position: absolute;
  top: 0;
  right: -20px;
  background-color: #ef4444;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

@keyframes spin {
  0% {
    transform: translateY(-50%) rotate(0deg);
  }
  100% {
    transform: translateY(-50%) rotate(360deg);
  }
}

/* Индикатор набора текста */
.typing-indicator {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  background-color: #6b7280;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
  animation: typing 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}

/* Улучшения для мобильного отображения */
@media (max-width: 767px) {
  .flex-grow.overflow-y-auto {
    /* Убираем нижний паддинг и нижний отступ для устранения черной полосы */
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
  }

  /* Обеспечиваем, чтобы сообщения были видны над полем ввода */
  .message-container {
    position: relative;
    z-index: 5;
  }

  /* Увеличиваем отступы для мобильных устройств */
  .sidebar-container,
  .chat-container {
    padding: 8px !important;
  }

  /* Улучшаем позиционирование формы отправки сообщений */
  .message-input-container {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    background-color: #1f2937 !important;
    padding: 10px !important;
    z-index: 50 !important;
    border-top: 1px solid #374151 !important;
    box-shadow: none !important; /* Убираем тень для устранения визуального отделения */
    margin-top: 0 !important;
  }

  /* Стили для обертки поля ввода */
  .message-input-wrapper {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background-color: transparent !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
  }

  /* Убираем пространство между сообщениями и полем ввода */
  .messages-container {
    padding-bottom: 60px !important; /* Добавляем отступ снизу для сообщений, чтобы они не скрывались под полем ввода */
    margin-bottom: 0 !important;
  }

  /* Скрываем кнопку чата только на странице чата в мобильной версии */
  :deep([class*="message-icon"]),
  :deep(.chat-button) {
    display: none !important;
  }

  /* Фиксируем высоту контейнера сообщений */
  .flex-col.md\:flex-row.h-\[calc\(100vh-12rem\)\].min-h-0.relative {
    min-height: calc(100vh - 12rem) !important;
  }
}

/* Контейнер сообщений с правильным скроллингом */
.flex-grow.overflow-y-auto {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Дополнительные стили для мобильного отображения сообщений */
@media (max-width: 767px) {
  .flex-grow.overflow-y-auto.messages-container {
    margin-bottom: 0 !important;
    padding-bottom: 60px !important; /* Отступ для поля ввода */
  }

  /* Убираем лишние отступы в контейнере сообщений */
  .w-full.md\:w-2\/3.flex.flex-col.min-h-0 {
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* Обеспечиваем, чтобы последнее сообщение не скрывалось под полем ввода */
  .w-full.md\:w-2\/3.flex.flex-col.min-h-0 > div:last-child {
    margin-bottom: 0 !important;
  }
}
</style>
