import { FiCheckCircle } from 'react-icons/fi';
import PropTypes from 'prop-types';

const SuccessAlert = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="p-4 rounded-md bg-green-50">
      <div className="flex">
        <FiCheckCircle className="text-green-500 mt-0.5 mr-3" />
        <div>
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

SuccessAlert.propTypes = {
  message: PropTypes.string.isRequired,
};

export default SuccessAlert;
