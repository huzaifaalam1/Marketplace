# AgenticMarketplace
📦 Local Development Setup

1️⃣ Clone the repository
    - git clone <repo-url>
    - cd agentic-marketplace

2️⃣ Install dependencies
     -
     npm install

3️⃣ Environment Variables
    - Create a file in the root of the project:
        .env
    - Add the shared Supabase credentials:
        NEXT_PUBLIC_SUPABASE_URL=your_project_url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

    ⚠️ Do NOT commit .env

4️⃣ Run the project
    - npm run dev

App runs at: http://localhost:3000

📁 Project Structure
agentic-marketplace/
    app/
        page.tsx
        layout.tsx
        globals.css (DO NOT MODIFY)
        login/
        signup/
        onboarding/
        setup-profile/
        setup-organization/
        dashboard/
    lib/
        supabaseClient.ts (DO NOT MODIFY)
