import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { 
  FiArrowLeft, 
  FiClock, 
  FiDollarSign, 
  FiCalendar, 
  FiFileText,
  FiUser,
  FiEdit2,
  FiTrash2,
  FiPlusCircle,
  FiAlertCircle,
  FiCheckCircle,
  FiFile
} from 'react-icons/fi';

// Project tabs
const TABS = {
  OVERVIEW: 'overview',
  TIME: 'time',
  INVOICES: 'invoices',
  DOCUMENTS: 'documents'
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Get project details
        const projectRes = await axios.get(`/projects/${id}`);
        setProject(projectRes.data);
        
        // Get client details
        const clientRes = await axios.get(`/clients/${projectRes.data.client_id}`);
        setClient(clientRes.data);
        
        // Get time entries for this project
        const timeRes = await axios.get(`/time/?project_id=${id}`);
        setTimeEntries(timeRes.data);
        
        // Get invoices for this project
        const invoicesRes = await axios.get(`/invoices/?project_id=${id}`);
        setInvoices(invoicesRes.data);
        
        // Get documents for this project
        const documentsRes = await axios.get(`/documents/?project_id=${id}`);
        setDocuments(documentsRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load project details');
        setLoading(false);
        console.error('Project detail loading error:', err);
      }
    };

    fetchProjectData();
  }, [id]);

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      setError('Failed to delete project');
      console.error('Project deletion error:', err);
    }
  };

  // Status color class
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default: // pending
        return 'bg-amber-100 text-amber-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center rounded-lg bg-red-50">
        <FiAlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-red-800">Error loading project</h3>
        <p className="mt-1 text-red-700">{error}</p>
        <Link to="/projects" className="inline-flex items-center mt-4 btn-primary">
          <FiArrowLeft className="mr-2" />
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center rounded-lg bg-gray-50">
        <FiAlertCircle className="w-12 h-12 mx-auto text-gray-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-800">Project not found</h3>
        <Link to="/projects" className="inline-flex items-center mt-4 btn-primary">
          <FiArrowLeft className="mr-2" />
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/projects" className="mr-4 text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
        </div>
        <div className="flex mt-4 space-x-3 sm:mt-0">
          <Link 
            to={`/projects/${id}/edit`}
            className="inline-flex items-center btn-outline"
          >
            <FiEdit2 className="mr-2" />
            Edit
          </Link>
          <button 
            onClick={handleDeleteProject}
            className="inline-flex items-center text-red-600 border-red-300 btn-outline hover:text-red-700 hover:bg-red-50"
          >
            <FiTrash2 className="mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Project status and details */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <p className="mt-2 text-gray-500">
                Created on {format(parseISO(project.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <div className="flex items-center mb-2 sm:mb-0">
                <FiCalendar className="mr-2 text-gray-500" />
                <span className="text-gray-700">
                  {project.start_date ? format(parseISO(project.start_date), 'MMM d, yyyy') : 'No start date'} 
                  {project.end_date ? ` - ${format(parseISO(project.end_date), 'MMM d, yyyy')}` : ''}
                </span>
              </div>
              <div className="flex items-center">
                <FiClock className="mr-2 text-gray-500" />
                <span className="text-gray-700">{project.total_hours.toFixed(1)} hours logged</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Description</h2>
              <div className="prose text-gray-700 max-w-none">
                {project.description ? (
                  <p>{project.description}</p>
                ) : (
                  <p className="italic text-gray-500">No description provided</p>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="p-4 rounded-lg bg-gray-50">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Client</h2>
                {client ? (
                  <div className="flex items-start">
                    <FiUser className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-800">{client.name}</h3>
                      <p className="text-sm text-gray-500">{client.company}</p>
                      {client.email && (
                        <p className="text-sm text-gray-500">{client.email}</p>
                      )}
                      <Link to={`/clients/${client.id}`} className="inline-block mt-1 text-sm text-primary-600 hover:text-primary-700">
                        View client details
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Client information not available</p>
                )}
                
                <div className="pt-4 mt-6 border-t border-gray-200">
                  <h2 className="mb-4 text-lg font-medium text-gray-900">Billing</h2>
                  {project.hourly_rate && (
                    <div className="flex items-center mb-2">
                      <FiDollarSign className="w-5 h-5 mr-3 text-gray-500" />
                      <div>
                        <p className="text-gray-700">Hourly Rate: ${project.hourly_rate.toFixed(2)}/hour</p>
                      </div>
                    </div>
                  )}
                  
                  {project.fixed_price && (
                    <div className="flex items-center mb-2">
                      <FiDollarSign className="w-5 h-5 mr-3 text-gray-500" />
                      <div>
                        <p className="text-gray-700">Fixed Price: ${project.fixed_price.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <FiFileText className="w-5 h-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-gray-700">Amount Billed: ${project.total_billed.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab content */}
        <div className="p-6">
          {activeTab === TABS.OVERVIEW && (
            <div className="space-y-6">
              {/* Time summary */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Time Summary</h3>
                  <Link to="/time" className="text-sm text-primary-600 hover:text-primary-700">
                    Log Time
                  </Link>
                </div>
                
                {timeEntries.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-gray-900">{project.total_hours.toFixed(1)}</div>
                      <div className="text-sm text-gray-500">Total Hours</div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-gray-900">
                        {timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Billable Hours</div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-gray-900">
                        ${(project.hourly_rate || 0) * project.total_hours.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Billable Amount</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-lg bg-gray-50">
                    <p className="text-gray-500">No time entries recorded for this project yet</p>
                    <Link to="/time" className="inline-flex items-center mt-2 btn-primary">
                      <FiPlusCircle className="mr-2" />
                      Log Time
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Invoice summary */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Summary</h3>
                  <Link to="/invoices" className="text-sm text-primary-600 hover:text-primary-700">
                    Create Invoice
                  </Link>
                </div>
                
                {invoices.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-gray-900">
                        {invoices.length}
                      </div>
                      <div className="text-sm text-gray-500">Total Invoices</div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-gray-900">
                        ${invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Total Invoiced</div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-green-600">
                        ${invoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.total_amount, 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Total Paid</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-lg bg-gray-50">
                    <p className="text-gray-500">No invoices created for this project yet</p>
                    <Link to="/invoices" className="inline-flex items-center mt-2 btn-primary">
                      <FiPlusCircle className="mr-2" />
                      Create Invoice
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === TABS.TIME && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Time Entries</h3>
                <Link to="/time" className="inline-flex items-center btn-primary">
                  <FiPlusCircle className="mr-2" />
                  Log Time
                </Link>
              </div>
              
              {timeEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Hours
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {format(parseISO(entry.date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {entry.hours.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            {entry.billable ? (
                              entry.invoiced ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FiCheckCircle className="w-3 h-3 mr-1" />
                                  Invoiced
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Billable
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Non-billable
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50">
                  <p className="text-gray-500">No time entries recorded for this project yet</p>
                  <Link to="/time" className="inline-flex items-center mt-2 btn-primary">
                    <FiPlusCircle className="mr-2" />
                    Log Time
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === TABS.INVOICES && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
                <Link to="/invoices" className="inline-flex items-center btn-primary">
                  <FiPlusCircle className="mr-2" />
                  Create Invoice
                </Link>
              </div>
              
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Issue Date
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              to={`/invoices/${invoice.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              {invoice.invoice_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {format(parseISO(invoice.issue_date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {invoice.due_date ? format(parseISO(invoice.due_date), 'MMM d, yyyy') : 'N/A'}
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
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            ${invoice.total_amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                            <Link 
                              to={`/invoices/${invoice.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50">
                  <p className="text-gray-500">No invoices created for this project yet</p>
                  <Link to="/invoices" className="inline-flex items-center mt-2 btn-primary">
                    <FiPlusCircle className="mr-2" />
                    Create Invoice
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === TABS.DOCUMENTS && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                <Link to="/documents" className="inline-flex items-center btn-primary">
                  <FiPlusCircle className="mr-2" />
                  Upload Document
                </Link>
              </div>
              
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-4 rounded-lg bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <FiFile className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                            {doc.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1)}
                          </p>
                          <div className="flex mt-2">
                            <a 
                              href={`/api/documents/${doc.id}/download`} 
                              className="text-xs text-primary-600 hover:text-primary-700"
                              download
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg bg-gray-50">
                  <p className="text-gray-500">No documents uploaded for this project yet</p>
                  <Link to="/documents" className="inline-flex items-center mt-2 btn-primary">
                    <FiPlusCircle className="mr-2" />
                    Upload Document
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

export default ProjectDetail;