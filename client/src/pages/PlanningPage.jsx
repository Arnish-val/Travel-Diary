import React, { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import * as planApi from '@/api/planning.api';
import useSocket from '@/hooks/useSocket';
import toast from 'react-hot-toast';

const PlanningPage = () => {
  useRequireAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New Plan form
  const [newTitle, setNewTitle] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newNotes, setNewNotes] = useState('');
  
  // Checklist item text
  const [newItemText, setNewItemText] = useState('');

  const handleSocketChecklistChange = (action, item) => {
    setSelectedPlan((prev) => {
      if (!prev) return prev;
      let newChecklist = [...(prev.checklist || [])];
      if (action === 'add') {
        newChecklist.push(item);
      } else if (action === 'update') {
        newChecklist = newChecklist.map((ci) => (ci.id === item.id ? item : ci));
      } else if (action === 'delete') {
        newChecklist = newChecklist.filter((ci) => ci.id !== item.id);
      }
      return { ...prev, checklist: newChecklist };
    });
  };

  const { emitChecklistChange } = useSocket(selectedPlan?.id, handleSocketChecklistChange);

  const fetchPlans = async () => {
    try {
      const res = await planApi.getPlannedTrips();
      setPlans(res.data.items || []);
    } catch {
      toast.error('Failed to load planned trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSelectPlan = async (id) => {
    try {
      const res = await planApi.getPlannedTrip(id);
      setSelectedPlan(res.data.trip);
    } catch {
      toast.error('Failed to load planning details');
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      const res = await planApi.createPlannedTrip({
        title: newTitle,
        budget_cents: newBudget ? parseInt(newBudget, 10) * 100 : null,
        notes: newNotes,
      });
      toast.success('Planned trip created!');
      setNewTitle('');
      setNewBudget('');
      setNewNotes('');
      fetchPlans();
      handleSelectPlan(res.data.trip.id);
    } catch {
      toast.error('Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await planApi.deletePlannedTrip(id);
      toast.success('Plan deleted');
      if (selectedPlan?.id === id) setSelectedPlan(null);
      fetchPlans();
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  // Checklist actions
  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || !selectedPlan) return;
    try {
      const res = await planApi.addChecklistItem(selectedPlan.id, {
        text: newItemText,
        sort_order: (selectedPlan.checklist?.length || 0) + 1,
      });
      setSelectedPlan((prev) => ({
        ...prev,
        checklist: [...(prev.checklist || []), res.data.item],
      }));
      emitChecklistChange('add', res.data.item);
      setNewItemText('');
    } catch {
      toast.error('Failed to add checklist item');
    }
  };

  const handleToggleChecklistItem = async (item) => {
    if (!selectedPlan) return;
    try {
      const updated = await planApi.updateChecklistItem(selectedPlan.id, item.id, {
        is_done: !item.is_done,
      });
      setSelectedPlan((prev) => ({
        ...prev,
        checklist: prev.checklist.map((ci) => (ci.id === item.id ? updated.data.item : ci)),
      }));
      emitChecklistChange('update', updated.data.item);
    } catch {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    if (!selectedPlan) return;
    try {
      await planApi.deleteChecklistItem(selectedPlan.id, itemId);
      setSelectedPlan((prev) => ({
        ...prev,
        checklist: prev.checklist.filter((ci) => ci.id !== itemId),
      }));
      emitChecklistChange('delete', { id: itemId });
    } catch {
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-20)' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="planner-page animate-fade-in">
      <div className="planner-header">
        <h1 className="display-text display-pink" style={{ fontSize: '46px', marginBottom: '8px' }}>
          Trip Planner
        </h1>
        <p className="text-muted">Draft upcoming itineraries and build live checklists.</p>
      </div>

      <div className="planner-layout">
        {/* Left Column: List & Create Form */}
        <div className="planner-sidebar-panel">
          <div className="card plan-form-card">
            <h3 className="display-text" style={{ fontSize: '20px', marginBottom: '12px' }}>Add Future Plan</h3>
            <form onSubmit={handleCreatePlan} className="plan-form" id="create-plan-form">
              <div className="form-group">
                <input
                  id="plan-title-input"
                  type="text"
                  className="form-input"
                  placeholder="Where do you want to go next?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  id="plan-budget-input"
                  type="number"
                  className="form-input"
                  placeholder="Budget estimate ($)"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                />
              </div>
              <div className="form-group">
                <textarea
                  id="plan-notes-input"
                  className="form-input"
                  placeholder="Notes, ideas, hotels..."
                  style={{ height: '70px', resize: 'vertical' }}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
              <button type="submit" id="plan-submit-btn" className="btn btn-primary w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create Plan'}
              </button>
            </form>
          </div>

          <div className="plans-list">
            <h3 className="display-text" style={{ fontSize: '20px', marginBottom: '12px' }}>Planned Trips</h3>
            <div className="plans-container">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlan(p.id)}
                  className={`plan-item card ${selectedPlan?.id === p.id ? 'active' : ''}`}
                  id={`plan-item-${p.id}`}
                >
                  <div style={{ flex: 1 }}>
                    <h4 className="plan-item-title">{p.title}</h4>
                    <div className="plan-item-meta text-xs text-muted">
                      {p.budget_cents ? `Budget: $${(p.budget_cents / 100).toLocaleString()}` : 'No budget set'}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm delete-plan-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlan(p.id);
                    }}
                    id={`delete-plan-btn-${p.id}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {plans.length === 0 && (
                <p className="text-muted text-sm" style={{ padding: 'var(--space-2)' }}>No planned trips yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Planning & Checklist */}
        <div className="planner-detail-panel">
          {selectedPlan ? (
            <div className="card plan-detail-card animate-scale-in">
              <div className="plan-detail-header">
                <div>
                  <h2 className="display-text display-pink" style={{ fontSize: '30px', margin: 0 }}>{selectedPlan.title}</h2>
                  {selectedPlan.budget_cents && (
                    <p className="budget-tag text-xs text-muted" style={{ fontWeight: '700', marginTop: '4px' }}>
                      💵 BUDGET: ${(selectedPlan.budget_cents / 100).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {selectedPlan.notes && (
                <div className="plan-notes-box">
                  <strong className="text-xs" style={{ fontWeight: '700', letterSpacing: '0.04em' }}>NOTES</strong>
                  <p className="text-sm prose" style={{ margin: 0, color: 'var(--text-body)' }}>{selectedPlan.notes}</p>
                </div>
              )}

              <hr className="divider" />

              {/* Checklist Section */}
              <div className="checklist-section">
                <h3 className="display-text" style={{ fontSize: '24px', marginBottom: '12px' }}>Checklist</h3>
                <form onSubmit={handleAddChecklistItem} className="checklist-add-form" id="add-checklist-form">
                  <input
                    id="checklist-text-input"
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="Add task (e.g., Book flights, Buy travel insurance)..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                  />
                  <button type="submit" id="checklist-submit-btn" className="btn btn-secondary btn-sm">
                    Add
                  </button>
                </form>

                <div className="checklist-list">
                  {selectedPlan.checklist?.length > 0 ? (
                    selectedPlan.checklist.map((item) => (
                      <div key={item.id} className="checklist-row">
                        <label className="checklist-label">
                          <input
                            type="checkbox"
                            className="checklist-checkbox"
                            checked={item.is_done}
                            onChange={() => handleToggleChecklistItem(item)}
                            id={`checklist-item-checkbox-${item.id}`}
                          />
                          <span className={item.is_done ? 'checked-text text-muted' : ''}>
                            {item.text}
                          </span>
                        </label>
                        <button
                          className="btn btn-ghost btn-sm checklist-item-delete"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          id={`delete-checklist-item-btn-${item.id}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-sm">Add checklist items above to stay organized.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card select-placeholder">
              <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</p>
              <h3 className="display-text display-pink" style={{ fontSize: '24px', marginBottom: '8px' }}>Select a plan</h3>
              <p className="text-muted prose">Choose a planned trip from the list to view notes and checklist.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .planner-page { max-width: 1100px; margin: 0 auto; padding-top: var(--space-8); }
        .planner-header { border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-6); margin-bottom: var(--space-8); }
        .planner-layout { display: grid; grid-template-columns: 1fr 1.6fr; gap: var(--space-10); }
        .planner-sidebar-panel { display: flex; flex-direction: column; gap: var(--space-8); }
        .plan-form-card { padding: var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .plan-form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-2); }
        .plans-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .plans-container { display: flex; flex-direction: column; gap: var(--space-3); }
        .plan-item { padding: var(--space-4) var(--space-5); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all var(--transition-fast); border: 1px solid var(--border-subtle); background: #fff; border-radius: var(--radius-md); }
        .plan-item:hover { border-color: var(--color-lipstick); }
        .plan-item.active { border-left: 4px solid var(--color-lipstick); border-color: var(--border-default); background: var(--color-blush); }
        .plan-item-title { font-family: var(--font-grotesk); font-size: 16px; font-weight: 700; color: var(--color-forest); }
        .delete-plan-btn { padding: var(--space-1); border-radius: 50%; color: var(--color-forest); }
        .delete-plan-btn:hover { color: var(--color-lipstick); background: none; }

        .planner-detail-panel { min-height: 400px; }
        .plan-detail-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .plan-detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .plan-notes-box { background: var(--color-blush); padding: var(--space-5); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--space-2); }
        .checklist-add-form { display: flex; gap: var(--space-3); margin: var(--space-3) 0 var(--space-4); }
        .checklist-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .checklist-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); }
        .checklist-label { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; font-family: var(--font-grotesk); font-size: 15px; color: var(--color-forest); flex: 1; }
        .checklist-checkbox { width: 18px; height: 18px; accent-color: var(--color-lipstick); cursor: pointer; }
        .checked-text { text-decoration: line-through; color: var(--text-muted); }
        .checklist-item-delete { padding: var(--space-1); color: var(--color-forest); }
        .checklist-item-delete:hover { color: var(--color-lipstick); background: none; }
        
        .select-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 350px; text-align: center; background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        @media (max-width: 768px) { .planner-layout { grid-template-columns: 1fr; gap: 40px; } }
      `}</style>
    </div>
  );
};

export default PlanningPage;
