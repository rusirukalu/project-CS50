import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { 
  FiPlus, FiX, FiEdit2, FiTrash2, FiAlertCircle,
  FiClock, FiCalendar, FiCheckCircle, FiFileText
} from 'react-icons/fi';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const TimeTracking = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [filters, setFilters] = useState({
    project_id: '',
    start_date: '',
    end_date: '',
    billable: ''
  });
  const [summary, setSummary] = useState({
    total_hours: 0,
    billable_hours: 0,
    billable_percentage: 0
  });
  
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });
  
  const formatDateForInput = (date) => format(date, 'yyyy-MM-dd');

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      start_date: formatDateForInput(startOfCurrentWeek),
      end_date: formatDateForInput(endOfCurrentWeek)
    }));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const queryParams = new URLSearchParams();
        if (filters.project_id) queryParams.append('project_id', filters.project_id);
        if (filters.start_date) queryParams.append('start_date', filters.start_date);
        if (filters.end_date) queryParams.append('end_date', filters.end_date);
        if (filters.billable !== '') queryParams.append('billable', filters.billable);
        
        const [timeRes, projectsRes, summaryRes] = await Promise.all([
          axios.get(`/api/time/?${queryParams}`),
          axios.get('/api/projects/'),
          axios.get(`/api/time/summary?start_date=${filters.start_date}&end_date=${filters.end_date}`)
        ]);
        
        setTimeEntries(Array.isArray(timeRes.data) ? timeRes.data : []);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        setSummary(summaryRes.data || { total_hours: 0, billable_hours: 0, billable_percentage: 0 });
        console.log('Time entries response:', timeRes.data); // Debug
      } catch (err) {
        console.error('Time entries loading error:', err);
        setError('Failed to load time entries');
        setTimeEntries([]);
        setProjects([]);
        setSummary({ total_hours: 0, billable_hours: 0, billable_percentage: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (filters.start_date && filters.end_date) {
      fetchData();
    }
  }, [filters]);

  const validationSchema = Yup.object({
    project_id: Yup.number().required('Project is required'),
    description: Yup.string().required('Description is required'),
    date: Yup.date().required('Date is required'),
    hours: Yup.number()
      .required('Hours are required')
      .positive('Hours must be positive')
      .max(24, 'Hours cannot exceed 24'),
    billable: Yup.boolean()
  });

  const formik = useFormik({
    initialValues: {
      project_id: '',
      description: '',
      date: formatDateForInput(new Date()),
      hours: '',
      billable: true
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const timeData = {
          ...values,
          hours: parseFloat(values.hours)
        };
        
        if (isEditing) {
          await axios.put(`/api/time/${currentEntry.id}`, timeData);
        } else {
          await axios.post('/api/time/', timeData);
        }
        
        const queryParams = new URLSearchParams();
        if (filters.project_id) queryParams.append('project_id', filters.project_id);
        if (filters.start_date) queryParams.append('start_date', filters.start_date);
        if (filters.end_date) queryParams.append('end_date', filters.end_date);
        if (filters.billable !== '') queryParams.append('billable', filters.billable);
        
        const [timeRes, summaryRes] = await Promise.all([
          axios.get(`/api/time/?${queryParams}`),
          axios.get(`/api/time/summary?start_date=${filters.start_date}&end_date=${filters.end_date}`)
        ]);
        
        setTimeEntries(Array.isArray(timeRes.data) ? timeRes.data : []);
        setSummary(summaryRes.data || { total_hours: 0, billable_hours: 0, billable_percentage: 0 });
        
        formik.resetForm();
        setShowModal(false);
        setIsEditing(false);
        setCurrentEntry(null);
      } catch (err) {
        console.error('Time entry save error:', err);
        setError(err.response?.data?.message || 'Failed to save time entry');
      }
    },
  });

  const handleEdit = (entry) => {
    setCurrentEntry(entry);
    setIsEditing(true);
    formik.setValues({
      project_id: entry.project_id.toString(),
      description: entry.description,
      date: entry.date,
      hours: entry.hours.toString(),
      billable: entry.billable
    });
    setShowModal(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) return;
    try {
      await axios.delete(`/api/time/${entryId}`);
      
      const queryParams = new URLSearchParams();
      if (filters.project_id) queryParams.append('project_id', filters.project_id);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.billable !== '') queryParams.append('billable', filters.billable);
      
      const [timeRes, summaryRes] = await Promise.all([
        axios.get(`/api/time/?${queryParams}`),
        axios.get(`/api/time/summary?start_date=${filters.start_date}&end_date=${filters.end_date}`)
      ]);
      
      setTimeEntries(Array.isArray(timeRes.data) ? timeRes.data : []);
      setSummary(summaryRes.data || { total_hours: 0, billable_hours: 0, billable_percentage: 0 });
    } catch (err) {
      console.error('Time entry delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete time entry');
    }
  };

  const resetFilters = () => {
    setFilters({
      project_id: '',
      start_date: formatDateForInput(startOfCurrentWeek),
      end_date: formatDateForInput(endOfCurrentWeek),
      billable: ''
    });
  };

  const entriesByDate = Array.isArray(timeEntries) ? 
    timeEntries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {}) : {};

  const getDatesInRange = () => {
    if (!filters.start_date || !filters.end_date) return [];
    const start = parseISO(filters.start_date);
    const end = parseISO(filters.end_date);
    return eachDayOfInterval({ start, end });
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  if (loading && !timeEntries.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading time entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900"></h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setCurrentEntry(null);
            formik.resetForm();
            setShowModal(true);
          }}
          className="flex items-center justify-center mt-3 sm:mt-0 btn-primary"
        >
          <FiPlus className="mr-2" />
          Log Time
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-4 bg-white rounded-lg shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-blue-100 rounded-full">
              <FiClock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_hours?.toFixed(1) || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 bg-green-100 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Billable Hours</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.billable_hours?.toFixed(1) || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-card">
          <div className="flex items-center">
            <div className="p-3 mr-4 rounded-full bg-amber-100">
              <FiFileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Billable Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(summary.billable_hours * (projects.length > 0 ? projects.reduce((sum, p) => sum + (p.hourly_rate || 0), 0) / projects.length : 0)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-card">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
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

          <div className="mb-4 md:mb-0">
            <label htmlFor="start_date_filter" className="block mb-1 text-sm font-medium text-gray-700">
              From
            </label>
            <input
              type="date"
              id="start_date_filter"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              className="form-input"
            />
          </div>

          <div className="mb-4 md:mb-0">
            <label htmlFor="end_date_filter" className="block mb-1 text-sm font-medium text-gray-700">
              To
            </label>
            <input
              type="date"
              id="end_date_filter"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              className="form-input"
            />
          </div>

          <div className="mb-4 md:mb-0">
            <label htmlFor="billable_filter" className="block mb-1 text-sm font-medium text-gray-700">
              Billable
            </label>
            <select
              id="billable_filter"
              value={filters.billable}
              onChange={(e) => setFilters({...filters, billable: e.target.value})}
              className="form-input"
            >
              <option value="">All</option>
              <option value="true">Billable</option>
              <option value="false">Non-billable</option>
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
        {timeEntries.length === 0 ? (
          <div className="p-6 text-center">
            <p className="mb-4 text-gray-500">No time entries found for the selected period</p>
            <button
              onClick={() => {
                setIsEditing(false);
                formik.resetForm();
                setShowModal(true);
              }}
              className="btn-primary"
            >
              <FiPlus className="inline mr-2" />
              Log Time
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {getDatesInRange().reverse().map(date => {
              const dateString = format(date, 'yyyy-MM-dd');
              const entries = entriesByDate[dateString] || [];
              const dayTotal = entries.reduce((sum, entry) => sum + entry.hours, 0);
              
              return (
                <div key={dateString} className="p-4">
                  <div className="flex flex-col mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className={`flex items-center ${isToday(date) ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
                      <FiCalendar className="mr-2" />
                      <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
                      {isToday(date) && <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">Today</span>}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 sm:mt-0">
                      {entries.length > 0 ? `${entries.length} entries · ${dayTotal.toFixed(1)} hours` : 'No entries'}
                    </div>
                  </div>
                  
                  {entries.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Project</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Hours</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link 
                                  to={`/projects/${entry.project_id}`}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  {getProjectName(entry.project_id)}
                                </Link>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{entry.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{entry.hours.toFixed(1)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
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
                              <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleEdit(entry)}
                                  className="mr-4 text-primary-600 hover:text-primary-900"
                                  disabled={entry.invoiced}
                                >
                                  <FiEdit2 className={`h-5 w-5 ${entry.invoiced ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={entry.invoiced}
                                >
                                  <FiTrash2 className={`h-5 w-5 ${entry.invoiced ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
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
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiClock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="w-full mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {isEditing ? 'Edit Time Entry' : 'Log Time'}
                    </h3>
                    <form onSubmit={formik.handleSubmit} className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="project_id" className="form-label">Project*</label>
                          <select
                            id="project_id"
                            name="project_id"
                            className={`form-input ${formik.touched.project_id && formik.errors.project_id ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('project_id')}
                          >
                            <option value="">Select a project</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.title}
                              </option>
                            ))}
                          </select>
                          {formik.touched.project_id && formik.errors.project_id && (
                            <p className="form-error">{formik.errors.project_id}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="description" className="form-label">Description*</label>
                          <textarea
                            id="description"
                            name="description"
                            rows="2"
                            placeholder="What did you work on?"
                            className={`form-input ${formik.touched.description && formik.errors.description ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('description')}
                          ></textarea>
                          {formik.touched.description && formik.errors.description && (
                            <p className="form-error">{formik.errors.description}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="date" className="form-label">Date*</label>
                            <input
                              type="date"
                              id="date"
                              name="date"
                              className={`form-input ${formik.touched.date && formik.errors.date ? 'border-red-500' : ''}`}
                              {...formik.getFieldProps('date')}
                            />
                            {formik.touched.date && formik.errors.date && (
                              <p className="form-error">{formik.errors.date}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="hours" className="form-label">Hours*</label>
                            <input
                              type="number"
                              id="hours"
                              name="hours"
                              step="0.1"
                              placeholder="0.0"
                              className={`form-input ${formik.touched.hours && formik.errors.hours ? 'border-red-500' : ''}`}
                              {...formik.getFieldProps('hours')}
                            />
                            {formik.touched.hours && formik.errors.hours && (
                              <p className="form-error">{formik.errors.hours}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="billable"
                            name="billable"
                            className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                            checked={formik.values.billable}
                            onChange={formik.handleChange}
                            disabled={isEditing && currentEntry?.invoiced}
                          />
                          <label htmlFor="billable" className="block ml-2 text-sm text-gray-900">
                            Billable
                            {isEditing && currentEntry?.invoiced && (
                              <span className="ml-2 text-xs text-gray-500">(Cannot change for invoiced entries)</span>
                            )}
                          </label>
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
                  {isEditing ? 'Update Time Entry' : 'Log Time'}
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

export default TimeTracking;