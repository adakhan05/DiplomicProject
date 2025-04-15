import { defineStore } from "pinia";
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
    async fetchResumes() {
      try {
        this.loading = true;
        this.error = null;

        const data = await get("/api/users/resumes/");

        // Сохраняем в кэш при успешном получении
        if (data && Array.isArray(data)) {
          localStorage.setItem("resumesCache", JSON.stringify(data));
          this.resumes = data;
        }

        return this.resumes;
      } catch (error) {
        console.error("Error fetching resumes:", error);
        this.error = "Ошибка при загрузке резюме";

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

        return [];
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
        console.error("Error fetching resume:", error);
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

    async createResume(resumeData) {
      try {
        this.loading = true;
        this.error = null;

        const data = await post("/api/users/resumes/", resumeData);
        this.resumes.push(data);

        // Обновляем кэш
        localStorage.setItem("resumesCache", JSON.stringify(this.resumes));

        return data;
      } catch (error) {
        console.error("Error creating resume:", error);
        this.error = "Ошибка при создании резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateResume(id, resumeData) {
      try {
        this.loading = true;
        this.error = null;

        const data = await put(`/api/users/resumes/${id}/`, resumeData);

        const index = this.resumes.findIndex((r) => r.id === id);
        if (index !== -1) {
          this.resumes[index] = data;
          // Обновляем кэш
          localStorage.setItem("resumesCache", JSON.stringify(this.resumes));
        }

        return data;
      } catch (error) {
        console.error("Error updating resume:", error);
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

        await del(`/api/users/resumes/${id}/`);

        this.resumes = this.resumes.filter((r) => r.id !== id);
        // Обновляем кэш
        localStorage.setItem("resumesCache", JSON.stringify(this.resumes));
      } catch (error) {
        console.error("Error deleting resume:", error);
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

        const data = await post(`/api/users/resumes/${id}/toggle_active/`);

        const index = this.resumes.findIndex((r) => r.id === id);
        if (index !== -1) {
          this.resumes[index].is_active = data.is_active;
          // Обновляем кэш
          localStorage.setItem("resumesCache", JSON.stringify(this.resumes));
        }

        return data;
      } catch (error) {
        console.error("Error toggling resume active status:", error);
        this.error = "Ошибка при изменении статуса резюме";
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
        console.error("Error adding experience:", error);
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
        console.error("Error adding education:", error);
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
        console.error("Error adding portfolio item:", error);
        this.error = "Ошибка при добавлении портфолио";
        throw error;
      }
    },
  },
});
