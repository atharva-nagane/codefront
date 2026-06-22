const ErrorMessage = ({ message }) => {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca',
      color: '#dc2626', padding: '0.75rem 1rem',
      borderRadius: '8px', margin: '1rem 0'
    }}>
      {message || 'Something went wrong'}
    </div>
  );
};

export default ErrorMessage;