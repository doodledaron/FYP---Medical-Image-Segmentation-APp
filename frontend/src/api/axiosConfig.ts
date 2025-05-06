import axios from 'axios';

// Define the base URL for your Django backend API
// Make sure this matches how your backend server is running and exposed
// Example: 'http://localhost:8000/api' or just '/api' if frontend and backend are served from the same origin

const axiosInstance = axios.create({
    // ← change this one line:
    baseURL: 'http://localhost:8000/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  })

// --- Optional: Interceptors for Authentication/Error Handling ---

// Example: Request interceptor to add Authorization token (if using token auth)
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken'); // Or get token from your auth context/state
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Example: Response interceptor for handling common errors (e.g., 401 Unauthorized)
// axiosInstance.interceptors.response.use(
//   (response) => {
//     // Any status code that lie within the range of 2xx cause this function to trigger
//     return response;
//   },
//   (error) => {
//     // Any status codes that falls outside the range of 2xx cause this function to trigger
//     if (error.response && error.response.status === 401) {
//       // Handle unauthorized access, e.g., redirect to login
//       console.error("Unauthorized access - redirecting to login.");
//       // window.location.href = '/login';
//     }
//     // You might want to extract a more specific error message here
//     const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
//     return Promise.reject(new Error(errorMessage)); // Reject with a standardized error
//   }
// );


export default axiosInstance;