import React, { useMemo } from 'react';
import { AppState, StudentStatus } from '../types';
import { DollarSign, Users, AlertTriangle, Clock, ArrowRight, TrendingUp, ShoppingBag, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  data: AppState;
  onChangeView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onChangeView }) => {
  const metrics = useMemo(() => {
    const totalRevenueCourses = data.students.reduce((acc, s) => 
      acc + s.history.reduce((sum, h) => sum + h.paid, 0), 0);
    
    const totalRevenueProducts = data.sales.reduce((acc, s) => acc + s.total, 0);
    
    const lowStockCount = data.products.filter(p => p.quantity <= p.minStock).length;
    
    const followUpsDue = data.students.filter(s => {
      if (!s.nextFollowUp) return false;
      const today = new Date().toISOString().split('T')[0];
      return s.nextFollowUp <= today && s.status !== StudentStatus.ALUMNI;
    }).length;

    return {
      revenue: totalRevenueCourses + totalRevenueProducts,
      revenueCourses: totalRevenueCourses,
      revenueProducts: totalRevenueProducts,
      lowStockCount,
      followUpsDue,
      activeStudents: data.students.filter(s => s.status === StudentStatus.ACTIVE).length,
      leads: data.students.filter(s => s.status === StudentStatus.INTERESTED).length
    };
  }, [data]);

  const recentActivity = useMemo(() => {
    const sales = data.sales.map(s => ({
      type: 'sale',
      date: s.date,
      title: 'Venda de Produtos',
      value: s.total,
      details: `${s.items.length} itens`
    }));

    const enrollments = data.students.flatMap(s => s.history.map(h => ({
      type: 'enrollment',
      date: h.date,
      title: `Matrícula: ${data.courses.find(c => c.id === h.courseId)?.name || 'Curso'}`,
      value: h.paid,
      details: s.name
    })));

    return [...sales, ...enrollments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [data]);

  const chartData = [
    { name: 'Cursos', value: metrics.revenueCourses, color: '#f43f5e' }, // rose-500
    { name: 'Produtos', value: metrics.revenueProducts, color: '#fbbf24' }, // amber-400
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Visão Geral</h2>
           <p className="text-sm text-gray-500 dark:text-dark-textMuted">Bem-vinda de volta! Aqui está o que está acontecendo na sua escola.</p>
        </div>
        <div className="text-sm text-gray-500 dark:text-dark-textMuted bg-white dark:bg-dark-surface px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-2">
          <Clock size={14} />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg shadow-primary-200/50 dark:shadow-none relative overflow-hidden group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 transform group-hover:scale-110 transition-transform">
             <DollarSign size={120} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign size={20} className="text-white" />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded text-white backdrop-blur-sm">Total</span>
          </div>
          <p className="text-sm opacity-90 mb-1 relative z-10">Receita Total</p>
          <h3 className="text-3xl font-bold relative z-10">{formatCurrency(metrics.revenue)}</h3>
        </div>

        <div 
          onClick={() => onChangeView('students')}
          className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            {metrics.followUpsDue > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-textMuted mb-1">Follow-ups Pendentes</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-dark-text">{metrics.followUpsDue}</h3>
        </div>

        <div 
           onClick={() => onChangeView('inventory')}
           className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            {metrics.lowStockCount > 0 && (
              <span className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded-full animate-pulse">Atenção</span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-textMuted mb-1">Estoque Baixo</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-dark-text">{metrics.lowStockCount} <span className="text-sm font-normal text-gray-400">itens</span></h3>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-textMuted mb-1">Pipeline de Vendas</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-dark-text">{metrics.leads}</h3>
            <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">Leads</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Revenue Mix */}
        <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text flex items-center gap-2">
                    <TrendingUp size={20} className="text-gray-400" /> Composição de Receita
                    </h3>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" className="dark:stroke-gray-700" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#9ca3af'}} width={80} axisLine={false} tickLine={false} />
                        <Tooltip 
                        cursor={{fill: 'rgba(0,0,0,0.05)'}}
                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#333' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} animationDuration={1500}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Right Column: Quick Actions & Feed */}
        <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-col">
            <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text mb-4">Ações Rápidas</h3>
            <div className="space-y-3 flex-1">
                <button 
                    onClick={() => onChangeView('students')}
                    className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-primary-50 dark:hover:bg-primary-900/20 group transition-colors border border-gray-100 dark:border-dark-border hover:border-primary-100 dark:hover:border-primary-800 flex items-center justify-between"
                >
                    <div>
                    <div className="font-medium text-gray-700 dark:text-dark-text group-hover:text-primary-700 dark:group-hover:text-primary-400">Cadastrar Nova Aluna</div>
                    <div className="text-xs text-gray-400 dark:text-dark-textMuted group-hover:text-primary-400">Registrar lead ou matrícula</div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500" />
                </button>

                <button 
                    onClick={() => onChangeView('inventory')}
                    className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-primary-50 dark:hover:bg-primary-900/20 group transition-colors border border-gray-100 dark:border-dark-border hover:border-primary-100 dark:hover:border-primary-800 flex items-center justify-between"
                >
                    <div>
                    <div className="font-medium text-gray-700 dark:text-dark-text group-hover:text-primary-700 dark:group-hover:text-primary-400">Registrar Venda</div>
                    <div className="text-xs text-gray-400 dark:text-dark-textMuted group-hover:text-primary-400">Saída de produto para aluna</div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500" />
                </button>

                {data.products.some(p => p.quantity <= p.minStock) && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl animate-in slide-in-from-bottom-2">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Reposição Necessária
                    </p>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                        {data.products.filter(p => p.quantity <= p.minStock).slice(0,3).map(p => (
                        <li key={p.id} className="flex justify-between">
                            <span>{p.name}</span>
                            <span className="font-bold">{p.quantity} un</span>
                        </li>
                        ))}
                    </ul>
                    </div>
                )}
            </div>
            </div>
            
            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
               <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text mb-4">Atividade Recente</h3>
               <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                      recentActivity.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                              <div className={`p-2 rounded-full shrink-0 ${item.type === 'sale' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                                  {item.type === 'sale' ? <ShoppingBag size={14} /> : <GraduationCap size={14} />}
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-dark-text leading-tight">{item.title}</p>
                                  <p className="text-xs text-gray-400 dark:text-dark-textMuted">{item.details} • {new Date(item.date).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="ml-auto text-sm font-bold text-gray-700 dark:text-gray-300">
                                  {formatCurrency(item.value)}
                              </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-sm text-gray-400 dark:text-dark-textMuted italic text-center">Nenhuma atividade recente.</p>
                  )}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;