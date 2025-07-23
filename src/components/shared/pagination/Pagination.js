import React from 'react';
import './Pagination.css';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
    onItemsPerPageChange,
    showInfo = true,
    showSizeSelector = true
}) => {
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        // Agar jami sahifalar kam bo'lsa, barchasini ko'rsatamiz
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                range.push(i);
            }
            return range;
        }

        // Birinchi sahifa har doim ko'rsatiladi
        rangeWithDots.push(1);

        // Joriy sahifa atrofidagi sahifalar
        for (let i = Math.max(2, currentPage - delta);
             i <= Math.min(totalPages - 1, currentPage + delta);
             i++) {
            range.push(i);
        }

        // Nuqtalar va oraliq sahifalarni qo'shish
        if (currentPage - delta > 2) {
            rangeWithDots.push('...');
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...');
        }

        // Oxirgi sahifa har doim ko'rsatiladi
        if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const visiblePages = getVisiblePages();
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageClick = (page) => {
        if (page !== '...' && page !== currentPage) {
            onPageChange(page);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value);
        onItemsPerPageChange(newItemsPerPage);
    };

    // Agar totalItems 0 bo'lsa, paginationni ko'rsatmaymiz
    if (totalItems === 0) return null;

    return (
        <div className="pagination-container">
            {/* Ma'lumot va sahifa o'lchamini tanlash */}
            <div className="pagination-info-section">
                {showInfo && (
                    <div className="pagination-info">
                        <span className="pagination-info-text">
                            {totalItems} tadan {startItem}-{endItem} ko'rsatilmoqda
                        </span>
                    </div>
                )}

                {showSizeSelector && (
                    <div className="pagination-size-selector">
                        <label className="pagination-size-label">
                            Sahifada:
                        </label>
                        <select
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="pagination-size-select"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Faqat 1 sahifadan ko'p bo'lsa pagination tugmalarini ko'rsatamiz */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    {/* Oldingi tugma */}
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className="pagination-btn pagination-btn-prev"
                        title="Oldingi sahifa"
                    >
                        <span className="pagination-btn-icon">‹</span>
                        <span className="pagination-btn-text">Oldingi</span>
                    </button>

                    {/* Sahifa raqamlari */}
                    <div className="pagination-pages">
                        {visiblePages.map((page, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageClick(page)}
                                className={`pagination-page ${
                                    currentPage === page ? 'pagination-page-active' : ''
                                } ${
                                    page === '...' ? 'pagination-page-dots' : ''
                                }`}
                                disabled={page === '...'}
                            >
                                {page === '...' ? '⋯' : page}
                            </button>
                        ))}
                    </div>

                    {/* Keyingi tugma */}
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="pagination-btn pagination-btn-next"
                        title="Keyingi sahifa"
                    >
                        <span className="pagination-btn-text">Keyingi</span>
                        <span className="pagination-btn-icon">›</span>
                    </button>
                </div>
            )}

            {/* Sahifa navigatsiyasi - faqat ko'p sahifa bo'lsa */}
            {totalPages > 1 && (
                <div className="pagination-navigation">
                    <span className="pagination-nav-text">
                        Sahifa {currentPage} / {totalPages}
                    </span>
                    <div className="pagination-jump">
                        <label className="pagination-jump-label">O'tish:</label>
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                                const page = parseInt(e.target.value);
                                if (page >= 1 && page <= totalPages) {
                                    onPageChange(page);
                                }
                            }}
                            className="pagination-jump-input"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pagination;
