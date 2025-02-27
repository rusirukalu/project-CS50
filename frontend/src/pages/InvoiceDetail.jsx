import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, isPast } from 'date-fns';
import { 
  FiArrowLeft, 
  FiEdit2, 
  FiTrash2, 
  FiDownload,
  FiAlertCircle, 
  FiFileText,
  FiCalendar,
  FiCheckCircle,
  FiSend
} from 'react-icons/fi';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch invoice, project, and client data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        
        // Get invoice details
        const invoiceRes = await axios.get(`/api/invoices/${id}`);
        
        // Check if invoice is overdue
        let invoice = invoiceRes.data;
        if (invoice.status === 'sent' && invoice.due_date && isPast(parseISO(invoice.due_date))) {
          invoice = { ...invoice, status: 'overdue' };
        }
        
        setInvoice(invoice);
        
        // Get project details
        const projectRes = await axios.get(`/api/projects/${invoice.project_id}`);
        setProject(projectRes.data);
        
        // Get client details
        const clientRes = await axios.get(`/api/clients/${projectRes.data.client_id}`);
        setClient(clientRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load invoice details');
        setLoading(false);
        console.error('Invoice detail loading error:', err);
      }
    };

    fetchInvoiceData();
  }, [id]);

  // Handle invoice deletion
  const handleDeleteInvoice = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/invoices/${id}`);
      navigate('/invoices');
    } catch (err) {
      setError('Failed to delete invoice');
      console.error('Invoice deletion error:', err);
    }
  };

  // Handle mark as sent
  const handleMarkSent = async () => {
    try {
      const response = await axios.post(`/api/invoices/${id}/mark-sent`);
      setInvoice(response.data.invoice);
    } catch (err) {
      setError('Failed to mark invoice as sent');
      console.error('Mark as sent error:', err);
    }
  };

  // Handle mark as paid
  const handleMarkPaid = async () => {
    try {
      const response = await axios.post(`/api/invoices/${id}/mark-paid`);
      setInvoice(response.data.invoice);
    } catch (err) {
      setError('Failed to mark invoice as paid');
      console.error('Mark as paid error:', err);
    }
  };

  // Status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default: // draft
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center rounded-lg bg-red-50">
        <FiAlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-red-800">Error loading invoice</h3>
        <p className="mt-1 text-red-700">{error}</p>
        <Link to="/invoices" className="inline-flex items-center mt-4 btn-primary">
          <FiArrowLeft className="mr-2" />
          Back to Invoices
        </Link>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center rounded-lg bg-gray-50">
        <FiAlertCircle className="w-12 h-12 mx-auto text-gray-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-800">Invoice not found</h3>
        <Link to="/invoices" className="inline-flex items-center mt-4 btn-primary">
          <FiArrowLeft className="mr-2" />
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/invoices" className="mr-4 text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
        </div>
        <div className="flex mt-4 space-x-3 sm:mt-0">
          <a
            href={`/api/invoices/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center btn-outline"
          >
            <FiDownload className="mr-2" />
            Download PDF
          </a>
          
          {invoice.status === 'draft' && (
            <>
              <Link 
                to={`/invoices/${id}/edit`}
                className="inline-flex items-center btn-outline"
              >
                <FiEdit2 className="mr-2" />
                Edit
              </Link>
              <button 
                onClick={handleDeleteInvoice}
                className="inline-flex items-center text-red-600 border-red-300 btn-outline hover:text-red-700 hover:bg-red-50"
              >
                <FiTrash2 className="mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice status and actions */}
      <div className="p-6 bg-white rounded-lg shadow-card">
        <div className="flex flex-col mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
            
            {invoice.status === 'overdue' && (
              <span className="ml-3 text-sm text-red-600">
                Payment overdue
              </span>
            )}
          </div>
          
          <div className="space-x-3">
            {invoice.status === 'draft' && (
              <button 
                onClick={handleMarkSent}
                className="inline-flex items-center btn-primary"
              >
                <FiSend className="mr-2" />
                Mark as Sent
              </button>
            )}
            
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <button 
                onClick={handleMarkPaid}
                className="inline-flex items-center btn-primary"
              >
                <FiCheckCircle className="mr-2" />
                Mark as Paid
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-900">Invoice Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="text-gray-900">{format(parseISO(invoice.issue_date), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="text-gray-900">
                    {invoice.due_date 
                      ? format(parseISO(invoice.due_date), 'MMMM d, yyyy')
                      : 'No due date'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiFileText className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Project</p>
                  <Link 
                    to={`/projects/${project?.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {project?.title || 'Unknown Project'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-900">Client Information</h2>
            
            {client ? (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{client.name}</p>
                {client.company && <p className="text-gray-700">{client.company}</p>}
                {client.email && <p className="text-gray-700">{client.email}</p>}
                {client.phone && <p className="text-gray-700">{client.phone}</p>}
                {client.address && <p className="text-gray-700 whitespace-pre-line">{client.address}</p>}
                
                <Link 
                  to={`/clients/${client.id}`}
                  className="inline-block mt-2 text-primary-600 hover:text-primary-700"
                >
                  View client details
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">Client information not available</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice items */}
      <div className="overflow-hidden bg-white rounded-lg shadow-card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Invoice Items</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 text-base font-semibold text-right text-gray-900">
                  ${invoice.total_amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Notes */}
      {invoice.notes && (
        <div className="p-6 bg-white rounded-lg shadow-card">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Notes</h2>
          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
