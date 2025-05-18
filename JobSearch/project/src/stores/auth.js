import { defineStore } from "pinia";
import axios from "axios";
import router from "@/router";
import { get, post } from "@/utils/api";
import { safeStorage } from "@/utils/api-helper";
import { useRouter } from "vue-router";

// Получаем экземпляр маршрутизатора
const routerInstance = useRouter();

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null,
    user: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isEmployer: (state) =>
      !!state.user &&
      (state.user.profile?.role === "employer" ||
        state.user.role === "employer"),
    isJobSeeker: (state) =>
      state.user?.role === "job_seeker" || state.user?.role === "jobseeker",
    isJobseeker: (state) =>
      !!state.user &&
      (state.user.profile?.role === "jobseeker" ||
        state.user.role === "job_seeker" ||
        state.user.role === "jobseeker" ||
        (!state.user.profile?.role && !state.user.role === "employer")),
    userId: (state) => state.user?.id,
    username: (state) =>
      state.user?.username ||
      state.user?.profile?.username ||
      state.user?.first_name ||
      "Пользователь",
    userAvatar: (state) => state.user?.avatar || null,
  },

  actions: {
    initAuth() {
      return new Promise(async (resolve, reject) => {
        try {
          console.log("Инициализация состояния авторизации...");

          // Попытка восстановить состояние авторизации из хранилища
          const storedToken = safeStorage.getItem("token");
          const storedUserJson = safeStorage.getItem("user");

          if (storedToken) {
            this.token = storedToken;
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${storedToken}`;
            console.log("Токен успешно восстановлен из хранилища");

            if (storedUserJson) {
              try {
                this.user = JSON.parse(storedUserJson);
                console.log(
                  "Данные пользователя успешно восстановлены из хранилища"
                );

                // В режиме разработки, гарантируем, что пользователь имеет роль
                if (
                  import.meta.env.DEV &&
                  this.user &&
                  !this.user.profile?.role &&
                  !this.user.role
                ) {
                  console.log("DEV MODE: Setting default jobseeker role");
                  this.user.role = "jobseeker";
                  this.setUser(this.user);
                }
              } catch (e) {
                console.warn("Ошибка при парсинге данных пользователя:", e);
                // Попытка получить профиль пользователя, если парсинг не удается
                await this.getUserProfile();
              }
            } else {
              // У нас есть токен, но нет данных пользователя, попробуем получить профиль
              await this.getUserProfile();
            }
          } else {
            // Токен не найден, гарантируем, что пользователь вышел
            this.clearAuth();
            console.log("Токен не найден, пользователь не аутентифицирован");
          }

          this.initialized = true;
          console.log(
            "Инициализация авторизации завершена. Пользователь аутентифицирован:",
            this.isAuthenticated
          );
          resolve();
        } catch (error) {
          console.error("Ошибка при инициализации авторизации:", error);
          this.initialized = true;
          reject(error);
        }
      });
    },

    async login(credentials) {
      try {
        this.loading = true;
        this.error = null;

        // Проверяем учетные данные
        if (!credentials || !credentials.username || !credentials.password) {
          this.error = "Имя пользователя и пароль обязательны";
          console.error("Ошибка при входе: неверные учетные данные");
          return false;
        }

        // Попытка входа с несколькими эндпоинтами для совместимости
        let response;
        let loginEndpoints = [
          "/api/users/login/",
          "/api/auth/login/",
          "/api/token/",
        ];

        let loginError = null;

        // Попытка входа с каждым эндпоинтом до тех пор, пока один не работает
        for (const endpoint of loginEndpoints) {
          try {
            console.log(`Попытка входа с эндпоинтом: ${endpoint}`);
            response = await post(endpoint, credentials);
            if (response.success) {
              console.log(`Вход успешно выполнен с эндпоинтом: ${endpoint}`);
              break;
            }
          } catch (err) {
            console.warn(
              `Вход не удалось выполнить с эндпоинтом: ${endpoint}:`,
              err
            );
            loginError = err;
          }
        }

        // Если все эндпоинты завершились неудачей, возвращаем последнюю ошибку
        if (!response || !response.success) {
          console.error("Все попытки входа не удались");
          this.error = "Неверный логин или пароль";
          return false;
        }

        // Обрабатываем успешный вход
        if (response.data && (response.data.token || response.data.access)) {
          const token = response.data.token || response.data.access;
          this.setToken(token);

          if (response.data.refresh) {
            safeStorage.setItem("refreshToken", response.data.refresh);
          }

          if (response.data.user) {
            const userData = response.data.user;
            if (!userData.username && credentials.username) {
              userData.username = credentials.username;
            }
            this.setUser(userData);
          } else if (credentials.username) {
            const userData = {
              username: credentials.username,
              email: credentials.email || "",
              role: "job_seeker",
            };
            this.setUser(userData);
          }

          try {
            await this.getUserProfile();
          } catch (profileError) {
            console.warn(
              "Не удалось получить профиль пользователя после входа:",
              profileError
            );
            // Не прерываем процесс входа из-за ошибки профиля
          }

          return true;
        } else {
          console.error("Неверный ответ от сервера (нет токена):", response);
          this.error = "Неверный ответ от сервера";
          return false;
        }
      } catch (error) {
        console.error("Ошибка при входе:", error);

        if (error.response) {
          switch (error.response.status) {
            case 400:
              this.error = "Неверные учетные данные";
              break;
            case 401:
              this.error = "Неверный логин или пароль";
              break;
            case 403:
              this.error = "Доступ запрещен";
              break;
            default:
              this.error = `Ошибка при входе в систему (${error.response.status})`;
          }
        } else if (error.request) {
          this.error = "Сервер не отвечает. Проверьте подключение к интернету";
        } else {
          this.error = error.message || "Ошибка при входе в систему";
        }

        return false;
      } finally {
        this.loading = false;
      }
    },

    async register(userData) {
      try {
        this.loading = true;
        this.error = null;

        let response;
        try {
          response = await post("/api/users/register/", userData);
        } catch (firstError) {
          console.warn(
            "Первый эндпоинт регистрации не прошел, попробуем другой",
            firstError
          );

          try {
            response = await post("/api/auth/register/", userData);
          } catch (secondError) {
            console.error("Все эндпоинты регистрации не прошли", secondError);
            throw secondError;
          }
        }

        // Проверяем, что ответ существует и содержит данные
        if (response && response.data) {
          // Проверяем наличие токена доступа
          if (response.data.token || response.data.access) {
            const token = response.data.token || response.data.access;
            this.setToken(token);

            if (response.data.refresh) {
              safeStorage.setItem("refreshToken", response.data.refresh);
            }
          }

          // Создаем объект пользователя из данных ответа
          const user = {
            username: userData.username,
            email: userData.email,
            role: userData.role || "job_seeker",
            id: response.data.user_id || response.data.id || null,
          };

          // Если в ответе есть данные пользователя, используем их
          if (response.data.user) {
            Object.assign(user, response.data.user);
          }

          this.setUser(user);
          await this.getUserProfile();
          return true;
        } else {
          throw new Error("Неверный ответ от сервера при регистрации");
        }
      } catch (error) {
        console.error("Ошибка при регистрации:", error);

        if (error.response && error.response.data) {
          const errors = error.response.data;
          let errorMsg = "";

          if (typeof errors === "object") {
            for (const field in errors) {
              if (Array.isArray(errors[field])) {
                errorMsg += `${field}: ${errors[field].join(", ")}\n`;
              } else {
                errorMsg += `${field}: ${errors[field]}\n`;
              }
            }
          } else {
            errorMsg = "Ошибка при регистрации";
          }

          this.error = errorMsg.trim();
        } else if (error.request) {
          this.error = "Сервер не отвечает. Проверьте подключение к интернету";
        } else {
          this.error = error.message || "Ошибка при регистрации";
        }

        return false;
      } finally {
        this.loading = false;
      }
    },

    async getUserProfile() {
      try {
        if (!this.token) return false;

        this.loading = true;

        // Try API endpoints for production
        let response;
        try {
          console.log("Fetching user profile from primary endpoint");
          response = await get("/api/users/me/");
          if (!response.success) {
            console.warn("First profile endpoint failed, trying alternative");
            throw new Error("First endpoint failed");
          }
        } catch (firstError) {
          console.warn(
            "First profile endpoint failed, trying alternative",
            firstError
          );

          try {
            response = await get("/api/users/profile/");
            if (!response.success) {
              console.warn(
                "Second profile endpoint failed, trying another alternative"
              );
              throw new Error("Второй эндпоинт профиля не прошел");
            }
          } catch (secondError) {
            console.warn(
              "Второй эндпоинт профиля не прошел, попробуем другой альтернативный",
              secondError
            );

            try {
              response = await get("/api/auth/profile/");
              if (!response.success) {
                console.warn("Третий эндпоинт профиля не прошел");
                throw new Error("Третий эндпоинт профиля не прошел");
              }
            } catch (thirdError) {
              console.error(
                "Ошибка при получении профиля пользователя:",
                thirdError
              );
              throw thirdError;
            }
          }
        }

        if (response.success && response.data) {
          const existingUsername = this.user?.username;
          const responseUsername = response.data.username;

          const user = {
            ...response.data,
            username: responseUsername || existingUsername,
          };

          if (user.profile && user.profile.role) {
            user.role = user.profile.role;
          }

          this.setUser(user);
          return true;
        } else {
          console.warn(
            "Не удалось получить профиль пользователя: неверный формат ответа"
          );
          return false;
        }
      } catch (error) {
        console.error("Получение ошибки профиля пользователя:", error);

        if (error.response && error.response.status === 401) {
          this.clearAuth();
        }

        return false;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        this.loading = true;

        // Import SavedJobs store to clear saved jobs
        const { useSavedJobsStore } = await import("@/stores/saved-jobs");
        const savedJobsStore = useSavedJobsStore();

        if (this.token) {
          try {
            await post("/api/auth/logout/");
          } catch (error) {
            console.warn("Logout API call failed:", error);
          }
        }

        // Очищаем сохраненные вакансии перед очисткой авторизации
        savedJobsStore.clearSavedJobs();

        this.clearAuth();

        // Очистка формы через localStorage для обеспечения сброса между сессиями
        localStorage.removeItem("login_form");

        if (routerInstance.currentRoute.value.meta.requiresAuth) {
          routerInstance.push("/login");
        }

        return true;
      } catch (error) {
        console.error("Logout error:", error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    setToken(token) {
      this.token = token;
      safeStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },

    setUser(user) {
      const previousUser = this.user;
      this.user = { ...user };
      safeStorage.setItem("user", JSON.stringify(this.user));

      // Обрабатываем изменение пользователя для сохраненных вакансий, если ID пользователя изменился
      if (previousUser && previousUser.id !== user.id) {
        import("@/stores/saved-jobs").then(({ useSavedJobsStore }) => {
          const savedJobsStore = useSavedJobsStore();
          savedJobsStore.handleUserChange();
        });
      }
    },

    clearAuth() {
      this.user = null;
      this.token = null;
      safeStorage.removeItem("token");
      safeStorage.removeItem("refreshToken");
      safeStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
    },

    checkAuth() {
      return new Promise((resolve) => {
        if (this.initialized) {
          resolve(this.isAuthenticated);
        } else {
          const unwatch = this.$subscribe((_, state) => {
            if (state.initialized) {
              unwatch();
              resolve(state.isAuthenticated);
            }
          });

          this.initAuth();
        }
      });
    },

    ensureCorrectRoles() {
      // Специальная проверка ролей - роли определяются строго сервером
      return;
    },

    async refreshToken() {
      try {
        const refreshToken = safeStorage.getItem("refreshToken");
        if (!refreshToken) {
          console.error("No refresh token available");
          return false;
        }

        console.log("Attempting to refresh token");

        // Попробуйте несколько эндпоинтов обновления
        const refreshEndpoints = [
          "/api/token/refresh/",
          "/api/auth/token/refresh/",
          "/api/users/refresh-token/",
        ];

        let success = false;
        let lastError = null;

        for (const endpoint of refreshEndpoints) {
          try {
            console.log(`Trying refresh endpoint: ${endpoint}`);
            const response = await axios.post(
              endpoint,
              { refresh: refreshToken },
              {
                headers: {
                  "Content-Type": "application/json",
                  "X-Requested-With": "XMLHttpRequest",
                },
                withCredentials: true,
              }
            );

            if (
              response.data &&
              (response.data.access || response.data.token)
            ) {
              const newToken = response.data.access || response.data.token;
              this.setToken(newToken);

              // Сохраняем новый refresh токен, если он предоставлен
              if (response.data.refresh) {
                safeStorage.setItem("refreshToken", response.data.refresh);
              }

              console.log("Token refresh successful");
              success = true;
              break;
            }
          } catch (error) {
            console.warn(`Refresh attempt failed at ${endpoint}:`, error);
            lastError = error;
          }
        }

        if (success) {
          return true;
        } else {
          if (lastError) throw lastError;
          throw new Error("All token refresh attempts failed");
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        return false;
      }
    },

    async uploadAvatar(file) {
      try {
        this.loading = true;

        // Сохраняем текущего пользователя перед запросом
        const currentUser = { ...this.user };

        const formData = new FormData();
        formData.append("avatar", file);

        const response = await axios.post(
          `/api/users/avatar/${this.user.id}/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data && response.data.avatar_url) {
          // Обновляем ТОЛЬКО поле avatar, сохраняя все остальные поля текущего пользователя
          const updatedUser = {
            ...currentUser,
            avatar: response.data.avatar_url,
          };
          this.setUser(updatedUser);
          return response.data.avatar_url;
        }

        return null;
      } catch (error) {
        console.error("Ошибка при загрузке аватара:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeAvatar() {
      try {
        this.loading = true;

        // Сохраняем текущего пользователя перед запросом
        const currentUser = { ...this.user };

        await axios.delete(`/api/users/avatar/${this.user.id}/`);

        // Обновляем ТОЛЬКО поле avatar, сохраняя все остальные поля текущего пользователя
        const updatedUser = { ...currentUser, avatar: null };
        this.setUser(updatedUser);

        return true;
      } catch (error) {
        console.error("Ошибка при удалении аватара:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
