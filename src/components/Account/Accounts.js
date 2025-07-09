/* global ZOHO */
import { useState, useEffect, useCallback } from 'react';
import { useLoginUser } from '../LoginUser';
import AccountDetailsPage from './AccountDetailsPage';
import AddAccount from './AddAccount';
import { useTabs } from '../TabContext';
import ContactDetailsPage from '../Contact/ContactDetailsPage';

const ContactsPopup = ({ contacts, onClose, onContactClick }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Account Contacts</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          {contacts.length > 0 ? (
            contacts.map(contact => (
              <div 
                key={contact.Contact_Id} 
                className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => onContactClick(contact.Contact_Id)}
              >
                <p className="text-sm font-medium text-gray-900">{contact.Contact_Name}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No contacts available</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Accounts = () => {
  const { activeTab, setActiveTab, tabs } = useTabs();
  const { currentUser, permissions, loading: userLoading, error: userError } = useLoginUser();
  const [sortBy, setSortBy] = useState('recent');
  const [accounts, setAccounts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawAccountsData, setRawAccountsData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20
  });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [showContactsPopup, setShowContactsPopup] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [redirectToContact, setRedirectToContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const isTeamLead = permissions?.includes('Team Lead');

  useEffect(() => {
    const storedAccountId = localStorage.getItem('selectedAccountId');
    const storedContactId = localStorage.getItem('selectedContactId');
    
    if (storedAccountId) {
      const fetchStoredAccount = async () => {
        try {
          const config = {
            app_name: 'lead-management-system',
            report_name: 'All_Accounts_Dev',
            id: storedAccountId,
          };

          const response = await ZOHO.CREATOR.DATA.getRecordById(config);
          if (response && response.data) {
            setSelectedAccount(response.data);
            localStorage.removeItem('selectedAccountId');
          }
        } catch (error) {
          console.error('Error fetching stored account:', error);
          localStorage.removeItem('selectedAccountId');
        }
      };

      fetchStoredAccount();
    }

    if (storedContactId) {
      const fetchStoredContact = async () => {
        try {
          const config = {
            app_name: 'lead-management-system',
            report_name: 'All_Contacts_Dev',
            id: storedContactId,
          };
          const response = await ZOHO.CREATOR.DATA.getRecordById(config);
          if (response && response.data) {
            setSelectedContact(response.data);
            setRedirectToContact(true);
            setActiveTab('Contacts');
            localStorage.removeItem('selectedContactId');
          }
        } catch (error) {
          console.error('Error fetching stored contact:', error);
          localStorage.removeItem('selectedContactId');
        }
      };
      fetchStoredContact();
    }
  }, [currentUser, setActiveTab]);

  const parseContacts = (contactsMap) => {
    try {
      if (!contactsMap) return [];
      
      if (Array.isArray(contactsMap)) {
        return contactsMap.map(c => ({

          Contact_Name: c.Contact_Name || c.name || 'Unknown',
          Contact_Id: String(c.Contact_Id || c.id || '')
        }));
      }
      
      if (typeof contactsMap === 'string') {
        // Handle string format: {"Contact_Name":"...","Contact_Id":...},...
        const contactStrings = contactsMap.split('},{');
        
        return contactStrings.map(str => {
          const cleanStr = str.replace(/[{}"]/g, '');
          const pairs = cleanStr.split(',');
          
          let contactName = 'Unknown';
          let contactId = '';
          
          pairs.forEach(pair => {
            const [key, value] = pair.split(':');
            if (key === 'Contact_Name') {
              contactName = value || 'Unknown';
            } else if (key === 'Contact_Id') {
              contactId = String(value || '');
            }
          });
          
          return { Contact_Name: contactName, Contact_Id: contactId };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing contacts:', error);
      return [];
    }
  };

  const fetchAccountsBatch = useCallback(async (cursor = null) => {
    try {
      let config = {
        app_name: "lead-management-system",
        report_name: "All_Accounts_Dev",
        max_records: 1000,
        ...(cursor && { record_cursor: cursor })
      };
      
      if (isTeamLead === false) {
        config.criteria = `Account_Owner.Email == "${currentUser}"`;
      }

      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      
      if (!response?.data || !Array.isArray(response.data)) {
        return { accounts: [], rawAccounts: [], nextCursor: null };
      }
      

      const transformedAccounts = response.data.map(account => ({
        id: account.ID,
        name: account.Account_Name || ''.trim(),
        type: account.Type || '',
        rating: account.Rating || '',
        phone: account.Phone || '',
        website: account.Website?.url || account.Website?.value || '',
        industry: account.Industry?.ID || '',
        employees: account.Employees || '',
        owner: account.Owner?.name || account.Owner?.zc_display_value || '',
        rawData: account,
        contacts: account.Contacts_Map ? parseContacts(account.Contacts_Map) : []
        
      }));
      

      return {
        accounts: transformedAccounts,
        rawAccounts: response.data,
        nextCursor: response.record_cursor || null
      };
    } catch (error) {
      console.error('Error fetching accounts batch:', error);
      throw error;
    }
  }, [currentUser, isTeamLead]);

  const loadAllAccounts = useCallback(async () => {
    if (!currentUser) return;
    
    setDataLoading(true);
    setError(null);
    
    try {
      let allAccounts = [];
      let allRawAccounts = [];
      let cursor = null;
      let hasMore = true;
      const maxBatches = 10;
  
      for (let batch = 0; hasMore && batch < maxBatches; batch++) {
        const { accounts: batchAccounts, rawAccounts: batchRawAccounts, nextCursor } = 
          await fetchAccountsBatch(cursor);
        allAccounts = [...allAccounts, ...batchAccounts];
        allRawAccounts = [...allRawAccounts, ...batchRawAccounts];
        cursor = nextCursor;
        hasMore = !!nextCursor;
      }
  
      setAccounts(allAccounts);
      setRawAccountsData(allRawAccounts);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(allAccounts.length / prev.pageSize)
      }));
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setDataLoading(false);
    }
  }, [currentUser, fetchAccountsBatch]);

  useEffect(() => {
    if (currentUser) {
      loadAllAccounts();
    }
  }, [currentUser, loadAllAccounts]);

  const getSortedPaginatedAccounts = () => {
    const sorted = [...accounts].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.rawData?.Created_Time || 0) - new Date(a.rawData?.Created_Time || 0);
      }
      return a.name.localeCompare(b.name);
    });

    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    return sorted.slice(startIndex, startIndex + pagination.pageSize);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleRowDoubleClick = (account) => {
    setSelectedAccount(account.rawData || account);
  };

  const handleContactClick = async (contactId) => {
    try {
      // Store the selected account ID if we have one
      if (selectedAccount?.ID) {
        localStorage.setItem('selectedAccountId', selectedAccount.ID);
      }
      
      // Store the contact ID to fetch
      localStorage.setItem('selectedContactId', contactId.toString());
      
      // Redirect to contacts tab
      setRedirectToContact(true);
      setActiveTab('Contacts');
    } catch (error) {
      console.error('Error handling contact click:', error);
      localStorage.removeItem('selectedContactId');
      localStorage.removeItem('selectedAccountId');
    }
  };

  const handleContactsCellClick = (contacts, e) => {
    e.stopPropagation();
    if (contacts.length === 1) {
      handleContactClick(contacts[0].Contact_Id);
    } else {
      setSelectedContacts(contacts);
      setShowContactsPopup(true);
    }
  };

  if (redirectToContact) {
    return (
      <ContactDetailsPage
        contact={selectedContact}
        onClose={() => {
          setRedirectToContact(false);
          setSelectedContact(null);
        }}
        currentUser={currentUser}
        canEdit={isTeamLead}
        setActiveTabMain={setActiveTab}
      />
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f29d29] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f29d29] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts data...</p>
        </div>
      </div>
    );
  }
console.log(selectedAccount)
  const displayedAccounts = getSortedPaginatedAccounts();
  const { currentPage, totalPages, pageSize } = pagination;
  const totalAccounts = accounts.length;
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalAccounts);
  const endItem = Math.min(currentPage * pageSize, totalAccounts);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center">
            <img 
              src="https://i.postimg.cc/gcSCSN1P/xpertprime-black-logo.png"
              alt="Xpert Prime Logo" 
              className="h-8 mr-2"
            />
            <h1 className="text-3xl font-light text-[#f29d29]">Xpert Prime</h1>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 text-sm font-medium ${
                  tab === 'Accounts'
                    ? 'text-[#f29d29] border-b-2 border-[#f29d29]'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-light text-gray-800">Accounts</h2>
            {currentUser && (
              <p className="text-sm text-gray-500">Showing accounts for: {currentUser}</p>
            )}
          </div>
          
          <div className="flex space-x-4">
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f29d29] focus:border-[#f29d29]"
                  >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name (A-Z)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowAddAccountForm(true)}
                  className="bg-[#f29d29] hover:bg-[#e08a1a] text-white px-4 py-2 rounded-md text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Account
                </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Account Source</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedAccounts.length > 0 ? (
                  displayedAccounts.map((account) => (
                    <tr 
                    key={account.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => handleRowDoubleClick(account)}
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        {account.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{account.name}</div>
                      </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 mt-2 whitespace-nowrap text-sm text-gray-500 flex justify-center items-center">
                      {account.contacts.length > 0 ? (
                      <div 
                        className="flex flex-row items-center gap-1 cursor-pointer hover:underline text-[#f29d29]"
                        onClick={(e) => handleContactsCellClick(account.contacts, e)}
                      >
                        <span>{account.contacts[0].Contact_Name}</span>
                        {account.contacts.length > 1 && (
                        <span className="text-xs text-[#f29d29] mt-1 rounded-full font-bold">
                          +{account.contacts.length - 1}
                        </span>
                        )}
                      </div>
                      ) : (
                      'No Contact'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {account.rawData.Account_Source.zc_display_value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {account.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {account.website ? (
                      <a 
                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f29d29] hover:underline"
                      >
                        {account.website}
                      </a>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {account.rawData.Industry && account.rawData.Industry.zc_display_value
                      ? account.rawData.Industry.zc_display_value
                      : 'No Industry'}
                    </td>
                    
                    </tr>
                  ))
                  ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No accounts found
                    </td>
                  </tr>
                  )}
                </tbody>
                </table>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalAccounts}</span> results
                </div>
                <nav className="flex space-x-1">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || totalAccounts === 0}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={totalAccounts === 0}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'border-[#f29d29] text-white bg-[#f29d29] hover:bg-[#e08a1a]'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  } ${totalAccounts === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalAccounts === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </main>

      {showContactsPopup && (
        <ContactsPopup 
          contacts={selectedContacts}
          onClose={() => setShowContactsPopup(false)}
          onContactClick={handleContactClick}
        />
      )}
      
      <AccountDetailsPage 
        account={selectedAccount} 
        onClose={() => setSelectedAccount(null)}
        currentUser={currentUser}
        setActiveTabMain={setActiveTab}
      />
      
      {showAddAccountForm && (
        <AddAccount 
          onClose={() => setShowAddAccountForm(false)} 
          onAccountAdded={() => {
            setShowAddAccountForm(false);
            loadAllAccounts();
          }}
          currentUser={currentUser}
          permissions={permissions}
        />
      )}
    </div>
  );
};

export default Accounts;