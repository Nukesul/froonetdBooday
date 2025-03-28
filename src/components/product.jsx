import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
    phase: 'branches', // branches -> loading -> content
  });

  const updateState = (newState) => {
    console.log('🔄 State update:', newState);
    setState(prev => ({ ...prev, ...newState }));
  };

  const fetchData = useCallback(async (url, key) => {
    console.log(`🌐 Fetching ${key} from ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log(`✅ Fetched ${key}:`, data);
      return data;
    } catch (err) {
      console.error(`❌ Fetch ${key} failed:`, err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    console.log('🏁 Component mounted');
    const loadBranches = async () => {
      updateState({ loading: true });
      try {
        const branches = await fetchData(
          'https://nukesul-boood-2ab7.twc1.net/api/public/branches/', 
          'branches'
        );
        updateState({ branches, loading: false });
      } catch (err) {
        updateState({ 
          error: 'Не удалось загрузить филиалы', 
          loading: false 
        });
      }
    };
    
    loadBranches();
    return () => console.log('🏁 Component unmounted');
  }, [fetchData]);

  const selectBranch = async (branch) => {
    console.log('🏢 Selected branch:', branch);
    updateState({ 
      selectedBranch: branch, 
      phase: 'loading',
      loading: true 
    });

    try {
      const [categories, products] = await Promise.all([
        fetchData('https://nukesul-boood-2ab7.twc1.net/api/public/categories/', 'categories'),
        fetchData('https://nukesul-boood-2ab7.twc1.net/api/public/products/', 'products')
      ]);
      
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        updateState({ cart: JSON.parse(savedCart) });
      }

      updateState({
        categories,
        products,
        phase: 'content',
        loading: false
      });
    } catch (err) {
      updateState({
        error: 'Ошибка загрузки данных',
        phase: 'branches',
        selectedBranch: null,
        loading: false
      });
    }
  };

  const addToCart = (size) => {
    const { selectedProduct, cart } = state;
    if (!selectedProduct) return;
    
    const cartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      size,
      price: selectedProduct[`${size}_price`] || selectedProduct.price,
      image: selectedProduct.image,
    };
    
    const newCart = [...cart, cartItem];
    updateState({ cart: newCart, selectedProduct: null });
    localStorage.setItem('cart', JSON.stringify(newCart));
    console.log('🛒 Added to cart:', cartItem);
  };

  const goToCheckout = () => {
    console.log('➡️ Going to checkout');
    navigate('/checkout');
  };

  const { selectedBranch, cart, branches, categories, products, selectedProduct, loading, error, phase } = state;
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  // Экран выбора филиалов
  if (phase === 'branches') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <h1 className="text-5xl font-extrabold text-white text-center mb-12 animate-bounceIn">
            Выберите свой филиал
          </h1>
          
          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-white"></div>
            </div>
          )}
          
          {error && (
            <p className="text-center text-white bg-red-500/80 p-4 rounded-lg mb-6 animate-fadeIn">
              {error}
            </p>
          )}
          
          {!loading && !error && branches.length === 0 && (
            <p className="text-center text-white text-xl animate-fadeIn">
              Филиалы не найдены
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => selectBranch(branch)}
                className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-r-4 border-white mb-6"></div>
          <p className="text-2xl font-semibold animate-pulse">
            Загружаем вкусности...
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
              {selectedBranch.name}
            </h2>
            <p className="text-sm text-gray-600">
              {selectedBranch.address}
            </p>
            <button
              onClick={() => updateState({ phase: 'branches', selectedBranch: null })}
              className="text-orange-500 hover:underline text-sm"
            >
              Сменить филиал
            </button>
          </div>
          {cart.length > 0 && (
            <button
              onClick={goToCheckout}
              className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-all flex items-center space-x-2"
            >
              <span>🛒</span>
              <span>{cart.length} | {totalPrice} сом</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {categories.map(category => {
          const categoryProducts = products.filter(
            p => p.subcategory?.category?.id === category.id && p.branch?.id === selectedBranch.id
          );
          if (!categoryProducts.length) return null;

          return (
            <section key={category.id} className="mb-12 animate-fadeIn">
              <h2 className="text-3xl font-bold text-orange-500 mb-6">
                {category.name} {category.emoji}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <img
                      src={product.image || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {product.name}
                      </h3>
                      <p className="text-gray-600">
                        от {product.small_price || product.price || 0} сом
                      </p>
                      <button
                        onClick={() => updateState({ selectedProduct: product })}
                        className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-all"
                      >
                        Выбрать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-md w-full m-4">
            <img
              src={selectedProduct.image || 'https://via.placeholder.com/300'}
              alt={selectedProduct.name}
              className="w-full h-40 object-cover rounded-t-xl mb-4"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedProduct.name}
            </h3>
            <div className="space-y-3">
              {['small', 'medium', 'large'].map(size => {
                const price = selectedProduct[`${size}_price`];
                return (
                  <button
                    key={size}
                    onClick={() => addToCart(size)}
                    disabled={!price}
                    className="w-full bg-gray-100 p-3 rounded-lg hover:bg-orange-500 hover:text-white transition-all flex justify-between disabled:opacity-50"
                  >
                    <span className="capitalize">{size}</span>
                    <span>{price ? `${price} сом` : 'Нет'}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => updateState({ selectedProduct: null })}
              className="mt-4 w-full text-orange-500 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-bounceIn {
          animation: bounceIn 1s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Product;