// Script to check the classroom tables in Supabase
const supabaseClient = supabase.createClient(
    'https://xtwamtfxirypcxszldow.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0d2FtdGZ4aXJ5cGN4c3psZG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NTIwMzQsImV4cCI6MjA1NjAyODAzNH0.ZZRtoHPlie0FN5IAF1WVd4sRqWOWH_ZfP149Gorit1c'
);

async function checkSetup() {
    console.log("===== Checking Classroom Setup =====");
    const username = localStorage.getItem('musicUsername');
    console.log("Current user:", username);

    if (!username) {
        console.error("No username found in localStorage. Please log in first.");
        return;
    }

    // 1. Check if user profile has role field
    try {
        console.log("\n1. Checking user profile...");
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();
            
        if (profileError) {
            console.error("Error fetching profile:", profileError);
        } else {
            console.log("Profile:", profile);
            console.log("Profile has role field:", profile.hasOwnProperty('role'));
            
            // Update role to admin if not already
            if (profile.role !== 'admin') {
                console.log("Setting user as admin...");
                const { data: updatedProfile, error: updateError } = await supabaseClient
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('username', username);
                    
                if (updateError) {
                    console.error("Error updating role:", updateError);
                } else {
                    console.log("Role updated to admin");
                }
            }
        }
    } catch (err) {
        console.error("Error checking profile:", err);
    }
    
    // 2. Test creating a classroom
    try {
        console.log("\n2. Testing classroom creation...");
        const testClass = {
            class_code: "TEST" + Math.floor(Math.random() * 10000),
            class_name: "Test Classroom",
            description: "A test classroom",
            created_by: username
        };
        
        console.log("Attempting to create test classroom...");
        const { data: classroom, error: classroomError } = await supabaseClient
            .from('classrooms')
            .insert([testClass])
            .select();
            
        if (classroomError) {
            console.error("Error creating classroom:", classroomError);
        } else {
            console.log("Created classroom:", classroom[0]);
            const classroomId = classroom[0].id;
            
            // 3. Test class membership
            console.log("\n3. Testing class membership...");
            const membership = {
                username: username,
                class_id: classroomId,
                role: 'admin'
            };
            
            const { data: memberData, error: memberError } = await supabaseClient
                .from('class_memberships')
                .insert([membership])
                .select();
                
            if (memberError) {
                console.error("Error joining classroom:", memberError);
            } else {
                console.log("Joined classroom:", memberData[0]);
                
                // 4. Test journal entry with class_id
                console.log("\n4. Testing class journal entry...");
                const entry = {
                    username: username,
                    title: "Test Class Entry",
                    link: "https://example.com",
                    entry_type: "document",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    class_id: classroomId
                };
                
                const { data: entryData, error: entryError } = await supabaseClient
                    .from('journal_entries')
                    .insert([entry])
                    .select();
                    
                if (entryError) {
                    console.error("Error creating class entry:", entryError);
                } else {
                    console.log("Created class journal entry:", entryData[0]);
                    
                    // 5. Test retrieving journal entries by class
                    console.log("\n5. Testing journal entry retrieval by class...");
                    const { data: classEntries, error: entriesError } = await supabaseClient
                        .from('journal_entries')
                        .select('*')
                        .eq('class_id', classroomId);
                        
                    if (entriesError) {
                        console.error("Error retrieving class entries:", entriesError);
                    } else {
                        console.log(`Found ${classEntries.length} entries for class ${classroomId}`);
                        console.log("Class entries:", classEntries);
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error in test process:", err);
    }
    
    console.log("\n===== Classroom Setup Test Complete =====");
}

// Execute the test
checkSetup();
