import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import Pagination from '../shared/pagination/Pagination';
import './Products.css';

// API_URL o'zgaruvchisi olib tashlandi, chunki u endi kerak emas.

const Products = () => {
    // 1. MA'LUMOTLARNI VA FUNKSIYALARNI CONTEXT'DAN OLAMIZ
    const {
        products: allProducts,
        categories: allCategories,
        isLoading: loading,
        error,
        updateProduct,
        deleteProduct,
    } = useAppContext();

    // Komponentning ichki state'lari (o'zgarishsiz)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('grid');

    // 2. O'CHIRISH VA STATUS O'ZGARTIRISH FUNKSIYALARI (o'zgarishsiz)
    const handleDelete = useCallback(async (id, name) => {
        if (!window.confirm(`"${name}" mahsulotini o'chirmoqchimisiz?`)) return;
        await deleteProduct(id);
    }, [deleteProduct]);

    const handleStatusChange = useCallback(async (id, currentStatus) => {
        const productToUpdate = allProducts.find(p => p.id === id);
        if (!productToUpdate) return;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        // FormData o'rniga oddiy obyekt yuborish kerak bo'lishi mumkin,
        // agar status o'zgartirishda fayl yuklanmasa.
        // Hozircha bu ishlaydi, chunki updateProduct FormData'siz ham ishlay oladi.
        await updateProduct(id, { ...productToUpdate, status: newStatus, existingImage: productToUpdate.image || '' });
    }, [allProducts, updateProduct]);

    // Filterlangan va saralangan mahsulotlar (o'zgarishsiz)
    const processedProducts = useMemo(() => {
        if (!allProducts) return [];
        const productsWithCategoryNames = allProducts.map(product => {
            const category = (allCategories || []).find(c => c.id === product.categoryId);
            return { ...product, categoryName: category ? category.name : 'Noma\'lum' };
        });

        let filtered = productsWithCategoryNames;
        if (selectedCategory) {
            filtered = filtered.filter(p => p.categoryId === selectedCategory);
        }
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(lowercasedTerm) ||
                p.description?.toLowerCase().includes(lowercasedTerm)
            );
        }

        return [...filtered].sort((a, b) => {
            let aValue = a[sortBy]; let bValue = b[sortBy];
            if (sortBy === 'price') { aValue = aValue || 0; bValue = bValue || 0; }
            else { aValue = String(aValue || '').toLowerCase(); bValue = String(bValue || '').toLowerCase(); }
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allProducts, allCategories, searchTerm, selectedCategory, sortBy, sortOrder]);

    // Pagination uchun (o'zgarishsiz)
    const totalPages = Math.ceil(processedProducts.length / productsPerPage);
    const currentProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return processedProducts.slice(startIndex, startIndex + productsPerPage);
    }, [processedProducts, currentPage, productsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategory, productsPerPage]);

    // === MUHIM O'ZGARISH ===
    // Yordamchi funksiyalarni yangilaymiz.
    const formatPrice = (price) => new Intl.NumberFormat('uz-UZ').format(price || 0) + ' so\'m';

    // Rasm manzilini to'g'ri qaytaradigan funksiya
    const getImageUrl = (imagePath) => {
        // Agar bazadan to'liq URL (masalan, https://upcdn.io/...) kelsa,
        // o'sha URLni o'zini qaytaramiz.
        if (imagePath && imagePath.startsWith('http')) {
            return imagePath;
        }
        // Agar rasm bo'lmasa yoki eski formatda bo'lsa,
        // o'rniga qo'yiladigan "bo'sh rasm" manzilini qaytaramiz.
        return '/images/no-image.png'; // Bu fayl frontend/public/images papkasida bo'lishi kerak
    };

    const truncateText = (text, length = 50) => text && text.length > length ? `${text.substring(0, length)}...` : text;

    // RENDER QISMI (o'zgarishsiz)
    if (loading && !allProducts.length) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"></div></div>;
    if (error) return <div className="alert alert-danger mx-4">Xato: {error}</div>;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0"><i className="fas fa-box me-2"></i>Mahsulotlar ({processedProducts.length})</h1>
                <Link to="/products/new" className="btn btn-primary"><i className="fas fa-plus me-1"></i>Yangi mahsulot</Link>
            </div>

            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <div className="row g-3 align-items-center">
                        <div className="col-lg-4"><input type="text" placeholder="Qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" /></div>
                        <div className="col-lg-2">
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="form-select">
                                <option value="">Barcha kategoriyalar</option>
                                {(allCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div className="col-lg-2"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select"><option value="name">Nomi</option><option value="price">Narxi</option></select></div>
                        <div className="col-lg-2"><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="form-select"><option value="asc">O'sish</option><option value="desc">Kamayish</option></select></div>
                        <div className="col-lg-2"><div className="btn-group w-100"><button type="button" className={`btn btn-outline-primary ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><i className="fas fa-th"></i></button><button type="button" className={`btn btn-outline-primary ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><i className="fas fa-table"></i></button></div></div>
                    </div>
                </div>
            </div>

            {currentProducts.length === 0 ? (
                <div className="text-center py-5"><i className="fas fa-box-open fa-3x text-muted"></i><h4 className="mt-3">Mahsulotlar topilmadi</h4></div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="row g-4">
                            {currentProducts.map(p => (
                                <div key={p.id} className="col-xl-3 col-lg-4 col-md-6">
                                    <div className="card h-100 shadow-sm product-card-grid">
                                        {/* <img> tegi endi yangi funksiyani ishlatadi */}
                                        <img src={getImageUrl(p.image)} alt={p.name} className="card-img-top product-image-grid" onError={(e) => e.target.src = '/images/no-image.png'} />
                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title text-truncate" title={p.name}>{p.name}</h5>
                                            <p className="text-muted small mb-2"><i className="fas fa-tag me-1 text-primary"></i>{p.categoryName}</p>
                                            <p className="card-text small flex-grow-1">{truncateText(p.description, 80)}</p>
                                            <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                                                <span className="h5 text-primary fw-bold mb-0">{formatPrice(p.price)}</span>
                                                <div className="btn-group">
                                                    <Link to={`/products/edit/${p.id}`} className="btn btn-sm btn-outline-primary" title="Tahrirlash"><i className="fas fa-edit"></i></Link>
                                                    <button onClick={() => handleStatusChange(p.id, p.status)} className={`btn btn-sm btn-outline-${p.status === 'active' ? 'warning' : 'success'}`} title={p.status === 'active' ? 'Nofaol qilish' : 'Faol qilish'}><i className={`fas ${p.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                                                    <button onClick={() => handleDelete(p.id, p.name)} className="btn btn-sm btn-outline-danger" title="O'chirish"><i className="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0">
                            <thead><tr><th>Rasm</th><th>Nomi</th><th>Kategoriya</th><th>Narx</th><th>Status</th><th className="text-center">Amallar</th></tr></thead>
                            <tbody>{currentProducts.map(p => (
                                <tr key={p.id}>
                                    {/* <img> tegi endi yangi funksiyani ishlatadi */}
                                    <td><img src={getImageUrl(p.image)} alt={p.name} className="rounded" style={{ width: '50px', height: '50px', objectFit: 'cover' }} onError={(e) => e.target.src = '/images/no-image.png'} /></td>
                                    <td className="fw-medium">{p.name}</td>
                                    <td><span className="badge bg-primary-soft text-primary">{p.categoryName}</span></td>
                                    <td className="fw-medium text-success">{formatPrice(p.price)}</td>
                                    <td><span className={`badge rounded-pill bg-${p.status === 'active' ? 'success' : 'secondary'}-soft text-${p.status === 'active' ? 'success' : 'secondary'}`}>{p.status === 'active' ? 'Faol' : 'Nofaol'}</span></td>
                                    <td className="text-center"><div className="btn-group">
                                        <Link to={`/products/edit/${p.id}`} className="btn btn-sm btn-outline-primary" title="Tahrirlash"><i className="fas fa-edit"></i></Link>
                                        <button onClick={() => handleStatusChange(p.id, p.status)} className={`btn btn-sm btn-outline-${p.status === 'active' ? 'warning' : 'success'}`} title={p.status === 'active' ? 'Nofaol qilish' : 'Faol qilish'}><i className={`fas ${p.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                                        <button onClick={() => handleDelete(p.id, p.name)} className="btn btn-sm btn-outline-danger" title="O'chirish"><i className="fas fa-trash"></i></button>
                                    </div></td>
                                </tr>
                            ))}</tbody>
                        </table></div></div>
                    )}
                    <div className="mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} itemsPerPage={productsPerPage} totalItems={processedProducts.length} onItemsPerPageChange={(size) => setProductsPerPage(size)} /></div>
                </>
            )}
        </div>
    );
};

export default Products;
