import { defineStore } from "pinia";
import axios from "axios";

export const useResumesStore = defineStore("resumes", {
  state: () => ({
    resumes: [],
    loading: false,
    error: null,
  }),

  getters: {
    activeResumes: (state) =>
      state.resumes.filter((resume) => resume.is_active),
  },

  actions: {
    async fetchResumes() {
      try {
        this.loading = true;
        this.error = null;

        console.log("Получение резюме из хранилища");

        // Явно добавляем заголовок авторизации
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Сначала пробуем основной эндпоинт
        try {
          const response = await axios.get("/api/resumes/", { headers });
          console.log("Хранилище резюме - ответ API:", response);

          if (response.data) {
            const resumesData = response.data.results || response.data;
            if (Array.isArray(resumesData)) {
              this.resumes = resumesData;
              return resumesData;
            }
          }
        } catch (error) {
          console.error(
            "Хранилище резюме - Первая конечная точка не сработала:",
            error
          );
        }

        // Пробуем альтернативный эндпоинт
        try {
          const response = await axios.get("/api/users/resumes/", { headers });
          console.log("Хранилище резюме - Альтернативный ответ API:", response);

          if (response.data) {
            const resumesData = response.data.results || response.data;
            if (Array.isArray(resumesData)) {
              this.resumes = resumesData;
              return resumesData;
            }
          }
        } catch (error) {
          console.error(
            "Хранилище резюме - Вторая конечная точка не сработала:",
            error
          );
        }

        // Если мы дошли сюда, резюме не найдены
        if (this.resumes.length === 0) {
          throw new Error("Не удалось получить резюме из API");
        }

        return this.resumes;
      } catch (error) {
        console.error("Ошибка получения резюме:", error);
        this.error =
          error.response?.data?.detail || "Не удалось получить резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createResume(resumeData) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.post("/api/resumes/", resumeData);
        this.resumes.push(response.data);
        return response.data;
      } catch (error) {
        console.error("Ошибка создания резюме:", error);
        this.error =
          error.response?.data?.detail || "Не удалось создать резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateResume(resumeId, resumeData) {
      try {
        this.loading = true;
        this.error = null;
        const response = await axios.patch(
          `/api/resumes/${resumeId}/`,
          resumeData
        );
        const index = this.resumes.findIndex((r) => r.id === resumeId);
        if (index !== -1) {
          this.resumes[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Ошибка обновления резюме:", error);
        this.error =
          error.response?.data?.detail || "Не удалось обновить резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteResume(resumeId) {
      try {
        this.loading = true;
        this.error = null;
        await axios.delete(`/api/resumes/${resumeId}/`);
        this.resumes = this.resumes.filter((r) => r.id !== resumeId);
      } catch (error) {
        console.error("Ошибка при удалении резюме:", error);
        this.error =
          error.response?.data?.detail || "Не удалось удалить резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async toggleResumeActive(resumeId) {
      try {
        this.loading = true;
        this.error = null;
        const resume = this.resumes.find((r) => r.id === resumeId);
        if (!resume) throw new Error("Резюме не найдено");

        const response = await axios.patch(`/api/resumes/${resumeId}/`, {
          is_active: !resume.is_active,
        });

        const index = this.resumes.findIndex((r) => r.id === resumeId);
        if (index !== -1) {
          this.resumes[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Ошибка при переключении статуса резюме:", error);
        this.error =
          error.response?.data?.detail ||
          "Не удалось переключить статус резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
