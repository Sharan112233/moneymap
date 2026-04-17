import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })


// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If token expired redirect to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login         = (data) => api.post('/auth/login', data)
export const signup        = (data) => api.post('/auth/signup', data)
export const getMe         = ()     => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/profile', data)

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPassword  = (data) => api.post('/auth/forgot/password', data)
export const verifyOTP       = (data) => api.post('/auth/forgot/verify-otp', data)
export const resetPassword   = (data) => api.post('/auth/forgot/set-password', data)

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions       = (params = {}) => api.get('/transactions/', { params })
export const addTransaction        = (data)        => api.post('/transactions/', data)
export const updateTransaction     = (id, data)    => api.put(`/transactions/${id}`, data)
export const deleteTransaction     = (id)          => api.delete(`/transactions/${id}`)
export const deleteAllTransactions = ()            => api.delete('/transactions/all')
export const importCSV             = (formData)    => api.post('/transactions/import-csv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// ── Budget ────────────────────────────────────────────────────────────────────
export const getBudgets = () => api.get('/budget/')
export const setBudget  = (data) => api.post('/budget/', data)

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getSummary              = ()                  => api.get('/analytics/summary')
export const getByCategory           = (allTime = false)   => api.get('/analytics/by-category', { params: { all: allTime } })
export const getByCategoryForMonth   = (month)             => api.get('/analytics/by-category', { params: { all: false, month } })
export const getMonthlyTrend         = ()                  => api.get('/analytics/monthly-trend')
export const getWeekdayPattern       = ()                  => api.get('/analytics/weekday-pattern')
export const getCurrentMonthSpending = ()                  => api.get('/analytics/current-month-spending')

// ── ML / Forecast ─────────────────────────────────────────────────────────────
export const getForecast           = ()   => api.get('/ml/forecast')
export const getForecastByCategory = ()   => api.get('/ml/forecast-by-category')
export const getAnomalies          = ()   => api.get('/ml/anomalies')
export const getPredictMonthEnd    = ()   => api.get('/ml/predict-month-end')
export const getSmartInsights      = ()   => api.get('/ml/smart-insights')
export const getSmartBudgetPlan    = (params) => api.get('/ml/smart-budget-plan', { params })

// ── Goals ─────────────────────────────────────────────────────────────────────
export const getGoals    = ()          => api.get('/goals/')
export const addGoal     = (data)      => api.post('/goals/', data)
export const updateGoal  = (id, data)  => api.put(`/goals/${id}`, data)
export const deleteGoal  = (id)        => api.delete(`/goals/${id}`)
export const predictGoal = (id)        => api.get(`/ml/savings-goal-predictor/${id}`)

// ── Reports ───────────────────────────────────────────────────────────────────
export const downloadPDF = () => api.get('/reports/pdf', { responseType: 'blob' })

// ── Alerts ────────────────────────────────────────────────────────────────────
export const checkBudgetAlerts = ()     => api.get('/alerts/check-budgets')
export const setupEmail        = (data) => api.post('/alerts/email-setup', data)
export const parseSMS          = (data) => api.post('/alerts/sms-parse', data)