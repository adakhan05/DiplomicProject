<template>
  <div
    class="resume-message-card bg-gray-800 border border-green-500 rounded-lg p-4 my-2 shadow"
  >
    <div class="resume-header flex items-center mb-3">
      <span class="material-icons text-green-500 mr-2">description</span>
      <h3 class="text-lg font-semibold text-green-400">Резюме соискателя</h3>
    </div>

    <div class="resume-info mb-3">
      <div class="applicant-name text-lg text-white font-medium mb-1">
        {{ resume.applicant_name }}
      </div>
      <div class="resume-title text-md text-gray-300 mb-2">
        {{ resume.title }}
      </div>

      <div v-if="resume.skills && resume.skills.length" class="skills mt-2">
        <div class="text-sm text-gray-400 mb-1 font-medium">Навыки:</div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(skill, index) in resume.skills.slice(0, 5)"
            :key="index"
            class="px-2 py-1 bg-gray-700 text-green-300 text-xs rounded-full"
          >
            {{ skill }}
          </span>
          <span
            v-if="resume.skills.length > 5"
            class="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full"
          >
            +{{ resume.skills.length - 5 }}
          </span>
        </div>
      </div>

      <div v-if="resume.cover_letter" class="cover-letter mt-3">
        <div class="text-sm text-gray-400 mb-1 font-medium">
          Сопроводительное письмо:
        </div>
        <div class="bg-gray-700 p-2 rounded text-sm text-white">
          {{
            resume.cover_letter.length > 150
              ? resume.cover_letter.substring(0, 150) + "..."
              : resume.cover_letter
          }}
        </div>
      </div>

      <div v-if="resume.professional_summary" class="professional-summary mt-3">
        <div class="text-sm text-gray-400 mb-1 font-medium">О себе:</div>
        <div class="bg-gray-700 p-2 rounded text-sm text-white">
          {{
            resume.professional_summary.length > 150
              ? resume.professional_summary.substring(0, 150) + "..."
              : resume.professional_summary
          }}
        </div>
      </div>
    </div>

    <div class="resume-actions flex justify-center space-x-3">
      <a
        @click="viewPdf"
        class="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-sm transition cursor-pointer"
      >
        <span class="material-icons text-sm mr-1">picture_as_pdf</span>
        Просмотреть PDF
      </a>
      <button
        @click="viewResume"
        class="flex items-center bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-md text-sm transition"
      >
        <span class="material-icons text-sm mr-1">visibility</span>
        Просмотреть полное резюме
      </button>
    </div>
  </div>
</template>

<script>
import { showNotification } from "@/utils/notifications";
import { getFileUrl } from "@/utils/fileHelper";

export default {
  name: "ResumeMessageCard",
  props: {
    resume: {
      type: Object,
      required: true,
    },
  },
  methods: {
    viewResume() {
      if (this.resume.resume_id) {
        this.$emit("view-resume", this.resume);
      }
    },
    async viewPdf() {
      try {
        // Сначала проверяем наличие resume_file_url (прямая ссылка на PDF)
        if (this.resume.resume_file_url) {
          try {
            // Добавляем метку времени для предотвращения кэширования
            const pdfUrl = `${
              this.resume.resume_file_url
            }?t=${new Date().getTime()}`;

            // Используем getFileUrl для преобразования localhost в IP-адрес
            const fullPdfUrl = getFileUrl(pdfUrl);
            console.log("ResumeMessageCard: Opening PDF with URL:", fullPdfUrl);

            // Показываем уведомление об открытии PDF
            showNotification("PDF файл открывается...", "info");

            // Определяем мобильное устройство
            const isMobile =
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
              );

            if (isMobile) {
              console.log("ResumeMessageCard: Обнаружено мобильное устройство");

              // Самый прямой и надежный метод для мобильных - смена window.location
              window.location.href = fullPdfUrl;
              console.log(
                "ResumeMessageCard: Перенаправление на PDF URL:",
                fullPdfUrl
              );
            } else {
              // На десктопе пробуем оба метода для надежности
              // Сначала стандартный метод
              const newWindow = window.open(fullPdfUrl, "_blank");

              // Если не сработало окно (блокировка попапов), пробуем создать ссылку
              if (
                !newWindow ||
                newWindow.closed ||
                typeof newWindow.closed === "undefined"
              ) {
                console.log(
                  "ResumeMessageCard: Открытие окна заблокировано, пробуем альтернативный метод"
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

            console.log("ResumeMessageCard: PDF открыт");
          } catch (error) {
            console.error(
              "ResumeMessageCard: Ошибка при открытии PDF напрямую:",
              error
            );
            showNotification("Произошла ошибка при открытии PDF", "error");

            // Если возникла ошибка при открытии напрямую, пробуем через родительский компонент
            if (this.resume.resume_id) {
              console.log(
                "ResumeMessageCard: Делегируем открытие PDF родительскому компоненту"
              );
              this.$emit("view-pdf", this.resume.resume_id);
            }
          }
        }
        // Если прямой ссылки нет, но есть ID резюме
        else if (this.resume.resume_id) {
          console.log(
            "ResumeMessageCard: Запрашиваем PDF по ID резюме:",
            this.resume.resume_id
          );
          showNotification("Загрузка PDF файла...", "info");
          this.$emit("view-pdf", this.resume.resume_id);
        }
        // Если нет ни ссылки, ни ID - сообщаем об ошибке
        else {
          console.error(
            "ResumeMessageCard: Отсутствует resume_file_url и resume_id"
          );
          showNotification("Ссылка на PDF файл отсутствует.", "error");
        }
      } catch (error) {
        console.error(
          "ResumeMessageCard: Общая ошибка при обработке PDF:",
          error
        );
        showNotification("Произошла ошибка при обработке PDF", "error");
        // В случае непредвиденной ошибки, пробуем делегировать родителю если есть ID
        if (this.resume.resume_id) {
          this.$emit("view-pdf", this.resume.resume_id);
        }
      }
    },
    formatSalary(salary) {
      if (!salary) return "Не указана";

      // Пробуем преобразовать в число, если это строка
      const salaryNum =
        typeof salary === "string" ? parseInt(salary, 10) : salary;

      // Если удалось преобразовать, форматируем с разделителями тысяч
      if (!isNaN(salaryNum)) {
        return salaryNum.toLocaleString() + " ₽";
      }

      // Если не удалось преобразовать, возвращаем как есть
      return salary;
    },
    formatEmploymentType(type) {
      const employmentTypes = {
        full_time: "Полный рабочий день",
        part_time: "Частичная занятость",
        project: "Проектная работа",
        internship: "Стажировка",
        remote: "Удаленная работа",
        flexible: "Гибкий график",
      };

      return employmentTypes[type] || type;
    },
  },
};
</script>

<style scoped>
.resume-message-card {
  transition: all 0.2s ease;
}
.resume-message-card:hover {
  border-color: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
}
</style>
