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
        const authStore = useAuthStore();
        const savedJobsKey = `savedJobs_${
          authStore.isAuthenticated ? authStore.user.id : "guest"
        }`;

        const savedJobsJson = localStorage.getItem(savedJobsKey);
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

    // Получить ключ localStorage для конкретного пользователя
    getUserStorageKey() {
      const authStore = useAuthStore();
      return `savedJobs_${
        authStore.isAuthenticated ? authStore.user.id : "guest"
      }`;
    },
  },

  actions: {
    loadSavedJobsFromStorage() {
      this.loading = true;
      this.error = null;

      try {
        // Устанавливаем таймаут для предотвращения бесконечной загрузки
        const loadingTimeout = setTimeout(() => {
          if (this.loading) {
            console.warn("Таймаут загрузки сохраненных вакансий");
            this.loading = false;
            this.error =
              "Превышено время ожидания загрузки. Попробуйте еще раз.";
          }
        }, 5000);

        // Получаем ключ localStorage, специфичный для пользователя
        const authStore = useAuthStore();
        const savedJobsKey = `savedJobs_${
          authStore.isAuthenticated ? authStore.user.id : "guest"
        }`;

        console.log(
          `Загрузка сохраненных вакансий пользователя из хранилища с ключом: ${savedJobsKey}`
        );
        const storedJobs = localStorage.getItem(savedJobsKey);

        if (storedJobs) {
          try {
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
                  saved_at: new Date().toISOString(),
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

                  // Убедимся, что saved_at существует
                  if (job.saved_at) {
                    normalizedJob.saved_at = job.saved_at;
                  }
                } else {
                  normalizedJob.job = { ...job };
                  normalizedJob.job.id = normalizedJob.id;
                }

                return normalizedJob;
              })
              .filter((job) => job !== null);

            this.savedJobs = parsedJobs;

            console.log(
              `Загружено ${parsedJobs.length} вакансий из локального хранилища пользователя`
            );

            // Обрабатываем загруженные вакансии для обеспечения согласованного форматирования
            this.processJobs();
            this.calculateStats();
          } catch (parseError) {
            console.error("Ошибка разбора данных из localStorage:", parseError);
            localStorage.removeItem(savedJobsKey); // Clean up corrupted data
            this.savedJobs = [];
            this.error =
              "Ошибка при обработке сохраненных вакансий. Данные были сброшены.";
          }
        } else {
          console.log(
            `Нет сохраненных вакансий в localStorage для ключа ${savedJobsKey}`
          );
          this.savedJobs = [];
        }

        clearTimeout(loadingTimeout);
        this.loading = false;
      } catch (error) {
        console.error("Ошибка загрузки сохраненных вакансий:", error);
        this.savedJobs = [];
        this.loading = false;
        this.error = "Произошла ошибка при загрузке сохраненных вакансий.";
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
        const authStore = useAuthStore();
        const savedJobsKey = `savedJobs_${
          authStore.isAuthenticated ? authStore.user.id : "guest"
        }`;

        localStorage.setItem(savedJobsKey, JSON.stringify(this.savedJobs));
        console.log(
          `Сохранено ${this.savedJobs.length} вакансий в localStorage пользователя (ключ: ${savedJobsKey})`
        );
      } catch (error) {
        console.error("Ошибка при сохранении вакансий в localStorage:", error);
      }
    },

    async fetchSavedJobs() {
      this.loading = true;
      this.error = null;
      let localDataLoaded = false;

      // Шаг 1: Пробуем загрузить из localStorage с использованием ключа, специфичного для пользователя
      try {
        const authStore = useAuthStore();
        const savedJobsKey = `savedJobs_${
          authStore.isAuthenticated ? authStore.user.id : "guest"
        }`;

        const savedJobsJson = localStorage.getItem(savedJobsKey);
        if (savedJobsJson) {
          console.log(
            `Загрузка сохраненных вакансий из localStorage для пользователя (ключ: ${savedJobsKey})`
          );
          try {
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
                `Загружено ${this.savedJobs.length} вакансий из localStorage для пользователя (ключ: ${savedJobsKey})`
              );

              // Если у нас есть данные из localStorage, вычисляем статистику и отмечаем как загруженные
              if (normalizedJobs.length > 0) {
                this.calculateStats();
                localDataLoaded = true;
              }
            }
          } catch (parseError) {
            console.error(
              "Ошибка парсинга данных из localStorage:",
              parseError
            );
            // Очищаем поврежденные данные в localStorage
            localStorage.removeItem(savedJobsKey);
          }
        }
      } catch (localError) {
        console.error("Ошибка загрузки из localStorage:", localError);
      }

      // Шаг 2: Пробуем загрузить из API, если пользователь аутентифицирован
      let apiSuccess = false;
      try {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) {
          console.log(
            "Пользователь не аутентифицирован, пропуск загрузки из API"
          );
          this.loading = false;

          // Если нет локальных данных и пользователь не аутентифицирован, показываем соответствующее сообщение
          if (!localDataLoaded) {
            this.error =
              "Войдите в систему, чтобы синхронизировать сохраненные вакансии";
          }
          return;
        }

        console.log(
          `Получение сохраненных вакансий из API для пользователя ${authStore.user.id}...`
        );
        try {
          const response = await axios.get("/api/saved-jobs", {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
            timeout: 10000, // 10 секунд тайм-аут для предотвращения бесконечной загрузки
            validateStatus: function (status) {
              // Считать только статусы 2xx успешными
              return status >= 200 && status < 300;
            },
          });

          console.log("Получен ответ от API:", response.data);
          apiSuccess = true;

          // Обработка ответа API
          let apiJobs = [];
          if (Array.isArray(response.data)) {
            console.log("API вернул массив напрямую");
            apiJobs = response.data;
          } else if (response.data && Array.isArray(response.data.savedJobs)) {
            console.log("API вернул объект с ключом savedJobs");
            apiJobs = response.data.savedJobs;
          } else if (response.data && typeof response.data === "object") {
            console.log("API вернул объект, поиск массива вакансий");
            const possibleJobsArray = Object.values(response.data).find((val) =>
              Array.isArray(val)
            );
            if (possibleJobsArray) {
              apiJobs = possibleJobsArray;
              console.log("Найден массив вакансий в объекте ответа");
            }
          }

          // Обновляем состояние только если API вернуло вакансии
          if (apiJobs.length > 0) {
            this.savedJobs = apiJobs;
            console.log(
              `API fetchSavedJobs: Найдено ${this.savedJobs.length} сохраненных вакансий для пользователя ${authStore.user.id}`
            );
            this.calculateStats();
            // Очищаем любые предыдущие ошибки, так как загрузка из API прошла успешно
            this.error = null;

            // Сохраняем результаты API в localStorage с ключом, специфичным для пользователя
            const savedJobsKey = `savedJobs_${authStore.user.id}`;
            localStorage.setItem(savedJobsKey, JSON.stringify(apiJobs));
            console.log(
              `Синхронизировано ${apiJobs.length} вакансий в localStorage (ключ: ${savedJobsKey})`
            );
          } else if (!localDataLoaded) {
            // Показываем сообщение "нет вакансий" только если у нас нет локальных данных
            console.log("API вернул пустой массив вакансий");
            this.savedJobs = [];
            this.calculateStats();
          }
        } catch (apiError) {
          // Обработка ошибки API отдельно
          if (apiError.response && apiError.response.status === 404) {
            console.warn(
              "API эндпоинт /api/saved-jobs не существует или недоступен"
            );
            // Для локальной разработки, API может отсутствовать - не считаем это критической ошибкой
            if (!localDataLoaded) {
              this.error =
                "Сервис сохраненных вакансий недоступен. Используются локальные данные.";
            }
          } else {
            // Другие ошибки API
            console.error(
              "Ошибка API при получении сохраненных вакансий:",
              apiError.response?.data || apiError.message || apiError
            );
            if (!localDataLoaded) {
              this.error =
                "Не удалось загрузить сохраненные вакансии с сервера. Используются локальные данные.";
            }
          }
        }
      } catch (error) {
        // Общая обработка ошибок
        console.error(
          "Ошибка при получении сохраненных вакансий:",
          error.response?.data || error.message || error
        );

        // Устанавливаем состояние ошибки только если у нас нет локальных данных
        if (!localDataLoaded) {
          this.error =
            "Не удалось загрузить сохраненные вакансии с сервера. Используются локальные данные.";
        }
      } finally {
        this.loading = false;

        // Если API завершилось с ошибкой, но у нас есть локальные данные, показываем неблокирующее уведомление
        if (!apiSuccess && localDataLoaded) {
          console.log("Используются локальные данные из-за ошибки API");
          // Не устанавливаем this.error, так как у нас есть локальные данные, избегая полноэкранной ошибки
        }
      }
    },

    async saveJob(jobData) {
      this.loading = true;
      // Очищаем любые предыдущие ошибки перед сохранением
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
        // Используем ключ, специфичный для пользователя, для согласованности
        const authStore = useAuthStore();
        const savedJobsKey = `savedJobs_${
          authStore.isAuthenticated ? authStore.user.id : "guest"
        }`;

        const savedJobsJson = localStorage.getItem(savedJobsKey);
        let savedJobs = savedJobsJson ? JSON.parse(savedJobsJson) : [];

        if (!Array.isArray(savedJobs)) {
          console.warn("savedJobs не является массивом, сброс");
          savedJobs = [];
        }

        const jobExistsInStorage = savedJobs.some(
          (job) => job.id === jobId || (job.job && job.job.id === jobId)
        );

        if (!jobExistsInStorage) {
          console.log(
            `Добавление вакансии ${jobId} в localStorage пользователя`
          );
          savedJobs.push({
            id: jobId,
            job: {
              ...jobData,
              id: jobId,
            },
            saved_at: new Date().toISOString(),
          });

          localStorage.setItem(savedJobsKey, JSON.stringify(savedJobs));
          console.log(
            `Успешно сохранено в localStorage (ключ: ${savedJobsKey}), всего: ${savedJobs.length}`
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
          // Используем ключ, специфичный для пользователя, для согласованности
          const authStore = useAuthStore();
          const savedJobsKey = `savedJobs_${
            authStore.isAuthenticated ? authStore.user.id : "guest"
          }`;

          const savedJobsJson = localStorage.getItem(savedJobsKey);
          if (savedJobsJson) {
            const savedJobs = JSON.parse(savedJobsJson);
            if (Array.isArray(savedJobs)) {
              // Обновляем состояние в памяти, чтобы оно соответствовало localStorage
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
                `Обновлены данные в памяти из localStorage (ключ: ${savedJobsKey}), всего: ${this.savedJobs.length}`
              );
              this.calculateStats();
              // Очищаем ошибку после успешного обновления
              this.error = null;
            }
          }
        } catch (e) {
          console.error("Ошибка обновления состояния в памяти:", e);
        }
      }
    },

    async unsaveJob(jobId) {
      if (!jobId) {
        console.error("Не указан ID вакансии для удаления");
        return;
      }

      const jobIdStr = jobId.toString();
      console.log(`Удаление вакансии с ID=${jobIdStr} из сохраненных`);

      // Обновляем состояние в памяти немедленно для отзывчивости UI
      this.savedJobs = this.savedJobs.filter(
        (item) =>
          !(item.id === jobIdStr || (item.job && item.job.id === jobIdStr))
      );
      this.calculateStats();

      // Обновляем localStorage с ключом, специфичным для пользователя
      try {
        const authStore = useAuthStore();
        const savedJobsKey = `savedJobs_${
          authStore.isAuthenticated ? authStore.user.id : "guest"
        }`;

        const savedJobsJson = localStorage.getItem(savedJobsKey);
        if (savedJobsJson) {
          const savedJobs = JSON.parse(savedJobsJson);
          if (Array.isArray(savedJobs)) {
            const filteredJobs = savedJobs.filter(
              (item) =>
                !(
                  item.id === jobIdStr ||
                  (item.job && item.job.id === jobIdStr)
                )
            );
            localStorage.setItem(savedJobsKey, JSON.stringify(filteredJobs));
            console.log(
              `Вакансия ID=${jobIdStr} удалена из localStorage пользователя (ключ: ${savedJobsKey})`
            );
          }
        }
      } catch (localError) {
        console.error(
          `Ошибка при обновлении localStorage после удаления вакансии ID=${jobIdStr}:`,
          localError
        );
      }

      // Если пользователь аутентифицирован, также удаляем из API
      try {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          // Удаление вакансии через API
          try {
            // Сначала пробуем прямой эндпоинт удаления, если он существует
            await axios.delete(`/api/saved-jobs/${jobIdStr}`, {
              headers: {
                Authorization: `Bearer ${authStore.token}`,
              },
            });
            console.log(`Вакансия ID=${jobIdStr} удалена через API (DELETE)`);
          } catch (directDeleteError) {
            console.warn(
              `Не удалось удалить через DELETE /api/saved-jobs/${jobIdStr}, пробуем через toggle:`,
              directDeleteError.response?.status || directDeleteError.message
            );

            // Возвращаемся к эндпоинту toggle
            await axios.post(
              "/api/saved-jobs/toggle_saved",
              { job: jobIdStr },
              {
                headers: {
                  Authorization: `Bearer ${authStore.token}`,
                },
              }
            );
            console.log(
              `Вакансия ID=${jobIdStr} удалена через API (toggle_saved)`
            );
          }
        } else {
          console.log(
            "Пользователь не аутентифицирован, удаление только из локального хранилища"
          );
        }
      } catch (error) {
        console.error(
          `Ошибка при удалении вакансии ID=${jobIdStr} через API:`,
          error.response?.data || error.message || error
        );
        // Вакансия уже удалена из UI, поэтому мы не показываем ошибку
        // Просто записываем её для отладки
      }
    },

    async toggleSaved(jobId, jobData) {
      if (!jobId) {
        console.error("Неверный ID вакансии для переключения:", jobId);
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
            console.error("Отсутствуют данные о вакансии для сохранения");
            return isSaved;
          }
          await this.saveJob(jobData);
          return true; // Теперь сохранено
        }
      } catch (error) {
        console.error("Ошибка при переключении состояния сохранения:", error);
        return isSaved; // Возвращаем исходное состояние при ошибке
      }
    },

    // Добавляем метод для очистки сохраненных вакансий при выходе из системы
    clearSavedJobs() {
      this.savedJobs = [];
      this.calculateStats();
    },

    // Метод для обработки изменения пользователя
    handleUserChange() {
      // Очищаем текущие вакансии
      this.savedJobs = [];
      // Перезагружаем из текущего пользователя's storage
      this.loadSavedJobsFromStorage();
      // Если пользователь аутентифицирован, также получаем данные из API
      if (useAuthStore().isAuthenticated) {
        this.fetchSavedJobs();
      }
    },

    // Метод для обновления данных сохраненных вакансий
    refreshSavedJobs() {
      console.log("Принудительное обновление данных сохраненных вакансий");
      const authStore = useAuthStore();

      // Сначала загружаем из localStorage
      this.loadSavedJobsFromStorage();

      // Если пользователь аутентифицирован, также получаем данные из API
      if (authStore.isAuthenticated) {
        this.fetchSavedJobs();
      }
    },
  },
});
