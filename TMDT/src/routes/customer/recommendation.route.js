const express = require('express');
const router = express.Router();
const recommendationController = require('../../controllers/customer/recommendationController');
const authMiddleware = require('../../middlewares/auth.middleware');

// Get personalized recommendations
router.get('/personalized', authMiddleware.requireAuth, recommendationController.getPersonalizedRecommendations);

// Get similar products
router.get('/similar/:productId', recommendationController.getSimilarProducts);

// Get trending products
router.get('/trending', recommendationController.getTrendingProducts);

// Get complementary products
router.get('/complementary/:productId', recommendationController.getComplementaryProducts);

// Get best deal products
router.get('/best-deals', recommendationController.getBestDealProducts);

module.exports = router; 