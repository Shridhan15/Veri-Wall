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
            name,          // <--- Added Name
            version,
            rule,
            prev_hash: prevHash,
            creator,
            justification
        }),

    // FIXED: Now sends a JSON body matching 'SignRequest'
    signPolicy: (fileName, adminName) =>
        api.post('/sign-policy', {
            filename: fileName,
            admin_name: adminName
        }),

    // FIXED: Now sends a JSON body matching 'VerifyRequest'
    verifyPolicy: (fileName) =>
        api.post('/verify-policy', {
            policy: fileName
        }),

    // FIXED: Now sends a JSON body matching 'ApplyRequest'
    applyPolicy: (fileName) =>
        api.post('/apply-policy', {
            policy: fileName
        }),

    listPolicies: () => api.get('/list-policies'),
    getStats: () => api.get('/system-stats'),
};

export default api;