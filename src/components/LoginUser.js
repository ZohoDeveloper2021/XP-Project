/* global ZOHO */
import { createContext, useContext, useState, useEffect } from 'react';

export const LoginUserContext = createContext();

export function LoginUserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async (email) => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Users_Dev",
        criteria: `(Email == "${email}")`,
      });
      if (response.data && response.data.length > 0) {
        const userRecord = response.data[0];
        setUserId(userRecord.ID);
        setPermissions(userRecord.Permission);
      } else {
        setError('Could not fetch current employee');
      }
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError('Error fetching employee');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const userResponse = await ZOHO.CREATOR.UTIL.getInitParams();
        if (!userResponse?.loginUser) {
          throw new Error('User authentication failed');
        }
        const email = userResponse.loginUser;
        setCurrentUser(email);
        await fetchUser(email);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize application');
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);
  return (
    <LoginUserContext.Provider value={{ currentUser, userId, permissions, loading, error }}>
      {children}
    </LoginUserContext.Provider>
  );
}

export function useLoginUser() {
  return useContext(LoginUserContext);
}
