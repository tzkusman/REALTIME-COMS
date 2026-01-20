
import React, { useState, useEffect } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Product, CartItem, Category } from '../types';

interface StorefrontProps {
  supabase: SupabaseClient;
  user: User | null;
}

const Storefront: React.FC<StorefrontProps> = ({ supabase, user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: catData } = await supabase.from('categories').select('*');
    if (prodData) setProducts(prodData);
    if (catData) {
      setCategories(catData);
      if (catData.length > 0) setNewProduct(prev => ({ ...prev, category_id: catData[0].id }));
    }
    setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('products').insert([
      {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        image_url: newProduct.image_url,
        category_id: newProduct.category_id
      }
    ]).select();

    if (error) {
      alert("Error adding product: " + error.message);
    } else {
      setNewProduct({ name: '', description: '', price: '', stock: '', image_url: '', category_id: categories[0]?.id || '' });
      setIsAddProductOpen(false);
      fetchData();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-[#3ecf8e]/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#3ecf8e] rounded-lg flex items-center justify-center text-[#09090b]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.362 9.354H12V.396L2.638 14.646H12v8.958l9.362-14.25z" /></svg>
              </div>
              <span className="font-black text-xl tracking-tighter uppercase italic">LocalStore</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
              <button onClick={() => setSelectedCategory(null)} className={`hover:text-white transition-colors ${!selectedCategory ? 'text-[#3ecf8e]' : ''}`}>All Collection</button>
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`hover:text-white transition-colors ${selectedCategory === cat.id ? 'text-[#3ecf8e]' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black uppercase text-[#3ecf8e] tracking-widest leading-none">Logged in as</span>
              <span className="text-xs font-bold text-white leading-tight">{user?.user_metadata?.username || 'User'}</span>
            </div>
            <button 
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Product
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-400 hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#3ecf8e] text-[#09090b] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#09090b]">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3ecf8e]/10 to-transparent"></div>
        <div className="relative z-10 text-center space-y-6 px-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase italic">Local <span className="text-[#3ecf8e]">Catalog</span></h1>
          <p className="text-zinc-500 text-base md:text-lg font-medium">Add products to your local database and see them instantly reflected in your storefront.</p>
        </div>
      </section>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-bold tracking-tight uppercase tracking-widest">Inventory</h2>
          <div className="text-sm text-zinc-500 font-mono uppercase tracking-tighter">Listing {filteredProducts.length} items</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[4/5] bg-zinc-900 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map(product => (
              <div key={product.id} className="group relative">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 relative">
                  <img 
                    src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'} 
                    alt={product.name} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-white text-black py-4 rounded-2xl font-bold text-sm hover:bg-[#3ecf8e] hover:text-[#09090b] transition-colors"
                    >
                      ADD TO BAG
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">{product.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{product.description}</p>
                  </div>
                  <p className="text-lg font-mono text-[#3ecf8e]">${product.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddProductOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-[#111114] border border-white/10 rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold italic uppercase tracking-tighter">Add New Product</h2>
              <button onClick={() => setIsAddProductOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Product Name</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="e.g. Pixel Buds Pro"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 focus:border-[#3ecf8e] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Category</label>
                    <select 
                      value={newProduct.category_id}
                      onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 focus:border-[#3ecf8e] transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#09090b] text-white">{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Description</label>
                  <textarea 
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Short product highlight..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 focus:border-[#3ecf8e] transition-all resize-none h-24 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Price ($)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="99.99"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 focus:border-[#3ecf8e] transition-all text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Initial Stock</label>
                    <input 
                      required
                      type="number" 
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      placeholder="100"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 focus:border-[#3ecf8e] transition-all text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Image URL (Unsplash recommended)</label>
                  <input 
                    required
                    type="url" 
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 focus:border-[#3ecf8e] transition-all font-mono text-[11px] text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 transition-all text-white"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-[#3ecf8e] text-[#09090b] px-8 py-4 rounded-2xl font-black text-sm hover:bg-[#34b27b] transition-all shadow-xl shadow-[#3ecf8e]/20"
                >
                  SAVE TO LOCAL DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#111114] border-l border-white/5 flex flex-col shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-widest italic">Your Bag</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                  <svg className="w-16 h-16 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <p className="font-medium italic text-sm text-center">Your bag is as empty as a local db without migrations.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-white/5 overflow-hidden shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm uppercase">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-mono text-[#3ecf8e]">${item.price * item.quantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-[#09090b]">
              <div className="flex justify-between items-end mb-6">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Subtotal</span>
                <span className="text-2xl font-mono">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                disabled={cart.length === 0}
                className="w-full bg-[#3ecf8e] text-[#09090b] py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#34b27b] disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-[#3ecf8e]/10 active:scale-95"
              >
                SECURE CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Storefront;
