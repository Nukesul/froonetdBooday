import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Product = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    phase: 'branches', // branches -> loading -> content
    branches: [],
    selectedBranch: null,
    products: [],
    cart: [],
    selectedProduct: null,
    loading: false,
    error: null,
  });

  const updateState = (newState) => {
    console.log('🔄 Обновление состояния:', newState);
    setState(prev => ({ ...prev, ...newState }));
  };

  const fetchData = async (url, key) => {
    console.log(`🌐 Загрузка ${key} с ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Ошибка HTTP ${response.status}`);
      const data = await response.json();
      console.log(`✅ Успешно загружено ${key}:`, data);
      return Array.isArray(data) ? data : data.results || [];
    } catch (err) {
      console.error(`❌ Ошибка загрузки ${key}:`, err.message);
      throw err;
    }
  };

  useEffect(() => {
    console.log('🏁 Компонент инициализирован');
    const loadBranches = async () => {
      updateState({ loading: true });
      try {
        const branches = await fetchData(
          'https://nukesul-boood-2ab7.twc1.net/api/public/branches/',
          'филиалов'
        );
        updateState({ branches, loading: false });
      } catch (err) {
        updateState({
          error: 'Не удалось загрузить филиалы. Проверьте подключение.',
          loading: false,
        });
      }
    };
    loadBranches();
  }, []);

  const handleBranchSelect = async (branch) => {
    console.log('🏢 Выбран филиал:', branch);
    updateState({
      selectedBranch: branch,
      phase: 'loading',
      loading: true,
      error: null,
    });

    try {
      const products = await fetchData(
        'https://nukesul-boood-2ab7.twc1.net/api/public/products/',
        'продуктов'
      );

      if (!products.length) {
        throw new Error('Продукты не найдены.');
      }

      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];

      updateState({
        products: products.filter(p => p.branch === branch.id), // Фильтр по филиалу
        cart,
        phase: 'content',
        loading: false,
      });
    } catch (err) {
      updateState({
        error: err.message || 'Ошибка загрузки продуктов.',
        phase: 'branches',
        selectedBranch: null,
        loading: false,
      });
    }
  };

  const addToCart = (size) => {
    const { selectedProduct, cart } = state;
    if (!selectedProduct) return;

    const price = selectedProduct[`${size}_price`] || selectedProduct.price || 0;
    const cartItem = {
      id: `${selectedProduct.id}-${size}`,
      name: selectedProduct.name,
      size,
      price,
      image: selectedProduct.image,
    };

    const newCart = [...cart, cartItem];
    updateState({ cart: newCart, selectedProduct: null });
    localStorage.setItem('cart', JSON.stringify(newCart));
    console.log('🛒 Добавлено в корзину:', cartItem);
  };

  const goToCheckout = () => {
    console.log('➡️ Переход к оформлению');
    navigate('/checkout');
  };

  const { phase, branches, selectedBranch, products, cart, selectedProduct, loading, error } = state;
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  // Экран выбора филиалов
  if (phase === 'branches') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-5xl font-extrabold text-white mb-12 animate-bounce">
            Выберите филиал
          </h1>

          {loading && (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
            </div>
          )}

          {error && (
            <p className="text-white bg-red-500/80 p-4 rounded-lg mb-6 animate-fade-in">
              {error}
            </p>
          )}

          {!loading && !error && branches.length === 0 && (
            <p className="text-white text-xl animate-fade-in">
              Филиалы не найдены
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => handleBranchSelect(branch)}
                className="relative bg-white/95 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {branch.name || 'Без названия'}
                </h2>
                <p className="text-gray-600">
                  {branch.address || 'Адрес не указан'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Экран загрузки
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-r-4 border-white mb-6"></div>
          <p className="text-2xl font-semibold animate-pulse">
            Загружаем меню...
          </p>
        </div>
      </div>
    );
  }

  // Основной контент
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-lg p-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedBranch?.name || 'Филиал'}
            </h2>
            <p className="text-sm text-gray-600">
              {selectedBranch?.address || 'Адрес'}
            </p>
            <button
              onClick={() => updateState({ phase: 'branches', selectedBranch: null })}
              className="text-indigo-500 hover:underline text-sm"
            >
              Сменить филиал
            </button>
          </div>
          {cart.length > 0 && (
            <button
              onClick={goToCheckout}
              className="bg-indigo-500 text-white px-6 py-2 rounded-full hover:bg-indigo-600 transition-all flex items-center space-x-2 shadow-md"
            >
              <span>🛒</span>
              <span>{cart.length} | {totalPrice.toFixed(2)} сом</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {error && (
          <p className="text-center text-red-500 mb-6 animate-fade-in">
            {error}
          </p>
        )}
        {products.length === 0 && !error && (
          <p className="text-center text-gray-600 text-lg animate-fade-in">
            Продукты не найдены
          </p>
        )}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <img
                src={product.image || 'https://via.placeholder.com/300'}
                alt={product.name || 'Без названия'}
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                onError={e => (e.target.src = 'https://via.placeholder.com/300')}
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {product.name || 'Без названия'}
                </h3>
                <p className="text-gray-600 mt-1">
                  от {product.small_price || product.price || 0} сом
                </p>
                <button
                  onClick={() => updateState({ selectedProduct: product })}
                  className="mt-3 w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-all shadow-sm"
                >
                  Выбрать
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-md w-full m-4 shadow-2xl">
            <img
              src={selectedProduct.image || 'https://via.placeholder.com/300'}
              alt={selectedProduct.name || 'Без названия'}
              className="w-full h-40 object-cover rounded-t-xl mb-4"
              onError={e => (e.target.src = 'https://via.placeholder.com/300')}
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedProduct.name || 'Без названия'}
            </h3>
            <div className="space-y-3">
              {['small', 'medium', 'large'].map(size => {
                const price = selectedProduct[`${size}_price`];
                return (
                  <button
                    key={size}
                    onClick={() => addToCart(size)}
                    disabled={!price}
                    className="w-full bg-gray-100 p-3 rounded-lg hover:bg-indigo-500 hover:text-white transition-all flex justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="capitalize">
                      {size === 'small' ? 'Маленький' : size === 'medium' ? 'Средний' : 'Большой'}
                    </span>
                    <span>{price ? `${price} сом` : 'Нет'}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => updateState({ selectedProduct: null })}
              className="mt-4 w-full text-indigo-500 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;

// Стили
const styles = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-bounce {
    animation: bounce 2s infinite;
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
  .animate-pulse {
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

// Добавляем стили в документ
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);