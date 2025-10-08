<template>
  <div class="w-full">
    <!-- Mobile: Card View -->
    <div class="block sm:hidden space-y-3">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" class="text-primary-600" />
      </div>

      <EmptyState
        v-else-if="!loading && data.length === 0"
        :icon="emptyIcon"
        :title="emptyTitle"
        :description="emptyDescription"
        :action-label="emptyActionLabel"
        @action="$emit('empty-action')"
      />

      <div
        v-else
        v-for="(row, index) in data"
        :key="getRowKey(row, index)"
        class="card p-4 space-y-3 touch-manipulation"
        @click="handleRowClick(row)"
      >
        <!-- Checkbox - Mobile -->
        <div v-if="selectable" class="flex items-center">
          <input
            type="checkbox"
            :checked="isSelected(row)"
            @change="toggleSelection(row)"
            @click.stop
            class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 touch-manipulation"
          />
        </div>

        <!-- Card Content -->
        <div
          v-for="column in columns"
          :key="column.key"
          class="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
        >
          <span class="text-sm font-medium text-gray-500 mr-4">
            {{ column.label }}
          </span>
          <span class="text-sm text-gray-900 text-right flex-1">
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="getValue(row, column.key)"
            >
              {{ formatValue(getValue(row, column.key), column) }}
            </slot>
          </span>
        </div>

        <!-- Actions - Mobile -->
        <div v-if="$slots.actions" class="pt-2 border-t border-gray-200">
          <slot name="actions" :row="row" />
        </div>
      </div>
    </div>

    <!-- Desktop: Table View -->
    <div class="hidden sm:block overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <!-- Table Header -->
        <thead class="bg-gray-50">
          <tr>
            <!-- Selection Column -->
            <th v-if="selectable" scope="col" class="w-12 px-6 py-3">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isSomeSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </th>

            <!-- Data Columns -->
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="[
                'px-6 py-3 text-left',
                'text-xs font-medium text-gray-500 uppercase tracking-wider',
                column.sortable
                  ? 'cursor-pointer select-none hover:bg-gray-100'
                  : '',
              ]"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable" class="flex flex-col">
                  <svg
                    :class="[
                      'w-3 h-3',
                      sortColumn === column.key && sortDirection === 'asc'
                        ? 'text-primary-600'
                        : 'text-gray-400',
                    ]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                    />
                  </svg>
                  <svg
                    :class="[
                      'w-3 h-3 -mt-1',
                      sortColumn === column.key && sortDirection === 'desc'
                        ? 'text-primary-600'
                        : 'text-gray-400',
                    ]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                    />
                  </svg>
                </span>
              </div>
            </th>

            <!-- Actions Column -->
            <th v-if="$slots.actions" scope="col" class="relative px-6 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="columnCount" class="px-6 py-12 text-center">
              <LoadingSpinner size="lg" class="text-primary-600 mx-auto" />
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="!loading && data.length === 0">
            <td :colspan="columnCount" class="px-6 py-12">
              <EmptyState
                :icon="emptyIcon"
                :title="emptyTitle"
                :description="emptyDescription"
                :action-label="emptyActionLabel"
                @action="$emit('empty-action')"
              />
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-else
            v-for="(row, index) in data"
            :key="getRowKey(row, index)"
            :class="[
              'hover:bg-gray-50 transition-colors',
              clickable ? 'cursor-pointer' : '',
              isSelected(row) ? 'bg-primary-50' : '',
            ]"
            @click="handleRowClick(row)"
          >
            <!-- Selection Cell -->
            <td v-if="selectable" class="px-6 py-4">
              <input
                type="checkbox"
                :checked="isSelected(row)"
                @change="toggleSelection(row)"
                @click.stop
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </td>

            <!-- Data Cells -->
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getValue(row, column.key)"
              >
                {{ formatValue(getValue(row, column.key), column) }}
              </slot>
            </td>

            <!-- Actions Cell -->
            <td
              v-if="$slots.actions"
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';
import EmptyState from './EmptyState.vue';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  format?: 'text' | 'number' | 'date' | 'currency' | 'badge';
  width?: string;
}

interface Props {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  selectable?: boolean;
  clickable?: boolean;
  rowKey?: string;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  emptyIcon?: 'inbox' | 'search' | 'folder' | 'document' | 'users' | 'chart';
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectable: false,
  clickable: false,
  rowKey: 'id',
  sortColumn: null,
  sortDirection: null,
  emptyIcon: 'inbox',
  emptyTitle: 'No data found',
  emptyDescription: 'Try adjusting your search or filter criteria',
});

const emit = defineEmits<{
  (e: 'row-click', row: any): void;
  (e: 'sort', column: string): void;
  (e: 'selection-change', selected: any[]): void;
  (e: 'empty-action'): void;
}>();

const selectedRows = ref<any[]>([]);

const columnCount = computed(() => {
  let count = props.columns.length;
  if (props.selectable) count++;
  if (props.$slots.actions) count++;
  return count;
});

const isAllSelected = computed(() => {
  return (
    props.data.length > 0 && selectedRows.value.length === props.data.length
  );
});

const isSomeSelected = computed(() => {
  return (
    selectedRows.value.length > 0 &&
    selectedRows.value.length < props.data.length
  );
});

function getRowKey(row: any, index: number): string | number {
  return row[props.rowKey] || index;
}

function getValue(row: any, key: string): any {
  return key.split('.').reduce((obj, k) => obj?.[k], row);
}

function formatValue(value: any, column: TableColumn): string {
  if (value == null) return '-';

  switch (column.format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value;
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'currency':
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
      }).format(value);
    default:
      return String(value);
  }
}

function isSelected(row: any): boolean {
  const rowKey = getRowKey(row, -1);
  return selectedRows.value.some((r) => getRowKey(r, -1) === rowKey);
}

function toggleSelection(row: any) {
  const rowKey = getRowKey(row, -1);
  const index = selectedRows.value.findIndex(
    (r) => getRowKey(r, -1) === rowKey
  );

  if (index > -1) {
    selectedRows.value.splice(index, 1);
  } else {
    selectedRows.value.push(row);
  }

  emit('selection-change', selectedRows.value);
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = [...props.data];
  }

  emit('selection-change', selectedRows.value);
}

function handleRowClick(row: any) {
  if (props.clickable) {
    emit('row-click', row);
  }
}

function handleSort(column: string) {
  emit('sort', column);
}
</script>
