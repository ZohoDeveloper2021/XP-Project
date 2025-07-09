/* global ZOHO */
import { useState, useEffect, useCallback } from 'react';
import { useLoginUser } from '../LoginUser';
import DealDetailsPage from './DealDetailsPage';
import AddDeal from './AddDeal';
import { useTabs } from '../TabContext';
import AccountDetailsPage from '../Account/AccountDetailsPage';
import ContactDetailsPage from '../Contact/ContactDetailsPage';

// Date parsing utility function
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

const Deals = () => {
  const { activeTab, setActiveTab, tabs } = useTabs();
  const { currentUser, userId, permissions, loading: userLoading, error: userError } = useLoginUser();
  const [sortBy, setSortBy] = useState('recent');
  const [deals, setDeals] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawDealsData, setRawDealsData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
  });
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showAddDealForm, setShowAddDealForm] = useState(false);
  const [filters, setFilters] = useState({
    stage: '',
    owner: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const isTeamLead = permissions?.includes('Team Lead');

  // State for account and contact redirection
  const [redirectToAccount, setRedirectToAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [redirectToContact, setRedirectToContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Stage color classes
  const stageClasses = {
    'On Boarded': 'bg-blue-100 text-blue-800',          
    'Discovery': 'bg-yellow-100 text-yellow-800',     
    'Proposal': 'bg-orange-100 text-orange-800',        
    'Negotiation': 'bg-teal-100 text-teal-800',         
    'Close Won/Lost': 'bg-green-100 text-green-800',    
  };

  useEffect(() => {
    const storedDealId = localStorage.getItem('selectedDealId');
    const storedAccountId = localStorage.getItem('selectedAccountId');
    const storedContactId = localStorage.getItem('selectedContactId');

    if (storedDealId) {
      const fetchStoredDeal = async () => {
        try {
          const config = {
            app_name: 'lead-management-system',
            report_name: 'All_Opportunities_Dev',
            id: storedDealId,
          };
          const response = await ZOHO.CREATOR.DATA.getRecordById(config);
          if (response && response.data) {
            setSelectedDeal(response.data);
            localStorage.removeItem('selectedDealId');
          }
        } catch (error) {
          console.error('Error fetching stored deal:', error);
          localStorage.removeItem('selectedDealId');
        }
      };
      fetchStoredDeal();
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

  const fetchDealsBatch = useCallback(async (cursor = null) => {
    try {
      let config = {
        app_name: 'lead-management-system',
        report_name: 'All_Opportunities_Dev',
        max_records: 1000,
        ...(cursor && { record_cursor: cursor }),
      };

      if (isTeamLead === false) {
        config.criteria = `Opportunity_Owner.Email == "${currentUser}"`;
      }

      const response = await ZOHO.CREATOR.DATA.getRecords(config);

      if (!response?.data || !Array.isArray(response.data)) {
        return { deals: [], rawDeals: [], nextCursor: null };
      }

      const transformedDeals = response.data.map((deal) => ({
        id: deal.ID,
        name: deal.Opportunity_Name || ''.trim(),
        account: deal.Accounts?.zc_display_value || deal.Accounts?.Name || 'No Account',
        accountId: deal.Accounts?.ID,
        contact: deal.Contacts?.zc_display_value || deal.Contacts?.Name || 'No Contact',
        contactId: deal.Contacts?.ID,
        stage: deal.Stage || '',
        createdate: deal.Added_Time || '',
        amount: deal.Amount || 0,
        probability: deal.Probability || 0,
        owner: deal.Opportunity_Owner?.zc_display_value || deal.Opportunity_Owner?.Name || 'N/A',
        rawData: deal,
      }));

      return {
        deals: transformedDeals,
        rawDeals: response.data,
        nextCursor: response.record_cursor || null,
      };
    } catch (error) {
      console.error('Error fetching deals batch:', error);
      throw error;
    }
  }, [currentUser, isTeamLead]);

  const loadAllDeals = useCallback(async () => {
    if (!currentUser) return;

    setDataLoading(true);
    setError(null);

    try {
      let allDeals = [];
      let allRawDeals = [];
      let cursor = null;
      let hasMore = true;
      const maxBatches = 10;

      for (let batch = 0; hasMore && batch < maxBatches; batch++) {
        const { deals: batchDeals, rawDeals: batchRawDeals, nextCursor } = await fetchDealsBatch(cursor);
        allDeals = [...allDeals, ...batchDeals];
        allRawDeals = [...allRawDeals, ...batchRawDeals];
        cursor = nextCursor;
        hasMore = !!nextCursor;
      }

      setDeals(allDeals);
      setRawDealsData(allRawDeals);
      setPagination((prev) => ({
        ...prev,
        totalPages: Math.ceil(allDeals.length / prev.pageSize),
      }));
    } catch (err) {
      setError('Failed to load deals');
    } finally {
      setDataLoading(false);
    }
  }, [currentUser, fetchDealsBatch]);

  useEffect(() => {
    if (currentUser) {
      loadAllDeals();
    }
  }, [currentUser, loadAllDeals]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getSortedPaginatedDeals = () => {
    let filtered = [...deals];

    // Apply stage filter
    if (filters.stage) {
      filtered = filtered.filter(deal => deal.stage === filters.stage);
    }

    // Apply owner filter
    if (filters.owner) {
      filtered = filtered.filter(deal => deal.owner === filters.owner);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include entire end day

      filtered = filtered.filter(deal => {
        const dealDate = parseCustomDate(deal.createdate);
        return dealDate >= startDate && dealDate <= endDate;
      });
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return parseCustomDate(b.createdate) - parseCustomDate(a.createdate);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'amount') {
        return b.amount - a.amount;
      } else if (sortBy === 'createdate') {
        return parseCustomDate(b.createdate) - parseCustomDate(a.createdate);
      }
      return 0;
    });

    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    return sorted.slice(startIndex, startIndex + pagination.pageSize);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleRowDoubleClick = (deal) => {
    setSelectedDeal(deal.rawData || deal);
  };

  const handleAccountClick = async (deal) => {
    if (!deal.accountId) return;

    localStorage.setItem('selectedAccountId', deal.accountId);
    try {
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Accounts_Dev',
        id: deal.accountId,
      };
      const response = await ZOHO.CREATOR.DATA.getRecordById(config);
      if (response && response.data) {
        setActiveTab('Accounts');
        await new Promise(resolve => setTimeout(resolve, 100)); 
        setSelectedAccount(response.data);
        setRedirectToAccount(true);
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      localStorage.removeItem('selectedAccountId');
    }
  };

  const handleContactClick = async (deal) => {
    if (!deal.contactId) return;

    localStorage.setItem('selectedContactId', deal.contactId);
    try {
      const config = {
        app_name: 'lead-management-system',
        report_name: 'All_Contacts_Dev',
        id: deal.contactId,
      };
      const response = await ZOHO.CREATOR.DATA.getRecordById(config);
      if (response && response.data) {
        setSelectedContact(response.data);
        setRedirectToContact(true);
        setActiveTab('Contacts');
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
      localStorage.removeItem('selectedContactId');
    }
  };

  const filteredDealsCount = deals.filter(deal => {
    if (filters.stage && deal.stage !== filters.stage) return false;
    if (filters.owner && deal.owner !== filters.owner) return false;
    if (filters.startDate && filters.endDate) {
      const dealDate = parseCustomDate(deal.createdate);
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      if (dealDate < start || dealDate > end) return false;
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

  if (redirectToContact) {
    return (
      <ContactDetailsPage
        contact={selectedContact}
        onClose={() => {
          setRedirectToContact(false);
          setSelectedContact(null);
          localStorage.removeItem('selectedContactId');
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
          <p className="mt-4 text-gray-600">Loading deals data...</p>
        </div>
      </div>
    );
  }

  const displayedDeals = getSortedPaginatedDeals();
  const { currentPage, totalPages, pageSize } = pagination;
  const totalDeals = filteredDealsCount;
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalDeals);
  const endItem = Math.min(currentPage * pageSize, totalDeals);

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
            <h2 className="text-2xl font-light text-gray-800">Deals</h2>
            {currentUser && (
              <p className="text-sm text-gray-500">Showing deals for: {currentUser}</p>
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
              {(filters.stage || filters.owner || filters.startDate || filters.endDate) && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f29d29] focus:border-[#f29d29]"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="amount">Amount (High to Low)</option>
                <option value="createdate">Created Date</option>
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
              onClick={() => setShowAddDealForm(true)}
              className="bg-[#f29d29] hover:bg-[#e08a1a] text-white px-4 py-2 rounded-md text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Deal
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className={`mb-6 bg-gray-50 p-4 rounded-lg transition-all duration-300 ease-in-out ${
          showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stage Filter */}
            <div>
              <label htmlFor="stage-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Stage
              </label>
              <select
                id="stage-filter"
                value={filters.stage}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f29d29] focus:border-[#f29d29]"
              >
                <option value="">Select</option>
                  <option value="On Boarded">On Boarded</option>
                  <option value="Discovery">Discovery</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Close Won/Lost">Close Won/Lost</option>
              </select>
            </div>

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
                  {Array.from(new Set(deals.map(deal => deal.owner))).map(owner => (
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
          {(filters.stage || filters.owner || filters.startDate || filters.endDate) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilters({
                    stage: '',
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Created Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedDeals.length > 0 ? (
                displayedDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => handleRowDoubleClick(deal)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                          {deal.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{deal.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {deal.account !== 'N/A' && deal.accountId ? (
                        <button
                          onClick={() => handleAccountClick(deal)}
                          className="text-[#f29d29] hover:underline"
                        >
                          {deal.account}
                        </button>
                      ) : (
                        deal.account
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {deal.contact !== 'N/A' && deal.contactId ? (
                        <button
                          onClick={() => handleContactClick(deal)}
                          className="text-[#f29d29] hover:underline"
                        >
                          {deal.contact}
                        </button>
                      ) : (
                        deal.contact
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stageClasses[deal.stage] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      ${deal.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {deal.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {deal.createdate}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    {deals.length === 0 ? 'No deals found' : 'No deals match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalDeals}</span>{' '}
            results
          </div>
          <nav className="flex space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalDeals === 0}
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
                  disabled={totalDeals === 0}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'border-[#f29d29] text-white bg-[#f29d29] hover:bg-[#e08a1a]'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  } ${totalDeals === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalDeals === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </main>

      {selectedDeal && (
        <DealDetailsPage
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          currentUser={currentUser}
          setActiveTabMain={setActiveTab}
          userId={userId}
          permissions={permissions}
        />
      )}

      {showAddDealForm && (
        <AddDeal
          onClose={() => setShowAddDealForm(false)}
          onDealAdded={() => {
            setShowAddDealForm(false);
            loadAllDeals();
          }}
          currentUser={currentUser}
          userId={userId}
          permissions={permissions}
        />
      )}
    </div>
  );
};

export default Deals;