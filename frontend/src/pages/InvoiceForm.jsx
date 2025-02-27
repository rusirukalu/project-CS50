import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { 
  FiArrowLeft, FiSave, FiPlus, FiTrash2, FiAlertCircle,
  FiCalendar, FiClock
} from 'react-icons/fi';

const formatDateForInput = (date) => {
  if (!date) return '';
  return typeof date === 'string' ? date.slice(0, 10) : format(date, 'yyyy-MM-dd');
};

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);

  // Define formik before useEffect
  const formik = useFormik({
    initialValues: {
      project_id: '',
      issue_date: formatDateForInput(new Date()),
      due_date: formatDateForInput(addDays(new Date(), 30)),
      notes: '',
    },
    validationSchema: Yup.object({
      project_id: Yup.string().required('Project is required'),
      issue_date: Yup.date().required('Issue date is required'),
      due_date: Yup.date().required('Due date is required'),
      notes: Yup.string(),
    }),
    onSubmit: handleSubmit
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const projectsRes = await axios.get('/api/projects/');
        const projectData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
        setProjects(projectData);
        
        if (isEditing) {
          const invoiceRes = await axios.get(`/api/invoices/${id}`);
          const invoice = invoiceRes.data;
          formik.setValues({
            project_id: invoice.project_id.toString(),
            issue_date: formatDateForInput(invoice.issue_date),
            due_date: formatDateForInput(invoice.due_date),
            notes: invoice.notes || '',
          });
          setItems(invoice.items || [{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        console.error('Response:', err.response?.data);
        setError('Failed to load data. Please try again.');
        setProjects([]);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditing]);

  useEffect(() => {
    const fetchTimeEntries = async () => {
      if (!formik.values.project_id) return;
      
      try {
        const response = await axios.get(`/api/time/?project_id=${formik.values.project_id}&billable=true&invoiced=false`);
        setTimeEntries(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error loading time entries:', err);
        setTimeEntries([]);
      }
    };
    
    fetchTimeEntries();
  }, [formik.values.project_id]);

  async function handleSubmit(values) {
    if (items.length === 0) {
      setError('At least one invoice item is required');
      return;
    }
    
    for (const item of items) {
      if (!item.description || item.quantity <= 0) {
        setError('All invoice items must have a description and quantity');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const invoiceData = {
        project_id: parseInt(values.project_id),
        issue_date: values.issue_date,
        due_date: values.due_date,
        notes: values.notes,
        items: items
      };
      
      if (isEditing) {
        await axios.put(`/api/invoices/${id}`, invoiceData);
      } else {
        await axios.post('/api/invoices/', invoiceData);
      }
      
      navigate('/invoices');
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError(err.response?.data?.message || 'Failed to save invoice');
      setSubmitting(false);
    }
  }

  const getProjectHourlyRate = () => {
    const project = projects.find(p => p.id.toString() === formik.values.project_id);
    return project?.hourly_rate || 0;
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: getProjectHourlyRate(), total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'quantity' || field === 'unit_price' ? parseFloat(value) || 0 : value;
    newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const generateFromTime = () => {
    if (!formik.values.project_id || timeEntries.length === 0) return;
    
    const entriesByDate = timeEntries.reduce((acc, entry) => {
      const date = entry.date.slice(0, 10);
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {});
    
    const newItems = Object.entries(entriesByDate).map(([date, entries]) => {
      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      const descriptions = entries.map(entry => entry.description).join(', ');
      return {
        description: `Work on ${date}: ${descriptions}`,
        quantity: totalHours,
        unit_price: getProjectHourlyRate(),
        total: totalHours * getProjectHourlyRate()
      };
    });
    
    setItems(newItems);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/invoices" className="mr-4 text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
        </div>
        
        {!isEditing && timeEntries.length > 0 && (
          <button
            type="button"
            onClick={generateFromTime}
            className="flex items-center mt-3 sm:mt-0 btn-outline"
          >
            <FiClock className="mr-2" />
            Generate from Time Entries
          </button>
        )}
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

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow-card">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Invoice Details</h2>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="project_id" className="form-label">
                Project*
              </label>
              <select
                id="project_id"
                name="project_id"
                className={`form-input ${
                  formik.touched.project_id && formik.errors.project_id ? 'border-red-500' : ''
                }`}
                {...formik.getFieldProps('project_id')}
                disabled={isEditing}
              >
                <option value="">Select a project</option>
                {Array.isArray(projects) && projects.length > 0 ? (
                  projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No projects available</option>
                )}
              </select>
              {formik.touched.project_id && formik.errors.project_id && (
                <p className="form-error">{formik.errors.project_id}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              {/* Placeholder for alignment */}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="issue_date" className="form-label">
                Issue Date*
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiCalendar className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="issue_date"
                  name="issue_date"
                  className={`form-input pl-10 ${
                    formik.touched.issue_date && formik.errors.issue_date ? 'border-red-500' : ''
                  }`}
                  {...formik.getFieldProps('issue_date')}
                />
              </div>
              {formik.touched.issue_date && formik.errors.issue_date && (
                <p className="form-error">{formik.errors.issue_date}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="due_date" className="form-label">
                Due Date*
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiCalendar className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  className={`form-input pl-10 ${
                    formik.touched.due_date && formik.errors.due_date ? 'border-red-500' : ''
                  }`}
                  {...formik.getFieldProps('due_date')}
                />
              </div>
              {formik.touched.due_date && formik.errors.due_date && (
                <p className="form-error">{formik.errors.due_date}</p>
              )}
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                className="form-input"
                placeholder="Payment terms, thank you note, or additional information"
                {...formik.getFieldProps('notes')}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-lg shadow-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Invoice Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center py-1 btn-outline"
            >
              <FiPlus className="mr-2" />
              Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="w-32 px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="w-20 px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="text-right form-input"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          className="pr-3 text-right form-input pl-7"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
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
                    ${calculateTotal().toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            to="/invoices"
            className="mr-4 btn-outline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center btn-primary"
          >
            <FiSave className="mr-2" />
            {submitting ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;