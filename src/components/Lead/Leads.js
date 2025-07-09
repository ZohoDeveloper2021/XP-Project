/* global ZOHO */
import { useState, useEffect, useCallback } from 'react';
import AddLead from './AddLead';
import LeadDetailsPage from './leadDetailsPage';
import { useLoginUser } from '../LoginUser';
import { useTabs } from '../TabContext';

const Leads = () => {
  const { activeTab, setActiveTab, tabs } = useTabs();
  const { currentUser, permissions, userId, loading: userLoading, error: userError } = useLoginUser();
  const [sortBy, setSortBy] = useState('recent');
  const [leads, setLeads] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawLeadsData, setRawLeadsData] = useState([]);
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20
  });
  const [filters, setFilters] = useState({
    status: '',
    owner: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Check if user is team lead
  const isTeamLead = permissions?.includes('Team Lead');
  // Check if user can edit records
  const canEditRecords = isTeamLead;

  const fetchLeadsBatch = useCallback(async (cursor = null) => {
    try {
      let config = {
        app_name: "lead-management-system",
        report_name: "All_Leads_Dev",
        max_records: 1000,
        ...(cursor && { record_cursor: cursor })
      };

      // Only filter by current user if they're NOT a team lead
      if (isTeamLead === false) {
        config.criteria = `Lead_Owner.Email == "${currentUser}"`;
      }

      const response = await ZOHO.CREATOR.DATA.getRecords(config);
      console.log('Get All Leads Response:', response);

      if (!response?.data || !Array.isArray(response.data)) {
        return { leads: [], rawLeads: [], nextCursor: null };
      }
  
      const transformedLeads = response.data.map(lead => ({
        id: lead.ID,
        name: lead.Name || ''.trim(),
        company: lead.Company || '',
        email: lead.Email || '',
        phone: lead.Phone_Number || '',
        status: lead.Lead_Status || 'New',
        source: lead.Lead_Source?.zc_display_value || lead.Lead_Source?.Source_Name || '',
        jobStack: lead.Stack?.zc_display_value || lead.Stack?.Job_Stack || '',
        industry: lead.Industry?.zc_display_value || lead.Industry?.Industry_Name || '',
        jobTitle: lead.Job_Title || '',
        rating: lead.Rating || '',
        createdTime: lead.Added_Time || new Date().toISOString(),
        owner: lead.Lead_Owner?.zc_display_value || lead.Lead_Owner?.Name || 'Unassigned',
        rawData: lead
      }));
  
      return {
        leads: transformedLeads,
        rawLeads: response.data,
        nextCursor: response.record_cursor || null
      };
    } catch (error) {
      console.error('Error fetching leads batch:', error);
      throw error;
    }
  }, [isTeamLead, currentUser]);

  const loadAllLeads = useCallback(async () => {
    if (!currentUser) return;
    
    setDataLoading(true);
    setError(null);
    
    try {
      let allLeads = [];
      let allRawLeads = [];
      let cursor = null;
      let hasMore = true;
      const maxBatches = 10;
  
      for (let batch = 0; hasMore && batch < maxBatches; batch++) {
        const { leads: batchLeads, rawLeads: batchRawLeads, nextCursor } = await fetchLeadsBatch(cursor);
        allLeads = [...allLeads, ...batchLeads];
        allRawLeads = [...allRawLeads, ...batchRawLeads];
        cursor = nextCursor;
        hasMore = !!nextCursor;
      }
  
      setLeads(allLeads);
      setRawLeadsData(allRawLeads);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(allLeads.length / prev.pageSize)
      }));
  
      if (allLeads.length === 0) {
        setError('No leads found for your account');
      }
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads. Please try again.');
    } finally {
      setDataLoading(false);
    }
  }, [currentUser, fetchLeadsBatch]);

  useEffect(() => {
    if (currentUser) {
      loadAllLeads();
    }
  }, [currentUser, loadAllLeads]);
// In the Leads component, add this function to handle lead updates
    const handleLeadUpdated = (updatedLead) => {
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === updatedLead.ID 
            ? { 
                ...lead,
                name: updatedLead.Name || lead.name,
                company: updatedLead.Company || lead.company,
                email: updatedLead.Email || lead.email,
                phone: updatedLead.Phone_Number || lead.phone,
                status: updatedLead.Lead_Status || lead.status,
                source: updatedLead.Lead_Source?.zc_display_value || lead.source,
                jobStack: updatedLead.Stack?.zc_display_value || lead.jobStack,
                industry: updatedLead.Industry?.zc_display_value || lead.industry,
                jobTitle: updatedLead.Job_Title || lead.jobTitle,
                rating: updatedLead.Rating || lead.rating,
                rawData: updatedLead
              }
            : lead
        )
      );
      
      setRawLeadsData(prevRawLeads =>
        prevRawLeads.map(lead => 
          lead.ID === updatedLead.ID ? updatedLead : lead
        )
      );
      
      setSelectedLead(updatedLead);
    };
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getSortedPaginatedLeads = () => {
    let filtered = [...leads];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    // Apply owner filter
    if (filters.owner) {
      filtered = filtered.filter(lead => lead.owner === filters.owner);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.createdTime);
        return leadDate >= start && leadDate <= end;
      });
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdTime) - new Date(a.createdTime);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'company') {
        return a.company.localeCompare(b.company);
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

  const handleRowDoubleClick = (lead) => {
    setSelectedLead(lead.rawData || lead);
  };

  const filteredLeadsCount = leads.filter(lead => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.owner && lead.owner !== filters.owner) return false;
    if (filters.startDate && filters.endDate) {
      const leadDate = new Date(lead.createdTime);
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      if (leadDate < start || leadDate > end) return false;
    }
    return true;
  }).length;

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
          <p className="mt-4 text-gray-600">Loading leads data...</p>
        </div>
      </div>
    );
  }

  const displayedLeads = getSortedPaginatedLeads();
  const { currentPage, totalPages, pageSize } = pagination;
  const totalLeads = filteredLeadsCount;
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalLeads);
  const endItem = Math.min(currentPage * pageSize, totalLeads);
console.log(displayedLeads)
  const statusClasses = {
    'New': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-purple-100 text-purple-800',
    'In Discussion': 'bg-yellow-100 text-yellow-800',
    'Meeting Scheduled': 'bg-orange-100 text-orange-800',
    'Follow-Up Required': 'bg-pink-100 text-pink-800',
    'Qualified': 'bg-green-100 text-green-800',
    'Unqualified': 'bg-red-100 text-red-800',
    'Converted': 'bg-teal-100 text-teal-800',
  };

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
            <h2 className="text-2xl font-light text-gray-800">Leads</h2>
            {currentUser && (
              <div className="text-sm text-gray-500">
                <p>Showing leads for: {currentUser}</p>
              </div>
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
              {(filters.status || filters.owner || filters.startDate || filters.endDate) && (
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
                <option value="company">Company (A-Z)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddLeadForm(true)}
              className="bg-[#f29d29] hover:bg-[#e08a1a] text-white px-4 py-2 rounded-md text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Lead
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className={`mb-6 bg-gray-50 p-4 rounded-lg transition-all duration-300 ease-in-out ${
          showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f29d29] focus:border-[#f29d29]"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="In Discussion">In Discussion</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Follow-Up Required">Follow-Up Required</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
                <option value="Converted">Converted</option>
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
                  {Array.from(new Set(leads.map(lead => lead.owner))).map(owner => (
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
          {(filters.status || filters.owner || filters.startDate || filters.endDate) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilters({
                    status: '',
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                {isTeamLead && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                )}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Job Stack</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Added Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedLeads.length > 0 ? (
                displayedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => handleRowDoubleClick(lead)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="ml-4 text-left">
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {lead.company}
                    </td>
                    {isTeamLead && (
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {lead.owner}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusClasses[lead.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {lead.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {lead.jobStack}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {lead.rawData.Added_Time}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-[#f29d29] hover:text-[#e08a1a] mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowDoubleClick(lead);
                        }}
                      >
                        View
                      </button>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isTeamLead ? "7" : "6"} className="px-6 py-4 text-center text-sm text-gray-500">
                    {leads.length === 0 ? 'No leads found' : 'No leads match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalLeads}</span> results
          </div>
          <nav className="flex space-x-1">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalLeads === 0}
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
                  disabled={totalLeads === 0}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'border-[#f29d29] text-white bg-[#f29d29] hover:bg-[#e08a1a]'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  } ${totalLeads === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalLeads === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </main>

      {showAddLeadForm && <AddLead onClose={() => setShowAddLeadForm(false)} userId={userId} />}
      {selectedLead && (
        <LeadDetailsPage 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          currentUser={currentUser}
          canEdit={canEditRecords}
          userId={userId}
          onLeadUpdated={handleLeadUpdated}
        />
      )}
    </div>
  );
};

export default Leads;