import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  FiUser, FiMail, FiDollarSign, FiBriefcase, FiLock, FiAlertCircle,
  FiCheckCircle, FiEdit2
} from 'react-icons/fi';

const Settings = () => {
  const { currentUser, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentUser?.profile_image || null);

  useEffect(() => {
    setImagePreview(currentUser?.profile_image || null); // Sync with currentUser on mount/update
  }, [currentUser]);

  const profileValidationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    username: Yup.string()
      .min(3, 'Username must be at least 3 characters')
      .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
      .required('Username is required'),
    specialization: Yup.string().required('Specialization is required'),
    hourly_rate: Yup.number().min(0, 'Hourly rate cannot be negative'),
    bio: Yup.string(),
  });

  const passwordValidationSchema = Yup.object({
    current_password: Yup.string().required('Current password is required'),
    new_password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('New password is required'),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('new_password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const profileFormik = useFormik({
    initialValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      username: currentUser?.username || '',
      specialization: currentUser?.specialization || '',
      hourly_rate: currentUser?.hourly_rate || '',
      bio: currentUser?.bio || '',
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoadingProfile(true);
        setProfileError('');
        setProfileSuccess('');
        
        let imageUrl = currentUser?.profile_image;
        if (selectedImage) {
          const formData = new FormData();
          formData.append('profile_image', selectedImage);
          const response = await axios.post('/api/auth/user/profile-image', formData, {
            headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'multipart/form-data' }
          });
          imageUrl = response.data.image_url; // Use full URL from backend
          setImagePreview(imageUrl); // Update preview immediately
        }
        
        const userData = {
          name: values.name,
          email: values.email,
          username: values.username,
          specialization: values.specialization,
          hourly_rate: values.hourly_rate ? parseFloat(values.hourly_rate) : undefined,
          bio: values.bio,
          profile_image: imageUrl
        };
        
        await updateProfile(userData);
        setProfileSuccess('Profile updated successfully');
        setLoadingProfile(false);
        
        // Refresh currentUser to ensure sync
        const refreshedUser = await axios.get('/api/auth/user', { headers: { 'Cache-Control': 'no-cache' } });
        updateProfile(refreshedUser.data); // Update AuthContext state
      } catch (err) {
        console.error('Profile update error:', err.response?.data || err);
        setProfileError(
          err.response?.data?.message || err.response?.data?.error || 'Failed to update profile'
        );
        setLoadingProfile(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoadingPassword(true);
        setPasswordError('');
        setPasswordSuccess('');
        
        await axios.put('/api/auth/user/password', {
          current_password: values.current_password,
          new_password: values.new_password,
        }, { headers: { 'Cache-Control': 'no-cache' } });
        
        setPasswordSuccess('Password updated successfully');
        passwordFormik.resetForm();
        setLoadingPassword(false);
      } catch (err) {
        console.error('Password update error:', err);
        setPasswordError(
          err.response?.data?.message || err.response?.data?.error || 'Failed to update password'
        );
        setLoadingPassword(false);
      }
    },
  });

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result; // Data URL for preview
        setImagePreview(previewUrl); // Use data URL for preview, not server URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => fileInputRef.current.click();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="overflow-hidden bg-white rounded-lg shadow-card">
        <div className="border-b border-gray-200">
          <nav className="flex px-6 space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="mb-6 text-lg font-medium text-gray-900">Profile Information</h2>

              {profileSuccess && (
                <div className="p-4 mb-4 border-l-4 border-green-500 bg-green-50">
                  <div className="flex items-center">
                    <FiCheckCircle className="mr-2 text-green-500" />
                    <p className="text-sm text-green-700">{profileSuccess}</p>
                  </div>
                </div>
              )}

              {profileError && (
                <div className="p-4 mb-4 border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-center">
                    <FiAlertCircle className="mr-2 text-red-500" />
                    <p className="text-sm text-red-700">{profileError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={profileFormik.handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    <div 
                      className="flex items-center justify-center w-24 h-24 overflow-hidden bg-gray-100 rounded-full cursor-pointer"
                      onClick={handleImageClick}
                    >
                      {imagePreview ? (
                        <img 
                          src={imagePreview.startsWith('data:') ? imagePreview : (imagePreview.startsWith('http') ? imagePreview : `http://localhost:5001${imagePreview}`)} 
                          alt="Profile" 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            setImagePreview(currentUser?.profile_image || null); // Fallback to currentUser image or default
                          }}
                        />
                      ) : (
                        <FiUser className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div 
                      className="absolute bottom-0 right-0 p-1 rounded-full cursor-pointer bg-primary-500"
                      onClick={handleImageClick}
                    >
                      <FiEdit2 className="w-4 h-4 text-white" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">{currentUser?.name}</h3>
                    <p className="text-sm text-gray-500">{currentUser?.email}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Change your profile picture by clicking on it
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="form-label">Name</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiUser className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-input pl-10 ${profileFormik.touched.name && profileFormik.errors.name ? 'border-red-500' : ''}`}
                        {...profileFormik.getFieldProps('name')}
                      />
                    </div>
                    {profileFormik.touched.name && profileFormik.errors.name && (
                      <p className="form-error">{profileFormik.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiMail className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-input pl-10 ${profileFormik.touched.email && profileFormik.errors.email ? 'border-red-500' : ''}`}
                        {...profileFormik.getFieldProps('email')}
                      />
                    </div>
                    {profileFormik.touched.email && profileFormik.errors.email && (
                      <p className="form-error">{profileFormik.errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="username" className="form-label">Username</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <div className="text-gray-400">@</div>
                      </div>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className={`form-input pl-10 ${profileFormik.touched.username && profileFormik.errors.username ? 'border-red-500' : ''}`}
                        {...profileFormik.getFieldProps('username')}
                      />
                    </div>
                    {profileFormik.touched.username && profileFormik.errors.username && (
                      <p className="form-error">{profileFormik.errors.username}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="specialization" className="form-label">Specialization</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiBriefcase className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="specialization"
                        name="specialization"
                        className={`form-input pl-10 ${profileFormik.touched.specialization && profileFormik.errors.specialization ? 'border-red-500' : ''}`}
                        placeholder="e.g. Web Developer, Designer"
                        {...profileFormik.getFieldProps('specialization')}
                      />
                    </div>
                    {profileFormik.touched.specialization && profileFormik.errors.specialization && (
                      <p className="form-error">{profileFormik.errors.specialization}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="hourly_rate" className="form-label">Hourly Rate ($)</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiDollarSign className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="hourly_rate"
                        name="hourly_rate"
                        placeholder="0.00"
                        className={`form-input pl-10 ${profileFormik.touched.hourly_rate && profileFormik.errors.hourly_rate ? 'border-red-500' : ''}`}
                        {...profileFormik.getFieldProps('hourly_rate')}
                      />
                    </div>
                    {profileFormik.touched.hourly_rate && profileFormik.errors.hourly_rate && (
                      <p className="form-error">{profileFormik.errors.hourly_rate}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bio" className="form-label">Bio</label>
                    <div className="mt-1">
                      <textarea
                        id="bio"
                        name="bio"
                        rows="4"
                        className="form-input"
                        placeholder="Write a short bio about yourself"
                        {...profileFormik.getFieldProps('bio')}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingProfile}
                    className="btn-primary"
                  >
                    {loadingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="mb-6 text-lg font-medium text-gray-900">Security Settings</h2>

              {passwordSuccess && (
                <div className="p-4 mb-4 border-l-4 border-green-500 bg-green-50">
                  <div className="flex items-center">
                    <FiCheckCircle className="mr-2 text-green-500" />
                    <p className="text-sm text-green-700">{passwordSuccess}</p>
                  </div>
                </div>
              )}

              {passwordError && (
                <div className="p-4 mb-4 border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-center">
                    <FiAlertCircle className="mr-2 text-red-500" />
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={passwordFormik.handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="current_password" className="form-label">Current Password</label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      className={`form-input pl-10 ${passwordFormik.touched.current_password && passwordFormik.errors.current_password ? 'border-red-500' : ''}`}
                      {...passwordFormik.getFieldProps('current_password')}
                    />
                  </div>
                  {passwordFormik.touched.current_password && passwordFormik.errors.current_password && (
                    <p className="form-error">{passwordFormik.errors.current_password}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new_password" className="form-label">New Password</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiLock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="new_password"
                        name="new_password"
                        className={`form-input pl-10 ${passwordFormik.touched.new_password && passwordFormik.errors.new_password ? 'border-red-500' : ''}`}
                        {...passwordFormik.getFieldProps('new_password')}
                      />
                    </div>
                    {passwordFormik.touched.new_password && passwordFormik.errors.new_password && (
                      <p className="form-error">{passwordFormik.errors.new_password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirm_password" className="form-label">Confirm New Password</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiLock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        className={`form-input pl-10 ${passwordFormik.touched.confirm_password && passwordFormik.errors.confirm_password ? 'border-red-500' : ''}`}
                        {...passwordFormik.getFieldProps('confirm_password')}
                      />
                    </div>
                    {passwordFormik.touched.confirm_password && passwordFormik.errors.confirm_password && (
                      <p className="form-error">{passwordFormik.errors.confirm_password}</p>
                    )}
                  </div>
                </div>

                <div className="py-3 text-right bg-gray-50">
                  <button
                    type="submit"
                    disabled={loadingPassword}
                    className="btn-primary"
                  >
                    {loadingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              <div className="pt-6 mt-10 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Portfolio Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure your public portfolio page at:{' '}
                  <a 
                    href={`/portfolio/${currentUser?.username}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800"
                  >
                    /portfolio/{currentUser?.username}
                  </a>
                </p>
                
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => window.open(`/portfolio/${currentUser?.username}`)}
                    className="btn-outline"
                  >
                    View My Portfolio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;