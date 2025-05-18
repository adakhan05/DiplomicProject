<template>
  <div
    class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer bg-red-500"
    @click="$emit('toggle')"
  >
    <button
      type="button"
      class="bg-yellow-400 px-2 py-1 rounded text-black font-medium text-sm focus:outline-none"
    >
      {{ show ? "Скрыть" : "Показать" }}
    </button>
  </div>
</template>

<script>
export default {
  name: "PasswordToggle",
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["toggle"],
};
</script>

<style scoped>
.absolute {
  z-index: 50 !important;
}
</style>
