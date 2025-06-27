const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Importing routes
const authRoute = require('./Routers/auth.route.js');
const dashboardRoute = require('./Routers/dashboard.route.js');
const companyRoute = require('./Routers/companies.route.js');
const activityRoute = require('./Routers/activity.route.js');
const userBillingInfoRoutes = require('./Routers/userBillingInfo.route.js');
const lookupRoutes = require('./Routers/lookup.route.js');
const generateRoutes = require('./Routers/generate.route.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000 ;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/dashboard', dashboardRoute); // Routes for dashboard summary and subscription updates
app.use('/api/companies', companyRoute); // Routes for company management
app.use('/api/activity', activityRoute); // Routes for activity logging
app.use('/api/user/billing-info', userBillingInfoRoutes); // Routes for user billing information
app.use('/api/lookups', lookupRoutes); // Routes for lookup data
app.use('/api/generate', generateRoutes); // Routes for generating invoices XML and template excel files


// Global error handler (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Quelque chose s'est cassé !");
});

// Server start
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});