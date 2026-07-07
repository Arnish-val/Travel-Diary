import api from './client';

export const getPlannedTrips   = ()         => api.get('/planned-trips');
export const getPlannedTrip    = (id)       => api.get(`/planned-trips/${id}`);
export const createPlannedTrip = (data)     => api.post('/planned-trips', data);
export const updatePlannedTrip = (id, data) => api.patch(`/planned-trips/${id}`, data);
export const deletePlannedTrip = (id)       => api.delete(`/planned-trips/${id}`);

export const addChecklistItem    = (id, data)             => api.post(`/planned-trips/${id}/checklist`, data);
export const updateChecklistItem = (id, itemId, data)     => api.patch(`/planned-trips/${id}/checklist/${itemId}`, data);
export const deleteChecklistItem = (id, itemId)           => api.delete(`/planned-trips/${id}/checklist/${itemId}`);
