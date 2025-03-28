import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Функциональный компонент Product с хуками
const Product = () => {
  const navigate = useNavigate();

  const [state, setState] = useState({
    selectedBranch: null,
    cart: [],
    branches: [],
    categories: [],
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    activeCategory: null,
    orderPlaced: false,
  });

  // Обновление состояния с помощью функции
  const updateState = (newState) => setState((prev) => ({ ...prev, ...newState }));

  // Загрузка данных с API
  const fetchData = useCallback(async (url, key, errorMessage) => {
    try {
      updateState({ loading: true, error: null });
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        updateState({ [key]: data });
      } else {
        updateState({ error: data.message || errorMessage });
      }
    } catch (err) {
      updateState({ error: `Ошибка сервера при загрузке ${key}` });
    } finally {
      updateState({ loading: false });
    }
  }, []);

  // Инициализация данных
  useEffect(() => {
    fetchData('https://nukesul-boood-2ab7.twc1.net/api/public/branches/', 'branches', 'Ошибка загрузки филиалов');
    fetchData('https://nukesul-boood-2ab7.twc1.net/api/public/categories/', 'categories', 'Ошибка загрузки категорий');
    fetchData('https://nukesul-boood-2ab7.twc1.net/api/public/products/', 'products', 'Ошибка загрузки продуктов');

    const savedCart = localStorage.getItem('cart');
    if (savedCart) updateState({ cart: JSON.parse(savedCart) });

    const orderPlaced = localStorage.getItem('orderPlaced') === 'true';
    updateState({ orderPlaced });

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchData]);

  // Сохранение корзины в localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // Обработчики
  const selectBranch = (branch) => updateState({ selectedBranch: branch });
  const openModal = (product) => updateState({ selectedProduct: product });
  const closeModal = () => updateState({ selectedProduct: null });

  const addToCart = (size) => {
    const { selectedProduct, cart } = state;
    const cartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      size,
      price: selectedProduct[`${size}_price`] || selectedProduct.price,
      image: selectedProduct.image,
    };
    updateState({ cart: [...cart, cartItem], selectedProduct: null });
  };

  const getCartSummary = () => {
    const totalItems = state.cart.length;
    const totalPrice = state.cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return { totalItems, totalPrice };
  };

  const scrollToCategory = (categoryId) => {
    updateState({ activeCategory: categoryId });
    const element = document.getElementById(`category-${categoryId}`);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const { categories, activeCategory } = state;
    let currentCategory = null;

    for (const category of categories) {
      const element = document.getElementById(`category-${category.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentCategory = category.id;
          break;
        }
      }
    }

    if (currentCategory !== activeCategory) updateState({ activeCategory: currentCategory });
  };

  const goToCheckout = () => navigate('/checkout');

  // Рендеринг
  const { selectedBranch, selectedProduct, cart, branches, categories, products, loading, error, activeCategory, orderPlaced } = state;
  const { totalItems, totalPrice } = getCartSummary();

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Выберите филиал</h1>
          {loading && <p className="text-center text-gray-600">Загрузка...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => selectBranch(branch)}
                className="bg-white rounded-xl shadow-lg p-6 text-left hover:bg-orange-500 hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                <h2 className="text-xl font-semibold">{branch.name}</h2>
                <p className="text-gray-600 group-hover:text-white">{branch.address}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Информация о филиале */}
      <div className="text-center mb-6">
        <p className="text-gray-700">
          Филиал: {selectedBranch.name}, {selectedBranch.address}
        </p>
        {!orderPlaced && (
          <button
            onClick={() => updateState({ selectedBranch: null })}
            className="text-orange-500 hover:underline text-sm"
          >
            Сменить филиал
          </button>
        )}
      </div>

      {/* Фиксированное меню категорий */}
      <div className="sticky top-0 bg-white shadow-lg z-20 py-4">
        <div className="max-w-[1250px] mx-auto px-4 flex justify-center space-x-6 overflow-x-auto">
          {categories.map((category) => {
            const categoryProducts = products.filter(
              (product) => product.subcategory.category.id === category.id && product.branch.id === selectedBranch.id
            );
            if (categoryProducts.length === 0) return null;

            return (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`relative text-lg font-semibold transition-all duration-300 whitespace-nowrap px-4 py-2 rounded-full group ${
                  activeCategory === category.id ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'
                }`}
              >
                <span className="flex items-center">
                  {category.emoji && <span className="mr-2 text-xl">{category.emoji}</span>}
                  <span className="relative">
                    {category.name}
                    <span
                      className={`absolute bottom-0 left-0 h-1 bg-orange-500 rounded-full transition-all duration-300 ${
                        activeCategory === category.id ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Секции категорий и товаров */}
      <div className="max-w-[1250px] mx-auto px-4 pt-8">
        {loading && <p className="text-center text-gray-600">Загрузка...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && categories.length === 0 && (
          <p className="text-center text-gray-600">Категории не найдены</p>
        )}
        {!loading &&
          !error &&
          categories.map((category) => {
            const categoryProducts = products.filter(
              (product) => product.subcategory.category.id === category.id && product.branch.id === selectedBranch.id
            );
            if (categoryProducts.length === 0) return null;

            return (
              <div key={category.id} id={`category-${category.id}`} className="mb-16">
                <h2
                  className="text-4xl font-bold text-white mb-10 text-center relative animate-fadeIn"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  <span
                    className="inline-block px-8 py-3 rounded-lg relative z-10"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(255, 147, 0, 0) 0%, rgba(255, 147, 0, 0.7) 5%, rgba(255, 147, 0, 1) 20%, rgba(255, 147, 0, 1) 80%, rgba(255, 147, 0, 0.7) 95%, rgba(255, 147, 0, 0) 100%)',
                      textShadow: '4px 4px 8px rgba(0, 0, 0, 0.5)',
                      letterSpacing: '2px',
                    }}
                  >
                    {category.name} {category.emoji || ''}
                  </span>
                  <span
                    className="absolute inset-0 z-0"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(255, 147, 0, 0) 0%, rgba(255, 147, 0, 0.5) 10%, rgba(255, 147, 0, 0.8) 50%, rgba(255, 147, 0, 0.5) 90%, rgba(255, 147, 0, 0) 100%)',
                      filter: 'blur(8px)',
                      transform: 'scale(1.15)',
                    }}
                  />
                  <span
                    className="absolute inset-0 z-0"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(255, 147, 0, 0) 0%, rgba(255, 147, 0, 0.3) 15%, rgba(255, 147, 0, 0.6) 50%, rgba(255, 147, 0, 0.3) 85%, rgba(255, 147, 0, 0) 100%)',
                      filter: 'blur(12px)',
                      transform: 'scale(1.2)',
                    }}
                  />
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
                    >
                      <div className="relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-56 object-cover"
                          onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found')}
                        />
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          Новинка
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          от {product.small_price || product.price || 'Не указана'} сом
                        </p>
                        <button
                          onClick={() => openModal(product)}
                          className="mt-4 w-full bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 transition-colors duration-300 font-semibold"
                        >
                          Выбрать
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Модальное окно */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-40 object-cover rounded-t-xl mb-4"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found')}
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{selectedProduct.name}</h2>
            <div className="space-y-3">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => addToCart(size)}
                  className="w-full bg-gray-100 p-3 rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-300 flex justify-between items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedProduct[`${size}_price`]}
                >
                  <span className="capitalize">
                    {size === 'small' ? 'Маленькая' : size === 'medium' ? 'Средняя' : 'Большая'}
                  </span>
                  <span>
                    {selectedProduct[`${size}_price`] ? `${selectedProduct[`${size}_price`]} сом` : 'Недоступно'}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={closeModal}
              className="mt-4 w-full text-gray-500 hover:text-orange-500 transition-colors duration-300 font-medium"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Корзина */}
      {cart.length > 0 && (
        <button
          onClick={goToCheckout}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-6"
        >
          <div className="flex items-center">
            <span className="font-semibold text-lg">🛒 Заказов:</span>
            <span className="ml-2 text-lg">{totalItems}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-lg">Сумма:</span>
            <span className="ml-2 text-lg">{totalPrice} сом</span>
          </div>
        </button>
      )}

      {/* Стили */}
      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Product;