import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRequireAuth } from '@/hooks/useAuth';
import * as tripsApi from '@/api/trips.api';
import toast from 'react-hot-toast';

const AddEditTripPage = () => {
  useRequireAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    privacy: 'private',
    cover_photo_url: '',
  });
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEditMode) return;

    const fetchTrip = async () => {
      try {
        const res = await tripsApi.getTrip(id);
        const trip = res.data.trip;
        setForm({
          title: trip.title || '',
          description: trip.description || '',
          start_date: trip.start_date ? trip.start_date.substring(0, 10) : '',
          end_date: trip.end_date ? trip.end_date.substring(0, 10) : '',
          privacy: trip.privacy || 'private',
          cover_photo_url: trip.cover_photo_url || '',
        });
      } catch (err) {
        toast.error('Failed to load trip');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.start_date) errs.start_date = 'Start date is required';
    if (!form.end_date) errs.end_date = 'End date is required';
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      errs.end_date = 'End date cannot be before start date';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        await tripsApi.updateTrip(id, form);
        toast.success('Trip updated successfully!');
        navigate(`/trips/${id}`);
      } else {
        const res = await tripsApi.createTrip(form);
        toast.success('Trip created successfully!');
        navigate(`/trips/${res.data.trip.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
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
    <div className="add-edit-page animate-fade-in">
      <div className="form-container card">
        <h1 className="display-text gradient-text page-title">
          {isEditMode ? 'Edit Trip' : 'Log New Trip'}
        </h1>
        <p className="text-muted page-subtitle">
          {isEditMode ? 'Update your trip details and privacy settings' : 'Record a new travel adventure'}
        </p>

        <form onSubmit={handleSubmit} className="trip-form" id="add-edit-trip-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="trip-title">Trip Title</label>
            <input
              id="trip-title"
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="Summer Vacation in Italy, Backpacking Japan..."
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="trip-start-date">Start Date</label>
              <input
                id="trip-start-date"
                type="date"
                name="start_date"
                className={`form-input ${errors.start_date ? 'input-error' : ''}`}
                value={form.start_date}
                onChange={handleChange}
              />
              {errors.start_date && <span className="form-error">{errors.start_date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="trip-end-date">End Date</label>
              <input
                id="trip-end-date"
                type="date"
                name="end_date"
                className={`form-input ${errors.end_date ? 'input-error' : ''}`}
                value={form.end_date}
                onChange={handleChange}
              />
              {errors.end_date && <span className="form-error">{errors.end_date}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="trip-cover-url">Cover Photo Image URL <span className="text-muted">(Optional)</span></label>
            <input
              id="trip-cover-url"
              type="url"
              name="cover_photo_url"
              className="form-input"
              placeholder="https://images.unsplash.com/... (or upload via trip page later)"
              value={form.cover_photo_url}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="trip-desc">Diary Notes / Description</label>
            <textarea
              id="trip-desc"
              name="description"
              className="form-input"
              style={{ height: '140px', resize: 'vertical' }}
              placeholder="Write about your journey, hotels, local foods, guides, and memorable experiences..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="trip-privacy">Privacy</label>
            <select
              id="trip-privacy"
              name="privacy"
              className="form-input"
              value={form.privacy}
              onChange={handleChange}
            >
              <option value="private">Private (Only you can see this trip)</option>
              <option value="public">Public (Shared on exploration searches)</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              id="trip-submit-btn"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? <span className="spinner" /> : isEditMode ? 'Save Changes' : 'Create Trip'}
            </button>
            <Link
              to={isEditMode ? `/trips/${id}` : '/dashboard'}
              id="trip-cancel-btn"
              className="btn btn-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <style>{`
        .add-edit-page { max-width: 680px; margin: 0 auto; }
        .form-container { padding: var(--space-8); }
        .page-title { font-size: 1.8rem; margin-bottom: var(--space-1); }
        .page-subtitle { margin-bottom: var(--space-8); }
        .trip-form { display: flex; flex-direction: column; gap: var(--space-5); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
        .form-actions { display: flex; gap: var(--space-3); margin-top: var(--space-4); }
        .input-error { border-color: var(--color-accent-coral) !important; }
        @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default AddEditTripPage;
