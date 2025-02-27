import { FiAlertCircle } from 'react-icons/fi';
import PropTypes from 'prop-types';

const ErrorAlert = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="p-4 rounded-md bg-red-50">
      <div className="flex">
        <FiAlertCircle className="text-red-500 mt-0.5 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

ErrorAlert.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ErrorAlert;
