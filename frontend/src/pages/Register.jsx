import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiBriefcase, FiDollarSign } from 'react-icons/fi';

const Register = () => {
  const { register, currentUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      specialization: '',
      hourly_rate: '',
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be less than 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
        .required('Username is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
      name: Yup.string()
        .required('Name is required'),
      specialization: Yup.string()
        .required('Specialization is required'),
      hourly_rate: Yup.number()
        .min(0, 'Hourly rate cannot be negative')
        .typeError('Hourly rate must be a number'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      const userData = {
        username: values.username,
        email: values.email,
        password: values.password,
        name: values.name,
        specialization: values.specialization,
        hourly_rate: values.hourly_rate ? parseFloat(values.hourly_rate) : 0,
      };
      
      try {
        const user = await register(userData);
        console.log('Registration success:', user); // Already present, kept for consistency
        navigate('/');
      } catch (err) {
        console.error('Register error:', err.response?.data);
        setError(
          err.response?.status === 400 && err.response?.data?.error === 'Username already taken'
            ? 'Username is already taken'
            : err.response?.status === 400 && err.response?.data?.error === 'Email already registered'
            ? 'Email is already registered'
            : err.response?.data?.error || 
              err.response?.data?.message || 
              'Failed to register. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-100 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-center text-gray-600">
          Join Freelance Manager and start organizing your business
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 py-8 bg-white shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="p-4 mb-4 border-l-4 border-red-500 bg-red-50">
              <div className="flex items-center">
                <FiAlertCircle className="mr-2 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiUser className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  className={`form-input pl-10 ${
                    formik.touched.username && formik.errors.username
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="Username"
                  {...formik.getFieldProps('username')}
                />
              </div>
              {formik.touched.username && formik.errors.username && (
                <p className="form-error">{formik.errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiMail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`form-input pl-10 ${
                    formik.touched.email && formik.errors.email
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="Email address"
                  {...formik.getFieldProps('email')}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="form-error">{formik.errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    className={`form-input pl-10 ${
                      formik.touched.password && formik.errors.password
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : ''
                    }`}
                    placeholder="Password"
                    {...formik.getFieldProps('password')}
                  />
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="form-error">{formik.errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`form-input pl-10 ${
                      formik.touched.confirmPassword && formik.errors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : ''
                    }`}
                    placeholder="Confirm password"
                    {...formik.getFieldProps('confirmPassword')}
                  />
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="form-error">{formik.errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiUser className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={`form-input pl-10 ${
                    formik.touched.name && formik.errors.name
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="Your full name"
                  {...formik.getFieldProps('name')}
                />
              </div>
              {formik.touched.name && formik.errors.name && (
                <p className="form-error">{formik.errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="specialization" className="form-label">
                Specialization
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiBriefcase className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  className={`form-input pl-10 ${
                    formik.touched.specialization && formik.errors.specialization
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="e.g. Web Developer, Graphic Designer"
                  {...formik.getFieldProps('specialization')}
                />
              </div>
              {formik.touched.specialization && formik.errors.specialization && (
                <p className="form-error">{formik.errors.specialization}</p>
              )}
            </div>

            <div>
              <label htmlFor="hourly_rate" className="form-label">
                Hourly Rate (optional)
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiDollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="text"
                  className={`form-input pl-10 ${
                    formik.touched.hourly_rate && formik.errors.hourly_rate
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                  placeholder="Your default hourly rate"
                  {...formik.getFieldProps('hourly_rate')}
                />
              </div>
              {formik.touched.hourly_rate && formik.errors.hourly_rate && (
                <p className="form-error">{formik.errors.hourly_rate}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex justify-center w-full px-4 py-2 btn-primary"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;