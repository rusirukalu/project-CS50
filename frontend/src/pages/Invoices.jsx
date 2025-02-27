import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, isPast } from 'date-fns';
import { 
  FiPlus, FiX, FiEdit2, FiTrash2, FiAlertCircle,
  FiFileText, FiDollarSign, FiCheckCircle, FiClock, FiDownload
} from 'react-icons/fi';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    project_id: '',
    client_id: ''
  });
  const [stats, setStats] = useState({
    total_invoiced: 0,
    total_paid: 0,
    pending_payment: 0,
    by_status: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.project_id) queryParams.append('project_id', filters.project_id);
        if (filters.client_id) queryParams.append('client_id', filters.client_id);
        
        const [invoicesRes, projectsRes, clientsRes, statsRes] = await Promise.all([
          axios.get(`/api/invoices/?${queryParams}`),
          axios.get('/api/projects/'),
          axios.get('/api/clients/'),
          axios.get('/api/invoices/stats')
        ]);
        
        const invoiceData = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
        const processedInvoices = invoiceData.map(invoice => {
          if (invoice.status === 'sent' && invoice.due_date && isPast(parseISO(invoice.due_date))) {
            return { ...invoice, status: 'overdue' };
          }
          return invoice;
        });
        
        setInvoices(processedInvoices);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setStats(statsRes.data || { total_invoiced: 0, total_paid: 0, pending_payment: 0, by_status: {} });
        console.log('Invoices response:', invoicesRes.data); // Debug
      } catch (err) {
        console.error('Invoices loading error:', err);
        setError('Failed to load invoices');
        setInvoices([]);
        setProjects([]);
        setClients([]);
        setStats({ total_invoiced: 0, total_paid: 0, pending_payment: 0, by_status: {} });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/invoices/${invoiceId}`);
      const [invoicesRes, statsRes] = await Promise.all([
        axios.get('/api/invoices/'),
        axios.get('/api/invoices/stats')
      ]);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setStats(statsRes.data || { total_invoiced: 0, total_paid: 0, pending_payment: 0, by_status: {} });
    } catch (err) {
      console.error('Invoice delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await axios.post(`/api/invoices/${invoiceId}/mark-paid`);
      const [invoicesRes, statsRes] = await Promise.all([
        axios.get('/api/invoices/'),
        axios.get('/api/invoices/stats')
      ]);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setStats(statsRes.data || { total_invoiced: 0, total_paid: 0, pending_payment: 0, by_status: {} });
    } catch (err) {
      console.error('Mark invoice paid error:', err);
      setError(err.response?.data?.message || 'Failed to mark invoice as paid');
    }
  };

  const handleMarkSent = async (invoiceId) => {
    try {
      await axios.post(`/api/invoices/${invoiceId}/mark-sent`);
      const [invoicesRes, statsRes] = await Promise.all([
        axios.get('/api/invoices/'),
        axios.get('/api/invoices/stats')
      ]);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setStats(statsRes.data || { total_invoiced: 0, total_paid: 0, pending_payment: 0, by_status: {} });
    } catch (err) {
      console.error('Mark invoice sent error:', err);
      setError(err.response?.data?.message || 'Failed to mark invoice as sent');
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      project_id: '',
      client_id: ''
    });
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  const getClientName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'Unknown Client';
    const client = clients.find(c => c.id === project.client_id);
    return client ? client.name : 'Unknown Client';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; // draft
    }
  };

  if (loading && !invoices.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link
          to="/invoices/new"
          className="flex items-center justify-center mt-3 sm:mt-0 btn-primary"
        >
          <FiPlus className="mr-2" />
          New Invoice
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50">
          <div className="flex">
            <FiAlertCircle className="text-red-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white rounded-lg shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-blue-100 rounded-full">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Invoiced</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.total_invoiced?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-green-100 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.total_paid?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 rounded-full bg-amber-100">
              <FiClock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.pending_payment?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-red-100 rounded-full">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdue_count || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-card">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="flex-grow mb-4 md:mb-0">
            <label htmlFor="status_filter" className="block mb-1 text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status_filter"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex-grow mb-4 md:mb-0">
            <label htmlFor="project_filter" className="block mb-1 text-sm font-medium text-gray-700">
              Project
            </label>
            <select
              id="project_filter"
              value={filters.project_id}
              onChange={(e) => setFilters({...filters, project_id: e.target.value})}
              className="form-input"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>

          <div className="flex-grow mb-4 md:mb-0">
            <label htmlFor="client_filter" className="block mb-1 text-sm font-medium text-gray-700">
              Client
            </label>
            <select
              id="client_filter"
              value={filters.client_id}
              onChange={(e) => setFilters({...filters, client_id: e.target.value})}
              className="form-input"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end mb-4 md:mb-0">
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
            >
              <FiX className="mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow-card">
        {invoices.length === 0 ? (
          <div className="p-6 text-center">
            <p className="mb-4 text-gray-500">No invoices found</p>
            <Link
              to="/invoices/new"
              className="inline-flex items-center btn-primary"
            >
              <FiPlus className="mr-2" />
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Client / Project</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Issue Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/invoices/${invoice.id}`}
                        className="font-medium text-primary-600 hover:text-primary-900"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getClientName(invoice.project_id)}</div>
                      <div className="text-sm text-gray-500">{getProjectName(invoice.project_id)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {format(parseISO(invoice.issue_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {invoice.due_date 
                        ? format(parseISO(invoice.due_date), 'MMM d, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      ${invoice.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          to={`/invoices/${invoice.id}`}
                          className="text-primary-600 hover:text-primary-900"
                          title="View"
                        >
                          <FiFileText className="w-5 h-5" />
                        </Link>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleMarkSent(invoice.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as Sent"
                          >
                            <FiClock className="w-5 h-5" />
                          </button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Paid"
                          >
                            <FiDollarSign className="w-5 h-5" />
                          </button>
                        )}
                        <a
                          href={`/api/invoices/${invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                          title="Download PDF"
                        >
                          <FiDownload className="w-5 h-5" />
                        </a>
                        {invoice.status === 'draft' && (
                          <>
                            <Link 
                              to={`/invoices/${invoice.id}/edit`}
                              className="text-amber-600 hover:text-amber-900"
                              title="Edit"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;