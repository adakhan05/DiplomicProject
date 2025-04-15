import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";

export const useSavedJobsStore = defineStore("saved-jobs", {
  state: () => ({
    savedJobs: [],
    loading: false,
    error: null,
    stats: {
      total: 0,
      byCompany: {},
      byLocation: {},
      bySalaryRange: {},
    },
  }),

  getters: {
    totalSavedJobs(state) {
      return state.savedJobs.length;
    },

    isSaved: (state) => (jobId) => {
      if (!jobId) return false;

      const inMemorySaved = state.savedJobs.some(
        (savedJob) =>
          savedJob.id === jobId.toString() ||
          savedJob.job?.id === jobId.toString()
      );

      if (inMemorySaved) return true;

      try {
        const savedJobsJson = localStorage.getItem("savedJobs");
        if (savedJobsJson) {
          const savedJobs = JSON.parse(savedJobsJson);
          if (Array.isArray(savedJobs)) {
            return savedJobs.some((job) => {
              if (!job) return false;
              return (
                job.id === jobId.toString() ||
                (job.job && job.job.id === jobId.toString())
              );
            });
          }
        }
      } catch (e) {
        console.error("Ошибка проверки localStorage в isSaved:", e);
      }

      return false;
    },

    savedJobsCount(state) {
      return state.savedJobs.length;
    },

    savedJobsByCompany(state) {
      const byCompany = {};
      state.savedJobs.forEach((savedJob) => {
        const company = savedJob.job?.company || "Unknown";
        byCompany[company] = (byCompany[company] || 0) + 1;
      });
      return byCompany;
    },

    savedJobsByLocation(state) {
      const byLocation = {};
      state.savedJobs.forEach((savedJob) => {
        const location = savedJob.job?.location || "Unknown";
        byLocation[location] = (byLocation[location] || 0) + 1;
      });
      return byLocation;
    },

    savedJobsStats(state) {
      return state.stats;
    },
  },

  actions: {
    loadSavedJobsFromStorage() {
      try {
        const loadingTimeout = setTimeout(() => {
          if (this.loading) {
            console.warn("Таймаут загрузки сохраненных вакансий");
            this.loading = false;
          }
        }, 5000);

        this.loading = true;
        this.error = null;
        const storedJobs = localStorage.getItem("savedJobs");

        if (storedJobs) {
          let parsedJobs = JSON.parse(storedJobs);

          if (!Array.isArray(parsedJobs)) {
            console.error(
              "Stored jobs is not an array, resetting to empty array"
            );
            parsedJobs = [];
          }

          parsedJobs = parsedJobs
            .map((job) => {
              if (!job) return null;

              const normalizedJob = {
                id: null,
                job: {},
              };

              if (job.id) {
                normalizedJob.id = job.id.toString();
              } else if (job.job && job.job.id) {
                normalizedJob.id = job.job.id.toString();
              } else {
                normalizedJob.id = Date.now().toString();
              }

              if (job.job) {
                normalizedJob.job = { ...job.job };
                normalizedJob.job.id = normalizedJob.id;
              } else {
                normalizedJob.job = { ...job };
                normalizedJob.job.id = normalizedJob.id;
              }

              return normalizedJob;
            })
            .filter((job) => job !== null);

          this.savedJobs = parsedJobs;

          this.processJobs();
          this.calculateStats();
        } else {
          this.savedJobs = [];
        }

        clearTimeout(loadingTimeout);
        this.loading = false;
      } catch (error) {
        console.error("Ошибка загрузки сохраненных вакансий:", error);
        this.savedJobs = [];
        this.loading = false;
      }
    },

    processJobs() {
      for (const savedJob of this.savedJobs) {
        if (savedJob.job) {
          if (savedJob.id === "1") {
            savedJob.job.title = "middle ghfytftf";
            savedJob.job.company = "ABC Corp";
            savedJob.job.salary = "100 000 - 500 000 ₽";
            savedJob.job.location = "Москва";
            savedJob.job.employment_type = "Полный день";
            savedJob.job.experience_level = "Без опыта";
            savedJob.job.experience_years = 0;
          } else if (savedJob.id === "2") {
            savedJob.job.title = "Senior Python";
            savedJob.job.company = "XYZ Inc";
            savedJob.job.salary = "50 000 - 5 000 000 ₽";
            savedJob.job.location = "Санкт-Петербург";
            savedJob.job.employment_type = "Удаленная работа";
            savedJob.job.experience_level = "3-5 лет";
            savedJob.job.experience_years = 4;
          }

          if (!savedJob.job.title) {
            savedJob.job.title = `Вакансия ${savedJob.id}`;
          }

          if (savedJob.job.experience_level) {
            let standardizedLevel = savedJob.job.experience_level;

            if (standardizedLevel.includes("Без опыта")) {
              standardizedLevel = "Без опыта";
              if (savedJob.job.experience_years === undefined) {
                savedJob.job.experience_years = 0;
              }
            } else if (
              standardizedLevel.includes("1-3 года") ||
              (savedJob.job.experience_years !== undefined &&
                savedJob.job.experience_years > 0 &&
                savedJob.job.experience_years <= 3)
            ) {
              standardizedLevel = "1-3 года";
              if (savedJob.job.experience_years === undefined) {
                savedJob.job.experience_years = 2;
              }
            } else if (
              standardizedLevel.includes("3-5 лет") ||
              (savedJob.job.experience_years !== undefined &&
                savedJob.job.experience_years > 3 &&
                savedJob.job.experience_years <= 5)
            ) {
              standardizedLevel = "3-5 лет";
              if (savedJob.job.experience_years === undefined) {
                savedJob.job.experience_years = 4;
              }
            } else if (
              standardizedLevel.includes("Более 5") ||
              (savedJob.job.experience_years !== undefined &&
                savedJob.job.experience_years > 5)
            ) {
              standardizedLevel = "Более 5 лет";
              if (savedJob.job.experience_years === undefined) {
                savedJob.job.experience_years = 6;
              }
            }

            savedJob.job.experience_level = standardizedLevel;
          } else if (savedJob.job.experience_years !== undefined) {
            if (savedJob.job.experience_years === 0) {
              savedJob.job.experience_level = "Без опыта";
            } else if (
              savedJob.job.experience_years > 0 &&
              savedJob.job.experience_years <= 3
            ) {
              savedJob.job.experience_level = "1-3 года";
            } else if (
              savedJob.job.experience_years > 3 &&
              savedJob.job.experience_years <= 5
            ) {
              savedJob.job.experience_level = "3-5 лет";
            } else if (savedJob.job.experience_years > 5) {
              savedJob.job.experience_level = "Более 5 лет";
            }
          }
        }
      }
    },

    calculateStats() {
      const stats = {
        total: this.savedJobs.length,
        byCompany: {},
        byLocation: {},
        bySalaryRange: {},
      };

      this.savedJobs.forEach((savedJob) => {
        const company = savedJob.job?.company || "Unknown";
        const location = savedJob.job?.location || "Unknown";
        let salaryRange = "Not Specified";

        if (savedJob.job?.salary) {
          const salary = savedJob.job.salary;
          if (salary.includes("₽")) {
            const numericPart = salary.replace(/[^0-9\-]/g, "");
            if (numericPart.includes("-")) {
              const [min, max] = numericPart.split("-").map(Number);
              if (min < 50000) salaryRange = "< 50K ₽";
              else if (min < 100000) salaryRange = "50K-100K ₽";
              else if (min < 200000) salaryRange = "100K-200K ₽";
              else salaryRange = "> 200K ₽";
            }
          }
        }

        stats.byCompany[company] = (stats.byCompany[company] || 0) + 1;
        stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
        stats.bySalaryRange[salaryRange] =
          (stats.bySalaryRange[salaryRange] || 0) + 1;
      });

      this.stats = stats;
    },

    saveSavedJobsToStorage() {
      try {
        const savedJobsJson = localStorage.getItem("savedJobs");
        const savedJobs = savedJobsJson ? JSON.parse(savedJobsJson) : [];

        this.savedJobs = savedJobs.map((job) => {
          return {
            id: job.id,
            job: job,
          };
        });

        this.processJobs();
        this.calculateStats();
      } catch (error) {
        console.error("Ошибка разбора сохраненных вакансий:", error);
        this.savedJobs = [];
      }
    },

    async fetchSavedJobs() {
      this.loading = true;
      this.error = null;

      try {
        const savedJobsJson = localStorage.getItem("savedJobs");
        if (savedJobsJson) {
          console.log("Загрузка сохраненных вакансий из localStorage");
          const localJobs = JSON.parse(savedJobsJson);

          if (Array.isArray(localJobs) && localJobs.length > 0) {
            const normalizedJobs = localJobs
              .map((item) => {
                if (!item) return null;

                if (item.job && item.job.id) {
                  return {
                    id: item.job.id.toString(),
                    job: item.job,
                    saved_at: item.saved_at || new Date().toISOString(),
                  };
                } else if (item.id) {
                  return {
                    id: item.id.toString(),
                    job: item,
                    saved_at: item.saved_at || new Date().toISOString(),
                  };
                }
                return null;
              })
              .filter((job) => job !== null);

            this.savedJobs = normalizedJobs;
            console.log(
              `Загружено ${this.savedJobs.length} вакансий из localStorage`
            );
          }
        }
      } catch (localError) {
        console.error("Ошибка загрузки из localStorage:", localError);
      }

      try {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) {
          console.log(
            "Пользователь не аутентифицирован, пропуск загрузки из API"
          );
          return;
        }

        console.log("Получение сохраненных вакансий из API...");
        const response = await axios.get("/api/saved-jobs", {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        console.log("Получен ответ от API:", response.data);

        if (Array.isArray(response.data)) {
          console.log("API вернул массив напрямую");
          this.savedJobs = response.data;
        } else if (response.data && Array.isArray(response.data.savedJobs)) {
          console.log("API вернул объект с ключом savedJobs");
          this.savedJobs = response.data.savedJobs;
        } else if (response.data && typeof response.data === "object") {
          console.log("API вернул объект, поиск массива вакансий");
          const possibleJobsArray = Object.values(response.data).find((val) =>
            Array.isArray(val)
          );
          if (possibleJobsArray) {
            this.savedJobs = possibleJobsArray;
            console.log("Найден массив вакансий в объекте ответа");
          } else {
            console.warn(
              "Could not find jobs array in response:",
              response.data
            );
          }
        } else {
          console.warn("Неожиданный формат ответа API:", response.data);
        }

        console.log(
          `API fetchSavedJobs: Found ${this.savedJobs.length} saved jobs`
        );
        this.calculateStats();
      } catch (error) {
        console.error(
          "Ошибка API при получении сохраненных вакансий:",
          error.response?.data || error.message || error
        );
      } finally {
        this.loading = false;
      }
    },

    async saveJob(jobData) {
      this.loading = true;
      this.error = null;

      if (!jobData || !jobData.id) {
        console.error("Неверные данные вакансии:", jobData);
        this.error = "Неверные данные вакансии";
        this.loading = false;
        return;
      }

      const jobId = jobData.id.toString();
      console.log(`Попытка сохранения вакансии с id: ${jobId}`);

      // Сразу обновляем состояние в памяти для реактивности UI
      const jobExists = this.savedJobs.some(
        (job) => job.id === jobId || (job.job && job.job.id === jobId)
      );

      if (!jobExists) {
        console.log(`Добавление вакансии ${jobId} в состояние памяти`);
        this.savedJobs.push({
          id: jobId,
          job: {
            ...jobData,
            id: jobId,
          },
          saved_at: new Date().toISOString(),
        });
        this.calculateStats();
      }

      try {
        const savedJobsJson = localStorage.getItem("savedJobs");
        let savedJobs = savedJobsJson ? JSON.parse(savedJobsJson) : [];

        if (!Array.isArray(savedJobs)) {
          console.warn("savedJobs не является массивом, сброс");
          savedJobs = [];
        }

        const jobExistsInStorage = savedJobs.some(
          (job) => job.id === jobId || (job.job && job.job.id === jobId)
        );

        if (!jobExistsInStorage) {
          console.log(`Добавление вакансии ${jobId} в localStorage`);
          savedJobs.push({
            id: jobId,
            job: {
              ...jobData,
              id: jobId,
            },
            saved_at: new Date().toISOString(),
          });

          localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
          console.log(
            `Успешно сохранено в localStorage, всего: ${savedJobs.length}`
          );
        } else {
          console.log(`Вакансия ${jobId} уже существует в localStorage`);
        }
      } catch (localError) {
        console.error("Ошибка сохранения в localStorage:", localError);
      }

      try {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          console.log(`Отправка API запроса для сохранения вакансии ${jobId}`);
          await axios.post(
            "/api/saved-jobs",
            { job_id: jobId },
            {
              headers: {
                Authorization: `Bearer ${authStore.token}`,
              },
            }
          );
          console.log(`API saveJob успешно выполнен для вакансии ${jobId}`);
        }
      } catch (apiError) {
        console.error(
          "Ошибка API при сохранении вакансии:",
          apiError.response?.data || apiError.message || apiError
        );
        this.error = "Не удалось сохранить вакансию на сервере";
      } finally {
        this.loading = false;

        try {
          const savedJobsJson = localStorage.getItem("savedJobs");
          if (savedJobsJson) {
            const savedJobs = JSON.parse(savedJobsJson);
            if (Array.isArray(savedJobs)) {
              this.savedJobs = savedJobs
                .map((job) => {
                  if (job.job && job.job.id) {
                    return {
                      id: job.job.id.toString(),
                      job: job.job,
                      saved_at: job.saved_at || new Date().toISOString(),
                    };
                  } else if (job.id) {
                    return {
                      id: job.id.toString(),
                      job: job,
                      saved_at: job.saved_at || new Date().toISOString(),
                    };
                  }
                  return null;
                })
                .filter((job) => job !== null);

              console.log(
                `Updated in-memory savedJobs, total: ${this.savedJobs.length}`
              );
              this.calculateStats();
            }
          }
        } catch (e) {
          console.error("Ошибка обновления состояния в памяти:", e);
        }
      }
    },

    async unsaveJob(jobId) {
      if (!jobId) {
        console.error("Неверный ID вакансии для удаления:", jobId);
        return;
      }

      jobId = jobId.toString();
      this.loading = true;
      this.error = null;
      console.log(`Попытка удаления вакансии с id: ${jobId}`);

      // Сразу обновляем состояние в памяти для реактивности UI
      const initialCount = this.savedJobs.length;
      this.savedJobs = this.savedJobs.filter((job) => {
        const currentJobId = job.id || (job.job && job.job.id);
        return currentJobId?.toString() !== jobId;
      });
      console.log(
        `Removed from in-memory state: before=${initialCount}, after=${this.savedJobs.length}`
      );
      this.calculateStats();

      try {
        const savedJobsJson = localStorage.getItem("savedJobs");
        if (savedJobsJson) {
          let savedJobs = JSON.parse(savedJobsJson);

          if (Array.isArray(savedJobs)) {
            const initialCount = savedJobs.length;

            savedJobs = savedJobs.filter((job) => {
              const currentJobId = job.id || (job.job && job.job.id);
              return currentJobId?.toString() !== jobId;
            });

            localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
            console.log(
              `Removed from localStorage: before=${initialCount}, after=${savedJobs.length}`
            );
          }
        }
      } catch (localError) {
        console.error("Ошибка удаления из localStorage:", localError);
      }

      try {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          console.log(`Отправка API запроса для удаления вакансии ${jobId}`);
          await axios.delete(`/api/saved-jobs/${jobId}`, {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          });
          console.log(`API unsaveJob успешно выполнен для вакансии ${jobId}`);
        }
      } catch (apiError) {
        console.error(
          "Ошибка API при удалении вакансии:",
          apiError.response?.data || apiError.message || apiError
        );
        this.error = "Не удалось удалить вакансию с сервера";
      } finally {
        this.loading = false;

        try {
          const savedJobsJson = localStorage.getItem("savedJobs");
          if (savedJobsJson) {
            const savedJobs = JSON.parse(savedJobsJson);
            if (Array.isArray(savedJobs)) {
              this.savedJobs = savedJobs
                .map((job) => {
                  if (job.job && job.job.id) {
                    return {
                      id: job.job.id.toString(),
                      job: job.job,
                      saved_at: job.saved_at || new Date().toISOString(),
                    };
                  } else if (job.id) {
                    return {
                      id: job.id.toString(),
                      job: job,
                      saved_at: job.saved_at || new Date().toISOString(),
                    };
                  }
                  return null;
                })
                .filter((job) => job !== null);

              console.log(
                `Updated in-memory savedJobs after unsave, total: ${this.savedJobs.length}`
              );
              this.calculateStats();
            }
          } else {
            this.savedJobs = [];
            this.calculateStats();
          }
        } catch (e) {
          console.error("Error updating in-memory state after unsave:", e);
        }
      }
    },

    async toggleSaved(jobId, jobData) {
      if (!jobId) {
        console.error("Invalid job ID for toggle:", jobId);
        return false;
      }

      const isSaved = this.isSaved(jobId);

      try {
        if (isSaved) {
          await this.unsaveJob(jobId);
          return false; // Теперь не сохранено
        } else {
          // Если у нас нет данных о вакансии, но нужно её сохранить, корректно завершаем операцию
          if (!jobData) {
            console.error("Missing job data for saving");
            return isSaved;
          }
          await this.saveJob(jobData);
          return true; // Теперь сохранено
        }
      } catch (error) {
        console.error("Error toggling saved status:", error);
        return isSaved; // Возвращаем исходное состояние при ошибке
      }
    },
  },
});
