<template>
  <div
    class="user-avatar"
    :class="[sizeClasses, { 'ring-2 ring-green-500': isActive }]"
    :style="{ backgroundColor: !imageUrl ? bgColor : '' }"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="`Аватар пользователя ${username}`"
      class="w-full h-full object-cover rounded-full"
      @error="handleImageError"
    />
    <span v-else class="text-white">{{ initials }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  imageUrl: {
    type: String,
    default: null,
  },
  username: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "md", // 'sm', 'md', 'lg'
    validator: (value) => ["xs", "sm", "md", "lg", "xl"].includes(value),
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const hasImageError = ref(false);

const handleImageError = () => {
  hasImageError.value = true;
};

const initials = computed(() => {
  if (!props.username) return "?";

  const parts = props.username.trim().split(/\s+/);
  if (parts.length === 1) {
    return props.username.substring(0, 2).toUpperCase();
  } else {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
});

const sizeClasses = computed(() => {
  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-xl",
  };
  return `rounded-full flex items-center justify-center ${sizes[props.size]}`;
});

// Генерирует постоянный цвет на основе имени пользователя
const bgColor = computed(() => {
  if (!props.username) return "#6B7280"; // gray-500

  const colors = [
    "#10B981", // emerald-500
    "#3B82F6", // blue-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#6366F1", // indigo-500
    "#14B8A6", // teal-500
  ];

  let hash = 0;
  for (let i = 0; i < props.username.length; i++) {
    hash = props.username.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
});
</script>

<style scoped>
.user-avatar {
  transition: all 0.2s ease;
}
</style>
