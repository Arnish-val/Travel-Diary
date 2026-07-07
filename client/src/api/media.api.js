import api from './client';

export const getTripMedia  = (tripId, params) => api.get(`/trips/${tripId}/media`, { params });
export const uploadMedia   = (tripId, formData) =>
  api.post(`/trips/${tripId}/media`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateMedia   = (id, data)       => api.patch(`/media/${id}`, data);
export const deleteMedia   = (id)             => api.delete(`/media/${id}`);
export const getStorageUsage = ()             => api.get('/users/me/storage');
