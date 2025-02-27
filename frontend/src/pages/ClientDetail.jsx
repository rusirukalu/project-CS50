import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { 
  FiArrowLeft, FiEdit2, FiTrash2, FiAlertCircle, FiMail, 
  FiPhone, FiBriefcase, FiMapPin, FiClock, FiPlusCircle, FiDollarSign
} from 'react-icons/fi';

const TABS = {
  OVERVIEW: 'overview',
  PROJECTS: 'projects',
  INVOICES: 'invoices',
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        
        const clientRes = await axios.get(`/api/clients/${id}`);
        setClient(clientRes.data);
        
        const projectsRes = await axios.get(`/api/projects/?client_id=${id}`);
        const projectData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
        setProjects(projectData);
        
        if (projectData.length > 0) {
          const projectIds = projectData.map(project => project.id);
          const invoicesPromises = projectIds.map(projectId => 
            axios.get(`/api/invoices/?project_id=${projectId}`)
          );
          
          const invoicesResponses = await Promise.all(invoicesPromises);
          const allInvoices = invoicesResponses.flatMap(response => 
            Array.isArray(response.data) ? response.data : []
          );
          
          setInvoices(allInvoices);
        } else {
          setInvoices([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Client detail loading error:', err);
        console.error('Response data:', err.response?.data);
        setError('Failed to load client details');
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  const handleDeleteClient = async () => {
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/clients/${id}`);
      navigate('/clients');
    } catch (err) {
      setError('Failed to delete client');
      console.error('Client deletion error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center rounded-lg bg-red-50">
        <FiAlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-red-800">Error loading client</h3>
        <p className="mt-1 text-red-700">{error}</p>
        <Link to="/clients" className="inline-flex items-center mt-4 btn-primary">
          <FiArrowLeft className="mr-2" />
          Back to Clients
        </Link>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center rounded-lg bg-gray-50">
        <FiAlertCircle className="w-12 h-12 mx-auto text-gray-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-800">Client not found</h3>
        <Link to="/clients" className="inline-flex items-center mt-4 btn-primary">
          <FiArrowLeft className="mr-2" />
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/clients" className="mr-4 text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        </div>
        <div className="flex mt-4 space-x-3 sm:mt-0">
          <button 
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="inline-flex items-center btn-outline"
          >
            <FiEdit2 className="mr-2" />
            Edit
          </button>
          <button 
            onClick={handleDeleteClient}
            className="inline-flex items-center text-red-600 border-red-300 btn-outline hover:text-red-700 hover:bg-red-50"
          >
            <FiTrash2 className="mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Client Information</h2>
              <div className="space-y-4">
                {client.company && (
                  <div className="flex items-start">
                    <FiBriefcase className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-gray-700">{client.company}</p>
                    </div>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-start">
                    <FiMail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <a href={`mailto:${client.email}`} className="text-primary-600 hover:text-primary-700">
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-start">
                    <FiPhone className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <a href={`tel:${client.phone}`} className="text-primary-600 hover:text-primary-700">
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start">
                    <FiMapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-gray-700 whitespace-pre-line">{client.address}</p>
                    </div>
                  </div>
                )}
              </div>
              {client.notes && (
                <div className="mt-8">
                  <h2 className="mb-4 text-lg font-medium text-gray-900">Notes</h2>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <div className="p-4 rounded-lg bg-gray-50">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Summary</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {projects.filter(project => project.status === 'active').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Invoiced</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${invoices
                        .filter(invoice => invoice.status !== 'paid')
                        .reduce((sum, invoice) => sum + invoice.total_amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-6 border-t border-gray-200">
                  <Link 
                    to="/projects"
                    state={{ clientId: client.id }}
                    className="inline-flex items-center justify-center w-full btn-primary"
                  >
                    <FiPlusCircle className="mr-2" />
                    New Project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mt-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {Object.values(TABS).map((tab) => (
              <button
                key={tab}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === TABS.OVERVIEW && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
                    <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700">
                      View All
                    </Link>
                  </div>
                  {projects.length > 0 ? (
                    <div className="divide-y divide-gray-200 rounded-lg bg-gray-50">
                      {projects.slice(0, 3).map(project => (
                        <Link 
                          key={project.id}
                          to={`/projects/${project.id}`}
                          className="block p-4 hover:bg-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{project.title}</h4>
                              <p className="text-sm text-gray-500">
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              </p>
                            </div>
                            <span className="inline-flex items-center text-sm text-gray-600">
                              <FiClock className="mr-1" />
                              {project.total_hours.toFixed(1)} hrs
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-lg bg-gray-50">
                      <p className="text-gray-500">No projects yet</p>
                      <Link 
                        to="/projects"
                        state={{ clientId: client.id }}
                        className="inline-flex items-center mt-2 btn-primary"
                      >
                        <FiPlusCircle className="mr-2" />
                        Create Project
                      </Link>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
                    <Link to="/invoices" className="text-sm text-primary-600 hover:text-primary-700">
                      View All
                    </Link>
                  </div>
                  {invoices.length > 0 ? (
                    <div className="divide-y divide-gray-200 rounded-lg bg-gray-50">
                      {invoices.slice(0, 3).map(invoice => (
                        <Link 
                          key={invoice.id}
                          to={`/invoices/${invoice.id}`}
                          className="block p-4 hover:bg-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{invoice.invoice_number}</h4>
                              <p className="text-sm text-gray-500">
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </p>
                            </div>
                            <span className="font-medium text-gray-900">
                              ${invoice.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-lg bg-gray-50">
                      <p className="text-gray-500">No invoices yet</p>
                      <Link 
                        to="/invoices"
                        className="inline-flex items-center mt-2 btn-primary"
                      >
                        <FiPlusCircle className="mr-2" />
                        Create Invoice
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === TABS.PROJECTS && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                <Link 
                  to="/projects"
                  state={{ clientId: client.id }}
                  className="inline-flex items-center btn-primary"
                >
                  <FiPlusCircle className="mr-2" />
                  New Project
                </Link>
              </div>
              {projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Project Name</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Timeline</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Billing</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map(project => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              to={`/projects/${project.id}`}
                              className="font-medium text-primary-600 hover:text-primary-900"
                            >
                              {project.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project.status === 'active' 
                                ? 'bg-blue-100 text-blue-800' 
                                : project.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {project.start_date ? (
                              <>
                                {format(parseISO(project.start_date), 'MMM d, yyyy')}
                                {project.end_date && ` - ${format(parseISO(project.end_date), 'MMM d, yyyy')}`}
                              </>
                            ) : (
                              'No dates set'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiClock className="mr-1.5 h-4 w-4 flex-shrink-0" />
                              {project.total_hours.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiDollarSign className="mr-1.5 h-4 w-4 flex-shrink-0" />
                              {project.fixed_price 
                                ? `Fixed: $${project.fixed_price.toFixed(2)}` 
                                : project.hourly_rate 
                                ? `Rate: $${project.hourly_rate.toFixed(2)}/hr` 
                                : 'Not set'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50">
                  <p className="text-gray-500">No projects created for this client yet</p>
                  <Link 
                    to="/projects"
                    state={{ clientId: client.id }}
                    className="inline-flex items-center mt-2 btn-primary"
                  >
                    <FiPlusCircle className="mr-2" />
                    Create First Project
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === TABS.INVOICES && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
                <Link 
                  to="/invoices"
                  className="inline-flex items-center btn-primary"
                >
                  <FiPlusCircle className="mr-2" />
                  New Invoice
                </Link>
              </div>
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Invoice #</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Project</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map(invoice => {
                        const project = projects.find(p => p.id === invoice.project_id);
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link 
                                to={`/invoices/${invoice.id}`}
                                className="font-medium text-primary-600 hover:text-primary-900"
                              >
                                {invoice.invoice_number}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {project ? project.title : 'Unknown Project'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {format(parseISO(invoice.issue_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                invoice.status === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : invoice.status === 'sent' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : invoice.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              ${invoice.total_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                              <Link 
                                to={`/invoices/${invoice.id}`}
                                className="mr-3 text-primary-600 hover:text-primary-900"
                              >
                                View
                              </Link>
                              <a 
                                href={`/api/invoices/${invoice.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900"
                              >
                                PDF
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50">
                  <p className="text-gray-500">No invoices created for this client yet</p>
                  <Link 
                    to="/invoices"
                    className="inline-flex items-center mt-2 btn-primary"
                  >
                    <FiPlusCircle className="mr-2" />
                    Create First Invoice
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;