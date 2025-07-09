/* global ZOHO */
import { useState, useEffect } from 'react';
import Attachments from '../Attachment';
import Notes from '../Notes';
import EditAccountForm from "../Account/EditAccountForm"
import Meeting from '../Meeting';
import Opportunities from '../Opportunities';
import Reminder from '../Reminder';
const AccountDetailsPage = ({ account, onClose, currentUser, setActiveTabMain }) => {

  // Helper functions to safely access account properties
  const [activeTab, setActiveTab] = useState('Overview');
  const [accountId, setAccountId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
console.log(account)
      useEffect(() => {
      if (account && account.ID) {
        setAccountId(account.ID);
      }
    }, [account]);
  const getAccountName = () => {
    if (!account) return 'Unknown';
    
    // Handle raw API data structure
    if (account.Account_Name) {
      if (typeof account.Account_Name === 'string') return account.Account_Name;
      return account.Account_Name.zc_display_value || 'Unknown';
    }
  };

  const getAccountOwner = () => {
    if (!account) return 'N/A';
    return account.Account_Owner?.zc_display_value || 'N/A';
  };

  const getWebsite = () => {
    if (!account) return 'N/A';
    return account.Website?.url || account.Website?.value || account.website || 'N/A';
  };

  const getBillingAddress = () => {
    if (!account) return 'N/A';
    
    const street1 = account.Billing_Street || account.address_line_1 || '';
    const street2 = account.Billing_Address_Line_2 || account.address_line_2 || '';
    const city = account.Billing_City || account.district_city || '';
    const state = account.Billing_State || account.state || '';
    const postalCode = account.Billing_Code || account.postal_code || '';
    const country = account.Billing_Country || account.country || '';
    
    const addressParts = [street1, street2, city, state, postalCode, country]
      .filter(part => part && part.trim() !== '');
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
  };
console.log("MM ",account)
  if (!account) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#f29d29] text-white p-4 rounded-t-lg ">
          <div className="flex justify-between items-center relative">
            <h2 className="text-xl font-semibold absolute left-1/2 transform -translate-x-1/2">Account Details</h2>
              <div className="flex items-center ml-auto space-x-3">
              <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center  px-4 py-2 bg-white text-black rounded-lg shadow-md hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                >
                  {/* <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg> */}
                  Edit
                </button>
              <button 
                onClick={onClose} 
                className="text-white hover:text-gray-200 text-2xl ml-auto"
                aria-label="Close"
              >
                &times;
              </button>
              </div>
          </div>
          <div className="mt-6 flex items-center">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-[#f29d29] font-bold text-xl mr-3">
              {getAccountName().charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <h3 className="font-medium">{getAccountName()}</h3>
              <p className="text-sm opacity-90">{account.Industry?.zc_display_value || account.industry || 'N/A'}</p>
            </div>
          </div>
        </div>

         {/* Tabs */}
        <div className="mt-4 border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['Overview', 'Attachments','Opportunities'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab
                    ? 'border-[#f29d29] text-[#f29d29]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                Basic Information
              </h3>
              <DetailItem label="Account Owner" value={getAccountOwner()} />
              <DetailItem label="Type" value={account.Type_field || 'N/A'} />
              <DetailItem label="Rating" value={account.Rating || account.rating || 'N/A'} />
              <DetailItem label="Phone" value={account.Phone_Number || 'N/A'} />
              <DetailItem 
                label="Website" 
                value={getWebsite()} 
                isLink 
              />
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                Company Details
              </h3>
              <DetailItem label="Industry" value={account.Industry?.zc_display_value || account.industry || 'N/A'} />
              <DetailItem label="Employees" value={account.Employees || account.employees || 'N/A'} />
              
            </div>

            {/* Billing Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                Billing Address
              </h3>
              <DetailItem label="Full Address" value={account.Billing_Address.address_line_1} />
              {/* <DetailItem label="Street" value={ account.Billing_Address.billingAddressLine1 || 'N/A'} /> */}
              <DetailItem label="City" value={account.Billing_Address.district_city || 'N/A'} />
              <DetailItem label="State" value={ account.Billing_Address.state_province || 'N/A'} />
              <DetailItem label="Postal Code" value={account.Billing_Address.postal_code || 'N/A'} />
              <DetailItem label="Country" value={account.Billing_Address.country || 'N/A'} />
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                Additional Information
              </h3>
              <DetailItem label="Account Source" value={account.Account_Source?.zc_display_value || 'N/A'} />
              <DetailItem 
                label="Created Date" 
                value={account.Added_Time
                    ? new Date(account.Added_Time).toLocaleString() 
                    : 'N/A'
                } 
              />
            </div>
          </div>
          )}
          {activeTab === 'Attachments' && accountId != null && (
            <Attachments module="Accounts" RecordId={accountId} currentUser={currentUser}/>
          )}

          {/* {activeTab === 'Notes' && (
            <Notes module="Accounts" RecordId={accountId} currentUser={currentUser} />
          )} */}

          {/* {activeTab === 'Reminder' && (
            <Reminder module="Accounts" RecordId={accountId} currentUser={currentUser} />
          )} */}
           {/* {activeTab === 'Meeting' && (
            <Meeting module="Accounts" RecordId={accountId} currentUser={currentUser}/>
          )} */}
          {activeTab === 'Opportunities' && (
            <Opportunities module="Accounts" RecordId={accountId} currentUser={currentUser} setActiveTabMain={setActiveTabMain}/>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {showEditForm && (
      <EditAccountForm 
        account={account} 
        onClose={() => setShowEditForm(false)}
      />
    )}
    </div>
  );
};

const DetailItem = ({ label, value, children, isLink = false }) => {
  const displayValue = value !== undefined && value !== null ? String(value) : 'N/A';

  if (children) {
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{children}</dd>
      </div>
    );
  }

  if (isLink && displayValue !== 'N/A') {
    const url = value.startsWith('http') ? value : `https://${value}`;
    return (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f29d29] hover:underline"
          >
            {displayValue}
          </a>
        </dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{displayValue}</dd>
    </div>
  );
};
export default AccountDetailsPage;