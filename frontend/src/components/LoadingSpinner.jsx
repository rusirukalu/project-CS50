import PropTypes from 'prop-types';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
        <p className="mt-2 text-gray-700">{text}</p>
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  text: PropTypes.string,
};

export default LoadingSpinner;
