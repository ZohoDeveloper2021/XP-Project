/* global ZOHO */
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { confirmAlert } from 'react-confirm-alert';



const Notes = ({ module, RecordId, currentUser }) => {
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState('');
  const [notes, setNotes] = useState([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);

  // Fetch current employee
  const fetchCurrentEmployee = async () => {
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Users_Dev",
        criteria: `(Email == "${currentUser}")`,
      });
      
      if (response.data && response.data.length > 0) {
        setCurrentEmployeeId(response.data[0].ID);
      } else {
        setError('Could not fetch current employee');
        toast.error('Could not fetch current employee');
      }
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError('Error fetching employee: ' + err.message);
      toast.error('Error fetching employee: ' + err.message);
    }
  };

  // Fetch notes
  const fetchNotes = async () => {
    setIsNotesLoading(true);
    try {
      const response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "lead-management-system",
        report_name: "All_Notes_Dev",
        criteria: `(Record_Id == "${RecordId}" || Accounts == "${RecordId}" || Opportunities == "${RecordId}")`,
      });
      
      if (response.data) {
        console.log(response.data)
        setNotes(response.data);
      } else {
        setError('Could not fetch notes');
        toast.error('Could not fetch notes');
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Error fetching notes: ' + err.message);
    } finally {
      setIsNotesLoading(false);
    }
  };

  // Handle note submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!noteSubject.trim() || !noteDetails.trim()) {
      toast.error('Please fill in both subject and details');
      return;
    }
  
    setIsSubmitting(true);
    
    try {
      const recordPayload = {
        data: {
          Record_Id: RecordId,
          Users: currentEmployeeId || null,
          Module_Mapping: module,
          Subject_field: noteSubject,
          Notes: noteDetails,
        },
      };

      const response = await ZOHO.CREATOR.DATA.addRecords({
        app_name: 'lead-management-system',
        form_name: 'Notes',
        payload: recordPayload,
      });

      if (response.code === 3000) {
        setShowAddForm(false);
        setNoteSubject('');
        setNoteDetails('');
        await fetchNotes();
        toast.success('Note added successfully');
      } else {
        throw new Error(response.message || 'Note creation failed');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(`Error: ${error.message || 'Failed to add note'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (RecordId) {
      fetchNotes();
    }
    if (currentUser) {
      fetchCurrentEmployee();
    }
  }, [RecordId, currentUser]);

  if (!RecordId) {
    return (
      <div>
        <p className="text-gray-500">No notes available for {module}.</p>
      </div>
    );
  }

  if (isNotesLoading && notes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f29d29]"></div>
      </div>
    );
  }

//  ###########  Delete Notes Functionality
   const deleteNote = (noteId) => {
    confirmAlert({
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this note?',
        buttons: [
        {
            label: 'Yes',
            onClick: async () => {
            try {
                const response = await ZOHO.CREATOR.DATA.deleteRecordById({
                app_name: 'lead-management-system',
                report_name: 'All_Notes_Dev',
                id: noteId
                });

                if (response.code === 3000) {
                toast.success('Note deleted successfully');
                setNotes((prevNotes) => prevNotes.filter((note) => note.ID !== noteId));
                } else {
                throw new Error(response.message || 'Failed to delete note');
                }
            } catch (error) {
                console.error('Error deleting note:', error);
                toast.error(`Error: ${error.message || 'Failed to delete note'}`);
            }
            },
        },
        {
            label: 'No',
            onClick: () => {},
        },
        ],
    });
    };


  return (
    <div className="">
      {/* <Toaster position="top-right" toastOptions={{ duration: 3000 }} /> */}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-5 py-3 rounded-t-lg flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-700">Notes for {module}</h3>
          <button
            className={`group p-1 rounded-full hover:bg-[#f29d29] hover:scale-110 bg-[#f29d29] text-white transition-all duration-500 transform ${
              showAddForm ? 'rotate-25' : 'rotate-0'
            }`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
              />
            </svg>
          </button>
        </div>

        {showAddForm && (
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Subject
                </label>
                <input
                  type="text"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-[#f29d29] focus:border-[#f29d29]"
                  placeholder="Enter note subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Details
                </label>
                <textarea
                  value={noteDetails}
                  onChange={(e) => setNoteDetails(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-[#f29d29] focus:border-[#f29d29]"
                  rows="4"
                  placeholder="Enter note details"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNoteSubject('');
                    setNoteDetails('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !noteSubject.trim() || !noteDetails.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#f29d29] hover:bg-[#d98222] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f29d29] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Note'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-16 h-16 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg">No notes available</p>
            <p className="text-sm text-gray-400">Add a note to see it here</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {notes.map((note) => (
              <div
                key={note.ID}
                className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4"
              >
                <div className="flex items-center space-x-2 mb-2 justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#f29d29] text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {note.Users.Name?.charAt(0) || '?'}
                        </div>
                        <div>
                        <h4 className="text-sm font-medium text-[#f29d29]">
                            {note.Users.Name || 'Unknown User'}
                        </h4>
                        <p className="text-xs text-gray-500">
                            {note.Added_Time
                            ? new Date(note.Added_Time).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                }).replace(',', '')
                            : 'No date'}
                        </p>
                        </div>
                </div>
                {/* <button
                    onClick={() => deleteNote(note.ID)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Delete Note"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m-4 0h14" />
                    </svg>

                </button> */}
                </div>

                <h5 className="text-sm font-semibold text-gray-700">{note.Subject_field || 'No Subject'}</h5>
                <p className="text-sm text-gray-600 mt-1">{note.Notes || 'No Details'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
