import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { handleAxiosError, safeStorage } from "@/utils/api-helper";

export const useJobsStore = defineStore("jobs", {
  state: () => ({
    jobs: [],
    filteredJobs: [],
    job: null,
    loading: false,
    error: null,
    filters: {
      query: "",
      location: "",
      employment_type: [],
      experience_level: [],
      salary_min: "",
      salary_max: "",
      sort_by: "created_at",
      sort_order: "desc",
    },
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
    },
    stats: {
      totalJobs: 0,
      byEmploymentType: {},
      byExperience: {},
    },
  }),

  getters: {
    getJobs: (state) => state.jobs,
    getFilteredJobs: (state) => state.filteredJobs,
    getFilters: (state) => state.filters,
    getPagination: (state) => state.pagination,
    getStats: (state) => state.stats,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getJob: (state) => state.job,
    activeJobs: (state) => {
      if (!state.jobs || !Array.isArray(state.jobs)) {
        return [];
      }
      // Строго фильтруем только по активным вакансиям
      return state.jobs.filter((job) => job && job.is_active === true);
    },
    paginatedJobs: (state) => {
      const start = (state.pagination.page - 1) * state.pagination.perPage;
      const end = start + state.pagination.perPage;
      return state.filteredJobs.slice(start, end);
    },
    totalPages: (state) => {
      return Math.ceil(state.filteredJobs.length / state.pagination.perPage);
    },
    getJobById: (state) => (id) => {
      return state.jobs.find((job) => job.id === parseInt(id));
    },
  },

  actions: {
    async fetchJobs(filterParams) {
      this.loading = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams();

        // Используем либо переданные фильтры, либо фильтры из хранилища
        const filters = filterParams || this.filters;

        // Всегда включаем активные вакансии для публичного списка
        queryParams.append("is_active", "true");

        if (filters.search || filters.query) {
          queryParams.append("title", filters.search || filters.query);
        }

        if (filters.location) {
          queryParams.append("location", filters.location);
        }

        if (filters.employment_type) {
          if (Array.isArray(filters.employment_type)) {
            filters.employment_type.forEach((type) => {
              queryParams.append("employment_type", type);
            });
          } else if (
            typeof filters.employment_type === "string" &&
            filters.employment_type.trim() !== ""
          ) {
            queryParams.append("employment_type", filters.employment_type);
          }
        }

        if (filters.experience_level) {
          if (Array.isArray(filters.experience_level)) {
            filters.experience_level.forEach((level) => {
              queryParams.append("experience", level);
            });
          } else if (
            typeof filters.experience_level === "string" &&
            filters.experience_level.trim() !== ""
          ) {
            queryParams.append("experience", filters.experience_level);
          }
        }

        if (filters.salary_min !== undefined && filters.salary_min !== null) {
          queryParams.append("min_salary", filters.salary_min);
        }

        if (filters.salary_max !== undefined && filters.salary_max !== null) {
          queryParams.append("salary_max", filters.salary_max);
        }

        if (this.filters.sort_by) {
          const sortParam =
            this.filters.sort_order === "desc"
              ? `-${this.filters.sort_by}`
              : this.filters.sort_by;
          queryParams.append("ordering", sortParam);
        }

        const queryString = queryParams.toString();
        const url = `/api/jobs/${queryString ? `?${queryString}` : ""}`;

        console.log(`Загрузка вакансий из API: ${url}`);
        const response = await axios.get(url);

        this.jobs = response.data.results || response.data || [];
        this.pagination.total = response.data.count || this.jobs.length;

        // Проверяем список удалённых вакансий и исключаем их
        try {
          const deletedJobs = JSON.parse(
            localStorage.getItem("deletedJobs") || "[]"
          );
          if (deletedJobs.length > 0) {
            console.log(
              `Фильтрация ${deletedJobs.length} удалённых вакансий из общего списка`
            );
            const oldCount = this.jobs.length;
            this.jobs = this.jobs.filter(
              (job) => !deletedJobs.includes(Number(job.id))
            );
            console.log(
              `Удалено из списка вакансий ${
                oldCount - this.jobs.length
              } вакансий, ранее отмеченных как удалённые`
            );
          }
        } catch (err) {
          console.error("Ошибка при фильтрации удалённых вакансий:", err);
        }

        // После получения вакансий с API, проверяем их статусы в localStorage
        // (это важно для синхронизации измененных, но еще не сохраненных на сервере статусов)
        if (this.jobs.length > 0) {
          try {
            const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
            if (storedJobs.length > 0) {
              console.log("Проверка статусов вакансий в localStorage");
              let hasChanges = false;

              this.jobs.forEach((job) => {
                const storedJob = storedJobs.find(
                  (j) => Number(j.id) === Number(job.id)
                );
                if (
                  storedJob &&
                  storedJob.is_active !== undefined &&
                  storedJob.is_active !== job.is_active
                ) {
                  console.log(
                    `Обновление статуса вакансии [${job.id}] из localStorage: ${job.is_active} -> ${storedJob.is_active}`
                  );
                  job.is_active = storedJob.is_active;
                  hasChanges = true;
                }
              });

              if (hasChanges) {
                console.log("Статусы вакансий обновлены из localStorage");
              }
            }
          } catch (err) {
            console.error("Ошибка при проверке статусов в localStorage:", err);
          }
        }

        // Обновляем отфильтрованный список вакансий
        this.updateFilteredJobs();

        await this.fetchJobStats();
        return this.jobs;
      } catch (error) {
        const errorMessage = handleAxiosError(error);
        this.error = errorMessage;
        console.error("Error fetching jobs:", errorMessage);
        return [];
      } finally {
        this.loading = false;
      }
    },

    async fetchMyJobs() {
      this.loading = true;
      this.error = null;

      try {
        console.log("Загрузка моих вакансий и счетчиков заявок...");

        // Использовать реальный API для получения вакансий независимо от среды выполнения
        const url = "/api/jobs/my/";
        console.log(`Загрузка вакансий из API: ${url}`);

        try {
          const response = await axios.get(url);

          if (response.data) {
            console.log(`Получено ${response.data.length} вакансий из API`);
            if (Array.isArray(response.data.results)) {
              this.jobs = response.data.results;
            } else if (Array.isArray(response.data)) {
              this.jobs = response.data;
            } else {
              console.error("Неожиданный формат ответа:", response.data);
              this.jobs = [];
            }
          } else {
            console.warn("No data returned from API");
            this.jobs = [];
          }
        } catch (apiError) {
          console.error("Ошибка загрузки вакансий из API:", apiError);
          this.error = "Не удалось загрузить вакансии с сервера";
          this.jobs = [];
        }

        return this.jobs;
      } catch (error) {
        console.error("Ошибка в fetchMyJobs:", error);
        this.error = "Произошла ошибка при загрузке вакансий";
        return [];
      } finally {
        this.loading = false;
      }
    },

    async getEmployerJobs() {
      this.loading = true;
      this.error = null;
      try {
        console.log("getEmployerJobs: Получение вакансий работодателя");

        // Получаем информацию о текущем пользователе из хранилища авторизации
        const authStore = useAuthStore();
        const currentUser = authStore.user;

        if (!currentUser || !currentUser.id) {
          console.warn(
            "getEmployerJobs: Пользователь не авторизован или не имеет ID"
          );
          this.jobs = [];
          return [];
        }

        // Делаем запрос к API для получения вакансий текущего работодателя
        try {
          const response = await axios.get("/api/jobs/my/");
          console.log("Получены вакансии работодателя:", response.data);

          if (response.data) {
            if (Array.isArray(response.data.results)) {
              this.jobs = response.data.results;
            } else if (Array.isArray(response.data)) {
              this.jobs = response.data;
            } else {
              console.warn(
                "Неожиданный формат данных в ответе API",
                response.data
              );
              this.jobs = [];
            }
          } else {
            this.jobs = [];
          }

          // Проверяем и фильтруем удалённые вакансии
          try {
            const deletedJobs = JSON.parse(
              localStorage.getItem("deletedJobs") || "[]"
            );
            if (deletedJobs.length > 0) {
              console.log(
                `Фильтрация ${deletedJobs.length} удалённых вакансий из списка вакансий работодателя`
              );
              const beforeCount = this.jobs.length;
              this.jobs = this.jobs.filter(
                (job) => !deletedJobs.includes(Number(job.id))
              );
              console.log(
                `Удалено ${
                  beforeCount - this.jobs.length
                } вакансий из списка работодателя`
              );
            }
          } catch (err) {
            console.error(
              "Ошибка при фильтрации удалённых вакансий работодателя:",
              err
            );
          }

          // После получения вакансий, синхронизируем локальные статусы
          if (this.jobs.length > 0) {
            try {
              const storedJobs = JSON.parse(
                localStorage.getItem("jobs") || "[]"
              );

              // Обновление статусов вакансий из localStorage
              let hasChanges = false;
              this.jobs.forEach((job) => {
                const storedJob = storedJobs.find(
                  (j) => Number(j.id) === Number(job.id)
                );
                if (
                  storedJob &&
                  storedJob.is_active !== undefined &&
                  storedJob.is_active !== job.is_active
                ) {
                  // Применение сохраненного статуса
                  console.log(
                    `Статус вакансии [${job.id}] изменен на ${
                      storedJob.is_active ? "активна" : "неактивна"
                    } из localStorage`
                  );
                  job.is_active = storedJob.is_active;
                  hasChanges = true;
                }
              });

              // Если были изменения, обновляем список
              if (hasChanges) {
                console.log(
                  "Обновление списка вакансий после синхронизации статусов"
                );
              }
            } catch (err) {
              console.error("Ошибка при синхронизации статусов вакансий:", err);
            }
          }

          // Обновляем фильтрованный список вакансий
          this.updateFilteredJobs();

          return this.jobs;
        } catch (apiError) {
          console.error("Ошибка при запросе вакансий работодателя:", apiError);

          // Если в localStorage есть данные, используем их как запасной вариант
          const localJobs = localStorage.getItem("jobs");
          if (localJobs) {
            try {
              const parsedJobs = JSON.parse(localJobs);
              if (Array.isArray(parsedJobs)) {
                // Фильтруем только вакансии текущего работодателя
                const employerJobs = parsedJobs.filter(
                  (job) =>
                    job.employer_id === currentUser.id ||
                    job.employer?.id === currentUser.id
                );
                console.log(
                  `Найдено ${employerJobs.length} вакансий работодателя в localStorage`
                );

                // Фильтруем удалённые вакансии
                try {
                  const deletedJobs = JSON.parse(
                    localStorage.getItem("deletedJobs") || "[]"
                  );
                  if (deletedJobs.length > 0) {
                    const beforeCount = employerJobs.length;
                    const filteredJobs = employerJobs.filter(
                      (job) => !deletedJobs.includes(Number(job.id))
                    );
                    console.log(
                      `Удалено ${
                        beforeCount - filteredJobs.length
                      } вакансий из списка работодателя в localStorage`
                    );
                    this.jobs = filteredJobs;
                    return filteredJobs;
                  }
                } catch (filterErr) {
                  console.error(
                    "Ошибка при фильтрации удалённых вакансий из localStorage:",
                    filterErr
                  );
                }

                this.jobs = employerJobs;
                return employerJobs;
              }
            } catch (e) {
              console.error("Ошибка при парсинге данных из localStorage:", e);
            }
          }

          throw apiError;
        }
      } catch (error) {
        console.error("Ошибка при получении вакансий работодателя:", error);
        this.error =
          "Не удалось загрузить ваши вакансии. Пожалуйста, попробуйте снова позже.";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createJob(jobData) {
      this.loading = true;
      this.error = null;

      try {
        // Создаем вакансию через API
        const response = await axios.post("/api/jobs/", jobData);

        // Добавляем новую вакансию в основной список
        this.jobs.push(response.data);

        // Также добавляем в localStorage для надежной синхронизации
        try {
          const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
          storedJobs.push(response.data);
          localStorage.setItem("jobs", JSON.stringify(storedJobs));

          // Установим флаг, что была недавно создана вакансия
          localStorage.setItem("recently_created_job", "true");
        } catch (localError) {
          console.error("Ошибка при сохранении в localStorage:", localError);
        }

        // Обновляем отфильтрованный список, чтобы вакансия отображалась сразу
        this.updateFilteredJobs();

        return response.data;
      } catch (error) {
        // Если API недоступен, создаем локально
        if (import.meta.env.DEV) {
          try {
            const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
            const authStore = useAuthStore();

            // Создаем новую вакансию с ID на основе временной метки
            const newJob = {
              ...jobData,
              id: Date.now(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: true,
              employer_id: authStore.user?.id || "default_employer",
              employer: authStore.user || { id: "default_employer" },
            };

            // Добавляем в localStorage
            storedJobs.push(newJob);
            localStorage.setItem("jobs", JSON.stringify(storedJobs));

            // Добавляем в списки в state
            this.jobs.push(newJob);

            // Обновляем отфильтрованный список
            this.updateFilteredJobs();

            // Установим флаг, что была недавно создана вакансия
            localStorage.setItem("recently_created_job", "true");

            console.log("Вакансия создана локально:", newJob);
            return newJob;
          } catch (localError) {
            console.error("Ошибка при создании вакансии локально:", localError);
          }
        }

        const errorMessage = handleAxiosError(error);
        this.error = errorMessage;
        console.error("Ошибка при создании вакансии:", errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateJob(jobId, jobData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.put(`/api/jobs/${jobId}/`, jobData);

        const index = this.jobs.findIndex((job) => job.id === jobId);
        if (index !== -1) {
          this.jobs[index] = response.data;
          this.filteredJobs = [...this.jobs];
        }

        return response.data;
      } catch (error) {
        const errorMessage = handleAxiosError(error);
        this.error = errorMessage;
        console.error(`Ошибка при обновлении вакансии ${jobId}:`, errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteJob(jobId) {
      this.loading = true;
      this.error = null;

      try {
        // В любом режиме удаляем из локального хранилища для надежности
        try {
          console.log(`Удаление вакансии ${jobId} из хранилища`);

          // 1. Удаляем из основного списка вакансий
          const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
          const initialCount = storedJobs.length;
          const updatedJobs = storedJobs.filter(
            (job) => Number(job.id) !== Number(jobId)
          );
          localStorage.setItem("jobs", JSON.stringify(updatedJobs));

          console.log(
            `Вакансия удалена из localStorage (было ${initialCount}, стало ${updatedJobs.length})`
          );

          // 2. Удаляем из заявок
          const applications = JSON.parse(
            localStorage.getItem("mockJobApplications") || "[]"
          );
          const updatedApplications = applications.filter(
            (app) =>
              Number(app.job) !== Number(jobId) &&
              Number(app.job_id || 0) !== Number(jobId)
          );
          localStorage.setItem(
            "mockJobApplications",
            JSON.stringify(updatedApplications)
          );

          // 3. Удаляем из сохраненных
          const savedJobs = JSON.parse(
            localStorage.getItem("savedJobs") || "[]"
          );
          const updatedSavedJobs = savedJobs.filter((job) => {
            if (job.id) return Number(job.id) !== Number(jobId);
            if (job.job && job.job.id)
              return Number(job.job.id) !== Number(jobId);
            return true;
          });
          localStorage.setItem("savedJobs", JSON.stringify(updatedSavedJobs));

          console.log("Все связанные данные удалены из localStorage");

          // 4. Устанавливаем флаг удаления, который сохранится между сессиями
          const deletedJobs = JSON.parse(
            localStorage.getItem("deletedJobs") || "[]"
          );
          if (!deletedJobs.includes(Number(jobId))) {
            deletedJobs.push(Number(jobId));
            localStorage.setItem("deletedJobs", JSON.stringify(deletedJobs));
          }
        } catch (localError) {
          console.error(
            "Ошибка при удалении из локального хранилища:",
            localError
          );
        }

        // Для режима разработки достаточно локального удаления
        if (import.meta.env.DEV) {
          console.log(
            `Режим разработки: локальное удаление вакансии ${jobId} выполнено`
          );

          // Обновляем массивы jobs и filteredJobs
          this.jobs = this.jobs.filter(
            (job) => Number(job.id) !== Number(jobId)
          );
          this.filteredJobs = [...this.jobs];

          return true;
        }

        // Для режима production вызываем API
        await axios.delete(`/api/jobs/${jobId}/`);
        console.log(`Вакансия ${jobId} удалена через API`);

        // Обновляем массивы jobs и filteredJobs
        this.jobs = this.jobs.filter((job) => Number(job.id) !== Number(jobId));
        this.filteredJobs = [...this.jobs];

        return true;
      } catch (error) {
        const errorMessage = handleAxiosError(error);
        this.error = errorMessage;
        console.error(`Ошибка при удалении вакансии ${jobId}:`, errorMessage);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async toggleJobStatus(jobId, isActive) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.patch(`/api/jobs/${jobId}/`, {
          is_active: isActive,
        });

        const index = this.jobs.findIndex((job) => job.id === jobId);
        if (index !== -1) {
          this.jobs[index] = response.data;

          // Фильтруем только активные вакансии для обновления filteredJobs
          const activeJobs = this.jobs.filter(
            (job) => job && job.is_active === true
          );
          this.filteredJobs = [...activeJobs];
        }

        return response.data;
      } catch (error) {
        const errorMessage = handleAxiosError(error);
        this.error = errorMessage;
        console.error(
          `Ошибка при изменении статуса вакансии ${jobId}:`,
          errorMessage
        );
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchJobStats() {
      try {
        const response = await axios.get("/api/jobs/stats/");
        this.stats = {
          totalJobs: response.data.total || 0,
          byEmploymentType: response.data.by_employment_type || {},
          byExperience: response.data.by_experience || {},
        };
        return this.stats;
      } catch (error) {
        console.error("Ошибка при получении статистики вакансий:", error);
        return {
          totalJobs: this.jobs.length,
          byEmploymentType: {},
          byExperience: {},
        };
      }
    },

    applyFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      this.pagination.page = 1;
      return this.fetchJobs();
    },

    setPage(page) {
      this.pagination.page = page;
    },

    resetFilters() {
      this.filters = {
        query: "",
        location: "",
        employment_type: [],
        experience_level: [],
        salary_min: "",
        salary_max: "",
        sort_by: "created_at",
        sort_order: "desc",
      };
      return this.fetchJobs();
    },

    findJobById(jobId) {
      if (!jobId) return null;

      const id = typeof jobId === "string" ? parseInt(jobId, 10) : jobId;
      let job = this.jobs.find((j) => j.id === id);

      if (!job) {
        job = this.jobs.find((j) => j.id === jobId);

        if (!job) {
          job = this.jobs.find((j) => String(j.id) === String(jobId));
        }
      }

      return job || null;
    },

    updateJobInList(updatedJob) {
      const index = this.jobs.findIndex((job) => job.id === updatedJob.id);

      if (index !== -1) {
        this.jobs[index] = { ...this.jobs[index], ...updatedJob };
        this.filteredJobs = [...this.jobs];
      }
    },

    calculateSalaryRange(job) {
      if (!job) return "Salary not specified";

      const min = job.min_salary;
      const max = job.max_salary;
      const currency = job.salary_currency || "₽";

      if (min && max) {
        if (min === max) {
          return `${min.toLocaleString()} ${currency}`;
        }
        return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
      } else if (min) {
        return `From ${min.toLocaleString()} ${currency}`;
      } else if (max) {
        return `Up to ${max.toLocaleString()} ${currency}`;
      }

      return "Salary not specified";
    },

    formatDate(dateString) {
      if (!dateString) return "";

      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    getJobStatus(job) {
      if (!job) return { text: "Неизвестно", color: "gray" };

      if (job.is_draft) {
        return { text: "Черновик", color: "gray" };
      } else if (job.is_active) {
        return { text: "Активна", color: "green" };
      } else if (job.is_archived) {
        return { text: "В архиве", color: "yellow" };
      } else if (job.is_closed) {
        return { text: "Закрыта", color: "red" };
      }

      return { text: "Неизвестно", color: "gray" };
    },

    async toggleJobActive(id) {
      try {
        console.log(`Изменение статуса вакансии ${id}`);
        this.loading = true;

        // Получаем вакансию из нашего массива
        const index = this.jobs.findIndex(
          (job) => Number(job.id) === Number(id)
        );
        if (index === -1) {
          throw new Error(`Вакансия с ID ${id} не найдена`);
        }

        // Получаем текущий статус и вычисляем новый
        const job = this.jobs[index];
        const currentStatus = Boolean(job.is_active);
        const newStatus = !currentStatus;

        console.log(
          `Текущий статус: ${currentStatus ? "активна" : "неактивна"}`
        );
        console.log(`Новый статус: ${newStatus ? "активна" : "неактивна"}`);

        // Сначала обновляем вакансию в нашем массиве
        job.is_active = newStatus;
        this.jobs[index] = { ...job }; // Создаем новую ссылку на объект
        this.jobs = [...this.jobs]; // Создаем новую ссылку на массив

        // Обновляем отфильтрованный список вакансий
        this.updateFilteredJobs();

        // Обновляем в localStorage
        try {
          const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
          const storedJobIndex = storedJobs.findIndex(
            (j) => Number(j.id) === Number(id)
          );

          if (storedJobIndex !== -1) {
            storedJobs[storedJobIndex].is_active = newStatus;
            localStorage.setItem("jobs", JSON.stringify(storedJobs));
            console.log("Статус обновлен в localStorage");
          } else {
            // Если вакансии еще нет в localStorage, добавляем ее
            storedJobs.push({
              ...job,
              id: Number(id),
              is_active: newStatus,
            });
            localStorage.setItem("jobs", JSON.stringify(storedJobs));
            console.log("Вакансия добавлена в localStorage");
          }
        } catch (err) {
          console.error("Ошибка при обновлении localStorage:", err);
        }

        // For development mode, we're done
        if (import.meta.env.DEV) {
          console.log("Режим разработки - обновление завершено");
          this.loading = false;
          return { id, is_active: newStatus, success: true };
        }

        // Для production вызываем API
        try {
          const response = await axios.post(
            `/api/jobs/${id}/toggle_active/`,
            {},
            {
              timeout: 5000,
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          console.log("API ответ:", response.data);

          // Если API вернул другой статус, обновляем наше локальное состояние
          if (
            response.data &&
            typeof response.data.is_active === "boolean" &&
            response.data.is_active !== newStatus
          ) {
            console.log(
              `API вернул другой статус: ${
                response.data.is_active ? "активна" : "неактивна"
              }`
            );

            // Обновляем нашу вакансию
            job.is_active = response.data.is_active;
            this.jobs[index] = { ...job };
            this.jobs = [...this.jobs];

            // Обновляем отфильтрованный список вакансий снова
            this.updateFilteredJobs();

            // Обновляем localStorage снова
            try {
              const storedJobs = JSON.parse(
                localStorage.getItem("jobs") || "[]"
              );
              const storedJobIndex = storedJobs.findIndex(
                (j) => Number(j.id) === Number(id)
              );

              if (storedJobIndex !== -1) {
                storedJobs[storedJobIndex].is_active = response.data.is_active;
                localStorage.setItem("jobs", JSON.stringify(storedJobs));
              }
            } catch (err) {
              console.error(
                "Ошибка при обновлении localStorage после API:",
                err
              );
            }
          }

          return {
            id,
            is_active: job.is_active,
            success: true,
          };
        } catch (apiError) {
          console.error("Ошибка API при изменении статуса:", apiError);
          // Keep the optimistically updated state
          return {
            id,
            is_active: newStatus,
            success: false,
            error: apiError.message,
          };
        }
      } catch (error) {
        console.error("Ошибка при изменении статуса вакансии:", error);
        this.error = "Не удалось изменить статус вакансии";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    updateFilteredJobs() {
      // Обновляем отфильтрованный список вакансий на основе геттера активных вакансий
      console.log(
        "Обновление отфильтрованного списка вакансий на основе активных"
      );

      try {
        // Проверяем список удалённых вакансий
        const deletedJobs = JSON.parse(
          localStorage.getItem("deletedJobs") || "[]"
        );

        // Фильтруем сначала по удалённым, а затем по активным вакансиям
        let filteredJobs = this.jobs;

        if (deletedJobs.length > 0) {
          const beforeCount = filteredJobs.length;
          filteredJobs = filteredJobs.filter(
            (job) => !deletedJobs.includes(Number(job.id))
          );
          const removedCount = beforeCount - filteredJobs.length;
          if (removedCount > 0) {
            console.log(
              `Отфильтровано ${removedCount} удалённых вакансий из списка активных`
            );
          }
        }

        // Дополнительно фильтруем по статусу is_active
        filteredJobs = filteredJobs.filter((job) => job.is_active === true);

        // Обновляем отфильтрованный список вакансий
        this.filteredJobs = filteredJobs;
      } catch (error) {
        console.error(
          "Ошибка при обновлении отфильтрованного списка вакансий:",
          error
        );
      }
    },

    // Метод для синхронизации с localStorage
    syncJobsWithLocalStorage() {
      try {
        console.log("Синхронизация списка вакансий с localStorage");

        // Проверяем флаг недавно созданной вакансии
        const recentlyCreated = localStorage.getItem("recently_created_job");
        if (recentlyCreated) {
          console.log(
            "Обнаружена недавно созданная вакансия, обновляем списки"
          );

          // Получаем вакансии из localStorage
          const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");

          // Фильтруем только активные вакансии
          const activeJobs = storedJobs.filter((job) => job.is_active === true);

          // Обновляем массив вакансий, если есть новые
          if (activeJobs.length > this.jobs.length) {
            console.log(
              `Найдено ${activeJobs.length} вакансий в localStorage, обновляем список`
            );
            this.jobs = [...activeJobs];
            this.updateFilteredJobs();
          }

          // Сбрасываем флаг
          localStorage.removeItem("recently_created_job");
        }
      } catch (error) {
        console.error("Ошибка при синхронизации с localStorage:", error);
      }
    },
  },
});
