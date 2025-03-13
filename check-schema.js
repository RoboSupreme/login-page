// Script to check both user_entries and journal_entries table schemas in Supabase
const supabaseClient = supabase.createClient(
    'https://xtwamtfxirypcxszldow.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0d2FtdGZ4aXJ5cGN4c3psZG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NTIwMzQsImV4cCI6MjA1NjAyODAzNH0.ZZRtoHPlie0FN5IAF1WVd4sRqWOWH_ZfP149Gorit1c'
);

// Function to check the user_entries table
async function checkUserEntriesTable() {
    console.log('\n------- Checking user_entries table -------');
    try {
        // Get a single row to inspect columns
        const { data, error } = await supabaseClient
            .from('user_entries')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Error fetching table data:', error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('Table structure:');
            console.log(Object.keys(data[0]));
            console.log('Sample entry:');
            console.log(data[0]);
        } else {
            console.log('No entries found in the table');
        }
    } catch (err) {
        console.error('Exception checking user_entries:', err);
    }
}

// Function to check the journal_entries table
async function checkJournalEntriesTable() {
    console.log('\n------- Checking journal_entries table -------');
    try {
        // Get a single row to inspect columns
        const { data, error } = await supabaseClient
            .from('journal_entries')
            .select('*')
            .limit(1);
            
        if (error) {
            // Check if the error is because the table doesn't exist
            if (error.code === '42P01') { // table doesn't exist
                console.error('The journal_entries table does not exist. Create it using the SQL provided in the journal-storage.js file.');
                console.log('SQL to create the journal_entries table:');
                console.log(`
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  username TEXT REFERENCES profiles(username),
  title TEXT,
  link TEXT,
  entry_type TEXT CHECK (entry_type IN ('video', 'document')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create an index for faster queries by username
CREATE INDEX journal_entries_username_idx ON journal_entries(username);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own entries
CREATE POLICY "Users can view their own entries"
ON journal_entries FOR SELECT
USING (username = auth.current_user()->>'username' OR auth.role() = 'service_role');

-- Create policy for users to insert their own entries
CREATE POLICY "Users can insert their own entries"
ON journal_entries FOR INSERT
WITH CHECK (username = auth.current_user()->>'username' OR auth.role() = 'service_role');

-- Create policy for users to update their own entries
CREATE POLICY "Users can update their own entries"
ON journal_entries FOR UPDATE
USING (username = auth.current_user()->>'username' OR auth.role() = 'service_role');

-- Create policy for users to delete their own entries
CREATE POLICY "Users can delete their own entries"
ON journal_entries FOR DELETE
USING (username = auth.current_user()->>'username' OR auth.role() = 'service_role');
`);
            } else {
                console.error('Error fetching journal_entries data:', error);
            }
            return;
        }
        
        if (data && data.length > 0) {
            console.log('Journal entries table structure:');
            console.log(Object.keys(data[0]));
            console.log('Sample entry:');
            console.log(data[0]);
        } else {
            console.log('No entries found in the journal_entries table, but the table exists.');
        }
    } catch (err) {
        console.error('Exception checking journal_entries:', err);
    }
}

// Function to check current user's profile
async function checkCurrentUser() {
    console.log('\n------- Checking current user -------');
    const username = localStorage.getItem('musicUsername');
    console.log(`Current username from localStorage: ${username}`);
    
    if (username) {
        try {
            // Check if this username exists in profiles table
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();
                
            if (error) {
                console.error('Error fetching user profile:', error);
                console.log('You may need to create this user in the profiles table.');
            } else if (data) {
                console.log('User profile found in profiles table:', data);
            }
        } catch (err) {
            console.error('Exception checking user profile:', err);
        }
    } else {
        console.log('No username found in localStorage. You need to log in first.');
    }
}

// Execute all checks
async function runAllChecks() {
    console.log('Starting schema check at', new Date().toLocaleString());
    await checkUserEntriesTable();
    await checkJournalEntriesTable();
    await checkCurrentUser();
    console.log('\n------- Schema check complete -------');
}

// Execute the function
runAllChecks();
