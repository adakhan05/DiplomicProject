import { defineStore } from "pinia";
import axios from "axios";

export const usePublicResumesStore = defineStore("publicResumes", {
  state: () => ({
    resumes: [],
    loading: false,
    error: null,
    filters: {
      search: "",
      location: "",
      position: "",
      employment_type: "",
      skills: [],
    },
  }),

  getters: {
    filteredResumes: (state) => {
      if (!state.resumes.length) return [];

      return state.resumes.filter((resume) => {
        // Поиск по названию резюме, имени или желаемой должности
        const searchMatch =
          !state.filters.search ||
          resume.title
            .toLowerCase()
            .includes(state.filters.search.toLowerCase()) ||
          resume.user.username
            .toLowerCase()
            .includes(state.filters.search.toLowerCase()) ||
          resume.desired_position
            .toLowerCase()
            .includes(state.filters.search.toLowerCase());

        // Фильтр по городу (если известен)
        const locationMatch =
          !state.filters.location ||
          (resume.user.location &&
            resume.user.location
              .toLowerCase()
              .includes(state.filters.location.toLowerCase()));

        // Фильтр по желаемой должности
        const positionMatch =
          !state.filters.position ||
          resume.desired_position
            .toLowerCase()
            .includes(state.filters.position.toLowerCase());

        // Фильтр по типу занятости
        const employmentMatch =
          !state.filters.employment_type ||
          resume.preferred_employment === state.filters.employment_type;

        // Фильтр по навыкам
        const skillsMatch =
          state.filters.skills.length === 0 ||
          state.filters.skills.some(
            (skill) =>
              resume.skills &&
              resume.skills.some((resumeSkill) =>
                resumeSkill.toLowerCase().includes(skill.toLowerCase())
              )
          );

        return (
          searchMatch &&
          locationMatch &&
          positionMatch &&
          employmentMatch &&
          skillsMatch
        );
      });
    },
  },

  actions: {
    async fetchPublicResumes() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get("/api/public-resumes/");
        console.log("Fetched public resumes:", response.data);
        this.resumes = response.data;
        return this.resumes;
      } catch (error) {
        console.error("Error fetching public resumes:", error);
        this.error = error.message || "Ошибка при загрузке резюме";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setFilter(filterName, value) {
      this.filters[filterName] = value;
    },

    resetFilters() {
      this.filters = {
        search: "",
        location: "",
        position: "",
        employment_type: "",
        skills: [],
      };
    },

    // Метод для начала чата с соискателем
    async startChat(userId) {
      try {
        // Здесь должна быть логика для создания или получения существующего чата
        // Возвращаемся в существующий чат или создаем новый
        return { success: true, userId };
      } catch (error) {
        console.error("Ошибка при начале чата:", error);
        throw error;
      }
    },
  },
});
