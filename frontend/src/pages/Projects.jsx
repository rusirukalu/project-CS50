import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  FiPlus, FiSearch, FiX, FiEdit2, FiTrash2, FiAlertCircle,
  FiCalendar, FiDollarSign, FiClock
} from 'react-icons/fi';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [filters, setFilters] = useState({ status: '', client_id: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.client_id) queryParams.append('client_id', filters.client_id);
        
        const [projectsRes, clientsRes] = await Promise.all([
          axios.get(`/api/projects/?${queryParams}`),
          axios.get('/api/clients/')
        ]);
        
        console.log('Projects response:', projectsRes.data);
        console.log('Clients response:', clientsRes.data);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        console.log('Clients state:', clients);
      } catch (err) {
        console.error('Projects loading error:', err);
        setError('Failed to load projects or clients');
        setProjects([]);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const validationSchema = Yup.object({
    title: Yup.string().required('Title is required'),
    client_id: Yup.number().required('Client is required'),
    status: Yup.string().required('Status is required'),
    start_date: Yup.date().nullable(),
    end_date: Yup.date().nullable()
      .min(Yup.ref('start_date'), 'End date must be after start date'),
    hourly_rate: Yup.number().nullable().min(0, 'Rate must be positive'),
    fixed_price: Yup.number().nullable().min(0, 'Price must be positive'),
  });

  const formik = useFormik({
    initialValues: {
      title: '', description: '', client_id: '', status: 'pending',
      start_date: '', end_date: '', hourly_rate: '', fixed_price: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const projectData = {
          ...values,
          client_id: parseInt(values.client_id, 10),
          hourly_rate: values.hourly_rate ? parseFloat(values.hourly_rate) : null,
          fixed_price: values.fixed_price ? parseFloat(values.fixed_price) : null,
          total_hours: 0.0,  // Explicitly set to match backend
          total_billed: 0.0  // Explicitly set to match backend
        };
        
        console.log('Sending project data:', projectData);
        if (isEditing) {
          await axios.put(`/api/projects/${currentProject.id}`, projectData);
        } else {
          await axios.post(`/api/projects/`, projectData);
        }
        
        const response = await axios.get('/api/projects/');
        setProjects(Array.isArray(response.data) ? response.data : []);
        
        formik.resetForm();
        setShowModal(false);
        setIsEditing(false);
        setCurrentProject(null);
      } catch (err) {
        console.error('Project save error:', err);
        console.error('Response data:', err.response?.data);
        console.error('Response status:', err.response?.status);
        setError(err.response?.data?.message || 'Failed to save project');
      }
    },
  });

  const handleEdit = (project) => {
    setCurrentProject(project);
    setIsEditing(true);
    formik.setValues({
      title: project.title || '', description: project.description || '',
      client_id: project.client_id || '', status: project.status || 'pending',
      start_date: project.start_date || '', end_date: project.end_date || '',
      hourly_rate: project.hourly_rate || '', fixed_price: project.fixed_price || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await axios.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(project => project.id !== projectId));
    } catch (err) {
      console.error('Project delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const resetFilters = () => {
    setFilters({ status: '', client_id: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => { setIsEditing(false); formik.resetForm(); setShowModal(true); }}
          className="flex items-center justify-center mt-3 sm:mt-0 btn-primary"
        >
          <FiPlus className="mr-2" />
          New Project
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <div className="flex-grow mb-4 sm:mb-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-10 form-input"
                onChange={(e) => {}}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <div className="mb-4 sm:mb-0">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="mb-4 sm:mb-0">
              <select
                value={filters.client_id}
                onChange={(e) => setFilters({...filters, client_id: e.target.value})}
                className="form-input"
              >
                <option value="">All Clients</option>
                {clients.length > 0 ? (
                  clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No clients available</option>
                )}
              </select>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <FiX className="mr-1" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-lg shadow-card">
        {projects.length === 0 ? (
          <div className="p-6 text-center">
            <p className="mb-4 text-gray-500">No projects found</p>
            <button
              onClick={() => { setIsEditing(false); formik.resetForm(); setShowModal(true); }}
              className="btn-primary"
            >
              <FiPlus className="inline mr-2" />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Timeline</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map(project => {
                  const client = clients.find(c => c.id === project.client_id);
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/projects/${project.id}`} className="text-primary-600 hover:text-primary-900">
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client ? client.name : 'Unknown Client'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.start_date && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FiCalendar className="mr-1.5 h-4 w-4 flex-shrink-0" />
                            <span>
                              {format(new Date(project.start_date), 'MMM d, yyyy')}
                              {project.end_date && ` - ${format(new Date(project.end_date), 'MMM d, yyyy')}`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiClock className="mr-1.5 h-4 w-4 flex-shrink-0" />
                          {project.total_hours.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button onClick={() => handleEdit(project)} className="mr-4 text-primary-600 hover:text-primary-900">
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {isEditing ? 'Edit Project' : 'New Project'}
                    </h3>
                    <form onSubmit={formik.handleSubmit} className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="title" className="form-label">Project Title*</label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            className={`form-input ${formik.touched.title && formik.errors.title ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('title')}
                          />
                          {formik.touched.title && formik.errors.title && (
                            <p className="form-error">{formik.errors.title}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="client_id" className="form-label">Client*</label>
                          <select
                            id="client_id"
                            name="client_id"
                            className={`form-input ${formik.touched.client_id && formik.errors.client_id ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('client_id')}
                          >
                            <option value="">Select a client</option>
                            {clients.length > 0 ? (
                              clients.map(client => (
                                <option key={client.id} value={client.id}>
                                  {client.name}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>No clients available</option>
                            )}
                          </select>
                          {formik.touched.client_id && formik.errors.client_id && (
                            <p className="form-error">{formik.errors.client_id}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="description" className="form-label">Description</label>
                          <textarea
                            id="description"
                            name="description"
                            rows="3"
                            className="form-input"
                            {...formik.getFieldProps('description')}
                          ></textarea>
                        </div>
                        <div>
                          <label htmlFor="status" className="form-label">Status*</label>
                          <select
                            id="status"
                            name="status"
                            className={`form-input ${formik.touched.status && formik.errors.status ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('status')}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {formik.touched.status && formik.errors.status && (
                            <p className="form-error">{formik.errors.status}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="start_date" className="form-label">Start Date</label>
                            <input
                              type="date"
                              id="start_date"
                              name="start_date"
                              className={`form-input ${formik.touched.start_date && formik.errors.start_date ? 'border-red-500' : ''}`}
                              {...formik.getFieldProps('start_date')}
                            />
                            {formik.touched.start_date && formik.errors.start_date && (
                              <p className="form-error">{formik.errors.start_date}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="end_date" className="form-label">End Date</label>
                            <input
                              type="date"
                              id="end_date"
                              name="end_date"
                              className={`form-input ${formik.touched.end_date && formik.errors.end_date ? 'border-red-500' : ''}`}
                              {...formik.getFieldProps('end_date')}
                            />
                            {formik.touched.end_date && formik.errors.end_date && (
                              <p className="form-error">{formik.errors.end_date}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="hourly_rate" className="form-label">Hourly Rate ($)</label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FiDollarSign className="w-5 h-5 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                id="hourly_rate"
                                name="hourly_rate"
                                placeholder="0.00"
                                className={`form-input pl-8 ${formik.touched.hourly_rate && formik.errors.hourly_rate ? 'border-red-500' : ''}`}
                                {...formik.getFieldProps('hourly_rate')}
                              />
                            </div>
                            {formik.touched.hourly_rate && formik.errors.hourly_rate && (
                              <p className="form-error">{formik.errors.hourly_rate}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="fixed_price" className="form-label">Fixed Price ($)</label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FiDollarSign className="w-5 h-5 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                id="fixed_price"
                                name="fixed_price"
                                placeholder="0.00"
                                className={`form-input pl-8 ${formik.touched.fixed_price && formik.errors.fixed_price ? 'border-red-500' : ''}`}
                                {...formik.getFieldProps('fixed_price')}
                              />
                            </div>
                            {formik.touched.fixed_price && formik.errors.fixed_price && (
                              <p className="form-error">{formik.errors.fixed_price}</p>
                            )}
                          </div>
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
                  {isEditing ? 'Update Project' : 'Create Project'}
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

export default Projects;