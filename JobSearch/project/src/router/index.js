import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import JobList from "@/views/JobList.vue";
import JobDetail from "@/views/JobDetail.vue";
import SavedJobs from "@/views/SavedJobs.vue";
import ResumeForm from "@/views/ResumeForm.vue";
import ResumeList from "@/views/ResumeList.vue";
import Profile from "@/views/Profile.vue";
import Chat from "@/views/Chat.vue";
import { ref } from "vue";

const MyJobs = () => import("@/views/MyJobs.vue");
const CreateVacancy = () => import("@/views/CreateVacancy.vue");
const MyApplications = () => import("@/views/MyApplications.vue");

console.log("Login component:", Login);
console.log("Register component:", Register);

console.log("Router loaded components:", {
  Login: typeof Login,
  Register: typeof Register,
  Home: typeof Home,
});

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
    meta: { public: true },
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { public: true, guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { public: true, guestOnly: true },
  },
  {
    path: "/jobs/create",
    name: "create-job",
    component: CreateVacancy,
    meta: {
      requiresAuth: true,
      requiresEmployer: true,
      title: "Создать вакансию",
      mode: "create",
    },
  },
  {
    path: "/jobs/:id",
    name: "job-detail",
    component: JobDetail,
    props: true,
    meta: {
      public: true,
      title: "Детали вакансии",
    },
  },
  {
    path: "/jobs",
    name: "jobs",
    component: JobList,
    meta: { title: "Вакансии" },
  },
  {
    path: "/saved-jobs",
    name: "saved-jobs",
    component: SavedJobs,
    meta: {
      requiresAuth: true,
      requiresJobseeker: true,
      title: "Сохраненные вакансии",
    },
  },
  {
    path: "/jobs/my",
    name: "my-jobs",
    component: MyJobs,
    meta: { requiresAuth: true, requiresEmployer: true, title: "Мои вакансии" },
  },
  {
    path: "/jobs/:id/edit",
    name: "edit-job",
    component: CreateVacancy,
    meta: {
      requiresAuth: true,
      requiresEmployer: true,
      title: "Редактировать вакансию",
    },
  },
  {
    path: "/applications",
    name: "my-applications",
    component: MyApplications,
    meta: {
      requiresAuth: true,
      title: "Мои отклики",
    },
  },
  {
    path: "/profile",
    name: "profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/resumes",
    name: "resumes",
    component: ResumeList,
    meta: { requiresAuth: true, requiresJobseeker: true },
  },
  {
    path: "/resumes/create",
    name: "create-resume",
    component: ResumeForm,
    meta: { requiresAuth: true, requiresJobseeker: true },
  },
  {
    path: "/resumes/:id/edit",
    name: "edit-resume",
    component: ResumeForm,
    meta: { requiresAuth: true, requiresJobseeker: true },
  },
  {
    path: "/chat",
    name: "chat",
    component: Chat,
    meta: {
      requiresAuth: true,
      title: "Сообщения",
    },
  },
  {
    path: "/messages/:id",
    name: "chat-conversation",
    component: Chat,
    meta: {
      requiresAuth: true,
      title: "Диалог",
    },
  },
  {
    path: "/messages",
    name: "messages",
    component: Chat,
    meta: {
      requiresAuth: true,
      title: "Сообщения",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const isDev = ref(import.meta.env.DEV);

// Add redirect for old chat URLs
router.beforeEach((to, from, next) => {
  if (to.path === "/chat" && to.query.conversation) {
    const conversationId = to.query.conversation;
    console.log(
      `ROUTER: Redirecting from /chat?conversation=${conversationId} to /messages/${conversationId}`
    );
    return next({
      path: `/messages/${conversationId}`,
      replace: true,
    });
  }
  next();
});

// Auth check
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Принудительный обход проверки ролей в режиме разработки - добавляем эту строку для пропуска всех проверок ролей в режиме разработки
  if (isDev.value && to.meta.requiresEmployer && authStore.isAuthenticated) {
    console.log("DEV MODE: Bypassing employer check for", to.path);
    return next();
  }

  if (!authStore.initialized) {
    console.log("Auth store not initialized, initializing...");
    await authStore.initAuth();
  }

  const isAuthenticated = authStore.isAuthenticated;
  console.log(
    `Route navigation: ${from.path} -> ${to.path} (Auth: ${isAuthenticated})`
  );

  if (to.meta.public) {
    if (to.meta.guestOnly && isAuthenticated) {
      return next("/");
    }
    return next();
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log(
      "Route requires auth but user is not authenticated. Redirecting to login"
    );
    return next({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  }

  if (to.meta.requiresEmployer) {
    console.log("Route requires employer access:", to.path);
    console.log("User object:", JSON.stringify(authStore.user));
    console.log("User role:", authStore.user?.role);
    console.log("User profile role:", authStore.user?.profile?.role);
    console.log("isEmployer getter:", authStore.isEmployer);

    const isEmployer =
      authStore.isEmployer ||
      authStore.user?.role === "employer" ||
      authStore.user?.profile?.role === "employer" ||
      authStore.user?.is_employer === true ||
      authStore.user?.user_type === "employer";

    console.log("Final employer check result:", isEmployer);

    if (!isEmployer) {
      console.log("User is not an employer, redirecting to home");
      return next("/");
    }
  }

  if (to.meta.requiresJobseeker && !authStore.isJobseeker) {
    return next("/");
  }

  return next();
});

export default router;
