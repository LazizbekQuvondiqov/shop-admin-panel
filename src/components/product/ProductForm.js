import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ProductForm = () => {
    const {
        categories: allCategories = [],
        products = [],
        addProduct,
        updateProduct,
        isLoading,
        refetchAll,
    } = useAppContext();

    const navigate = useNavigate();
    const { id: productId } = useParams();
    const isEditMode = Boolean(productId);

    // --- Har bir maydon uchun alohida state'lar ---
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('active');

    // Rasm uchun state'lar
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [existingImagePath, setExistingImagePath] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Tahrirlash rejimida ma'lumotlarni o'rnatish
    useEffect(() => {
        if (isEditMode && products.length > 0) {
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit) {
                setName(productToEdit.name || '');
                setCategoryId(productToEdit.categoryId || '');
                setPrice(productToEdit.price ? productToEdit.price.toString() : '');
                setDescription(productToEdit.description || '');
                setStatus(productToEdit.status || 'active');
                setExistingImagePath(productToEdit.image || '');
                if (productToEdit.image) {
                    const apiUrl = process.env.REACT_APP_API_URL.replace('/api', '');
                    setImagePreview(`${apiUrl}${productToEdit.image}`);
                }
            }
        }
    }, [productId, isEditMode, products]);

    // Fayl tanlanganda
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Fayl hajmini tekshirish (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, image: 'Fayl hajmi 5MB dan kichik bo\'lishi kerak.' }));
                return;
            }

            // Fayl turini tekshirish
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, image: 'Faqat rasm fayllari ruxsat etilgan.' }));
                return;
            }

            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setErrors(prev => {
                const { image, ...rest } = prev;
                return rest;
            });
        }
    };

    // Rasmni olib tashlash
    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
        setExistingImagePath('');
        const fileInput = document.getElementById('image');
        if (fileInput) fileInput.value = "";
    };

    // Validatsiya funksiyasi
    const validateForm = useCallback(() => {
        const newErrors = {};

        // Nom validatsiyasi
        if (!name || !name.trim()) {
            newErrors.name = 'Mahsulot nomi kiritilishi majburiy.';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Mahsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak.';
        }

        // Kategoriya validatsiyasi
        if (!categoryId || categoryId === '') {
            newErrors.categoryId = 'Kategoriya tanlanishi majburiy.';
        }

        // Narx validatsiyasi
        if (!price || price === '') {
            newErrors.price = 'Narx kiritilishi majburiy.';
        } else {
            const priceValue = parseFloat(price);
            if (isNaN(priceValue) || priceValue <= 0) {
                newErrors.price = 'Narx musbat son bo\'lishi kerak.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [name, categoryId, price]);

    // Formani yuborish
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // console.log('Form yuborilmoqda...', { name, categoryId, price, description, status }); // Debug

        if (!validateForm()) {
            console.log('Validatsiya xatosi:', errors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const payload = new FormData();

            // Majburiy maydonlarni qo'shish
            payload.append('name', name.trim());
            payload.append('categoryId', categoryId);
            payload.append('price', price);
            payload.append('description', description || '');
            payload.append('status', status);

            // Rasm bilan ishlash
            if (imageFile) {
                payload.append('image', imageFile);
            } else if (existingImagePath && !isEditMode) {
                // Yangi mahsulot yaratilayotganda mavjud rasm bo'lmaydi
            } else if (isEditMode) {
                payload.append('existingImage', existingImagePath || '');
            }

            // Debug: FormData ichidagi ma'lumotlarni ko'rish
            console.log('Payload tarkibi:');
            for (let [key, value] of payload.entries()) {
                console.log(`${key}:`, value);
            }

            let result;
            if (isEditMode) {
                result = await updateProduct(productId, payload);
            } else {
                result = await addProduct(payload);
            }

            console.log('Muvaffaqiyatli saqlandi:', result);

            // Ma'lumotlarni yangilash
            if (refetchAll) {
                await refetchAll();
            }

            // Muvaffaqiyatli sahifaga o'tish
            navigate('/products');

        } catch (error) {
            console.error("Saqlashda xatolik:", error);

            // Xatolik matnini aniqlash
            let errorMessage = 'Saqlashda noma\'lum xatolik yuz berdi.';

            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setErrors({ form: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }, [
        name, categoryId, price, description, status,
        imageFile, existingImagePath, isEditMode, productId,
        addProduct, updateProduct, navigate, refetchAll, validateForm, errors
    ]);

    // Agar ma'lumotlar yuklanayotgan bo'lsa
    if (isLoading && isEditMode && !name) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yuklanmoqda...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="card shadow-lg">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                        {isEditMode ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot Qo\'shish'}
                    </h4>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => navigate('/products')}
                        aria-label="Yopish"
                    ></button>
                </div>

                <div className="card-body p-4">
                    {errors.form && (
                        <div className="alert alert-danger" role="alert">
                            <strong>Xatolik!</strong> {errors.form}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row g-3">
                            {/* Mahsulot nomi */}
                            <div className="col-md-6">
                                <label htmlFor="name" className="form-label">
                                    Mahsulot nomi <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    placeholder="Mahsulot nomini kiriting..."
                                    required
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                            </div>

                            {/* Kategoriya */}
                            <div className="col-md-6">
                                <label htmlFor="categoryId" className="form-label">
                                    Kategoriya <span className="text-danger">*</span>
                                </label>
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                                    required
                                >
                                    <option value="">Kategoriyani tanlang...</option>
                                    {(allCategories || []).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.categoryId && <div className="invalid-feedback">{errors.categoryId}</div>}
                            </div>

                            {/* Narx */}
                            <div className="col-md-6">
                                <label htmlFor="price" className="form-label">
                                    Narx (so'm) <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                            </div>

                            {/* Status */}
                            <div className="col-md-6">
                                <label htmlFor="status" className="form-label">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="active">Faol</option>
                                    <option value="inactive">Nofaol</option>
                                </select>
                            </div>

                            {/* Tavsif */}
                            <div className="col-12">
                                <label htmlFor="description" className="form-label">Tavsif</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="form-control"
                                    rows="4"
                                    placeholder="Mahsulot haqida qo'shimcha ma'lumot..."
                                ></textarea>
                            </div>

                            {/* Rasm yuklash */}
                            <div className="col-12">
                                <label htmlFor="image" className="form-label">Mahsulot rasmi</label>
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                                />
                                {errors.image && <div className="invalid-feedback">{errors.image}</div>}

                                {imagePreview && (
                                    <div className='mt-3 position-relative d-inline-block'>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="img-thumbnail"
                                            style={{
                                                width: '200px',
                                                height: '200px',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                            title="Rasmni olib tashlash"
                                            style={{ transform: 'translate(25%, -25%)' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* Tugmalar */}
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/products')}
                                className="btn btn-outline-secondary"
                                disabled={isSubmitting}
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    isEditMode ? 'Yangilash' : 'Qo\'shish'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductForm;
