export type Paginated<T> = {
  results: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};
