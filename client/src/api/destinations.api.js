import api from './client';

export const search        = (params) => api.get('/destinations/search', { params });
export const autocomplete  = (q)      => api.get('/destinations/autocomplete', { params: { q } });
export const getDestination= (id)     => api.get(`/destinations/${id}`);
export const createDestination = (data) => api.post('/destinations', data);
export const getRatings    = (destId) => api.get(`/destinations/${destId}/ratings`);
export const createRating  = (destId, data) => api.post(`/destinations/${destId}/ratings`, data);
export const updateRating  = (id, data) => api.patch(`/ratings/${id}`, data);
export const deleteRating  = (id)     => api.delete(`/ratings/${id}`);
