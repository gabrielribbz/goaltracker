import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit2, Check, X, Award } from 'lucide-react';
import './App.css';

// Componente para cada objetivo na lista
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
      setEditTitleValue(goal.title); // revert if empty
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
    <div className={`goal-card ${isCompleted ? 'goal-completed' : ''}`}>
      <img src={goal.imageUrl} alt={goal.title} className="goal-image" loading="lazy" />
      <div className="goal-content">
        <div className="goal-header">
          {isEditingTitle ? (
            <div className="title-edit-container">
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
                className="title-edit-input"
              />
              <button onClick={handleTitleSubmit} className="btn-icon success"><Check size={18} /></button>
              <button onClick={() => { setIsEditingTitle(false); setEditTitleValue(goal.title); }} className="btn-icon danger"><X size={18} /></button>
            </div>
          ) : (
            <h3 className="goal-title">
              {goal.title}
              <button className="edit-pen" onClick={() => setIsEditingTitle(true)} title="Editar nome">
                <Edit2 size={16} />
              </button>
            </h3>
          )}
          
          <button 
            className="goal-delete" 
            onClick={() => onDelete(goal.id)}
            title="Excluir objetivo"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {isCompleted && (
          <div className="completed-badge">
            <Award size={16} /> Objetivo Alcançado!
          </div>
        )}

        <div className="progress-section">
          <div className="progress-stats">
            <div className="stat-block">
              <span className="stat-label">Atual</span>
              <span className="stat-value">{formatCurrency(goal.currentValue)}</span>
            </div>
            <div className="stat-block" style={{ textAlign: 'right' }}>
              <span className="stat-label">Meta</span>
              <span className="stat-value accent">{formatCurrency(goal.targetValue)}</span>
            </div>
          </div>
          
          <div className="progress-track">
            <div 
              className={`progress-fill ${isCompleted ? 'completed-fill' : ''}`} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-footer">
            <span className="progress-text">{progress}% Concluído</span>
            
            {!isCompleted && (
              <form className="add-value-form" onSubmit={handleAddSubmit}>
                <span className="currency-symbol">R$</span>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={addAmount} 
                  onChange={(e) => setAddAmount(e.target.value)} 
                  placeholder="0,00"
                  className="add-value-input"
                />
                <button type="submit" className="add-value-btn" title="Adicionar valor" disabled={!addAmount}>
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

    const newGoal = {
      id: crypto.randomUUID(),
      title: formData.title,
      currentValue: parseNumber(formData.currentValue),
      targetValue: parseNumber(formData.targetValue),
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800', // Default money/goal image
    };

    setGoals((prev) => [newGoal, ...prev]);
    setFormData({
      title: '',
      currentValue: '',
      targetValue: '',
      imageUrl: '',
    });
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
    <div className="app-container">
      <header className="header">
        <h1>Tracker de Objetivos</h1>
        <p>Acompanhe suas metas e realize seus sonhos</p>
      </header>

      <main className="main-content">
        <section className="glass-panel">
          <h2>
            <Target className="icon" size={24} color="var(--accent-primary)" />
            Novo Objetivo
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Nome do Objetivo</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-input"
                placeholder="Ex: Reserva de Emergência"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentValue">Valor Atual (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                id="currentValue"
                name="currentValue"
                className="form-input"
                placeholder="Ex: 1000,00"
                value={formData.currentValue}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="targetValue">Valor Alvo (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                id="targetValue"
                name="targetValue"
                className="form-input"
                placeholder="Ex: 50000,00"
                value={formData.targetValue}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="imageUrl">URL da Imagem</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                className="form-input"
                placeholder="https://exemplo.com/imagem.jpg"
                value={formData.imageUrl}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn-primary">
              <Plus size={20} />
              Adicionar Objetivo
            </button>
          </form>
        </section>

        <section className="goals-container">
          {sortedGoals.length === 0 ? (
            <div className="goals-empty">
              <Target size={48} />
              <h3>Nenhum objetivo registrado</h3>
              <p>Comece adicionando seu primeiro grande objetivo ao lado.</p>
            </div>
          ) : (
            sortedGoals.map((goal, index) => (
              <div style={{ animationDelay: `${index * 0.1}s` }} key={goal.id}>
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
      </main>
    </div>
  );
}

export default App;
