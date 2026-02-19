
import React, { useState } from 'react';
import { LayoutDashboard, Users, GraduationCap, Package, Calendar, FileEdit, Sparkles, Moon, Sun, Kanban, MessageSquareText, ChevronDown, ChevronRight, UserCircle, CreditCard, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { View, Theme } from '../types';

interface NavigationProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentTheme: Theme;
  logoUrl?: string;
  toggleTheme: () => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setCurrentView, currentTheme, logoUrl, toggleTheme, onLogout }) => {
  // State to control expanded submenus
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['students-group']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  // Menu Structure
  const navStructure = [
    { 
      type: 'item', 
      id: 'dashboard', 
      label: 'Painel', 
      icon: LayoutDashboard 
    },
    { 
      type: 'item', 
      id: 'agenda', 
      label: 'Agenda', 
      icon: Calendar 
    },
    { 
      type: 'group', 
      id: 'students-group', 
      label: 'Gestão de Alunas', 
      icon: Users,
      children: [
        { id: 'students', label: 'Lista de Alunas', icon: UserCircle },
        { id: 'pipeline', label: 'Funil de Contatos', icon: Kanban }
      ]
    },
    { 
      type: 'item', 
      id: 'courses', 
      label: 'Cursos', 
      icon: GraduationCap 
    },
    { 
      type: 'item', 
      id: 'inventory', 
      label: 'Estoque', 
      icon: Package 
    },
    { 
      type: 'item', 
      id: 'payments', 
      label: 'Pagamentos', 
      icon: CreditCard 
    },
    { 
      type: 'item', 
      id: 'messages', 
      label: 'Mensagens', 
      icon: MessageSquareText 
    },
    { 
      type: 'item', 
      id: 'form-builder', 
      label: 'Formulário', 
      icon: FileEdit 
    },
    { 
      type: 'item', 
      id: 'settings', 
      label: 'Configurações', 
      icon: SettingsIcon 
    },
  ];

  // Helper to flatten items for mobile
  const mobileNavItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'students', label: 'Alunas', icon: Users },
    { id: 'payments', label: 'Pagar', icon: CreditCard },
    { id: 'courses', label: 'Cursos', icon: GraduationCap },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white dark:bg-dark-surface border-r border-gray-100 dark:border-dark-border h-screen fixed left-0 top-0 z-20 shadow-lg transition-colors duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-dark-border">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
          ) : (
            <div className="bg-primary-500 p-2 rounded-lg shadow-md">
              <Sparkles className="text-white w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg text-gray-800 dark:text-dark-text tracking-tight">Sistema Unic</h1>
            <p className="text-xs text-primary-500 font-medium">Gestão Escolar</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navStructure.map((item: any) => {
            if (item.type === 'group') {
              const isExpanded = expandedGroups.includes(item.id);
              const isActiveGroup = item.children.some((child: any) => child.id === currentView);
              
              return (
                <div key={item.id} className="mb-2">
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActiveGroup
                        ? 'text-primary-700 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10 font-semibold' 
                        : 'text-gray-600 dark:text-dark-textMuted hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className={isActiveGroup ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'} />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-gray-100 dark:border-dark-border space-y-1">
                      {item.children.map((child: any) => {
                        const isChildActive = currentView === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => setCurrentView(child.id as View)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                              isChildActive 
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' 
                                : 'text-gray-500 dark:text-dark-textMuted hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <child.icon size={18} className={isChildActive ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'} />
                            {child.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const Icon = item.icon;
              if (!Icon) return null;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold shadow-sm border border-primary-100 dark:border-primary-800' 
                      : 'text-gray-600 dark:text-dark-textMuted hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'} />
                  {item.label}
                </button>
              );
            }
          })}
        </nav>

        <div className="p-4 space-y-2">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-textMuted hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
           >
             {currentTheme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}
             <span className="text-xs font-medium">{currentTheme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
           </button>
           
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
           >
             <LogOut size={16}/>
             <span className="text-xs font-bold">Sair</span>
           </button>
           
           <p className="text-center text-[10px] text-gray-400 mt-2">Versão 1.8.0</p>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 px-2 py-2 pb-safe">
        <div className="flex justify-around items-center overflow-x-auto no-scrollbar">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-colors ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-dark-textMuted'
                }`}
              >
                <div className={`${isActive ? 'bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-full mb-1' : 'mb-1'}`}>
                   <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          <button onClick={toggleTheme} className="p-2 text-gray-400 dark:text-dark-textMuted min-w-[60px] flex flex-col items-center">
             {currentTheme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
             <span className="text-[10px] font-medium mt-1">Tema</span>
          </button>
          <button onClick={onLogout} className="p-2 text-red-400 min-w-[60px] flex flex-col items-center">
             <LogOut size={20}/>
             <span className="text-[10px] font-medium mt-1">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Navigation;
