import { useState, useCallback, useMemo } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface PaginationResult<T> {
  // Current page data
  paginatedData: T[];
  
  // Pagination state
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  
  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Page size
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];
  
  // Helpers
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  
  // For displaying "Showing X-Y of Z"
  rangeDisplay: string;
}

export function usePagination<T>(
  data: T[],
  options: PaginationOptions = {}
): PaginationResult<T> {
  const {
    initialPage = 1,
    initialPageSize = 25,
    pageSizeOptions = [10, 25, 50, 100],
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Ensure current page is valid
  const validCurrentPage = useMemo(() => {
    if (currentPage < 1) return 1;
    if (currentPage > totalPages && totalPages > 0) return totalPages;
    return currentPage;
  }, [currentPage, totalPages]);

  // Calculate indices
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Get paginated data
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(validCurrentPage + 1);
  }, [validCurrentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(validCurrentPage - 1);
  }, [validCurrentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [totalPages, goToPage]);

  // Page size change
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    // Reset to first page when changing page size
    setCurrentPage(1);
  }, []);

  // Helpers
  const hasNextPage = validCurrentPage < totalPages;
  const hasPreviousPage = validCurrentPage > 1;

  // Range display
  const rangeDisplay = useMemo(() => {
    if (totalItems === 0) return 'Sin registros';
    return `Mostrando ${startIndex + 1}-${endIndex} de ${totalItems}`;
  }, [startIndex, endIndex, totalItems]);

  return {
    paginatedData,
    currentPage: validCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    pageSizeOptions,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    rangeDisplay,
  };
}

// Component-ready pagination controls
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: (number | 'ellipsis')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // Always show first page
  range.push(1);

  // Calculate start and end of visible range
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if at the beginning or end
  if (currentPage <= halfVisible + 1) {
    end = maxVisible - 1;
  } else if (currentPage >= totalPages - halfVisible) {
    start = totalPages - maxVisible + 2;
  }

  // Add ellipsis before if needed
  if (start > 2) {
    range.push('ellipsis');
  }

  // Add visible pages
  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  // Add ellipsis after if needed
  if (end < totalPages - 1) {
    range.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}
