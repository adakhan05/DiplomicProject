import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { handleAxiosError } from "@/utils/api-helper";

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
    async fetchJobs() {
      this.loading = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams();

        if (this.filters.query) {
          queryParams.append("q", this.filters.query);
        }

        if (this.filters.location) {
          queryParams.append("location", this.filters.location);
        }

        if (this.filters.employment_type.length) {
          this.filters.employment_type.forEach((type) => {
            queryParams.append("employment_type", type);
          });
        }

        if (this.filters.experience_level.length) {
          this.filters.experience_level.forEach((level) => {
            queryParams.append("experience_level", level);
          });
        }

        if (this.filters.salary_min) {
          queryParams.append("salary_min", this.filters.salary_min);
        }

        if (this.filters.salary_max) {
          queryParams.append("salary_max", this.filters.salary_max);
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

        this.jobs = response.data.results || response.data;
        this.pagination.total = response.data.count || this.jobs.length;
        this.filteredJobs = [...this.jobs];

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

    async createJob(jobData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post("/api/jobs/", jobData);
        this.jobs.push(response.data);
        this.filteredJobs = [...this.jobs];
        return response.data;
      } catch (error) {
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
        // Для режима разработки обрабатываем localStorage напрямую
        if (import.meta.env.DEV) {
          console.log(`DEV MODE: Deleting job ${jobId} from localStorage`);

          try {
            // Получаем вакансии из localStorage
            const jobsJson = localStorage.getItem("jobs");
            if (jobsJson) {
              let jobs = JSON.parse(jobsJson);

              if (Array.isArray(jobs)) {
                const initialCount = jobs.length;

                // Фильтруем вакансию для удаления
                jobs = jobs.filter((job) => job.id != jobId);

                // Сохраняем обратно в localStorage
                localStorage.setItem("jobs", JSON.stringify(jobs));

                // Обновляем массив вакансий в хранилище
                this.jobs = this.jobs.filter((job) => job.id != jobId);
                this.filteredJobs = [...this.jobs];

                console.log(
                  `DEV MODE: Deleted job from localStorage. Before: ${initialCount}, After: ${jobs.length}`
                );

                // Также очищаем все заявки для этой вакансии
                try {
                  const applicationsJson = localStorage.getItem(
                    "mockJobApplications"
                  );
                  if (applicationsJson) {
                    let applications = JSON.parse(applicationsJson);
                    if (Array.isArray(applications)) {
                      const appInitialCount = applications.length;
                      applications = applications.filter(
                        (app) => app.job != jobId
                      );
                      localStorage.setItem(
                        "mockJobApplications",
                        JSON.stringify(applications)
                      );
                      console.log(
                        `DEV MODE: Removed applications for deleted job. Before: ${appInitialCount}, After: ${applications.length}`
                      );
                    }
                  }
                } catch (appError) {
                  console.error(
                    "DEV MODE: Error cleaning up applications:",
                    appError
                  );
                }

                // Также удаляем из сохраненных вакансий, если они есть
                try {
                  const savedJobsJson = localStorage.getItem("savedJobs");
                  if (savedJobsJson) {
                    let savedJobs = JSON.parse(savedJobsJson);
                    if (Array.isArray(savedJobs)) {
                      savedJobs = savedJobs.filter((job) => {
                        if (job.id) return job.id != jobId;
                        if (job.job && job.job.id) return job.job.id != jobId;
                        return true;
                      });
                      localStorage.setItem(
                        "savedJobs",
                        JSON.stringify(savedJobs)
                      );
                    }
                  }
                } catch (savedError) {
                  console.error(
                    "DEV MODE: Error cleaning up saved jobs:",
                    savedError
                  );
                }

                this.loading = false;
                return true;
              }
            }
          } catch (error) {
            console.error(
              "DEV MODE: Error deleting job from localStorage:",
              error
            );
            throw new Error(
              "Failed to delete job from localStorage: " + error.message
            );
          }
        }

        // Для режима производства или если режим разработки дал сбой, используем API
        await axios.delete(`/api/jobs/${jobId}/`);

        this.jobs = this.jobs.filter((job) => job.id !== jobId);
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
          this.filteredJobs = [...this.jobs];
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
        console.error("Error fetching job stats:", error);
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
      this.loading = true;
      this.error = null;
      try {
        console.log(`toggleJobActive: Переключение статуса для вакансии ${id}`);

        // Для режима разработки используем прямой подход без вызова API
        if (import.meta.env.DEV) {
          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Прямое переключение статуса вакансии без вызова API"
          );
          const index = this.jobs.findIndex((job) => job.id === id);
          if (index !== -1) {
            // Просто переключаем статус напрямую
            this.jobs[index].is_active = !this.jobs[index].is_active;

            // Сохраняем в localStorage для сохранения в режиме разработки
            try {
              const storedJobs = JSON.parse(
                localStorage.getItem("jobs") || "[]"
              );
              const storedJobIndex = storedJobs.findIndex(
                (job) => job.id === id
              );

              if (storedJobIndex !== -1) {
                storedJobs[storedJobIndex].is_active =
                  this.jobs[index].is_active;
              } else {
                storedJobs.push({
                  id: this.jobs[index].id,
                  is_active: this.jobs[index].is_active,
                  title: this.jobs[index].title,
                });
              }

              localStorage.setItem("jobs", JSON.stringify(storedJobs));
              console.log(
                `РЕЖИМ РАЗРАБОТКИ: Статус вакансии ${id} сохранен в localStorage: ${this.jobs[index].is_active}`
              );
            } catch (err) {
              console.error(
                "Ошибка сохранения статуса вакансии в localStorage:",
                err
              );
            }

            // Создаем имитацию ответа для поддержания согласованности кода
            const mockResponse = {
              data: {
                ...this.jobs[index],
                is_active: this.jobs[index].is_active,
              },
            };

            // Притворяемся, что получили ответ от сервера
            console.log(
              "РЕЖИМ РАЗРАБОТКИ: Статус вакансии успешно переключен, теперь:",
              this.jobs[index].is_active ? "активна" : "неактивна"
            );
            return mockResponse.data;
          } else {
            throw new Error("Job not found");
          }
        }

        // Режим производства - используем API
        const response = await axios.post(
          `/api/jobs/${id}/toggle_active/`,
          {},
          {
            timeout: 10000,
          }
        );

        console.log("toggleJobActive: Получен ответ", response);

        // Обновляем вакансию в массиве вакансий
        const index = this.jobs.findIndex((job) => job.id === id);
        if (index !== -1) {
          this.jobs[index].is_active = response.data.is_active;
        }

        return response.data;
      } catch (error) {
        console.error("Ошибка при переключении статуса вакансии:", error);

        // Улучшенная обработка ошибок - не выбрасываем ошибку в режиме разработки
        if (import.meta.env.DEV) {
          this.error =
            "Error toggling job status in development mode. Using fallback instead.";
          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Использование запасного варианта для переключения статуса вакансии"
          );

          // Пробуем запасной подход
          const index = this.jobs.findIndex((job) => job.id === id);
          if (index !== -1) {
            this.jobs[index].is_active = !this.jobs[index].is_active;

            // Также обновляем в localStorage
            try {
              const storedJobs = JSON.parse(
                localStorage.getItem("jobs") || "[]"
              );
              const storedJobIndex = storedJobs.findIndex(
                (job) => job.id === id
              );

              if (storedJobIndex !== -1) {
                storedJobs[storedJobIndex].is_active =
                  this.jobs[index].is_active;
              } else {
                storedJobs.push({
                  id: this.jobs[index].id,
                  is_active: this.jobs[index].is_active,
                  title: this.jobs[index].title,
                });
              }

              localStorage.setItem("jobs", JSON.stringify(storedJobs));
            } catch (storageErr) {
              console.error(
                "Ошибка в запасном варианте localStorage:",
                storageErr
              );
            }

            return this.jobs[index];
          }

          return null; // Вакансия не найдена в локальном состоянии
        }

        // Для производства распространяем ошибку
        this.error = "Error toggling job status. Please try again.";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Добавляем новый метод для обновления количества заявок
    async refreshApplicationCounts() {
      if (!this.jobs || this.jobs.length === 0) {
        console.log("Нет вакансий для обновления счетчиков заявок");
        return;
      }

      console.log("Обновление счетчиков заявок для всех вакансий");

      if (import.meta.env.DEV) {
        // В режиме разработки проверяем localStorage на наличие заявок
        try {
          const storedApplications = localStorage.getItem(
            "mockJobApplications"
          );
          if (storedApplications) {
            const mockApplications = JSON.parse(storedApplications);

            // Группируем заявки по ID вакансии
            const applicationsByJob = {};
            mockApplications.forEach((app) => {
              if (!applicationsByJob[app.job]) {
                applicationsByJob[app.job] = [];
              }
              applicationsByJob[app.job].push(app);
            });

            // Обновляем количество заявок для каждой вакансии
            this.jobs.forEach((job) => {
              const jobApplications = applicationsByJob[job.id] || [];
              job.applications_count = jobApplications.length;
            });

            // Обновляем также отфильтрованные вакансии
            this.filteredJobs = [...this.jobs];

            console.log("Счетчики заявок обновлены из localStorage");
          }
        } catch (err) {
          console.error("Ошибка при обновлении счетчиков заявок:", err);
        }
      } else {
        // В производстве мы бы сделали вызов API для получения обновленного количества заявок
        try {
          // Получаем обновленные данные о вакансиях, которые должны включать количество заявок
          await this.fetchMyJobs();
        } catch (err) {
          console.error("Error refreshing application counts:", err);
        }
      }
    },

    // Добавляем внутренние вспомогательные методы
    _updateApplicationCounts() {
      try {
        const jobApplications = JSON.parse(
          localStorage.getItem("mockJobApplications") || "[]"
        );

        // Подсчитываем заявки для каждой вакансии
        this.jobs.forEach((job) => {
          const applicationsForJob = jobApplications.filter(
            (app) => Number(app.job) === Number(job.id)
          );
          job.application_count = applicationsForJob.length;
        });

        console.log("Updated application counts for jobs");
      } catch (error) {
        console.error("Error updating application counts:", error);
      }
    },
  },
});
