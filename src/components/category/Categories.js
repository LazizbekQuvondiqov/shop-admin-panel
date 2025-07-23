import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Pagination from '../shared/pagination/Pagination';
import './Categories.css';

const Categories = () => {
    const {
        categories: allCategories,
        products: allProducts,
        isLoading,
        error: contextError,
        addCategory,
        updateCategory,
        deleteCategory
    } = useAppContext();

    const [componentError, setComponentError] = useState(null);
    const [formData, setFormData] = useState({ name: '', status: 'active' });
    const [editMode, setEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const categoriesWithProductCount = useMemo(() => {
        if (!allCategories || !allProducts) return [];
        return allCategories.map(category => ({
            ...category,
            productCount: allProducts.filter(p => p.categoryId === category.id).length
        }));
    }, [allCategories, allProducts]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (componentError) setComponentError(null);
    }, [componentError]);

    const resetForm = useCallback(() => {
        setFormData({ name: '', status: 'active' });
        setEditMode(false);
        setCurrentCategory(null);
        setComponentError(null);
    }, []);

    const openFormModal = useCallback((category = null) => {
        resetForm();
        if (category) {
            setEditMode(true);
            setCurrentCategory(category);
            setFormData({ name: category.name, status: category.status });
        }
        setShowFormModal(true);
    }, [resetForm]);

    const closeFormModal = useCallback(() => {
        setShowFormModal(false);
        resetForm();
    }, [resetForm]);

    const openDeleteModal = useCallback((category) => {
        setCurrentCategory(category);
        setShowDeleteModal(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setShowDeleteModal(false);
        setCurrentCategory(null);
        setComponentError(null);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setComponentError('Kategoriya nomi kiritilishi shart.');
            return;
        }

        const isDuplicate = allCategories.some(cat => cat.name.toLowerCase() === formData.name.trim().toLowerCase() && cat.id !== currentCategory?.id);
        if (isDuplicate) {
            setComponentError('Bu nomda kategoriya allaqachon mavjud.');
            return;
        }

        setIsSubmitting(true);
        setComponentError(null);

        const payload = { name: formData.name.trim(), status: formData.status };

        const result = editMode
            ? await updateCategory(currentCategory.id, payload)
            : await addCategory(payload);

        if (result.success) {
            closeFormModal();
        } else {
            setComponentError(result.error || 'Noma\'lum xatolik yuz berdi.');
        }

        setIsSubmitting(false);
    }, [formData, editMode, currentCategory, allCategories, updateCategory, addCategory, closeFormModal]);

    // 🔥 Yangilangan handleDelete
    const handleDelete = useCallback(async () => {
        if (!currentCategory) return;

        setIsSubmitting(true);
        setComponentError(null);

        const result = await deleteCategory(currentCategory.id);

        if (result.success) {
            closeDeleteModal();
        } else {
            setComponentError(result.error || 'O\'chirishda xatolik yuz berdi.');
        }

        setIsSubmitting(false);
    }, [currentCategory, deleteCategory, closeDeleteModal]);

    const totalPages = Math.ceil(categoriesWithProductCount.length / itemsPerPage);

    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return categoriesWithProductCount.slice(startIndex, startIndex + itemsPerPage);
    }, [categoriesWithProductCount, currentPage, itemsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const displayError = contextError || componentError;

    if (isLoading && !allCategories.length) {
        return (
            <div className="loader-container">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0"><i className="fas fa-tags me-2"></i>Kategoriyalar ({allCategories.length})</h1>
                <button className="btn btn-primary" onClick={() => openFormModal()}>
                    <i className="fas fa-plus me-2"></i>Yangi kategoriya
                </button>
            </div>

            {displayError && !showFormModal && !showDeleteModal && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {String(displayError)}
                    <button type="button" className="btn-close" onClick={() => setComponentError(null)} aria-label="Close"></button>
                </div>
            )}

            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Nomi</th>
                                    <th className="text-center">Mahsulotlar soni</th>
                                    <th className="text-center">Holati</th>
                                    <th className="text-center">Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCategories.length > 0 ? paginatedCategories.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <strong>{category.name}</strong><br />
                                            <small className="text-muted">ID: {category.id}</small>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-primary rounded-pill">{category.productCount}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`badge rounded-pill bg-${category.status === 'active' ? 'success' : 'secondary'}-soft text-${category.status === 'active' ? 'success' : 'secondary'}`}>
                                                {category.status === "active" ? "Faol" : "Nofaol"}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="btn-group">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => openFormModal(category)} title="Tahrirlash">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => openDeleteModal(category)} title="O'chirish">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5">
                                            <i className="fas fa-tags fa-3x text-muted"></i>
                                            <p className="mt-2">Kategoriyalar topilmadi.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {totalPages > 1 && (
                    <div className="card-footer bg-light">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={categoriesWithProductCount.length}
                            onItemsPerPageChange={(size) => {
                                setItemsPerPage(size);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* FORM MODAL */}
            {showFormModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeFormModal}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <form className="modal-content" onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{editMode ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</h5>
                                <button type="button" className="btn-close" onClick={closeFormModal}></button>
                            </div>
                            <div className="modal-body">
                                {componentError && <div className="alert alert-danger py-2">{componentError}</div>}
                                <div className="mb-3">
                                    <label htmlFor="category-name" className="form-label">Nomi *</label>
                                    <input
                                        type="text"
                                        id="category-name"
                                        name="name"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="category-status" className="form-label">Holati</label>
                                    <select
                                        id="category-status"
                                        name="status"
                                        className="form-select"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="active">Faol</option>
                                        <option value="inactive">Nofaol</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeFormModal}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !formData.name.trim()}>
                                    {isSubmitting && <span className="spinner-border spinner-border-sm me-2"></span>}
                                    {editMode ? 'Saqlash' : 'Qo\'shish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL (yangilangan) */}
            {showDeleteModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeDeleteModal}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">O'chirishni tasdiqlang</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeDeleteModal}></button>
                            </div>
                            <div className="modal-body">
                                {componentError && <div className="alert alert-danger py-2">{componentError}</div>}
                                <p>
                                    Haqiqatan ham <strong>"{currentCategory?.name}"</strong> nomli kategoriyani o'chirmoqchimisiz?
                                </p>
                                {currentCategory?.productCount > 0 && (
                                    <div className="alert alert-warning">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Ushbu kategoriyada {currentCategory.productCount} ta mahsulot bor. Diqqat bilan davom eting.
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal} disabled={isSubmitting}>Yo'q</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isSubmitting}>
                                    {isSubmitting && <span className="spinner-border spinner-border-sm me-2"></span>}
                                    Ha, o'chirish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;

