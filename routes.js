const express = require('express');
const router = express.Router();
const authentication = require('./auth/authentication');
const dashboard = require('./dash/dashboard.js');
const SA = require('./superadmin/SA.js');
const limitter = require('express-rate-limit');


const registerLimitter = limitter({
    windowMS : 5*60*1000,
    max: 2,
})

// Registration route
router.post('/register',registerLimitter, authentication.register);

const loginLimit = limitter({
    windowMS : 1*60*1000,
    max: 5,
})
// Login route
router.post('/login', loginLimit,authentication.login);
router.post('/register-dashboard', authentication.register_dashboard);
router.get('/user', authentication.getUserDetails);
router.post('/verify', authentication.verifyToken);
router.post('/re-verify-mail', authentication.resendToken);
router.post('/forgot', authentication.forgotPassword);
router.post('/resend-forgot', authentication.resendResetToken);
router.post('/reset-password', authentication.resetPassword);
// router.put('/setUserOnline/:UserId', authentication.setUserOnline);
// router.put('/setUserOffline/:UserId', authentication.setUserOffline);

//Dashboard
router.get('/userdevices/:companyEmail', dashboard.userDevices);
router.put('/editDevice/:deviceId', dashboard.editDevice);
router.put('/companyDetails/:UserId', dashboard.companyDetails);
router.put('/personalDetails/:UserId', dashboard.personalDetails);
router.put('/updatePassword/:UserId', dashboard.updatePassword);
router.put('/editDeviceTrigger/:deviceId', dashboard.editDeviceTrigger);
router.get('/device-trigger/:deviceId', dashboard.fetchDeviceTrigger);
router.get('/user-devices-trigger/:CompanyEmail', dashboard.fetchAllDeviceTrigger);
router.get('/data/:deviceId/intervals', dashboard.getDataByTimeInterval);
router.get('/data/:deviceId', dashboard.getDataByCustomDate);
router.get('/dataStatus/:deviceId/intervals', dashboard.getDataByTimeIntervalStatus);
router.get('/dataStatus/:deviceId', dashboard.getDataByCustomDateStatus);
router.get('/live-device-detail/:deviceId', dashboard.getDeviceDetails);
router.get('/live-device-status/:deviceId', dashboard.getLiveStatusDetails);
router.get('/user-data/:userId', dashboard.getUserData);
router.post('/new-message', dashboard.insertNewMessage);
router.put('/mark-read-message/:messageId', dashboard.markMessageAsRead);
router.delete('/delete-message/:messageId', dashboard.deleteMessage);
router.get('/unread-message/:receiver', dashboard.countUnreadMessages);
router.get('/messages/:receiver', dashboard.getUserMessages);
router.get('/Company-users/:CompanyEmail', dashboard.fetchCompanyUser);
router.post('/addDeviceTrigger', dashboard.addDeviceTrigger)
router.post('/addDevice', dashboard.addDevice);

//SA
// router.get('/fetchAllDevices', SA.fetchAllDevices);
// router.get('/fetchAllUsers', SA.fetchAllUsers);
// router.post('/addDevice', SA.addDevice);
// router.get('/getDeviceByUID/:deviceUID', SA.getDeviceByUID);
// router.put('/updateDevice/:deviceUID', SA.updateDevice);
// router.delete('/deleteDevice/:deviceUID', SA.deleteDevice);
// router.get('/fetchCompanyDetails/:CompanyEmail', SA.fetchCompanyDetails);
// router.get('/fetchCounts/:CompanyEmail', SA.fetchCounts);

module.exports = router;