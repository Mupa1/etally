<template>
  <div class="rich-text-editor">
    <!-- Toolbar -->
    <div
      class="toolbar border-b border-gray-300 p-2 flex flex-wrap gap-2 bg-gray-50"
    >
      <button
        type="button"
        @click="formatText('bold')"
        class="p-2 rounded hover:bg-gray-200"
        :class="{ 'bg-blue-100': isFormatActive('bold') }"
        title="Bold"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M6.5 5a2.5 2.5 0 0 1 4.206 1.623A2.5 2.5 0 0 1 13 10h-2.5V8.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0V13H13a2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5h-.5V5h-6z"
          />
        </svg>
      </button>
      <button
        type="button"
        @click="formatText('italic')"
        class="p-2 rounded hover:bg-gray-200"
        :class="{ 'bg-blue-100': isFormatActive('italic') }"
        title="Italic"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M6.5 3h7.254v2.5a.75.75 0 0 1-1.5 0V4.5h-3a.75.75 0 0 0 0 1.5h2.5v3.5h-2.5a.75.75 0 0 0 0 1.5h3v2.5a.75.75 0 0 1-1.5 0V16H6.5a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5H6.5v-2.5a.75.75 0 0 1 1.5 0v-2.5h3V6.5h-3a.75.75 0 0 0 0-1.5z"
          />
        </svg>
      </button>
      <button
        type="button"
        @click="formatText('underline')"
        class="p-2 rounded hover:bg-gray-200"
        :class="{ 'bg-blue-100': isFormatActive('underline') }"
        title="Underline"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M5 3.25a.75.75 0 0 0-.75.75v6a5.5 5.5 0 0 0 11 0V4a.75.75 0 0 0-1.5 0v6a4 4 0 0 1-8 0V4a.75.75 0 0 0-.75-.75zM3.25 14a.75.75 0 0 0 0 1.5h13.5a.75.75 0 0 0 0-1.5H3.25z"
          />
        </svg>
      </button>
      <div class="w-px bg-gray-300 mx-2"></div>
      <button
        type="button"
        @click="formatText('justifyLeft')"
        class="p-2 rounded hover:bg-gray-200"
        title="Align Left"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M2 4a.75.75 0 0 0 0 1.5h16a.75.75 0 0 0 0-1.5H2zm0 5a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5H2zm0 5a.75.75 0 0 0 0 1.5h16a.75.75 0 0 0 0-1.5H2z"
          />
        </svg>
      </button>
      <button
        type="button"
        @click="formatText('justifyCenter')"
        class="p-2 rounded hover:bg-gray-200"
        title="Align Center"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M3 4a.75.75 0 0 0 0 1.5h4A2.25 2.25 0 0 1 9.25 7v6a.75.75 0 0 0 1.5 0V7A3.75 3.75 0 0 0 7 4H3zM13 4a.75.75 0 0 0 0 1.5h4A2.25 2.25 0 0 1 19.25 8a2.25 2.25 0 0 1-2.25 2.25h-4a.75.75 0 0 0 0 1.5h4A3.75 3.75 0 0 0 23 5.75 3.75 3.75 0 0 0 19.25 2h-4z"
          />
        </svg>
      </button>
      <button
        type="button"
        @click="formatText('justifyRight')"
        class="p-2 rounded hover:bg-gray-200"
        title="Align Right"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M18 4a.75.75 0 0 0 0-1.5H2a.75.75 0 0 0 0 1.5h16zm-6 5a.75.75 0 0 0 0-1.5H2a.75.75 0 0 0 0 1.5h10zm6 5a.75.75 0 0 0 0-1.5H2a.75.75 0 0 0 0 1.5h16z"
          />
        </svg>
      </button>
      <div class="w-px bg-gray-300 mx-2"></div>
      <button
        type="button"
        @click="formatText('insertUnorderedList')"
        class="p-2 rounded hover:bg-gray-200"
        title="Bullet List"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M3.5 4.25a1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1zm1 3.5a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5h-12zm0 4.5a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5h-12zM5 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm1-7.75a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5h-12z"
          />
        </svg>
      </button>
      <button
        type="button"
        @click="formatText('insertOrderedList')"
        class="p-2 rounded hover:bg-gray-200"
        title="Numbered List"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M3.5 2.75a.75.75 0 0 0-1.5 0V5a.75.75 0 0 0 .75.75h1.25v-.5a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0V7h-.75A.75.75 0 0 0 3 7.5v1.25a.75.75 0 0 0 1.5 0V8.25h.75a.75.75 0 0 0 0-1.5H3.5v-.5h1.25a.75.75 0 0 0 0-1.5H3.5v-1.75zm1.5 5.5a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5h-12zM5 14a.75.75 0 0 0 0 1.5h11a.75.75 0 0 0 0-1.5H5z"
          />
        </svg>
      </button>
      <div class="w-px bg-gray-300 mx-2"></div>
      <button
        type="button"
        @click="formatText('removeFormat')"
        class="p-2 rounded hover:bg-gray-200 text-red-600"
        title="Clear Formatting"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M8.47 1.315A.75.75 0 0 0 7.43 2.165L9.29 4.5l-.517.517L6.913 2.681a.75.75 0 1 0-1.061 1.061l.945.945-1.118.374a1.5 1.5 0 0 0-.925 1.934l2.553 7.883a.75.75 0 0 0 1.434 0l2.552-7.883a1.5 1.5 0 0 0-.925-1.934l-1.119-.374L9.66 5.137 10.78 6.258l-.517.517-1.86-2.335zM4.272 6a.75.75 0 0 0-.532.91l3.5 10.5a.75.75 0 0 0 1.42.257l.93-1.8 1.06 1.06a.75.75 0 1 0 1.06-1.06l-1.06-1.06.93-1.8a.75.75 0 0 0-.257-1.42L5.818 6H4.272zm11.656 0a.75.75 0 0 0-.532.91l3.5 10.5a.75.75 0 0 0 1.42.257l.93-1.8 1.06 1.06a.75.75 0 1 0 1.06-1.06l-1.06-1.06.93-1.8a.75.75 0 0 0-.257-1.42L15.818 6h-.532z"
          />
        </svg>
      </button>
    </div>

    <!-- Editor Content -->
    <div
      ref="editorRef"
      class="editor-content min-h-[300px] p-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
      contenteditable="true"
      @input="handleInput"
      @blur="handleBlur"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editorRef = ref<HTMLElement | null>(null);
const isUpdating = ref(false);

onMounted(() => {
  if (props.modelValue) {
    updateEditor(props.modelValue);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!isUpdating.value) {
      updateEditor(newValue);
    }
  }
);

function updateEditor(value: string) {
  if (editorRef.value) {
    editorRef.value.innerHTML = value;
  }
}

function handleInput() {
  if (editorRef.value) {
    isUpdating.value = true;
    emit('update:modelValue', editorRef.value.innerHTML);
    setTimeout(() => {
      isUpdating.value = false;
    }, 0);
  }
}

function handleBlur() {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML);
  }
}

function formatText(command: string) {
  document.execCommand(command, false);
  editorRef.value?.focus();
}

function isFormatActive(command: string): boolean {
  return document.queryCommandState(command);
}
</script>

<style scoped>
.editor-content {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  line-height: 1.6;
}

.editor-content:focus {
  outline: none;
}

.toolbar button:hover {
  background-color: #e5e7eb;
}

.toolbar button.active {
  background-color: #dbeafe;
}
</style>
