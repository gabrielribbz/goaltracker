import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit2, Check, X, Award, Bell, BellOff } from 'lucide-react';
import { useNotifications } from './useNotifications';

function GoalItem({ goal, onDelete, onUpdateTitle, onAddValue }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(goal.title);
  
  const [addAmount, setAddAmount] = useState('');

  const progress = goal.targetValue === 0 ? 0 : Math.min(((goal.currentValue / goal.targetValue) * 100), 100).toFixed(1);
  const isCompleted = goal.currentValue >= goal.targetValue;

  const handleTitleSubmit = () => {
    if (editTitleValue.trim()) {
      onUpdateTitle(goal.id, editTitleValue.trim());
    } else {
      setEditTitleValue(goal.title);
    }
    setIsEditingTitle(false);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const normalizedAmount = String(addAmount).replace(',', '.');
    const amount = parseFloat(normalizedAmount);
    if (!isNaN(amount) && amount > 0) {
      onAddValue(goal.id, amount);
      setAddAmount('');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className={`group/card relative flex flex-col sm:flex-row overflow-hidden rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-slate-800/80 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-[0_8px_40px_-8px_rgba(99,102,241,0.25)] ${isCompleted ? 'ring-2 ring-emerald-500/50 shadow-[0_0_30px_rgba(52,211,153,0.2)]' : ''}`}>
      
      <div className="relative h-48 sm:h-auto sm:w-64 shrink-0 overflow-hidden group">
        <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/50 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-gray-950/60 pointer-events-none" />
      </div>

      <div className="flex flex-col flex-1 p-6 relative min-w-0">
        <div className="flex justify-between items-start gap-2 mb-3">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                autoFocus
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setEditTitleValue(goal.title);
                  }
                }}
                className="w-full min-w-0 flex-1 bg-slate-800 border border-indigo-400/50 text-slate-100 px-3 py-1.5 rounded-md text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button onClick={handleTitleSubmit} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors"><Check size={18} /></button>
              <button onClick={() => { setIsEditingTitle(false); setEditTitleValue(goal.title); }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"><X size={18} /></button>
            </div>
          ) : (
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100 leading-tight group">
              {goal.title}
              <button className="text-slate-500 opacity-0 group-hover:opacity-100 hover:text-indigo-400 hover:bg-indigo-400/10 p-1 rounded-md transition-all shrink-0" onClick={() => setIsEditingTitle(true)} title="Editar nome">
                <Edit2 size={16} />
              </button>
            </h3>
          )}
          
          <button 
            className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-md transition-all opacity-0 group-hover/card:opacity-100 shrink-0" 
            onClick={() => onDelete(goal.id)}
            title="Excluir objetivo"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {isCompleted && (
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold mb-3 w-fit animate-bounce">
            <Award size={16} /> Objetivo Alcançado!
          </div>
        )}

        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2.5">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Atual</span>
              <span className="text-lg font-bold text-slate-100">{formatCurrency(goal.currentValue)}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Meta</span>
              <span className="text-lg font-bold text-indigo-400">{formatCurrency(goal.targetValue)}</span>
            </div>
          </div>
          
          <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${isCompleted ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`} 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
          
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm font-medium text-slate-400 whitespace-nowrap">{progress}% Concluído</span>
            
            {!isCompleted && (
              <form className="flex items-center bg-slate-900/50 border border-slate-700/50 rounded-md overflow-hidden transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50" onSubmit={handleAddSubmit}>
                <span className="text-slate-400 text-sm pl-2 font-semibold">R$</span>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={addAmount} 
                  onChange={(e) => setAddAmount(e.target.value)} 
                  placeholder="0,00"
                  className="bg-transparent border-none text-slate-200 w-[70px] px-2 py-1.5 text-sm focus:outline-none"
                />
                <button type="submit" className="bg-indigo-500/10 text-indigo-400 p-1.5 border-l border-slate-700/50 transition-colors hover:bg-indigo-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Adicionar valor" disabled={!addAmount}>
                  <Plus size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const fileInputRef = React.useRef(null);
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('goals');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: '1',
        title: 'Comprar um Carro Novo',
        currentValue: 15000,
        targetValue: 80000,
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
      },
      {
        id: '2',
        title: 'Viagem para o Japão',
        currentValue: 3000,
        targetValue: 12000,
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
      }
    ];
  });

  const [formData, setFormData] = useState({
    title: '',
    currentValue: '',
    targetValue: '',
    imageUrl: '',
  });

  const { isActive: notificationsActive, toggleNotifications, sendTestNotification } = useNotifications(goals);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetValue) return;

    const parseNumber = (val) => {
      if (!val) return 0;
      return parseFloat(String(val).replace(',', '.')) || 0;
    };

    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const newGoal = {
      id: generateId(),
      title: formData.title,
      currentValue: parseNumber(formData.currentValue),
      targetValue: parseNumber(formData.targetValue),
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800',
    };

    setGoals((prev) => [newGoal, ...prev]);
    setFormData({
      title: '',
      currentValue: '',
      targetValue: '',
      imageUrl: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress into JPEG to save space
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          setFormData((prev) => ({
            ...prev,
            imageUrl: dataUrl,
          }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const handleUpdateTitle = (id, newTitle) => {
    setGoals((prev) => prev.map(goal => 
      goal.id === id ? { ...goal, title: newTitle } : goal
    ));
  };

  const handleAddValue = (id, amount) => {
    setGoals((prev) => prev.map(goal => {
      if (goal.id === id) {
        return { ...goal, currentValue: goal.currentValue + amount };
      }
      return goal;
    }));
  };

  const sortedGoals = [...goals].sort((a, b) => {
    const aCompleted = a.currentValue >= a.targetValue;
    const bCompleted = b.currentValue >= b.targetValue;
    if (aCompleted && !bCompleted) return -1;
    if (!aCompleted && bCompleted) return 1;
    return 0;
  });

  return (
    <div 
      className="h-screen w-full relative overflow-hidden bg-gray-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      
      {/* Background elements */}
      <div className="fixed top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none mix-blend-screen" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-4 md:py-6 flex flex-col gap-4 md:gap-6 relative z-10 w-full h-full">
        
        <header className="flex flex-row md:flex-col items-center justify-between md:justify-start text-left md:text-center shrink-0">
          <div>
            <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight leading-tight md:mb-3">
              Tracker de Objetivos
            </h1>
            <p className="hidden md:block text-slate-400 text-lg font-medium max-w-xl mx-auto">
              Acompanhe suas metas e realize seus sonhos
            </p>
          </div>
          
          <div className="flex flex-row md:flex-col items-center gap-3 md:mt-5">
            <button
              className={`inline-flex items-center gap-2 p-2 md:px-5 md:py-2.5 rounded-full border text-sm font-medium transition-all duration-300 relative overflow-hidden ${notificationsActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)]' : 'bg-slate-900/60 backdrop-blur-md border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
              onClick={toggleNotifications}
              title={notificationsActive ? 'Lembretes ativos' : 'Ativar lembretes'}
            >
              {notificationsActive ? <Bell size={18} /> : <BellOff size={18} />}
              <span className="hidden md:inline">{notificationsActive ? 'Lembretes ativos' : 'Ativar lembretes'}</span>
              {notificationsActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1 hidden md:block" />}
            </button>

            {notificationsActive && (
              <button
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 bg-transparent border border-dashed border-slate-600 rounded-full text-slate-400 text-xs font-medium hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
                onClick={sendTestNotification}
              >
                🔔 Testar notificação
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 h-full items-start lg:items-stretch">
            <section className="bg-slate-900/65 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl lg:h-full lg:overflow-y-auto">
            <h2 className="text-xl font-bold mb-7 flex items-center gap-3 text-slate-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20">
                <Target size={20} className="text-indigo-400" />
              </div>
              Novo Objetivo
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-400 mb-2">Nome do Objetivo</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-200 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-600"
                  placeholder="Ex: Reserva de Emergência"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="currentValue" className="block text-sm font-semibold text-slate-400 mb-2">Valor Atual (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="currentValue"
                  name="currentValue"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-200 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-600"
                  placeholder="Ex: 1000,00"
                  value={formData.currentValue}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="targetValue" className="block text-sm font-semibold text-slate-400 mb-2">Valor Alvo (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="targetValue"
                  name="targetValue"
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-200 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-600"
                  placeholder="Ex: 50000,00"
                  value={formData.targetValue}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="imageFile" className="block text-sm font-semibold text-slate-400 mb-2">Imagem do Objetivo</label>
                <input
                  type="file"
                  id="imageFile"
                  name="imageFile"
                  accept="image/*"
                  ref={fileInputRef}
                  className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-200 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/15 file:text-indigo-400 hover:file:bg-indigo-500 hover:file:text-white file:transition-colors file:cursor-pointer"
                  onChange={handleImageUpload}
                />
                {formData.imageUrl && formData.imageUrl.startsWith('data:image') && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/50 relative">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                  </div>
                )}
              </div>

              <button type="submit" className="mt-4 w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.5)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 group shrink-0">
                <Plus size={20} className="transition-transform group-hover:rotate-90" />
                Adicionar Objetivo
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-6 lg:h-full lg:overflow-y-auto lg:pr-3">
            {sortedGoals.length === 0 ? (
              <div className="text-center p-16 bg-slate-900/40 backdrop-blur-md border border-dashed border-slate-700/50 rounded-3xl text-slate-500 flex flex-col items-center">
                <Target size={48} className="mb-4 opacity-30" />
                <h3 className="text-lg font-bold text-slate-300 mb-2">Nenhum objetivo registrado</h3>
                <p>Comece adicionando seu primeiro grande objetivo ao lado.</p>
              </div>
            ) : (
              sortedGoals.map((goal, index) => (
                <div key={goal.id}>
                  <GoalItem 
                    goal={goal} 
                    onDelete={handleDelete} 
                    onUpdateTitle={handleUpdateTitle}
                    onAddValue={handleAddValue}
                  />
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  </div>
);
}

export default App;
