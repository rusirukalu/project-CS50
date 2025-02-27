import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiPlus, FiSearch, FiX, FiEdit2, FiTrash2, FiAlertCircle,
  FiUser, FiMail, FiPhone, FiBriefcase
} from 'react-icons/fi';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/clients/'); // Fixed path
        console.log('Clients response:', response.data); // Debug
        setClients(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Clients loading error:', err);
        setError('Failed to load clients');
        setClients([]); // Reset to array on error
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email address'),
    phone: Yup.string(),
    company: Yup.string(),
    address: Yup.string(),
    notes: Yup.string()
  });

  const formik = useFormik({
    initialValues: {
      name: '', email: '', phone: '', company: '', address: '', notes: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (isEditing) {
          await axios.put(`/api/clients/${currentClient.id}`, values); // Fixed path
        } else {
          await axios.post('/api/clients/', values); // Fixed path
        }
        
        const response = await axios.get('/api/clients/'); // Fixed path
        setClients(Array.isArray(response.data) ? response.data : []);
        
        formik.resetForm();
        setShowModal(false);
        setIsEditing(false);
        setCurrentClient(null);
      } catch (err) {
        console.error('Client save error:', err);
        setError(err.response?.data?.message || 'Failed to save client');
      }
    },
  });

  const handleEdit = (client) => {
    setCurrentClient(client);
    setIsEditing(true);
    formik.setValues({
      name: client.name || '', email: client.email || '', phone: client.phone || '',
      company: client.company || '', address: client.address || '', notes: client.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await axios.delete(`/api/clients/${clientId}`); // Fixed path
      setClients(clients.filter(client => client.id !== clientId));
    } catch (err) {
      console.error('Client delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete client');
    }
  };

  const filteredClients = Array.isArray(clients) && clients.length > 0 ? 
    clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setCurrentClient(null);
            formik.resetForm();
            setShowModal(true);
          }}
          className="flex items-center justify-center mt-3 sm:mt-0 btn-primary"
        >
          <FiPlus className="mr-2" />
          New Client
        </button>
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

      <div className="p-4 bg-white rounded-lg shadow-card">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, company, or email..."
            className="pl-10 form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card">
          <div className="p-6 text-center">
            {searchTerm ? (
              <>
                <p className="mb-4 text-gray-500">No clients found matching "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn-outline"
                >
                  <FiX className="inline mr-2" />
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-gray-500">No clients yet</p>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    formik.resetForm();
                    setShowModal(true);
                  }}
                  className="btn-primary"
                >
                  <FiPlus className="inline mr-2" />
                  Add your first client
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map(client => (
            <div key={client.id} className="overflow-hidden bg-white rounded-lg shadow-card">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Link 
                      to={`/clients/${client.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-primary-600"
                    >
                      {client.name}
                    </Link>
                    {client.company && (
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <FiBriefcase className="mr-1.5 h-4 w-4 flex-shrink-0" />
                        {client.company}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Edit client"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete client"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  {client.email && (
                    <div className="flex items-center text-sm">
                      <FiMail className="w-4 h-4 mr-2 text-gray-500" />
                      <a href={`mailto:${client.email}`} className="text-gray-600 hover:text-primary-600">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-sm">
                      <FiPhone className="w-4 h-4 mr-2 text-gray-500" />
                      <a href={`tel:${client.phone}`} className="text-gray-600 hover:text-primary-600">
                        {client.phone}
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 mt-6 border-t border-gray-100">
                  <Link 
                    to={`/clients/${client.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiUser className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="w-full mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {isEditing ? 'Edit Client' : 'New Client'}
                    </h3>
                    <form onSubmit={formik.handleSubmit} className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="form-label">Name*</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            className={`form-input ${formik.touched.name && formik.errors.name ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('name')}
                          />
                          {formik.touched.name && formik.errors.name && (
                            <p className="form-error">{formik.errors.name}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="email" className="form-label">Email</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-input ${formik.touched.email && formik.errors.email ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('email')}
                          />
                          {formik.touched.email && formik.errors.email && (
                            <p className="form-error">{formik.errors.email}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="phone" className="form-label">Phone</label>
                          <input
                            type="text"
                            id="phone"
                            name="phone"
                            className="form-input"
                            {...formik.getFieldProps('phone')}
                          />
                        </div>
                        <div>
                          <label htmlFor="company" className="form-label">Company</label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            className="form-input"
                            {...formik.getFieldProps('company')}
                          />
                        </div>
                        <div>
                          <label htmlFor="address" className="form-label">Address</label>
                          <textarea
                            id="address"
                            name="address"
                            rows="2"
                            className="form-input"
                            {...formik.getFieldProps('address')}
                          ></textarea>
                        </div>
                        <div>
                          <label htmlFor="notes" className="form-label">Notes</label>
                          <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            className="form-input"
                            {...formik.getFieldProps('notes')}
                          ></textarea>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={formik.handleSubmit}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isEditing ? 'Update Client' : 'Add Client'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;