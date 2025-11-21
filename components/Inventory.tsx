import React, { useState } from 'react';
import { Product, Student } from '../types';
import { Search, ShoppingCart, AlertTriangle, Plus, Minus, Tag } from 'lucide-react';
import { ToastType } from './Toast';

interface InventoryProps {
  products: Product[];
  students: Student[];
  onUpdateStock: (id: string, qty: number) => void;
  onRecordSale: (studentId: string, items: {productId: string, qty: number}[], discount: number) => void;
  onShowToast: (message: string, type: ToastType) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, students, onUpdateStock, onRecordSale, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{productId: string, qty: number}[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [discount, setDiscount] = useState<string>('');

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
        onShowToast(`Produto ${product.name} sem estoque!`, 'error');
        return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.qty >= product.quantity) {
             onShowToast('Quantidade máxima em estoque atingida no carrinho.', 'info');
             return prev; 
        }
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId: product.id, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const cartSubtotal = cart.reduce((acc, item) => {
    const prod = products.find(p => p.id === item.productId);
    return acc + (prod ? prod.sellPrice * item.qty : 0);
  }, 0);

  const discountValue = parseFloat(discount) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountValue);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    onRecordSale(selectedStudent || 'walk-in', cart, discountValue);
    setCart([]);
    setSelectedStudent('');
    setDiscount('');
    onShowToast(`Venda realizada com sucesso! Total: ${formatCurrency(cartTotal)}`, 'success');
  };

  return (
    <div className="pb-20 md:pb-0 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] animate-fade-in">
      
      {/* Product List (Left 2/3) */}
      <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Estoque de Produtos</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-200 w-64"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-dark-textMuted text-xs uppercase sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold rounded-tl-2xl">Produto</th>
                <th className="p-4 font-semibold">Preço Venda</th>
                <th className="p-4 font-semibold">Estoque</th>
                <th className="p-4 font-semibold text-right rounded-tr-2xl">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="font-medium text-gray-800 dark:text-dark-text">{product.name}</div>
                    {product.quantity <= product.minStock && (
                      <div className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                        <AlertTriangle size={12} /> Estoque Baixo
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-dark-textMuted">{formatCurrency(product.sellPrice)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      product.quantity === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      product.quantity <= product.minStock ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {product.quantity} un
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.quantity === 0}
                      className="bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                    >
                      + Vender
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Point of Sale (Right 1/3) */}
      <div className="lg:col-span-1 bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-100 dark:border-dark-border flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> Caixa Rápido</h3>
          <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">{cart.length} itens</span>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-white/5 shrink-0">
          <select 
            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-sm focus:outline-none focus:border-primary-400 bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text shadow-sm"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Venda Avulsa (Balcão)</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-dark-textMuted space-y-3">
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-full">
                 <ShoppingCart size={40} className="opacity-50"/>
              </div>
              <p className="text-sm font-medium">Seu carrinho está vazio</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const prod = products.find(p => p.id === item.productId);
              if (!prod) return null;
              return (
                <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-dark-border hover:border-primary-200 transition-colors">
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-dark-text line-clamp-1">{prod.name}</div>
                    <div className="text-xs text-gray-500 dark:text-dark-textMuted mt-0.5">{item.qty}x {formatCurrency(prod.sellPrice)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="font-bold text-sm text-primary-700 dark:text-primary-400">{formatCurrency(prod.sellPrice * item.qty)}</span>
                     <button onClick={() => removeFromCart(item.productId)} className="text-gray-400 hover:text-red-500 p-1 transition-colors"><Minus size={16}/></button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-dark-border space-y-4 shrink-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-dark-textMuted font-medium">Subtotal</span>
            <span className="font-bold text-gray-700 dark:text-dark-text">{formatCurrency(cartSubtotal)}</span>
          </div>

          <div className="flex items-center gap-2">
             <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl flex items-center px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                <Tag size={16} className="text-gray-400 mr-2"/>
                <input 
                  type="number" 
                  placeholder="Desconto (R$)" 
                  className="w-full text-sm outline-none bg-transparent text-gray-800 dark:text-dark-text"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                />
             </div>
          </div>

          <div className="flex justify-between items-end pt-2 border-t border-gray-200 dark:border-dark-border">
            <span className="text-gray-600 dark:text-dark-textMuted font-bold">Total Final</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-dark-text">{formatCurrency(cartTotal)}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:shadow-none"
          >
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inventory;