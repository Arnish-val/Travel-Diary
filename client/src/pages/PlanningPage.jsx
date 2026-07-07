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
      <div className="planner-layout">
        {/* Left Column: List & Create Form */}
        <div className="planner-sidebar-panel">
          <div className="card plan-form-card">
            <h3>Add Future Plan</h3>
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
              <button type="submit" id="plan-submit-btn" className="btn btn-primary btn-sm w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create Plan'}
              </button>
            </form>
          </div>

          <div className="plans-list">
            <h3>Planned Trips</h3>
            {plans.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectPlan(p.id)}
                className={`plan-item card ${selectedPlan?.id === p.id ? 'active' : ''}`}
                id={`plan-item-${p.id}`}
              >
                <div>
                  <h4 className="plan-item-title">{p.title}</h4>
                  <div className="plan-item-meta text-xs text-muted">
                    {p.budget_cents ? `Budget: $${(p.budget_cents / 100).toLocaleString()}` : 'No budget set'}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm text-coral delete-plan-btn"
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
              <p className="text-muted text-sm" style={{ padding: 'var(--space-4)' }}>No planned trips yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Planning & Checklist */}
        <div className="planner-detail-panel">
          {selectedPlan ? (
            <div className="card plan-detail-card animate-scale-in">
              <div className="plan-detail-header">
                <div>
                  <h2>{selectedPlan.title}</h2>
                  {selectedPlan.budget_cents && (
                    <p className="budget-tag text-sm text-accent">
                      💵 Budget: ${(selectedPlan.budget_cents / 100).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {selectedPlan.notes && (
                <div className="plan-notes-box">
                  <strong>Notes</strong>
                  <p className="text-sm text-secondary">{selectedPlan.notes}</p>
                </div>
              )}

              <hr className="divider" />

              {/* Checklist Section */}
              <div className="checklist-section">
                <h3>Checklist</h3>
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
                          className="btn btn-ghost btn-sm text-coral checklist-item-delete"
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
              <p style={{ fontSize: '3rem' }}>📋</p>
              <h3>Select a plan</h3>
              <p className="text-muted">Choose a planned trip from the sidebar to view notes and checklist.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .planner-page { max-width: 1100px; margin: 0 auto; }
        .planner-layout { display: grid; grid-template-columns: 1fr 1.6fr; gap: var(--space-6); }
        .planner-sidebar-panel { display: flex; flex-direction: column; gap: var(--space-6); }
        .plan-form-card { padding: var(--space-5); }
        .plan-form { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-3); }
        .plans-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .plans-list h3 { margin-bottom: var(--space-2); }
        .plan-item { padding: var(--space-4); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all var(--transition-fast); }
        .plan-item:hover { border-color: var(--color-brand-400); background: var(--glass-bg); }
        .plan-item.active { border-color: var(--color-brand-500); background: rgba(99,102,241,0.08); }
        .plan-item-title { font-size: 0.95rem; font-weight: 600; }
        .delete-plan-btn { padding: var(--space-2); opacity: 0; transition: opacity var(--transition-fast); }
        .plan-item:hover .delete-plan-btn { opacity: 1; }

        .planner-detail-panel { min-height: 400px; }
        .plan-detail-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
        .plan-detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .budget-tag { margin-top: 4px; font-weight: 500; }
        .plan-notes-box { background: var(--color-bg-elevated); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: var(--space-1); }
        .checklist-add-form { display: flex; gap: var(--space-2); margin: var(--space-3) 0 var(--space-4); }
        .checklist-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .checklist-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); background: var(--color-bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); }
        .checklist-label { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; font-size: 0.9rem; flex: 1; }
        .checklist-checkbox { width: 16px; height: 16px; accent-color: var(--color-brand-500); cursor: pointer; }
        .checked-text { text-decoration: line-through; }
        .checklist-item-delete { opacity: 0; padding: var(--space-1); }
        .checklist-row:hover .checklist-item-delete { opacity: 1; }
        .select-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 350px; text-align: center; }
        @media (max-width: 768px) { .planner-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default PlanningPage;
