// Supabase client initialization - using the same one from login-script.js
const supabaseClient = supabase.createClient(
    'https://xtwamtfxirypcxszldow.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0d2FtdGZ4aXJ5cGN4c3psZG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NTIwMzQsImV4cCI6MjA1NjAyODAzNH0.ZZRtoHPlie0FN5IAF1WVd4sRqWOWH_ZfP149Gorit1c'
);

// Helper function to get current user info
function getCurrentUser() {
    const username = localStorage.getItem('musicUsername');
    let currentUserObj = null;
    
    try {
        const currentUserString = localStorage.getItem('currentUser');
        if (currentUserString) {
            currentUserObj = JSON.parse(currentUserString);
        }
    } catch (e) {
        console.error('Error parsing currentUser from localStorage:', e);
    }
    
    return { username, currentUserObj };
}

// Save a new journal entry to Supabase
async function saveEntry(entryData) {
    console.log('Attempting to save entry:', entryData);
    try {
        // Get current user info
        const { username, currentUserObj } = getCurrentUser();
        
        if (!username) {
            console.error('User not logged in');
            return { success: false, error: 'User not logged in' };
        }
        
        console.log('User info:', { username, currentUserObj });
        
        // Determine entry type based on link
        const isVideo = entryData.link && entryData.link.includes('youtube');
        const entryType = isVideo ? 'video' : 'document';
        
        // Get class context if available
        const classId = entryData.classId || null;
        console.log(classId ? `Saving entry for class ID: ${classId}` : 'Saving general entry');
        
        // Try saving to the new journal_entries table first
        console.log('Attempting to save entry to journal_entries table');
        
        const entry = {
            username: username,
            title: entryData.title || '',
            link: entryData.link || '',
            entry_type: entryType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            class_id: classId
        };
        
        // Save to journal_entries table
        const { data: journalData, error: journalError } = await supabaseClient
            .from('journal_entries')
            .insert([entry]);
            
        if (!journalError) {
            console.log('Entry saved successfully to journal_entries table');
            return { success: true, data: journalData };
        }
        
        console.error('Error saving to journal_entries:', journalError);
        console.log('Falling back to user_entries table');
        
        // Try saving to user_entries table as fallback
        const userEntry = {
            username: username,
            youtube_link: entryData.link || '',
            description: entryData.title || '',
            created_at: new Date().toISOString(),
            entry_type: entryType
        };
        
        const { data, error } = await supabaseClient
            .from('user_entries')
            .insert([userEntry]);
            
        if (!error) {
            console.log('Entry saved successfully to user_entries table');
            return { success: true, data };
        }
        
        console.error('Error saving to user_entries:', error);
        console.log('Falling back to profile update method');
        
        // Final fallback: try updating the profile directly
        // Check which log slots are available
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('log1_youtube, log1_description, log1_date, log2_youtube, log2_description, log2_date, log3_youtube, log3_description, log3_date')
            .eq('username', username)
            .single();
            
        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return { 
                success: false, 
                error: 'Could not find your profile. Please log out and log in again.' 
            };
        }
        
        // Find which slot to use
        let slotToUse = 1;
        
        // Check for empty slots first
        if (!profile.log1_youtube && !profile.log1_description) {
            slotToUse = 1;
        } else if (!profile.log2_youtube && !profile.log2_description) {
            slotToUse = 2;
        } else if (!profile.log3_youtube && !profile.log3_description) {
            slotToUse = 3;
        } else {
            // All slots filled, find the oldest
            const log1Date = profile.log1_date ? new Date(profile.log1_date) : new Date();
            const log2Date = profile.log2_date ? new Date(profile.log2_date) : new Date();
            const log3Date = profile.log3_date ? new Date(profile.log3_date) : new Date();
            
            if (log1Date <= log2Date && log1Date <= log3Date) {
                slotToUse = 1;
            } else if (log2Date <= log1Date && log2Date <= log3Date) {
                slotToUse = 2;
            } else {
                slotToUse = 3;
            }
        }
        
        console.log(`Using profile log slot ${slotToUse} for new entry`);
        
        // Create update object for the selected slot
        const update = {};
        update[`log${slotToUse}_youtube`] = entryData.link || '';
        update[`log${slotToUse}_description`] = entryData.title || '';
        update[`log${slotToUse}_date`] = new Date().toISOString();
        
        // Update the profile with the new entry
        const { data: updateData, error: updateError } = await supabaseClient
            .from('profiles')
            .update(update)
            .eq('username', username);
            
        if (updateError) {
            console.error('Error updating profile:', updateError);
            return { success: false, error: updateError.message };
        }
        
        console.log('Entry saved successfully to profile');
        return { success: true, data: updateData, slotUsed: slotToUse };
        
        console.log('Entry saved successfully to user_entries table');
        return { success: true, data };
    } catch (err) {
        console.error('Exception saving entry:', err);
        return { success: false, error: err.message };
    }
}

// Load all entries for the current user from Supabase
// If classId is provided, only load entries for that class
async function loadEntriesFromSupabase(classId = null) {
    console.log(`DEBUG [loadEntriesFromSupabase] START - Loading entries${classId ? ` for class ${classId}` : ''}...`);
    try {
        // Get current user info
        const { username } = getCurrentUser();
        if (!username) {
            console.error('User not logged in');
            return { success: false, error: 'User not logged in', entries: [] };
        }
        console.log(`DEBUG [loadEntriesFromSupabase] Loading entries for username: ${username}, classId: ${classId}`);

        // Build the query to get entries from journal_entries table
        let query = supabaseClient
            .from('journal_entries')
            .select('*')
            .eq('username', username);
            
        // If classId is provided, filter by class_id
        // This ensures we only get entries for this user's personal class journal
        if (classId) {
            console.log(`DEBUG [loadEntriesFromSupabase] Filtering by class_id: ${classId}`);
            query = query.eq('class_id', classId);
        } else {
            console.log(`DEBUG [loadEntriesFromSupabase] Filtering for entries with NULL class_id`);
            // For personal journal, get entries with no class_id (null)
            query = query.is('class_id', null);
        }
        
        // Execute the query and order by creation date
        console.log(`DEBUG [loadEntriesFromSupabase] Executing query with filters`);
        const { data: journalEntries, error: journalError } = await query
            .order('created_at', { ascending: false });

        // If we successfully got entries from journal_entries table
        if (!journalError && journalEntries && journalEntries.length > 0) {
            console.log(`DEBUG [loadEntriesFromSupabase] FOUND ${journalEntries.length} ENTRIES in journal_entries table`);
            console.log('DEBUG [loadEntriesFromSupabase] Entry IDs found:', journalEntries.map(e => e.id).join(', '));
            console.log('DEBUG [loadEntriesFromSupabase] Raw entries data:', JSON.stringify(journalEntries, null, 2));

            // Convert to our app's format
            const entries = journalEntries.map(entry => {
                const formatted = {
                    id: entry.id,
                    title: entry.title,
                    link: entry.link,
                    date: entry.created_at || new Date().toISOString(),
                    type: entry.entry_type,
                    username: entry.username,
                    class_id: entry.class_id
                };
                console.log(`DEBUG [loadEntriesFromSupabase] Formatted entry ${entry.id}:`, JSON.stringify(formatted, null, 2));
                return formatted;
            });

            console.log(`DEBUG [loadEntriesFromSupabase] RETURNING ${entries.length} formatted entries`);
            return { success: true, entries };
        }

        // If journal_entries failed or returned no entries, try user_entries
        console.log('No entries in journal_entries table or error occurred. Checking user_entries table.');
        if (journalError) {
            console.log('journal_entries error:', journalError);
        }

        // Try to get entries from user_entries table
        const { data: userEntries, error: userEntriesError } = await supabaseClient
            .from('user_entries')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false });

        // If we successfully got entries from user_entries table
        if (!userEntriesError && userEntries && userEntries.length > 0) {
            console.log('Loaded entries from user_entries table:', userEntries);

            // Convert to our app's format
            const entries = userEntries.map(entry => ({
                id: entry.id,
                title: entry.description,
                link: entry.youtube_link,
                date: entry.created_at || new Date().toISOString(),
                type: entry.entry_type || (entry.youtube_link && entry.youtube_link.includes('youtube') ? 'video' : 'document')
            }));

            console.log('Formatted entries from user_entries:', entries);
            return { success: true, entries };
        }
        
        // If user_entries failed or returned no entries, try to get from profiles
        console.log('No entries in user_entries table or error occurred. Checking profiles table.');
        if (userEntriesError) {
            console.log('user_entries error:', userEntriesError);
        }
        
        // Query the profiles table for the log entries
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('log1_youtube, log1_description, log1_date, log2_youtube, log2_description, log2_date, log3_youtube, log3_description, log3_date')
            .eq('username', username)
            .single();

        if (profileError) {
            console.error('Error loading profile:', profileError);
            return { success: false, error: profileError.message, entries: [] };
        }

        console.log('Loaded profile data:', profile);

        // Convert the profile data into an array of entries
        const profileEntries = [];

        // Add log1 if it exists
        if (profile.log1_youtube || profile.log1_description) {
            profileEntries.push({
                id: 'log1',
                title: profile.log1_description,
                link: profile.log1_youtube,
                date: profile.log1_date || new Date().toISOString(),
                type: profile.log1_youtube && profile.log1_youtube.includes('youtube') ? 'video' : 'document'
            });
        }

        // Add log2 if it exists
        if (profile.log2_youtube || profile.log2_description) {
            profileEntries.push({
                id: 'log2',
                title: profile.log2_description,
                link: profile.log2_youtube,
                date: profile.log2_date || new Date().toISOString(),
                type: profile.log2_youtube && profile.log2_youtube.includes('youtube') ? 'video' : 'document'
            });
        }

        // Add log3 if it exists
        if (profile.log3_youtube || profile.log3_description) {
            profileEntries.push({
                id: 'log3',
                title: profile.log3_description,
                link: profile.log3_youtube,
                date: profile.log3_date || new Date().toISOString(),
                type: profile.log3_youtube && profile.log3_youtube.includes('youtube') ? 'video' : 'document'
            });
        }

        // Sort entries by date, newest first
        profileEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log('Entries extracted from profile:', profileEntries);
        return { success: true, entries: profileEntries };
    } catch (err) {
        console.error('Exception loading entries:', err);
        return { success: false, error: err.message, entries: [] };
    }
}

// Delete an entry from Supabase
async function deleteEntry(entryId) {
    try {
        // Get current user info
        const { username } = getCurrentUser();
        if (!username) {
            console.error('User not logged in');
            return { success: false, error: 'User not logged in' };
        }

        console.log(`Attempting to delete entry with ID: ${entryId}`);
        
        // Check if this is a log ID (log1, log2, log3) from profiles table
        if (['log1', 'log2', 'log3'].includes(entryId)) {
            // This is a profile log entry
            console.log(`Deleting log entry from profiles table: ${entryId}`);
            
            // Create update object to clear the entry
            const update = {};
            update[`${entryId}_youtube`] = null;
            update[`${entryId}_description`] = null;
            update[`${entryId}_date`] = null;

            // Update the profile to clear the entry
            const { error } = await supabaseClient
                .from('profiles')
                .update(update)
                .eq('username', username);

            if (error) {
                console.error('Error deleting profile entry:', error);
                return { success: false, error: error.message };
            }

            console.log(`Profile entry ${entryId} deleted successfully`);
            return { success: true };
        } else {
            // Try to delete from journal_entries table first
            console.log(`Attempting to delete from journal_entries table with ID: ${entryId}`);
            
            const { error: journalError } = await supabaseClient
                .from('journal_entries')
                .delete()
                .eq('id', entryId)
                .eq('username', username); // Only delete own entries

            if (!journalError) {
                console.log(`journal_entries entry ${entryId} deleted successfully`);
                return { success: true };
            }

            console.log('Entry not found in journal_entries or error occurred:', journalError);
            console.log('Trying user_entries table instead');
            
            // If journal_entries fails, try to delete from user_entries table
            const { error } = await supabaseClient
                .from('user_entries')
                .delete()
                .eq('id', entryId)
                .eq('username', username); // Only delete own entries

            if (error) {
                console.error('Error deleting user_entries entry:', error);
                return { success: false, error: error.message };
            }

            console.log(`user_entries entry ${entryId} deleted successfully`);
            return { success: true };
        }
    } catch (err) {
        console.error('Exception deleting entry:', err);
        return { success: false, error: err.message };
    }
}

// Update an existing journal entry
async function updateEntry(entryData) {
    console.log('DEBUG [updateEntry] Starting with data:', JSON.stringify(entryData, null, 2));
    try {
        // Get current user info
        const { username } = getCurrentUser();
        console.log('DEBUG [updateEntry] Current username:', username);
        
        if (!username) {
            console.error('User not logged in');
            return { success: false, error: 'User not logged in' };
        }
        
        // Get the entry ID
        const entryId = entryData.id;
        console.log('DEBUG [updateEntry] Entry ID to update:', entryId);
        if (!entryId) {
            console.error('DEBUG [updateEntry] Error: No entry ID provided');
            return { success: false, error: 'No entry ID provided' };
        }
        
        // Check if this is a special ID format for profile entries (log1, log2, log3)
        if (entryId.startsWith('log')) {
            console.log('DEBUG [updateEntry] Detected profile-based entry, updating profile:', entryId);
            // This is a profile-based entry (log1, log2, or log3)
            const logSlot = entryId.charAt(3); // Extract the number from 'log1', 'log2', etc.
            
            if (logSlot !== '1' && logSlot !== '2' && logSlot !== '3') {
                console.error('DEBUG [updateEntry] Invalid log slot:', logSlot);
                return { success: false, error: 'Invalid log slot' };
            }
            
            // Create update object for the selected slot
            const update = {};
            update[`log${logSlot}_youtube`] = entryData.link || '';
            update[`log${logSlot}_description`] = entryData.title || '';
            update[`log${logSlot}_date`] = new Date().toISOString();
            
            console.log('DEBUG [updateEntry] Updating profile with:', JSON.stringify(update, null, 2));
            
            // Update the profile with the new entry
            const { data: updateData, error: updateError } = await supabaseClient
                .from('profiles')
                .update(update)
                .eq('username', username);
                
            if (updateError) {
                console.error('DEBUG [updateEntry] Error updating profile:', updateError);
                return { success: false, error: updateError.message };
            }
            
            console.log('DEBUG [updateEntry] Profile updated successfully');
            return { success: true, data: updateData };
        }
        
        // Regular journal_entries table entry
        console.log('DEBUG [updateEntry] Attempting to update in journal_entries table');
        
        // First verify this entry belongs to the current user
        console.log('DEBUG [updateEntry] Fetching existing entry with ID:', entryId);
        const { data: existingEntry, error: fetchError } = await supabaseClient
            .from('journal_entries')
            .select('*')  // Select all fields for better debugging
            .eq('id', entryId)
            .single();
            
        if (fetchError) {
            console.error('DEBUG [updateEntry] Error fetching entry from journal_entries:', fetchError);
            console.log('DEBUG [updateEntry] Trying to update entry in user_entries as fallback');
            
            // Try to update in user_entries table
            try {
                const { data: userEntry, error: userFetchError } = await supabaseClient
                    .from('user_entries')
                    .select('*')
                    .eq('id', entryId)
                    .single();
                    
                if (userFetchError) {
                    console.error('DEBUG [updateEntry] Error fetching from user_entries:', userFetchError);
                    return { success: false, error: 'Entry not found in any table' };
                }
                
                // Update in user_entries table
                const userUpdate = {
                    youtube_link: entryData.link || '',
                    description: entryData.title || '',
                    updated_at: new Date().toISOString()
                };
                
                const { data: userData, error: userUpdateError } = await supabaseClient
                    .from('user_entries')
                    .update(userUpdate)
                    .eq('id', entryId);
                    
                if (userUpdateError) {
                    console.error('DEBUG [updateEntry] Error updating user_entries:', userUpdateError);
                    return { success: false, error: userUpdateError.message };
                }
                
                console.log('DEBUG [updateEntry] Entry updated in user_entries table');
                return { success: true, data: userData };
            } catch (err) {
                console.error('DEBUG [updateEntry] Error in user_entries fallback:', err);
                return { success: false, error: err.message };
            }
        }
        
        console.log('DEBUG [updateEntry] Found existing entry:', JSON.stringify(existingEntry, null, 2));
        
        // Security check: ensure the entry belongs to this user
        if (existingEntry.username !== username) {
            console.error('DEBUG [updateEntry] Permission denied. Entry belongs to:', existingEntry.username, 'Current user:', username);
            return { success: false, error: 'Permission denied' };
        }
        
        // Determine entry type based on link
        const isVideo = entryData.link && entryData.link.includes('youtube');
        const entryType = entryData.type || (isVideo ? 'video' : 'document');
        console.log('DEBUG [updateEntry] Determined entry type:', entryType);
        
        const updatedEntry = {
            title: entryData.title || '',
            link: entryData.link || '',
            entry_type: entryType,
            updated_at: new Date().toISOString(),
            // Don't change username or class_id as they're identity fields
        };
        
        console.log('DEBUG [updateEntry] Updating with data:', JSON.stringify(updatedEntry, null, 2));
        console.log('DEBUG [updateEntry] Preserving class_id:', existingEntry.class_id);
        
        // Update the entry
        const { data, error } = await supabaseClient
            .from('journal_entries')
            .update(updatedEntry)
            .eq('id', entryId);
            
        if (error) {
            console.error('DEBUG [updateEntry] Error updating entry:', error);
            return { success: false, error: error.message };
        }
        
        console.log('DEBUG [updateEntry] Entry updated successfully! Updated record:', JSON.stringify(data, null, 2));
        return { success: true, data };
    } catch (error) {
        console.error('DEBUG [updateEntry] Exception in updateEntry:', error);
        return { success: false, error: error.message };
    }
}
