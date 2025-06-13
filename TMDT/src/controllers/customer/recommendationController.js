const recommendation = require('../../models/customer/recommendation.model');
const index = require('../../models/customer/index.model');
const general = require('../../models/general.model');

const recommendationController = function() { }

// Get personalized recommendations for a user
recommendationController.getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user ? req.user.user_id : null;
        const recommendations = await recommendation.getPersonalizedRecommendations(userId);
        
        res.status(200).json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting personalized recommendations',
            error: error.message
        });
    }
};

// Get similar products for a specific product
recommendationController.getSimilarProducts = async (req, res) => {
    try {
        const productId = req.params.productId;
        const similarProducts = await recommendation.getSimilarProducts(productId);
        
        res.status(200).json({
            success: true,
            data: similarProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting similar products',
            error: error.message
        });
    }
};

// Get trending products
recommendationController.getTrendingProducts = async (req, res) => {
    try {
        const trendingProducts = await recommendation.getTrendingProducts();
        
        res.status(200).json({
            success: true,
            data: trendingProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting trending products',
            error: error.message
        });
    }
};

// Get complementary products
recommendationController.getComplementaryProducts = async (req, res) => {
    try {
        const productId = req.params.productId;
        const complementaryProducts = await recommendation.getComplementaryProducts(productId);
        
        res.status(200).json({
            success: true,
            data: complementaryProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting complementary products',
            error: error.message
        });
    }
};

// Get best deal products
recommendationController.getBestDealProducts = async (req, res) => {
    try {
        const bestDealProducts = await recommendation.getBestDealProducts();
        
        res.status(200).json({
            success: true,
            data: bestDealProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting best deal products',
            error: error.message
        });
    }
};

module.exports = recommendationController; 