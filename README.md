# Split Smartly

Build a complete, functional full-stack web application called:

SPLITSMART
Smart Group Expense & Settlement Manager

============================================================
IMPORTANT PROJECT GOAL
============================================================

SplitSmart is a college-focused group expense splitting and
settlement management application.

It allows friends, classmates and project groups to:

- Create groups
- Add members
- Record shared expenses
- Automatically calculate individual shares
- Calculate net balances
- Track who owes whom
- Generate an optimized settlement plan
- Minimize unnecessary money transfers
- View expense history
- View group analytics

This is also a DSA micro-project.

The application MUST contain a REAL implementation of:

- HashMap
- Directed Graph
- Greedy Algorithm
- Priority Queue / Heap
- Settlement optimization

Do NOT fake the DSA concepts by only mentioning them in the UI.

============================================================
1. TECHNOLOGY STACK — STRICT
============================================================

FRONTEND:

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- Chart.js for charts
- Lucide icons or Font Awesome if needed

DO NOT use React.

DO NOT use Next.js.

DO NOT use Angular.

Keep the frontend simple and understandable.

BACKEND:

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security only where necessary for authentication
- Maven

DATABASE:

- PostgreSQL

DSA:

Implement the DSA logic in Java.

Use:

- HashMap
- Directed Graph
- PriorityQueue / Heap
- Greedy Algorithm

DEPLOYMENT:

The application must be structured so that:

Frontend can be deployed to Vercel.

Backend can be deployed to a service such as Render or Railway.

PostgreSQL can be hosted using a cloud PostgreSQL provider.

Do NOT depend on:

- XAMPP
- PHP
- MySQL
- Firebase
- Supabase
- Node.js backend
- MongoDB

============================================================
2. VERY IMPORTANT ARCHITECTURE
============================================================

Use a simple client-server architecture.

Architecture:

Browser
   ↓
HTML + CSS + Vanilla JavaScript
   ↓
REST API
   ↓
Spring Boot
   ↓
Spring Data JPA
   ↓
PostgreSQL

The frontend must NEVER directly access PostgreSQL.

All persistent data must go through the Spring Boot REST API.

This is important because the same account must be able to access
the same groups and expenses from different devices.

Example:

Laptop
   ↓
Login as user@example.com
   ↓
Create "Goa Trip"
   ↓
Data saved in PostgreSQL


Phone
   ↓
Login as user@example.com
   ↓
Fetch groups from backend
   ↓
"Goa Trip" appears

============================================================
3. PROJECT STRUCTURE
============================================================

Use a simple two-part structure:

SplitSmart/

├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── groups.html
│   ├── group.html
│   ├── expenses.html
│   ├── settlement.html
│   ├── history.html
│   ├── analytics.html
│   ├── how-it-works.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── groups.js
│       ├── expenses.js
│       ├── settlement.js
│       ├── history.js
│       └── analytics.js
│
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/
│           │       └── splitsmart/
│           │           ├── SplitSmartApplication.java
│           │           │
│           │           ├── controller/
│           │           ├── service/
│           │           ├── repository/
│           │           ├── model/
│           │           ├── dto/
│           │           ├── dsa/
│           │           └── config/
│           │
│           └── resources/
│               └── application.properties
│
└── README.md

Do not create unnecessary enterprise-level folders.

Keep the architecture easy for a student to understand.

============================================================
4. DATABASE
============================================================

Use PostgreSQL.

Create these main entities:

USERS

- id
- name
- email
- password
- created_at

GROUPS

- id
- name
- category
- description
- created_at
- created_by

GROUP_MEMBERS

- id
- group_id
- user_id
- joined_at

EXPENSES

- id
- group_id
- title
- amount
- paid_by
- category
- expense_date
- created_at

EXPENSE_PARTICIPANTS

- id
- expense_id
- user_id
- share_amount

SETTLEMENTS

- id
- group_id
- from_user
- to_user
- amount
- status
- created_at
- completed_at

Use:

- Primary keys
- Foreign keys
- Appropriate indexes
- Relationships
- created_at timestamps

Use JPA relationships where appropriate.

Avoid unnecessary duplication.

============================================================
5. DATABASE CONFIGURATION
============================================================

Do NOT hard-code production database credentials.

Use environment variables.

Example:

DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD

Provide a local development configuration in:

application.properties

Also provide a clear README explaining how to configure
PostgreSQL locally and how environment variables should be
configured for deployment.

============================================================
6. AUTHENTICATION
============================================================

Create:

REGISTER
LOGIN
LOGOUT

Registration:

- Name
- Email
- Password
- Confirm Password

Login:

- Email
- Password

Passwords must never be stored as plain text.

Use BCrypt password hashing.

Use a simple authentication mechanism that works correctly
between frontend and backend.

If JWT is used, keep the implementation minimal and clearly
structured.

The frontend should store only the authentication token/session
information necessary to communicate with the backend.

Do NOT store passwords in LocalStorage.

============================================================
7. USER FLOW
============================================================

The complete flow should be:

Register
   ↓
Login
   ↓
Dashboard
   ↓
Create Group
   ↓
Add Members
   ↓
Add Expense
   ↓
Calculate Shares
   ↓
Calculate Balances
   ↓
Generate Settlement
   ↓
Mark Settlement Complete
   ↓
History / Analytics

All important data must be retrieved from PostgreSQL through
Spring Boot APIs.

============================================================
8. DASHBOARD
============================================================

Create a modern dashboard.

Show:

- Total Groups
- Total Expenses
- Total Amount Spent
- Amount You Owe
- Amount You Should Receive
- Recent Groups
- Recent Expenses

Quick action buttons:

+ Create Group
+ Add Expense
View Groups
View Settlements

Dashboard values must be calculated from real backend data.

Do NOT use permanent fake statistics.

If the user has no data, show a good empty state.

============================================================
9. GROUPS
============================================================

Create a Groups page.

Each group card should show:

- Group name
- Category
- Number of members
- Total expenses
- Total amount spent
- Created date

Categories:

- Trip
- College
- Food
- Project
- Event
- Other

Actions:

- Open Group
- Add Expense
- View Settlement

============================================================
10. CREATE GROUP
============================================================

Fields:

- Group Name
- Category
- Description

When a group is created:

1. Create the group in PostgreSQL.
2. Automatically add the creator as a member.
3. Return the group ID.
4. Redirect to the group details page.

============================================================
11. GROUP MEMBERS
============================================================

Allow group members to be added.

For simplicity, support adding an existing registered user
using their email.

The backend must verify that the user exists.

Do not allow the same user to be added twice.

The group creator should automatically become a member.

Display:

- Member name
- Email
- Total paid
- Total share
- Net balance

============================================================
12. GROUP DETAILS
============================================================

Create a group details page with sections:

Overview
Members
Expenses
Balances
Settlement

Overview:

- Group name
- Category
- Description
- Total spending
- Number of expenses
- Number of members

Members:

- Name
- Total paid
- Total share
- Net balance

Expenses:

- Title
- Amount
- Paid by
- Date
- Category
- Participants

Settlement:

- Optimized transactions
- Pending/completed status

============================================================
13. ADD EXPENSE
============================================================

Expense fields:

- Expense title
- Amount
- Paid by
- Date
- Category
- Participants

Participants must be selected from group members.

Initially support ONLY equal splitting.

Example:

Amount = ₹1200
Participants = 4

Each share = ₹300.

The payer does NOT need to be the only participant.

Example:

A pays ₹1000 for A, B and C.

The system should calculate:

A = ₹333.33
B = ₹333.33
C = ₹333.34

Make sure:

SUM(all shares) = original expense amount

Handle rounding correctly.

Use a database transaction when creating:

Expense
+
Expense Participants

If saving any part fails, roll back the operation.

============================================================
14. BALANCE CALCULATION
============================================================

For every group member calculate:

TOTAL PAID

TOTAL SHARE

NET BALANCE

Formula:

Net Balance = Total Paid - Total Share

If:

Net Balance > 0

The person should RECEIVE money.

If:

Net Balance < 0

The person OWES money.

Example:

A paid ₹1000.

A's total share = ₹400.

Net balance = +₹600.

Therefore:

A should receive ₹600.

These calculations should be generated from actual expenses.

Do not permanently store derived balances unless necessary.

============================================================
15. DSA REQUIREMENT
============================================================

THIS IS THE CORE OF THE PROJECT.

Create a dedicated DSA package:

backend/src/main/java/com/splitsmart/dsa/

Include:

DebtGraph.java
MaxHeap.java or appropriate PriorityQueue implementation
SettlementOptimizer.java

============================================================
16. HASHMAP
============================================================

Use Java HashMap for efficient balance lookup.

Example concept:

Map<Long, Double> balances

where:

key = user/member ID

value = net balance

The implementation should be actual Java code.

Explain in comments why HashMap is useful.

Expected average lookup:

O(1)

============================================================
17. DIRECTED GRAPH
============================================================

Create a DebtGraph class.

Represent debt relationships as directed edges.

Example:

B → A : ₹300

means B owes A ₹300.

The graph should contain:

From user
To user
Amount

Create an appropriate graph representation using Java collections.

Do not simply create a class named DebtGraph and leave it unused.

The settlement logic must actually use the graph concept.

============================================================
18. PRIORITY QUEUE / HEAP
============================================================

Use Java PriorityQueue.

Separate:

CREDITORS
Positive balances

DEBTORS
Negative balances

Prioritize the largest outstanding balances.

Use appropriate comparators.

The algorithm should efficiently select the largest creditor
and largest debtor.

============================================================
19. GREEDY SETTLEMENT ALGORITHM
============================================================

Create:

SettlementOptimizer.java

The algorithm:

1. Calculate net balances.
2. Put positive balances into creditor priority queue.
3. Put negative balances into debtor priority queue.
4. Select the largest creditor.
5. Select the largest debtor.
6. Calculate:

settlementAmount =
minimum(creditorAmount, debtorAmount)

7. Create a transaction:

Debtor → Creditor → settlementAmount

8. Reduce both balances.
9. If one balance becomes zero, remove it.
10. Continue until all balances are settled.

Example:

A = +₹600
B = -₹200
C = -₹400

Output:

B → A : ₹200
C → A : ₹400

============================================================
20. OPTIMIZATION
============================================================

The purpose of the algorithm is to minimize unnecessary
transactions.

Do not simply generate one transaction for every original
expense.

Combine all expenses first.

Then calculate:

Net balances

Then optimize those balances.

The settlement result should contain:

- payer
- receiver
- amount

============================================================
21. DSA TIME COMPLEXITY
============================================================

Document the approximate time complexity of the settlement
algorithm in the README.

Explain the complexity of:

- HashMap balance calculation
- Graph creation
- PriorityQueue operations
- Greedy settlement matching

Keep the explanation beginner-friendly.

============================================================
22. SETTLEMENT PAGE
============================================================

Create a dedicated Settlement page.

Show:

TOTAL AMOUNT TO SETTLE

NUMBER OF TRANSACTIONS

CURRENT STATUS

Then show transaction cards.

Example:

--------------------------------
Rahul
   ↓
Priya

₹300

Rahul pays Priya ₹300
[Mark Completed]
--------------------------------

Use:

Green → receiving money

Red/orange → paying money

Allow a settlement to be marked:

Pending
Completed

Persist the status in PostgreSQL.

============================================================
23. EXPENSE HISTORY
============================================================

Create a History page.

Show:

- Expense title
- Group
- Amount
- Paid by
- Date
- Category
- Participants

Filters:

- Group
- Category
- Date
- User

Allow opening an expense to see its full breakdown.

============================================================
24. ANALYTICS
============================================================

Create a polished Analytics page.

Show:

- Total spending
- Number of expenses
- Average expense
- Highest expense
- Total paid by each member
- Total share by each member
- Current balances

Use Chart.js.

Charts:

1. Spending by member
2. Spending by category
3. Expense trend

All charts must use real backend data.

If there is no data:

Show a clean empty state.

Do not create fake analytics.

============================================================
25. HOW IT WORKS PAGE
============================================================

Create a visually interesting "How It Works" page.

Show:

EXPENSE
   ↓
INDIVIDUAL SHARES
   ↓
NET BALANCES
   ↓
DEBT GRAPH
   ↓
PRIORITY QUEUE
   ↓
GREEDY MATCHING
   ↓
OPTIMIZED SETTLEMENT

Explain:

1. Expense is recorded.
2. Shares are calculated.
3. Net balances are calculated.
4. Debt relationships form a graph.
5. Creditors/debtors are placed into priority queues.
6. Greedy matching minimizes transactions.

This section is specifically for explaining the DSA during viva.

============================================================
26. REST API
============================================================

Create clean REST endpoints.

AUTH:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

GROUPS:

GET /api/groups
GET /api/groups/{id}
POST /api/groups
DELETE /api/groups/{id}

MEMBERS:

GET /api/groups/{id}/members
POST /api/groups/{id}/members
DELETE /api/groups/{id}/members/{userId}

EXPENSES:

GET /api/groups/{id}/expenses
POST /api/groups/{id}/expenses
GET /api/expenses/{id}
DELETE /api/expenses/{id}

BALANCES:

GET /api/groups/{id}/balances

SETTLEMENT:

GET /api/groups/{id}/settlement
POST /api/groups/{id}/settlement/generate
PATCH /api/settlements/{id}/complete

ANALYTICS:

GET /api/groups/{id}/analytics

Keep controllers thin.

Put business logic in service classes.

Put database access in repositories.

Put DSA logic in the dsa package.

============================================================
27. BACKEND STRUCTURE
============================================================

Use:

controller/
service/
repository/
model/
dto/
dsa/
config/

Example:

GroupController
GroupService
GroupRepository

ExpenseController
ExpenseService
ExpenseRepository

SettlementController
SettlementService
SettlementOptimizer

Do not put SQL or complicated business logic inside controllers.

============================================================
28. SECURITY
============================================================

Implement basic security correctly.

Requirements:

- BCrypt password hashing
- Authentication required for private endpoints
- Users can only access groups they belong to
- Users cannot modify another user's unrelated data
- Validate all IDs
- Validate all request bodies

Never expose passwords in API responses.

Never expose database credentials.

============================================================
29. ERROR HANDLING
============================================================

Handle:

- Invalid login
- Duplicate email
- Invalid group
- Unauthorized group access
- Duplicate group member
- Invalid expense
- Negative amount
- Zero amount
- No participants
- Invalid payer
- Settlement when no money is owed
- Missing resources
- Database errors

Return clean JSON error responses.

Show friendly messages in the frontend.

Never expose raw stack traces to users.

============================================================
30. FRONTEND API LAYER
============================================================

Create:

frontend/js/api.js

All backend communication should go through this file.

Use fetch().

Example conceptual functions:

login()
register()
getGroups()
createGroup()
getGroup()
addMember()
createExpense()
getBalances()
generateSettlement()
completeSettlement()
getAnalytics()

Do not duplicate fetch logic across every page.

============================================================
31. UI DESIGN
============================================================

The UI should look like a polished modern SaaS product.

Style:

- Clean
- Modern
- Minimal
- Professional
- College-friendly
- Slightly Gen-Z
- Responsive

Use:

- White/light background
- Sophisticated green/teal accent
- Neutral gray text
- Rounded cards
- Subtle shadows
- Good spacing
- Clean typography
- Smooth but restrained animations

Use:

GREEN:
Money received / positive balance

RED/ORANGE:
Money owed / negative balance

Avoid:

- Excessive gradients
- Neon cyberpunk styling
- Excessive glassmorphism
- Childish illustrations
- Overly complicated animations

============================================================
32. NAVIGATION
============================================================

Desktop sidebar:

Dashboard
Groups
Expenses
Settlement
History
Analytics
How It Works
Profile
Logout

Mobile:

Use a responsive navigation system.

============================================================
33. RESPONSIVE DESIGN
============================================================

Must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Tables should not overflow badly.

Convert important tables to responsive cards on small screens.

============================================================
34. EMPTY STATES
============================================================

Do not show empty white screens.

Examples:

No groups:

"No groups yet.
Create your first group to start splitting expenses."

No expenses:

"No expenses recorded yet."

No settlement:

"You're all settled up! 🎉"

============================================================
35. TOAST NOTIFICATIONS
============================================================

Use clean toast notifications for:

Success
Error
Warning
Information

Examples:

"Group created successfully."

"Expense added."

"Settlement generated."

"Member added."

"Settlement marked as completed."

============================================================
36. NO STATIC DUMMY APPLICATION
============================================================

The application must actually work.

Do NOT create:

- fake buttons
- fake charts
- hard-coded groups
- hard-coded expenses
- hard-coded balances
- fake settlement results

All important data must come from PostgreSQL through the backend.

============================================================
37. DEPLOYMENT READINESS
============================================================

Prepare the project for deployment.

Frontend:

Must be deployable as a static site.

Backend:

Must be deployable as a Spring Boot application.

Database:

Must use PostgreSQL.

Do not hard-code localhost URLs.

Use an environment/configuration variable for the backend API URL.

Example concept:

API_BASE_URL

Development:

http://localhost:8080

Production:

Use the deployed Spring Boot backend URL.

============================================================
38. CORS
============================================================

Configure Spring Boot CORS correctly so the deployed frontend
can communicate with the deployed backend.

Keep the allowed frontend origin configurable.

Do not use insecure wildcard CORS in production if avoidable.

============================================================
39. README
============================================================

Create a complete README containing:

1. Project Overview
2. Features
3. Technology Stack
4. Architecture
5. Database Schema
6. API Overview
7. DSA Concepts
8. Settlement Algorithm
9. Time Complexity
10. Local Setup
11. PostgreSQL Setup
12. Backend Setup
13. Frontend Setup
14. Environment Variables
15. Deployment
16. Future Improvements

Also explain:

Why HashMap?
Why Graph?
Why PriorityQueue?
Why Greedy?

============================================================
40. LOCAL DEVELOPMENT
============================================================

Make local setup beginner-friendly.

Backend:

Run Spring Boot using Maven.

Frontend:

Use a simple local static server.

Database:

PostgreSQL.

Provide clear setup instructions.

============================================================
41. FINAL FUNCTIONAL TEST
============================================================

Test this exact flow:

REGISTER
↓
LOGIN
↓
CREATE GROUP
↓
ADD MEMBER
↓
ADD EXPENSE
↓
SELECT PARTICIPANTS
↓
CALCULATE SHARES
↓
CALCULATE NET BALANCES
↓
BUILD DEBT GRAPH
↓
RUN GREEDY + PRIORITY QUEUE SETTLEMENT
↓
DISPLAY OPTIMIZED SETTLEMENT
↓
MARK SETTLEMENT COMPLETED
↓
VIEW HISTORY
↓
VIEW ANALYTICS

Then test:

DEVICE A:
Login
Create group
Add expense

DEVICE B:
Login with the SAME account

Expected:

The same group and expense must appear.

This shared-data behavior is a CORE requirement.

============================================================
42. IMPORTANT ACADEMIC REQUIREMENT
============================================================

This is a DSA micro-project.

The final application must clearly demonstrate:

HashMap
Directed Graph
PriorityQueue / Heap
Greedy Algorithm
Transaction Optimization

The DSA implementation must be actual Java code.

Do not replace the DSA implementation with database queries.

Do not fake the algorithm.

The settlement optimizer should be one of the most clearly
structured parts of the backend.

============================================================
43. FINAL QUALITY STANDARD
============================================================

The final application should feel like a real product called
SplitSmart, not a basic college CRUD project.

Priorities:

1. FUNCTIONALITY
2. CORRECT DSA IMPLEMENTATION
3. CORRECT DATABASE RELATIONSHIPS
4. SHARED DATA ACROSS DEVICES
5. CLEAN UI
6. RESPONSIVE DESIGN
7. DEPLOYMENT READINESS
8. CODE SIMPLICITY

Do not over-engineer.

Do not introduce unnecessary frameworks.

Keep the code understandable enough for a student to explain
every major part during a viva.

Build the complete working application, not just a frontend mockup.
