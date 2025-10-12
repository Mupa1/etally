<template>
  <div class="bg-white shadow-sm rounded-lg overflow-hidden">
    <!-- Table Container -->
    <div class="overflow-x-auto">
      <div class="inline-block min-w-full align-middle">
        <table class="min-w-full border-separate border-spacing-0">
          <!-- Table Header -->
          <thead>
            <tr>
              <th
                v-for="(column, idx) in columns"
                :key="column.key"
                scope="col"
                :class="[
                  'sticky top-0 z-10 border-b border-gray-300',
                  'bg-white/75 backdrop-blur-sm backdrop-filter',
                  'py-3.5 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider',
                  idx === 0 ? 'pl-6 pr-3' : 'px-3',
                  idx === columns.length - 1 ? 'pr-6' : '',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.className || '',
                ]"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="bg-white">
            <tr
              v-for="(item, itemIdx) in paginatedData"
              :key="getRowKey(item, itemIdx)"
              class="hover:bg-gray-50 transition-colors"
            >
              <td
                v-for="(column, colIdx) in columns"
                :key="`${getRowKey(item, itemIdx)}-${column.key}`"
                :class="[
                  itemIdx !== paginatedData.length - 1
                    ? 'border-b border-gray-200'
                    : '',
                  'py-4 text-sm',
                  colIdx === 0 ? 'pl-6 pr-3' : 'px-3',
                  colIdx === columns.length - 1 ? 'pr-6' : '',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.cellClassName || '',
                ]"
              >
                <!-- Custom slot for this column -->
                <slot
                  v-if="$slots[`cell-${column.key}`]"
                  :name="`cell-${column.key}`"
                  :item="item"
                  :value="getValue(item, column.key)"
                />
                <!-- Default rendering -->
                <span v-else>{{ getValue(item, column.key) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="showPagination && totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :per-page="perPage"
      :show-per-page="showPerPageSelector"
      :per-page-options="perPageOptions"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Pagination from './Pagination.vue';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  cellClassName?: string;
}

interface Props {
  columns: TableColumn[];
  data: any[];
  rowKey?: string;
  currentPage?: number;
  perPage?: number;
  showPagination?: boolean;
  showPerPageSelector?: boolean;
  perPageOptions?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  currentPage: 1,
  perPage: 10,
  showPagination: true,
  showPerPageSelector: true,
  perPageOptions: () => [10, 25, 50, 100],
});

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'per-page-change', perPage: number): void;
}>();

const totalItems = computed(() => props.data.length);

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / props.perPage);
});

const paginatedData = computed(() => {
  if (!props.showPagination) {
    return props.data;
  }

  const start = (props.currentPage - 1) * props.perPage;
  const end = start + props.perPage;
  return props.data.slice(start, end);
});

function getRowKey(item: any, index: number): string | number {
  return item[props.rowKey] || index;
}

function getValue(item: any, key: string): any {
  // Support nested keys like 'user.name'
  return key.split('.').reduce((obj, k) => obj?.[k], item);
}

function handlePageChange(page: number) {
  emit('page-change', page);
}

function handlePerPageChange(perPage: number) {
  emit('per-page-change', perPage);
}
</script>
