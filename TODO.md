# TODO: Integrate Frontend with Backend and Database

## Approved Plan Steps
- [x] Add firebase-admin dependency to backend/package.json
- [x] Update backend/server.js to initialize Firebase Admin SDK
- [x] Create backend/routes/campaigns.js for GET /api/campaigns and POST /api/campaigns
- [x] Update backend/routes/contribute.js to handle POST /api/campaigns/:id/contribute
- [x] Create backend/routes/withdraw.js for POST /api/campaigns/:id/withdraw
- [x] Create backend/routes/refund.js for POST /api/campaigns/:id/refund
- [x] Update pol-crowdfund/src/app/page.tsx to fetch campaigns from API instead of contract
- [x] Update pol-crowdfund/src/app/create-campaign/page.tsx to call API for creating campaigns
- [x] Update pol-crowdfund/src/app/donate/page.tsx to call API for contributions
- [x] Update pol-crowdfund/src/app/transactions/page.tsx accordingly
- [x] Install dependencies in backend (npm install)
- [x] Test backend routes
- [ ] Run frontend (npm run dev in pol-crowdfund) and verify integrations
- [x] Ensure CORS is handled for API calls (add cors middleware if needed)
- [x] Fix login redirect issue
