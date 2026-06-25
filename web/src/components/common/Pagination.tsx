import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next ›</button>
    </nav>
  );
};
export default Pagination;
