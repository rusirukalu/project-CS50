import { Link } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="flex flex-col justify-center min-h-screen bg-gray-100">
      <div className="max-w-md p-6 mx-auto text-center bg-white rounded-lg shadow-md">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-red-100 rounded-full">
          <FiAlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="mb-6 text-gray-600">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        
        <div className="flex flex-col justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center btn-primary"
          >
            <FiHome className="mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center btn-outline"
          >
            <FiArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
