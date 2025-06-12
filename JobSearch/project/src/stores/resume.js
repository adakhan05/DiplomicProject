import { defineStore } from "pinia";
import axios from "axios";
import { get, post, put, del } from "@/utils/api-helper";

export const useResumeStore = defineStore("resume", {
  state: () => ({
    resumes: [],
    currentResume: null,
    loading: false,
    error: null,
  }),

  getters: {
    activeResumes: (state) =>
      state.resumes.filter((resume) => resume.is_active),
    hasActiveResume: (state) =>
      state.resumes.some((resume) => resume.is_active),
  },

  actions: {
    async fetchResumes(filters = {}) {
      this.loading = true;
      this.error = null;
      try {
        console.log("Получение резюме из API с фильтрами:", filters);
        // Создаем параметры запроса из фильтров
        const params = new URLSearchParams();
        if (filters.search) params.append("search", filters.search);
        if (filters.location) params.append("location", filters.location);
        if (filters.position) params.append("position", filters.position);
        if (filters.employment_type)
          params.append("employment_type", filters.employment_type);
        // Добавляйте другие фильтры по мере необходимости

        const response = await axios.get("/api/resumes/", { params });

        // Сохраняем в кэш при успешном получении
        if (response.data && Array.isArray(response.data)) {
          localStorage.setItem("resumesCache", JSON.stringify(response.data));
          this.resumes = response.data;
        }

        console.log(`Получено ${this.resumes.length} резюме`);
        return this.resumes;
      } catch (error) {
        console.error("Ошибка при получении резюме:", error);
        this.error = error.message || "Ошибка при загрузке резюме";

        // Проверяем кэш при ошибке
        try {
          const cachedData = localStorage.getItem("resumesCache");
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed)) {
              console.log("Загружены резюме из кэша");
              this.resumes = parsed;
              return parsed;
            }
          }
        } catch (cacheError) {
          console.error("Ошибка при чтении кэша резюме:", cacheError);
        }

        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchResume(id) {
      try {
        this.loading = true;
        this.error = null;

        const data = await get(`/api/users/resumes/${id}/`);
        this.currentResume = data;
        return data;
      } catch (error) {
        console.error("Ошибка при получении резюме:", error);
        this.error = "Ошибка при загрузке резюме";

        // Ищем в локальном массиве
        const found = this.resumes.find((r) => r.id === Number(id));
        if (found) {
          this.currentResume = found;
          return found;
        }
        return null;
      } finally {
        this.loading = false;
      }
    },

    async createResume(formData) {
      try {
        this.loading = true;
        this.error = null;

        // Явно устанавливаем is_active в true при создании
        formData.append("is_active", "true");

        const response = await axios.post("/api/resumes/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        this.resumes.push(response.data);
        // Обновляем кэш
        localStorage.setItem("resumesCache", JSON.stringify(this.resumes));

        return response.data;
      } catch (error) {
        console.error("Ошибка при создании резюме:", error);
        this.error = "Ошибка при создании резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateResume(id, formData) {
      try {
        this.loading = true;
        this.error = null;

        // Явно устанавливаем is_active в true при обновлении
        formData.append("is_active", "true");

        const response = await axios.put(`/api/resumes/${id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const index = this.resumes.findIndex((r) => r.id === id);
        if (index !== -1) {
          this.resumes[index] = response.data;
          // Обновляем кэш
          localStorage.setItem("resumesCache", JSON.stringify(this.resumes));
        }

        return response.data;
      } catch (error) {
        console.error("Ошибка при обновлении резюме:", error);
        this.error = "Ошибка при обновлении резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteResume(id) {
      try {
        this.loading = true;
        this.error = null;

        await axios.delete(`/api/resumes/${id}/`);

        this.resumes = this.resumes.filter((r) => r.id !== id);
        // Обновляем кэш
        localStorage.setItem("resumesCache", JSON.stringify(this.resumes));
      } catch (error) {
        console.error("Ошибка при удалении резюме:", error);
        this.error = "Ошибка при удалении резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async toggleResumeActive(id) {
      try {
        this.loading = true;
        this.error = null;

        const response = await axios.post(`/api/resumes/${id}/toggle_active/`);

        const index = this.resumes.findIndex((r) => r.id === id);
        if (index !== -1) {
          this.resumes[index].is_active = response.data.is_active;
          // Обновляем кэш
          localStorage.setItem("resumesCache", JSON.stringify(this.resumes));
        }

        return response.data;
      } catch (error) {
        console.error("Ошибка при изменении статуса резюме:", error);
        this.error = "Ошибка при изменении статуса резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeResumeFile(id) {
      try {
        this.loading = true;
        this.error = null;

        console.log(`Removing PDF file for resume with ID: ${id}`);
        const response = await axios.post(
          `/api/resumes/${id}/remove_resume_file/`
        );

        // Обновляем объект резюме в массиве
        const index = this.resumes.findIndex((r) => r.id === id);
        if (index !== -1 && response.data.resume) {
          // Заменяем данные резюме полностью
          this.resumes[index] = response.data.resume;
          // Обновляем кэш
          localStorage.setItem("resumesCache", JSON.stringify(this.resumes));
          console.log(`Updated resume in store after file removal: ID=${id}`);
        }

        return response.data;
      } catch (error) {
        console.error("Ошибка при удалении файла резюме:", error);
        this.error = "Ошибка при удалении файла резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addExperience(resumeId, experienceData) {
      try {
        const response = await post(
          `/api/users/resumes/${resumeId}/add_experience/`,
          experienceData
        );
        return response.data;
      } catch (error) {
        console.error("Ошибка при добавлении опыта работы:", error);
        this.error = "Ошибка при добавлении опыта работы";
        throw error;
      }
    },

    async addEducation(resumeId, educationData) {
      try {
        const response = await post(
          `/api/users/resumes/${resumeId}/add_education/`,
          educationData
        );
        return response.data;
      } catch (error) {
        console.error("Ошибка при добавлении образования:", error);
        this.error = "Ошибка при добавлении образования";
        throw error;
      }
    },

    async addPortfolio(resumeId, portfolioData) {
      try {
        const response = await post(
          `/api/users/resumes/${resumeId}/add_portfolio/`,
          portfolioData
        );
        return response.data;
      } catch (error) {
        console.error("Ошибка при добавлении портфолио:", error);
        this.error = "Ошибка при добавлении портфолио";
        throw error;
      }
    },
  },
});
