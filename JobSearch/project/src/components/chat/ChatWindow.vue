<template>
  <div
    class="chat-window bg-white rounded-lg shadow-lg p-4 h-[600px] flex flex-col"
  >
    <!-- Заголовок чата -->
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
            title="Удалить чат"
          >
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Сообщения в чате -->
    <div
      class="messages-container flex-grow overflow-y-auto mb-4"
      ref="messagesContainer"
    >
      <div v-if="loading" class="flex justify-center items-center h-full">
        <div class="spinner"></div>
      </div>
      <div
        v-else-if="!messages || messages.length === 0"
        class="text-center text-gray-500 mt-8"
      >
        <div class="flex flex-col items-center">
          <span class="material-icons text-3xl mb-2">chat</span>
          <p>Нет сообщений в этом чате</p>
          <p class="text-sm mt-2">Отправьте сообщение, чтобы начать беседу</p>
        </div>
      </div>
      <template v-else>
        <div
          v-for="(message, index) in messages"
          :key="message.id || index"
          class="message-wrapper mb-3"
        >
          <!-- Сообщение с опциями -->
          <div class="flex items-start relative group">
            <!-- Отображение сообщения -->
            <div
              :class="[
                'message p-3 rounded-lg max-w-[85%] break-words',
                isCurrentUser(message)
                  ? 'ml-auto bg-green-600 text-white'
                  : 'bg-gray-700 text-white',
              ]"
            >
              <!-- Отправитель сообщения (только для сообщений от других пользователей) -->
              <div
                v-if="!isCurrentUser(message)"
                class="message-sender text-xs text-green-300 mb-1"
              >
                {{ message.sender_name || "Пользователь" }}
              </div>

              <!-- Сообщение с резюме -->
              <resume-message-card
                v-if="isResumeMessage(message.content)"
                :resume="parseResumeMessage(message.content)"
              />

              <!-- Содержимое обычного сообщения -->
              <div
                v-else-if="message.text && message.text.includes('Моё резюме:')"
                class="resume-message"
              >
                <div v-html="formatResumeMessage(message.text)"></div>
              </div>
              <div
                v-else
                class="message-text"
                v-html="formatMessage(message.content || message.text)"
              ></div>

              <!-- Message Timestamp -->
              <div
                :class="[
                  'message-time text-xs mt-1',
                  isCurrentUser(message) ? 'text-green-200' : 'text-gray-300',
                ]"
              >
                {{ formatTime(message.created_at) }}
              </div>
            </div>

            <!-- Опции сообщения (Удалить) - Только для сообщений текущего пользователя -->
            <div
              v-if="isCurrentUser(message)"
              class="message-options opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1"
            >
              <button
                @click="
                  $emit('delete-message', {
                    conversationId: conversation.id,
                    messageId: message.id,
                  })
                "
                class="p-1 bg-gray-700 rounded-full text-gray-300 hover:text-red-500"
                title="Удалить сообщение"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Поле ввода сообщения -->
    <div class="chat-input mt-auto">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <textarea
          v-model="newMessage"
          @keydown.enter.prevent="sendMessage"
          placeholder="Введите сообщение..."
          class="flex-grow p-3 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          rows="2"
        ></textarea>
        <button
          type="submit"
          class="p-3 bg-green-600 text-white rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          :disabled="!newMessage.trim() || sendingMessage"
        >
          <span class="material-icons">send</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import ResumeMessageCard from "./ResumeMessageCard.vue";

export default {
  name: "ChatWindow",
  components: {
    ResumeMessageCard,
  },
  props: {
    selectedUser: {
      type: Object,
      default: null,
    },
    currentUser: {
      type: Object,
      required: true,
    },
    conversation: {
      type: Object,
      required: true,
    },
    messages: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    sendingMessage: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const store = useStore();
    const messagesContainer = ref(null);
    const newMessage = ref("");

    const loadMessages = async () => {
      if (!props.selectedUser) return;
      try {
        // Список возможных URL для загрузки сообщений
        const possibleMessageUrls = [
          `/api/jobs/messages/?pk=${props.selectedUser.id}_${
            props.conversation.job?.id || "none"
          }`,
          `/api/messages/?pk=${props.selectedUser.id}_${
            props.conversation.job?.id || "none"
          }`,
          `/jobs/messages/?pk=${props.selectedUser.id}_${
            props.conversation.job?.id || "none"
          }`,
          `/messages/?pk=${props.selectedUser.id}_${
            props.conversation.job?.id || "none"
          }`,
        ];

        let response;
        let successUrl = null;

        for (const url of possibleMessageUrls) {
          try {
            console.log(`loadMessages: пробуем URL: ${url}`);
            response = await axios.get(url);
            successUrl = url;
            console.log(`loadMessages: успешный запрос к ${url}`);
            break;
          } catch (err) {
            console.log(
              `loadMessages: ошибка при использовании URL ${url}:`,
              err.message
            );
          }
        }

        if (!successUrl) {
          console.error(
            "loadMessages: ни один URL не работает для загрузки сообщений"
          );
          return;
        }

        props.messages = response.data;
        scrollToBottom();
      } catch (error) {
        console.error("Ошибка загрузки сообщений:", error);
      }
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || props.sendingMessage) return;

      try {
        // Список возможных URL для отправки сообщений
        const possibleMessageUrls = [
          "/api/jobs/messages/",
          "/api/messages/",
          "/api/chat/",
          "/chat/",
        ];

        let response;
        let successUrl = null;

        for (const url of possibleMessageUrls) {
          try {
            console.log(`sendMessage: пробуем URL: ${url}`);
            response = await axios.post(url, {
              content: newMessage.value,
              recipient: props.selectedUser.id,
            });
            successUrl = url;
            console.log(`sendMessage: успешный запрос к ${url}`);
            break;
          } catch (err) {
            console.log(
              `sendMessage: ошибка при использовании URL ${url}:`,
              err.message
            );
          }
        }

        if (!successUrl) {
          console.error(
            "sendMessage: ни один URL не работает для отправки сообщений"
          );
          return;
        }

        props.messages.push(response.data);
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

    const isResumeMessage = (content) => {
      if (!content) return false;

      try {
        // Проверяем, является ли сообщение JSON-объектом с типом "resume_attached"
        const data = JSON.parse(content);
        return data && data.type === "resume_attached";
      } catch (e) {
        // Если содержимое не является JSON, проверяем по тексту
        return (
          typeof content === "string" &&
          (content.includes('class="resume-link"') ||
            content.includes("Моё резюме:"))
        );
      }
    };

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
          };
        }
      } catch (e) {
        // Если не удалось распарсить JSON, возвращаем базовый объект
        console.log("Ошибка при парсинге сообщения о резюме:", e);
        return {
          resume_id: null,
          title: "Резюме",
          applicant_name: "Соискатель",
        };
      }
    };

    const getResumeMessageText = (content) => {
      // Извлекаем текст до кнопки и саму ссылку
      const match = content.match(
        /^(.*?)(<a [^>]*class=\"resume-link\"[^>]*>.*?<\/a>)/
      );
      if (match) {
        return `${match[1]}<br/>`;
      }
      return content;
    };
    const openResumeFromMessage = (content) => {
      const match = content.match(/href=\"(\/resumes\/[0-9]+)\"/);
      if (match) {
        window.open(match[1], "_blank");
      }
    };

    const formatMessage = (text) => {
      if (!text) return "";

      // Заменяем URL на кликабельные ссылки
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let formattedText = text.replace(
        urlRegex,
        '<a href="$1" target="_blank" class="text-blue-300 underline">$1</a>'
      );

      // Заменяем новые строки на <br>
      formattedText = formattedText.replace(/\n/g, "<br>");

      // Форматируем ссылки на резюме
      const resumeRegex = /\/resumes\/(\d+)/g;
      formattedText = formattedText.replace(
        resumeRegex,
        '<a href="/resumes/$1" class="text-blue-300 underline">посмотреть резюме</a>'
      );

      return formattedText;
    };

    const formatResumeMessage = (text) => {
      if (!text) return "";

      // Создаем красивое форматирование для сообщения с резюме
      const lines = text.split("\n");
      let html = '<div class="resume-card bg-gray-800 p-3 rounded-lg">';

      // Обрабатываем заголовок (первая строка)
      if (lines.length > 0) {
        html += `<div class="resume-title font-bold text-green-300 mb-2">${formatMessage(
          lines[0]
        )}</div>`;
      }

      // Обрабатываем остальные строки
      if (lines.length > 1) {
        html += '<div class="resume-details">';
        for (let i = 1; i < lines.length - 1; i++) {
          if (lines[i].trim()) {
            html += `<div class="resume-line my-1">${formatMessage(
              lines[i]
            )}</div>`;
          }
        }
        html += "</div>";
      }

      // Обрабатываем ссылку на резюме (обычно последняя строка)
      if (lines.length > 1) {
        const lastLine = lines[lines.length - 1];
        if (lastLine.includes("/resumes/")) {
          const resumeRegex = /\/resumes\/(\d+)/;
          const match = lastLine.match(resumeRegex);
          if (match && match[1]) {
            html += `<div class="resume-link-container mt-2">
              <a href="/resumes/${match[1]}" class="resume-link inline-flex items-center bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                <span class="material-icons mr-1 text-sm">description</span>
                Открыть полное резюме
              </a>
            </div>`;
          } else {
            html += `<div class="resume-link-container mt-2">${formatMessage(
              lastLine
            )}</div>`;
          }
        } else {
          html += `<div class="resume-text mt-2">${formatMessage(
            lastLine
          )}</div>`;
        }
      }

      html += "</div>";
      return html;
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const isCurrentUser = (message) => {
      // Получить ID текущего пользователя из localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = user?.id || null;

      return String(message.sender) === String(currentUserId);
    };

    let messageSocket;
    if (props.conversation && !props.selectedUser) {
      // Канал уведомлений для работодателя
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id) {
        messageSocket = new WebSocket(`ws://${window.location.host}/ws/chat/`);
        messageSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "new_conversation") {
            // запустить родительский список пользователей
            emit("new-conversation", data);
          }
        };
      }
    }

    watch(
      () => props.selectedUser,
      (newUser) => {
        if (newUser) {
          loadMessages();
        } else {
          props.messages = [];
        }
      }
    );

    onMounted(() => {
      if (props.selectedUser) {
        loadMessages();
      }
    });

    return {
      messagesContainer,
      newMessage,
      sendMessage,
      scrollToBottom,
      formatDate,
      formatMessageText,
      isResumeMessage,
      getResumeMessageText,
      openResumeFromMessage,
      formatMessage,
      formatResumeMessage,
      formatTime,
      isCurrentUser,
      parseResumeMessage,
    };
  },
};
</script>

<style scoped>
.chat-window {
  background-color: #1a202c;
  border: 1px solid #2d3748;
}

.messages-container {
  scrollbar-width: thin;
  scrollbar-color: #4a5568 #2d3748;
}

.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #2d3748;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: #4a5568;
  border-radius: 4px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #10b981;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Стили для сообщений с резюме */
.resume-card {
  border-left: 3px solid #10b981;
}

.resume-link {
  transition: all 0.2s ease;
}

.resume-link:hover {
  transform: translateY(-1px);
}
</style>
