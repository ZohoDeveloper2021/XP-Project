/* global ZOHO */
import { useState, useEffect } from 'react';
import Attachments from '../Attachment';
import Notes from "../Notes"
import EditContactForm from "../Contact/EditContactForm"
import Meeting from '../Meeting';
import Opportunities from '../Opportunities';
import Reminder from '../Reminder';

const ContactDetailsPage = ({ contact, onClose, currentUser, setActiveTabMain, userId,permissions }) => {
  // Helper functions to safely access contact properties
  const [activeTab, setActiveTab] = useState('Overview');
  const [contactId, setContactId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [fullContact, setFullContact] = useState(null);
console.log(contact)
      useEffect(() => {
      if (contact && contact.ID) {
        setContactId(contact.ID);
      }
    }, [contact]);

    useEffect(() => {
    const fetchContactDetails = async () => {
      if (contact && contact.ID) {
        try {
          const response = await ZOHO.CREATOR.DATA.getRecordById({
            app_name: "lead-management-system",
            report_name: "All_Contacts_Dev",
            id: contact.ID
          });
          
          if (response.code === 3000) {
            setFullContact(response.data);
          } else {
            setFullContact(contact);
          }
        } catch (error) {
          console.error("Failed to fetch contact details:", error);
          setFullContact(contact);
        }
      }
    };

    fetchContactDetails();
  }, [contact]);

  const getContactName = () => {
    if (!contact) return 'Unknown';
    if (contact.Name) {
      if (typeof contact.Name === 'string') return contact.Name;
      if (contact.Name.first_name || contact.Name.last_name) {
        return `${contact.Name.first_name || ''} ${contact.Name.last_name || ''}`.trim();
      }
      return contact.Name.zc_display_value || 'Unknown';
    }
    // Handle transformed data structure
    return contact.name || 'Unknown';
  };

  const getAccount = () => {
    if (!contact) return 'N/A';
    if (typeof contact.Account_Name === 'string') return contact.Account_Name;
    return contact.Account_Name?.zc_display_value || '';
  };

  const getEmail = () => {
    if (!contact) return 'N/A';
    return contact.Email || contact.email || 'N/A';
  };

  const getPhone = () => {
    if (!contact) return 'N/A';
    return contact.Phone_Number2 || contact.Phone || contact.phone || 'N/A';
  };

  const getContactOwner = () => {
    if (!contact) return 'N/A';
    if (typeof contact.Owner === 'string') return contact.Owner;
    return contact.Contact_Owner?.zc_display_value || 'N/A';
  };
if (!fullContact) return <div>Loading...</div>;

 const getAddressField = (field) => {
    if (!contact || !contact.Billing_Address) return 'N/A';
    return contact.Billing_Address[field] || 'N/A';
  };

  if (!contact) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#f29d29] text-white p-4 rounded-t-lg ">
          <div className="flex justify-between items-center relative">
            <h2 className="text-xl font-semibold absolute left-1/2 transform -translate-x-1/2">Contact Details</h2>
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
              {getContactName().charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <h3 className="font-medium">{getContactName()}</h3>
              <p className="text-sm opacity-90">{getAccount()}</p>
            </div>
          </div>
        </div>

         {/* Tabs */}
        <div className="mt-4 border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['Overview', 'Attachments', 'Notes', 'Meeting','Reminder','Opportunities'].map((tab) => (
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
              <DetailItem label="Email" value={getEmail()} />
              <DetailItem label="Account" value={contact.Account_Name.zc_display_value || 'N/A'} />
              <DetailItem label="Phone" value={getPhone()} />
              <DetailItem label="Title" value={contact.Title || contact.title || 'N/A'} />
              <DetailItem label="Profile" value={contact.Profile.zc_display_value || 'N/A'} />
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                Contact Details
              </h3>
              <DetailItem label="Department" value={contact.Department || 'N/A'} />
              <DetailItem label="Contact Owner" value={getContactOwner()} />
               <DetailItem label="Contact Source" value={contact.Contact_Source?.zc_display_value || 'N/A'} />
              <DetailItem 
                label="Created Date" 
                value={
                  contact.Created_Time || contact.Added_Time
                    ? new Date(contact.Created_Time || contact.Added_Time).toLocaleString() 
                    : 'N/A'
                } 
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#f29d29] border-b border-[#f29d29] pb-1">
                Address Information
              </h3>
              <DetailItem label="State" value={getAddressField('state_province')} />
              <DetailItem label="City" value={getAddressField('district_city')} />
              <DetailItem label="Country" value={getAddressField('country')} />
              <DetailItem label="Zip Code" value={getAddressField('postal_code')} />
              <DetailItem label="Line Address" value={getAddressField('address_line_1')} />
            </div>
          </div>
          )}
          {activeTab === 'Attachments' && contactId != null && (
            <Attachments module="Contacts" RecordId={contactId} currentUser={currentUser}/>
          )}

          {activeTab === 'Notes' && (
            <Notes module="Contacts" RecordId={contactId} currentUser={currentUser} />
          )}

          {activeTab === 'Reminder' && (
            <Reminder module="Contacts" RecordId={contactId} currentUser={currentUser} comment={true}/>
          )}
           {activeTab === 'Meeting' && (
            <Meeting module="Contacts" RecordId={contactId} currentUser={currentUser} lead={contact}/>
          )}
           {activeTab === 'Opportunities' && (
            <Opportunities module="Contacts" RecordId={contactId} currentUser={currentUser} setActiveTabMain={setActiveTabMain}/>
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
      <EditContactForm 
        contact={contact} 
        onClose={() => setShowEditForm(false)}
        userId={userId}
        permissions={permissions}
        currentUser={currentUser}
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

export default ContactDetailsPage;