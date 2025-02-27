import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { 
  FiPlus, FiX, FiEdit2, FiTrash2, FiAlertCircle,
  FiFile, FiFileText, FiImage, FiPaperclip, FiDownload,
} from 'react-icons/fi';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType) => {
  if (!fileType) return <FiFile />;
  if (fileType.includes('image')) {
    return <FiImage className="text-blue-500" />;
  } else if (fileType.includes('pdf')) {
    return <FiFileText className="text-red-500" />;
  } else if (
    fileType.includes('word') || 
    fileType.includes('document') ||
    fileType.includes('text')
  ) {
    return <FiFileText className="text-blue-500" />;
  } else {
    return <FiPaperclip className="text-gray-500" />;
  }
};

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filters, setFilters] = useState({
    project_id: '',
    document_type: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const queryParams = new URLSearchParams();
        if (filters.project_id) queryParams.append('project_id', filters.project_id);
        if (filters.document_type) queryParams.append('document_type', filters.document_type);
        
        const [documentsRes, projectsRes, typesRes] = await Promise.all([
          axios.get(`/api/documents/?${queryParams}`),
          axios.get('/api/projects/'),
          axios.get('/api/documents/types')
        ]);
        
        const projectData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
        setDocuments(Array.isArray(documentsRes.data) ? documentsRes.data : []);
        setProjects(projectData);
        setDocumentTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
        console.log('Projects fetched:', projectData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load documents:', err);
        console.error('Error response:', err.response?.data);
        setError('Failed to load documents');
        setProjects([]);
        setDocumentTypes([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const validationSchema = Yup.object().shape({
    project_id: Yup.number().required('Project is required'),
    name: Yup.string().required('Name is required'),
    document_type: Yup.string().required('Document type is required'),
    file: Yup.mixed()
      .test('fileRequired', 'File is required', function (value) {
        return isEditing ? true : !!value; // Only require file when not editing
      })
  });

  const formik = useFormik({
    initialValues: {
      project_id: '',
      name: '',
      document_type: '',
      description: '',
      file: null
    },
    validationSchema,
    validateOnMount: false,
    onSubmit: async (values) => {
      try {
        console.log('Submitting values:', values); // Debug
        if (isEditing) {
          await axios.put(`/api/documents/${currentDocument.id}`, {
            name: values.name,
            document_type: values.document_type,
            description: values.description
          });
          
          const queryParams = new URLSearchParams();
          if (filters.project_id) queryParams.append('project_id', filters.project_id);
          if (filters.document_type) queryParams.append('document_type', filters.document_type);
          
          const response = await axios.get(`/api/documents/?${queryParams}`);
          setDocuments(Array.isArray(response.data) ? response.data : []);
        } else {
          const formData = new FormData();
          formData.append('file', values.file);
          formData.append('project_id', values.project_id);
          formData.append('name', values.name);
          formData.append('document_type', values.document_type);
          formData.append('description', values.description || '');
          
          await axios.post('/api/documents/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: progressEvent => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          });
          
          const queryParams = new URLSearchParams();
          if (filters.project_id) queryParams.append('project_id', filters.project_id);
          if (filters.document_type) queryParams.append('document_type', filters.document_type);
          
          const response = await axios.get(`/api/documents/?${queryParams}`);
          setDocuments(Array.isArray(response.data) ? response.data : []);
        }
        
        formik.resetForm();
        setShowModal(false);
        setIsEditing(false);
        setCurrentDocument(null);
        setUploadProgress(0);
      } catch (err) {
        console.error('Document save error:', err);
        setError(err.response?.data?.message || 'Failed to save document');
      }
    }
  });

  const handleFileChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      formik.setValues({
        ...formik.values,
        name: formik.values.name || file.name,
        file: file
      });
    }
  };

  const handleEdit = (document) => {
    setCurrentDocument(document);
    setIsEditing(true);
    formik.setValues({
      project_id: document.project_id.toString(),
      name: document.name,
      document_type: document.document_type,
      description: document.description || '',
      file: null
    });
    setShowModal(true);
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/documents/${documentId}`);
      
      const queryParams = new URLSearchParams();
      if (filters.project_id) queryParams.append('project_id', filters.project_id);
      if (filters.document_type) queryParams.append('document_type', filters.document_type);
      
      const response = await axios.get(`/api/documents/?${queryParams}`);
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Document delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const resetFilters = () => {
    setFilters({
      project_id: '',
      document_type: '',
    });
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  if (loading && !documents.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setCurrentDocument(null);
            formik.resetForm();
            setShowModal(true);
          }}
          className="flex items-center justify-center mt-3 sm:mt-0 btn-primary"
        >
          <FiPlus className="mr-2" />
          Upload Document
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
              {Array.isArray(projects) && projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>

          <div className="flex-grow mb-4 md:mb-0">
            <label htmlFor="document_type_filter" className="block mb-1 text-sm font-medium text-gray-700">
              Document Type
            </label>
            <select
              id="document_type_filter"
              value={filters.document_type}
              onChange={(e) => setFilters({...filters, document_type: e.target.value})}
              className="form-input"
            >
              <option value="">All Types</option>
              {Array.isArray(documentTypes) && documentTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
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

      <div className="p-6 bg-white rounded-lg shadow-card">
        {documents.length === 0 ? (
          <div className="py-6 text-center">
            <FiFile className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading a document.</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  formik.resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center btn-primary"
              >
                <FiPlus className="mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map(document => (
              <div key={document.id} className="overflow-hidden transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg">
                        {getFileIcon(document.file_type)}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 truncate" title={document.name}>
                          {document.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <button
                        onClick={() => handleEdit(document)}
                        className="mr-2 text-gray-400 hover:text-gray-500"
                        title="Edit document"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(document.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete document"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    <p>
                      <span className="font-medium">Project: </span>
                      <Link 
                        to={`/projects/${document.project_id}`}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        {getProjectName(document.project_id)}
                      </Link>
                    </p>
                    <p className="mt-1">
                      <span className="font-medium">Size: </span>
                      {formatFileSize(document.file_size)}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium">Uploaded: </span>
                      {format(parseISO(document.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  
                  {document.description && (
                    <p className="mt-2 text-sm text-gray-600 truncate" title={document.description}>
                      {document.description}
                    </p>
                  )}
                  
                  <div className="flex justify-end pt-3 mt-4 border-t border-gray-200">
                    <a
                      href={`/api/documents/${document.id}/download`}
                      className="inline-flex items-center px-3 py-1 text-sm btn-outline"
                      download
                    >
                      <FiDownload className="mr-1.5 h-4 w-4" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              onClick={() => setShowModal(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiFile className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="w-full mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {isEditing ? 'Edit Document' : 'Upload Document'}
                    </h3>
                    
                    <form onSubmit={formik.handleSubmit} className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="project_id" className="form-label">
                            Project*
                          </label>
                          <select
                            id="project_id"
                            name="project_id"
                            className={`form-input ${formik.touched.project_id && formik.errors.project_id ? 'border-red-500' : ''}`}
                            {...formik.getFieldProps('project_id')}
                            disabled={isEditing}
                          >
                            <option value="">Select a project</option>
                            {Array.isArray(projects) && projects.length > 0 ? (
                              projects.map(project => (
                                <option key={project.id} value={project.id}>{project.title}</option>
                              ))
                            ) : (
                              <option value="" disabled>No projects available</option>
                            )}
                          </select>
                          {formik.touched.project_id && formik.errors.project_id && (
                            <p className="form-error">{formik.errors.project_id}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="name" className="form-label">
                            Document Name*
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            className={`form-input ${
                              formik.touched.name && formik.errors.name ? 'border-red-500' : ''
                            }`}
                            placeholder="Enter document name"
                            {...formik.getFieldProps('name')}
                          />
                          {formik.touched.name && formik.errors.name && (
                            <p className="form-error">{formik.errors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="document_type" className="form-label">
                            Document Type*
                          </label>
                          <select
                            id="document_type"
                            name="document_type"
                            className={`form-input ${
                              formik.touched.document_type && formik.errors.document_type ? 'border-red-500' : ''
                            }`}
                            {...formik.getFieldProps('document_type')}
                          >
                            <option value="">Select document type</option>
                            {Array.isArray(documentTypes) && documentTypes.map(type => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </select>
                          {formik.touched.document_type && formik.errors.document_type && (
                            <p className="form-error">{formik.errors.document_type}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="form-label">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows="2"
                            className="form-input"
                            placeholder="Optional document description"
                            {...formik.getFieldProps('description')}
                          ></textarea>
                        </div>
                        
                        {!isEditing && (
                          <div>
                            <label htmlFor="file" className="form-label">
                              File*
                            </label>
                            <div className="flex items-center mt-1">
                              <label className="block w-full">
                                <span className="sr-only">Choose file</span>
                                <input 
                                  id="file"
                                  name="file"
                                  type="file" 
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                  onChange={handleFileChange}
                                />
                              </label>
                            </div>
                            {formik.touched.file && formik.errors.file && (
                              <p className="form-error">{formik.errors.file}</p>
                            )}
                            
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="mt-2">
                                <div className="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                  <div 
                                    className="bg-primary-600 h-2.5 rounded-full" 
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  Uploading: {uploadProgress}%
                                </p>
                              </div>
                            )}
                          </div>
                        )}
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
                  {isEditing ? 'Update Document' : 'Upload Document'}
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

export default Documents;