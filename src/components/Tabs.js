// src/Tabs.js
import { useLoginUser } from './LoginUser';
import Leads from './Lead/Leads';
import Contacts from './Contact/Contacts';
import Accounts from './Account/Accounts';
import Deals from './Deal/Deals';
import { useTabs } from './TabContext';

const Tabs = () => {
  const { activeTab, selectedAccountId, setSelectedAccountId  } = useTabs();
  const { loading, error } = useLoginUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f29d29] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-red-500 max-w-md">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-4 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#f29d29] hover:bg-[#e08a1a] text-white px-4 py-2 rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {activeTab === 'Leads' && <Leads />}
      {activeTab === 'Contacts' && <Contacts />}
      {activeTab === 'Accounts' && (
        <Accounts 
          preselectedAccountId={selectedAccountId}
          onAccountClose={() => setSelectedAccountId(null)}
        />
      )}
      {activeTab === 'Deals' && <Deals />}
    </div>
  );
};

export default Tabs;