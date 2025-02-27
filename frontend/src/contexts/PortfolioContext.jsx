import { createContext, useContext, useReducer } from 'react';

const PortfolioContext = createContext();

const initialState = {
  portfolio: null,
  stats: {
    projects: { total: 0, by_status: {}, recent_projects: [], public_projects_count: 0 },
    time: { total_hours: 0, billable_hours: 0, hours_by_day: [] },
    invoices: { total_invoiced: 0, total_paid: 0 },
    clients: 0
  },
  userDetails: null,
  loading: true,
  error: null
};

function portfolioReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PORTFOLIO':
      return { ...state, portfolio: action.payload };
    case 'SET_USER_DETAILS':
      return { ...state, userDetails: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'CLEAR_STATE':
      return initialState;
    default:
      return state;
  }
}

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);
  
  return (
    <PortfolioContext.Provider value={{ state, dispatch }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}