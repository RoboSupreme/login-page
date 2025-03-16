// This is a simple script to help debug and fix the teacher buttons
// Run this in your browser console when on the dashboard page

async function fixTeacherButtons() {
  console.log("Starting teacher button fix...");
  
  // Get current user role
  const username = localStorage.getItem('musicUsername');
  const storedRole = localStorage.getItem('musicUserRole');
  
  console.log("Current username:", username);
  console.log("Current role in localStorage:", storedRole);
  
  // Check database role
  const supabaseClient = supabase.createClient(
    'https://xtwamtfxirypcxszldow.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0d2FtdGZ4aXJ5cGN4c3psZG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NTIwMzQsImV4cCI6MjA1NjAyODAzNH0.ZZRtoHPlie0FN5IAF1WVd4sRqWOWH_ZfP149Gorit1c'
  );
  
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('username', username)
    .single();
    
  if (error) {
    console.error("Error getting role from database:", error);
    return;
  }
  
  const dbRole = profile.role || 'student';
  console.log("Role in database:", dbRole);
  
  // Update localStorage if needed
  if (storedRole !== dbRole) {
    console.log("Updating localStorage role to match database");
    localStorage.setItem('musicUserRole', dbRole);
  }
  
  // Now make sure the create class button is visible if user is a teacher
  if (dbRole === 'teacher') {
    console.log("User is a teacher, making createClassBtn visible");
    const createClassBtn = document.getElementById('createClassBtn');
    if (createClassBtn) {
      createClassBtn.style.display = 'block';
      console.log("Button should now be visible");
    } else {
      console.error("Could not find createClassBtn element");
    }
    
    // Add a teacher badge if it doesn't exist
    const userInfoSection = document.querySelector('.user-info');
    if (userInfoSection && !document.querySelector('.teacher-badge')) {
      console.log("Adding teacher badge");
      const teacherBadge = document.createElement('div');
      teacherBadge.className = 'role-badge teacher-badge';
      teacherBadge.textContent = 'Teacher';
      teacherBadge.style.backgroundColor = '#4CAF50';
      teacherBadge.style.color = 'white';
      teacherBadge.style.padding = '3px 8px';
      teacherBadge.style.borderRadius = '4px';
      teacherBadge.style.display = 'inline-block';
      teacherBadge.style.marginTop = '8px';
      userInfoSection.appendChild(teacherBadge);
    }
    
    // Update role display
    const roleDisplay = document.getElementById('userRole');
    if (roleDisplay) {
      roleDisplay.textContent = 'Role: Teacher';
    }
  }
  
  console.log("Fix completed");
}

// Call the function
fixTeacherButtons();
