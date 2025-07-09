/* global ZOHO */
import { useState, useEffect, useCallback } from 'react';
import { useLoginUser } from '../LoginUser';
import ContactDetailsPage from './ContactDetailsPage';
import AccountDetailsPage from '../Account/AccountDetailsPage';
import AddContact from './AddContact';
import { useTabs } from '../TabContext';

// Date parsing utility function (same as in Deals component)
const parseCustomDate = (dateStr) => {
  if (!dateStr) return new Date(0); // Return epoch if no date
  
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('-');
  const [hours, minutes, seconds] = timePart ? timePart.split(':') : [0, 0, 0];

  return new Date(
    parseInt(year),
    months[month],
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
};

const Contacts = () => {
  const { activeTab, setActiveTab, tabs } = useTabs();
  const { currentUser, userId, permissions, loading: userLoading, error: userError } = useLoginUser();
  const [sortBy, setSortBy] = useState('recent');
  const [contacts, setContacts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawContactsData, setRawContactsData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
  });
  const [selectedContact, setSelectedContact] = useState(null);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [filters, setFilters] = useState({
    owner: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const isTeamLead = permissions?.includes('Team Lead');
  const canEditRecords = isTeamLead;

  // State for account redirection
  const [redirectToAccount, setRedirectToAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchContactsBatch = useCallback(async (cursor = null) => {
    try {
      let config = {
        app_name: "lead-management-system",
        report_name: "All_Contacts_Dev",
        max_records: 1000,
        ...(cursor && { record_cursor: cursor })
      };

      // Only filter by current user if they're NOT a team lead
      if (isTeamLead === false) {
        config.criteria = `Contact_Owner.Email == "${currentUser}"`;
      }

      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      
      if (!response?.data || !Array.isArray(response.data)) {
        return { contacts: [], rawContacts: [], nextCursor: null };
      }
  
      const transformedContacts = response.data.map(contact => ({
        id: contact.ID,
        name: contact.Name || ''.trim(),
        account: contact.Account_Name?.zc_display_value || contact.Accounts?.Name || 'No Account',
        accountId: contact.Account_Name?.ID,
        email: contact.Email || '',
        phone: contact.Phone_Number2 || '',
        title: contact.Title || '',
        lastContact: contact.Added_Time || '',
        owner: contact.Contact_Owner?.zc_display_value || contact.Contact_Owner?.Name || 'N/A',
        rawData: contact
      }));
  
      return {
        contacts: transformedContacts,
        rawContacts: response.data,
        nextCursor: response.record_cursor || null
      };
    } catch (error) {
      console.error('Error fetching contacts batch:', error);
      throw error;
    }
  }, [currentUser, isTeamLead]);

  const loadAllContacts = useCallback(async () => {
    if (!currentUser) return;
    
    setDataLoading(true);
    setError(null);
    
    try {
      let allContacts = [];
      let allRawContacts = [];
      let cursor = null;
      let hasMore = true;
      const maxBatches = 10;
  
      for (let batch = 0; hasMore && batch < maxBatches; batch++) {
        const { contacts: batchContacts, rawContacts: batchRawContacts, nextCursor } = await fetchContactsBatch(cursor);
        allContacts = [...allContacts, ...batchContacts];
        allRawContacts = [...allRawContacts, ...batchRawContacts];
        cursor = nextCursor;
        hasMore = !!nextCursor;
      }
  
      setContacts(allContacts);
      setRawContactsData(allRawContacts);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(allContacts.length / prev.pageSize)
      }));
  
      if (allContacts.length === 0) {
        setError('No contacts found for your account');
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setDataLoading(false);
    }
  }, [currentUser, fetchContactsBatch]);

  useEffect(() => {
    const storedContactId = localStorage.getItem('selectedContactId');
    const storedAccountId = localStorage.getItem('selectedAccountId');

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
            localStorage.removeItem('selectedContactId');
          }
        } catch (error) {
          console.error('Error fetching stored contact:', error);
          localStorage.removeItem('selectedContactId');
        }
      };
      fetchStoredContact();
    }

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
            setRedirectToAccount(true);
            setActiveTab('Accounts');
            localStorage.removeItem('selectedAccountId');
          }
        } catch (error) {
          console.error('Error fetching stored account:', error);
          localStorage.removeItem('selectedAccountId');
        }
      };
      fetchStoredAccount();
    }
  }, [currentUser, setActiveTab]);

  useEffect(() => {
    if (currentUser) {
      loadAllContacts();
    }
  }, [currentUser, loadAllContacts]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getSortedPaginatedContacts = () => {
    let filtered = [...contacts];

    // Apply owner filter
    if (filters.owner) {
      filtered = filtered.filter(contact => contact.owner === filters.owner);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include entire end day

      filtered = filtered.filter(contact => {
        const contactDate = parseCustomDate(contact.lastContact);
        return contactDate >= startDate && contactDate <= endDate;
      });
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return parseCustomDate(b.lastContact) - parseCustomDate(a.lastContact);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    return sorted.slice(startIndex, startIndex + pagination.pageSize);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleRowDoubleClick = (contact) => {
    setSelectedContact(contact.rawData || contact);
  };

  const handleAccountClick = async (contact) => {
    if (!contact.accountId) return;

    localStorage.setItem('selectedAccountId', contact.accountId);
    try {
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Accounts_Dev',
        id: contact.accountId,
      };
      const response = await ZOHO.CREATOR.DATA.getRecordById(config);
      if (response && response.data) {
        setSelectedAccount(response.data);
        setRedirectToAccount(true);
        setActiveTab('Accounts');
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      localStorage.removeItem('selectedAccountId');
    }
  };

  const filteredContactsCount = contacts.filter(contact => {
    if (filters.owner && contact.owner !== filters.owner) return false;
    if (filters.startDate && filters.endDate) {
      const contactDate = parseCustomDate(contact.lastContact);
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      if (contactDate < start || contactDate > end) return false;
    }
    return true;
  }).length;

  // Conditional rendering for redirection
  if (redirectToAccount) {
    return (
      <AccountDetailsPage
        account={selectedAccount}
        onClose={() => {
          setRedirectToAccount(false);
          setSelectedAccount(null);
          localStorage.removeItem('selectedAccountId');
        }}
        currentUser={currentUser}
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
          <p className="mt-4 text-gray-600">Loading contacts data...</p>
        </div>
      </div>
    );
  }

  const displayedContacts = getSortedPaginatedContacts();
  const { currentPage, totalPages, pageSize } = pagination;
  const totalContacts = filteredContactsCount;
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalContacts);
  const endItem = Math.min(currentPage * pageSize, totalContacts);
console.log(displayedContacts)
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
                  tab === activeTab
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
            <h2 className="text-2xl font-light text-gray-800">Contacts</h2>
            {currentUser && (
              <p className="text-sm text-gray-500">Showing contacts for: {currentUser}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-md text-sm flex items-center ${
                showFilters 
                  ? 'bg-[#f29d29] text-white' 
                  : 'bg-white text-[#f29d29] border border-[#f29d29]'
              } relative`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {(filters.owner || filters.startDate || filters.endDate) && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>

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
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={() => setShowAddContactForm(true)}
              className="bg-[#f29d29] hover:bg-[#e08a1a] text-white px-4 py-2 rounded-md text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className={`mb-6 bg-gray-50 p-4 rounded-lg transition-all duration-300 ease-in-out ${
          showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Owner Filter (only for team leads) */}
            {isTeamLead && (
              <div>
                <label htmlFor="owner-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <select
                  id="owner-filter"
                  value={filters.owner}
                  onChange={(e) => handleFilterChange('owner', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f29d29] focus:border-[#f29d29]"
                >
                  <option value="">All Owners</option>
                  {Array.from(new Set(contacts.map(contact => contact.owner))).map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Start Date Filter */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f29d29] focus:border-[#f29d29]"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f29d29] focus:border-[#f29d29]"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filters.owner || filters.startDate || filters.endDate) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilters({
                    owner: '',
                    startDate: '',
                    endDate: ''
                  });
                }}
                className="text-sm text-[#f29d29] hover:text-[#e08a1a] flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                {isTeamLead && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                )}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Added Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedContacts.length > 0 ? (
                displayedContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => handleRowDoubleClick(contact)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {contact.account !== 'N/A' && contact.accountId ? (
                        <button
                          onClick={() => handleAccountClick(contact)}
                          className="text-[#f29d29] hover:underline"
                        >
                          {contact.account}
                        </button>
                      ) : (
                        contact.account
                      )}
                    </td>
                    {isTeamLead && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {contact.owner}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {contact.rawData.Title || "No Title"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {contact.email || "No Email"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {contact.phone || "No Phone"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {contact.rawData.Added_Time || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isTeamLead ? "7" : "6"} className="px-6 py-4 text-center text-sm text-gray-500">
                    {contacts.length === 0 ? 'No contacts found' : 'No contacts match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalContacts}</span>{' '}
            results
          </div>
          <nav className="flex space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalContacts === 0}
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
                  disabled={totalContacts === 0}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'border-[#f29d29] text-white bg-[#f29d29] hover:bg-[#e08a1a]'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  } ${totalContacts === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalContacts === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </main>

      {showAddContactForm && (
        <AddContact
          onClose={() => setShowAddContactForm(false)}
          onContactAdded={() => {
            setShowAddContactForm(false);
            loadAllContacts();
          }}
          currentUser={currentUser}
          userId={userId}
        />
      )}

      {selectedContact && (
        <ContactDetailsPage
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          currentUser={currentUser}
          canEdit={canEditRecords}
          setActiveTabMain={setActiveTab}
          userId={userId}
          permissions={permissions}
        />
      )}
    </div>
  );
};

export default Contacts;