import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Default Uvicorn address

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const policyAPI = {
    login: (username, password) =>
        api.post('/login', { username, password }),

    createPolicy: (name, version, rule, prevHash, creator, justification) =>
        api.post('/create-policy', {
            name,          
            version,
            rule,
            prev_hash: prevHash,
            creator,
            justification
        }),
 
    signPolicy: (fileName, adminName) =>
        api.post('/sign-policy', {
            filename: fileName,
            admin_name: adminName
        }), 
    verifyPolicy: (fileName) =>
        api.post('/verify-policy', {
            policy: fileName
        }),
 
    applyPolicy: (fileName) =>
        api.post('/apply-policy', {
            policy: fileName
        }),

    listPolicies: () => api.get('/list-policies'),
    getStats: () => api.get('/system-stats'),
};

export default api;