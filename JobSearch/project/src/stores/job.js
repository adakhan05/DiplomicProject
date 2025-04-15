import { defineStore } from "pinia";
import axios from "axios";

export const useJobStore = defineStore("job", {
  state: () => ({
    jobs: [],
    applications: [],
    loading: false,
    error: null,
  }),

  actions: {
    async createJob(jobData) {
      try {
        const response = await axios.post("/api/jobs/", jobData);
        this.jobs.push(response.data);
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка создания вакансии:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async updateJob(jobId, jobData) {
      try {
        const response = await axios.put(`/api/jobs/${jobId}/`, jobData);
        const index = this.jobs.findIndex((job) => job.id === jobId);
        if (index !== -1) {
          this.jobs[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка обновления вакансии:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async deleteJob(jobId) {
      this.loading = true;
      this.error = null;

      // Преобразуем jobId в число для сравнения
      jobId = Number(jobId);
      console.log(`Начало удаления вакансии с ID: ${jobId}`);

      try {
        // Обработка удаления в режиме разработки с надежной обработкой ошибок
        if (import.meta.env.DEV) {
          console.log(
            `РЕЖИМ РАЗРАБОТКИ: Удаление вакансии ${jobId} из localStorage`
          );

          // Сначала очистим все кэшированные данные, которые могут быть связаны с этой вакансией
          try {
            // 1. Обрабатываем основной массив вакансий в localStorage
            const jobsJson = localStorage.getItem("jobs");
            if (jobsJson) {
              let jobs = JSON.parse(jobsJson);

              // Отслеживаем начальное количество для проверки удаления
              const initialCount = jobs.length;
              const jobToDelete = jobs.find((job) => Number(job.id) === jobId);

              if (!jobToDelete) {
                console.warn(
                  `РЕЖИМ РАЗРАБОТКИ: Вакансия ${jobId} не найдена в localStorage, нечего удалять`
                );
              } else {
                console.log(
                  `РЕЖИМ РАЗРАБОТКИ: Найдена вакансия для удаления: "${jobToDelete.title}"`
                );

                // Фильтруем вакансию для удаления
                jobs = jobs.filter((job) => Number(job.id) !== jobId);

                // Сохраняем обратно в localStorage
                localStorage.setItem("jobs", JSON.stringify(jobs));
                console.log(
                  `РЕЖИМ РАЗРАБОТКИ: Вакансия удалена из localStorage. До: ${initialCount}, После: ${jobs.length}`
                );

                // Показываем подтверждение
                alert(`Вакансия "${jobToDelete.title}" успешно удалена`);
              }
            }

            // 2. Очищаем заявки
            try {
              const applicationsJson = localStorage.getItem(
                "mockJobApplications"
              );
              if (applicationsJson) {
                let applications = JSON.parse(applicationsJson);
                if (Array.isArray(applications)) {
                  const initialApps = applications.length;
                  applications = applications.filter(
                    (app) => Number(app.job) !== jobId
                  );
                  localStorage.setItem(
                    "mockJobApplications",
                    JSON.stringify(applications)
                  );
                  console.log(
                    `РЕЖИМ РАЗРАБОТКИ: Removed applications for job. Before: ${initialApps}, After: ${applications.length}`
                  );
                }
              }
            } catch (appError) {
              console.error(
                `РЕЖИМ РАЗРАБОТКИ: Ошибка при очистке откликов для вакансии ${jobId}:`,
                appError
              );
            }

            // 3. Удаляем из сохраненных вакансий
            try {
              const savedJobsJson = localStorage.getItem("savedJobs");
              if (savedJobsJson) {
                let savedJobs = JSON.parse(savedJobsJson);
                if (Array.isArray(savedJobs)) {
                  const initialSaved = savedJobs.length;
                  savedJobs = savedJobs.filter((job) => {
                    // Обрабатываем разные форматы сохраненных вакансий
                    if (typeof job === "object") {
                      if (job.id) return Number(job.id) !== jobId;
                      if (job.job && job.job.id)
                        return Number(job.job.id) !== jobId;
                    }
                    return true;
                  });
                  localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
                  console.log(
                    `РЕЖИМ РАЗРАБОТКИ: Removed job from saved jobs. Before: ${initialSaved}, After: ${savedJobs.length}`
                  );
                }
              }
            } catch (savedError) {
              console.error(
                `РЕЖИМ РАЗРАБОТКИ: Ошибка при очистке сохраненных вакансий для вакансии ${jobId}:`,
                savedError
              );
            }

            // 4. Обновляем массив вакансий в хранилище
            this.jobs = this.jobs.filter((job) => Number(job.id) !== jobId);

            console.log(
              `РЕЖИМ РАЗРАБОТКИ: Вакансия ${jobId} полностью удалена из всех хранилищ`
            );
            this.loading = false;
            return true;
          } catch (error) {
            console.error(
              `РЕЖИМ РАЗРАБОТКИ: Ошибка при удалении вакансии ${jobId}:`,
              error
            );
            alert(`Ошибка при удалении вакансии: ${error.message}`);
            throw error;
          }
        }

        // Обработка продакшн-режима
        await axios.delete(`/api/jobs/${jobId}/`);
        console.log(`Режим продакшн: Вакансия ${jobId} удалена через API`);

        // Обновляем локальное состояние
        this.jobs = this.jobs.filter((job) => Number(job.id) !== jobId);

        return true;
      } catch (error) {
        console.error(`Ошибка при удалении вакансии ${jobId}:`, error);
        const errorMessage =
          error.response?.data?.detail || error.message || "Unknown error";
        this.error = `Failed to delete job: ${errorMessage}`;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getJobs(filters = {}) {
      this.loading = true;
      this.error = null;
      try {
        console.log("getJobs: Начало API запроса с фильтрами:", filters);

        // Для режима разработки: проверяем localStorage на наличие активных вакансий перед вызовом API
        if (import.meta.env.DEV) {
          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Проверка localStorage на наличие вакансий"
          );
          try {
            // Получаем вакансии из localStorage
            const localJobs = JSON.parse(localStorage.getItem("jobs") || "[]");

            // Если у нас есть сохраненные вакансии, используем их вместо вызова API
            if (localJobs.length > 0) {
              console.log(
                `РЕЖИМ РАЗРАБОТКИ: Найдено ${localJobs.length} вакансий в localStorage`
              );

              // Фильтруем неактивные вакансии, если это не специально запрошено
              let filteredJobs = localJobs;
              if (!filters.show_inactive) {
                filteredJobs = localJobs.filter(
                  (job) => job.is_active !== false
                );
                console.log(
                  `РЕЖИМ РАЗРАБОТКИ: Отфильтровано до ${filteredJobs.length} активных вакансий`
                );
              }

              // Применяем фильтры поиска, если они есть
              if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredJobs = filteredJobs.filter(
                  (job) =>
                    job.title?.toLowerCase().includes(searchTerm) ||
                    job.company_name?.toLowerCase().includes(searchTerm)
                );
              }

              this.jobs = filteredJobs;
              console.log(
                "РЕЖИМ РАЗРАБОТКИ: Используются вакансии из localStorage",
                this.jobs
              );
              return { results: this.jobs, count: this.jobs.length };
            }
          } catch (err) {
            console.error(
              "РЕЖИМ РАЗРАБОТКИ: Ошибка при чтении вакансий из localStorage:",
              err
            );
          }
        }

        const response = await axios.get("/api/jobs/", {
          params: filters,
          timeout: 10000,
        });

        console.log("getJobs: Получен ответ", response);

        if (!response.data) {
          console.error("getJobs: Пустые данные в ответе");
          throw new Error("Получен пустой ответ от сервера");
        }

        let jobsData = [];
        if (response.data.results) {
          jobsData = response.data.results;
        } else if (Array.isArray(response.data)) {
          jobsData = response.data;
        } else {
          console.error("getJobs: Неожиданный формат ответа");
          jobsData = [];
        }

        // В режиме разработки, проверяем localStorage на переопределение статуса вакансии
        if (import.meta.env.DEV) {
          try {
            const localJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
            if (localJobs.length > 0) {
              // Обновляем статус активации вакансии на основе localStorage
              jobsData = jobsData.map((job) => {
                const localJob = localJobs.find((lj) => lj.id === job.id);
                if (localJob && localJob.is_active !== undefined) {
                  job.is_active = localJob.is_active;
                  console.log(
                    `РЕЖИМ РАЗРАБОТКИ: Статус вакансии ${job.id} обновлен из localStorage: ${job.is_active}`
                  );
                }
                return job;
              });

              // Фильтруем неактивные вакансии, если это не специально запрошено
              if (!filters.show_inactive) {
                jobsData = jobsData.filter((job) => job.is_active !== false);
                console.log(
                  `РЕЖИМ РАЗРАБОТКИ: Отфильтровано до ${jobsData.length} активных вакансий после объединения`
                );
              }
            }
          } catch (err) {
            console.error(
              "РЕЖИМ РАЗРАБОТКИ: Ошибка применения статуса вакансии из localStorage:",
              err
            );
          }
        }

        this.jobs = jobsData;
        return {
          results: this.jobs,
          count: this.jobs.length,
        };
      } catch (error) {
        console.error("Error in getJobs:", error);

        if (error.response && error.response.status === 404) {
          this.error =
            "API endpoint для вакансий не найден. Проверьте настройку бекенда.";
        } else {
          this.error =
            "Не удалось загрузить вакансии. Обновите страницу или попробуйте позже.";
        }

        this.jobs = [];
        return { results: [], count: 0 };
      } finally {
        this.loading = false;
      }
    },

    async getEmployerJobs() {
      try {
        const response = await axios.get("/api/jobs/my-jobs/");
        this.jobs = response.data.results || [];
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка при получении вакансий работодателя:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async applyForJob(jobId, applicationData) {
      try {
        const response = await axios.post(
          `/api/jobs/${jobId}/apply/`,
          applicationData
        );
        this.applications.push(response.data);
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка при отклике на вакансию:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async getUserApplications() {
      try {
        const response = await axios.get("/api/applications/");
        this.applications = response.data;
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка при получении откликов:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async updateApplicationStatus(applicationId, status) {
      try {
        const response = await axios.post(
          `/api/applications/${applicationId}/update-status/`,
          { status }
        );
        const index = this.applications.findIndex(
          (app) => app.id === applicationId
        );
        if (index !== -1) {
          this.applications[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка при обновлении статуса отклика:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async getJob(jobId) {
      this.loading = true;
      this.error = null;
      try {
        console.log(`getJob: Загрузка вакансии с ID ${jobId}`);

        // Преобразуем jobId в число для согласованного сравнения
        const numericJobId = Number(jobId);

        // Используем API для получения вакансии из бэкенда напрямую
        const response = await axios.get(`/api/jobs/${jobId}/`, {
          timeout: 10000,
        });

        if (response.data) {
          this.selectedJob = response.data;
          return response.data;
        } else {
          console.error("Пустой ответ для вакансии", jobId);
          this.error = "Вакансия не найдена";
          throw new Error("Вакансия не найдена");
        }
      } catch (error) {
        console.error("Ошибка при загрузке деталей вакансии:", error);
        if (error.response && error.response.status === 404) {
          this.error = "Вакансия не найдена в базе данных";
        } else {
          this.error =
            error.message || "Не удалось загрузить вакансию. Попробуйте позже.";
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
