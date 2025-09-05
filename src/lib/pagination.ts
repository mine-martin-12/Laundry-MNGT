export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

export const calculatePagination = (state: PaginationState) => {
  const totalPages = Math.ceil(state.totalCount / state.pageSize);
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize - 1, state.totalCount - 1);
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: state.currentPage < totalPages,
    hasPrevPage: state.currentPage > 1,
  };
};

export const getSupabasePagination = (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  return { from, to };
};