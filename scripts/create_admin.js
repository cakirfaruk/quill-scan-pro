
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ekkymypfvixlysrgtabz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVra3lteXBmdml4bHlzcmd0YWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjUxMTMsImV4cCI6MjA3NzUwMTExM30.l2v48ELXVKVniMES4VXIfJ6aqBfBho-I41wYMulVxoo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdmin() {
    const email = "admin@admin.com";
    const password = "Astr0Social#2026!Str0ng";
    const username = "AdminUser";

    console.log(`Attempting to register ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                full_name: "Admin User",
            },
        },
    });

    if (error) {
        console.error("Error creating user:", error.message);
    } else {
        console.log("User created successfully:", data.user);
        if (data.session) {
            console.log("Session created (Auto-confirmed or no email verify needed).");
        } else {
            console.log("User created but session is null (Email verification might be required).");
        }
    }
}

createAdmin();
