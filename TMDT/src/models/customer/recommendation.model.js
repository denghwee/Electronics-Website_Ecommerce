const db = require('../../config/db/connect');
const util = require('node:util');
const query = util.promisify(db.query).bind(db);

const recommendation = function() { }

// Get personalized recommendations based on user's purchase history and ratings
recommendation.getPersonalizedRecommendations = async (userId, limit = 8) => {
    const sql = `
        SELECT DISTINCT p.*, 
            COALESCE(AVG(f.feedback_rate), 0) as avg_rating,
            COUNT(f.feedback_id) as feedback_count,
            pv.product_variant_is_bestseller,
            p.product_view_count
        FROM products p
        JOIN product_variants pv ON p.product_id = pv.product_id
        LEFT JOIN feedbacks f ON p.product_id = f.product_id
        WHERE p.product_id NOT IN (
            SELECT DISTINCT p2.product_id
            FROM products p2
            JOIN order_details od ON p2.product_id = od.product_id
            JOIN orders o ON od.order_id = o.order_id
            WHERE o.user_id = ?
        )
        GROUP BY p.product_id
        ORDER BY 
            (COALESCE(AVG(f.feedback_rate), 0) * 0.4 + 
            pv.product_variant_is_bestseller * 0.3 + 
            (p.product_view_count / 1000) * 0.3) DESC
        LIMIT ?
    `;
    
    return await query(sql, [userId, limit]);
};

// Get recommendations based on product similarity
recommendation.getSimilarProducts = async (productId, limit = 8) => {
    const sql = `
        SELECT p.*, 
            COALESCE(AVG(f.feedback_rate), 0) as avg_rating,
            COUNT(f.feedback_id) as feedback_count,
            pv.product_variant_is_bestseller,
            p.product_view_count
        FROM products p
        JOIN product_variants pv ON p.product_id = pv.product_id
        LEFT JOIN feedbacks f ON p.product_id = f.product_id
        WHERE p.category_id = (
            SELECT category_id 
            FROM products 
            WHERE product_id = ?
        )
        AND p.product_id != ?
        GROUP BY p.product_id
        ORDER BY 
            (COALESCE(AVG(f.feedback_rate), 0) * 0.4 + 
            pv.product_variant_is_bestseller * 0.3 + 
            (p.product_view_count / 1000) * 0.3) DESC
        LIMIT ?
    `;
    
    return await query(sql, [productId, productId, limit]);
};

// Get trending products based on recent views and purchases
recommendation.getTrendingProducts = async (limit = 8) => {
    const sql = `
        SELECT p.*, 
            COALESCE(AVG(f.feedback_rate), 0) as avg_rating,
            COUNT(f.feedback_id) as feedback_count,
            pv.product_variant_is_bestseller,
            p.product_view_count,
            COUNT(od.order_detail_id) as recent_purchases
        FROM products p
        JOIN product_variants pv ON p.product_id = pv.product_id
        LEFT JOIN feedbacks f ON p.product_id = f.product_id
        LEFT JOIN order_details od ON p.product_id = od.product_id
        LEFT JOIN orders o ON od.order_id = o.order_id
        WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY p.product_id
        ORDER BY 
            (p.product_view_count * 0.4 + 
            COUNT(od.order_detail_id) * 0.4 + 
            COALESCE(AVG(f.feedback_rate), 0) * 0.2) DESC
        LIMIT ?
    `;
    
    return await query(sql, [limit]);
};

// Get complementary products based on frequently bought together
recommendation.getComplementaryProducts = async (productId, limit = 8) => {
    const sql = `
        SELECT p.*, 
            COUNT(*) as co_occurrence,
            COALESCE(AVG(f.feedback_rate), 0) as avg_rating
        FROM products p
        JOIN order_details od1 ON p.product_id = od1.product_id
        JOIN orders o1 ON od1.order_id = o1.order_id
        JOIN order_details od2 ON o1.order_id = od2.order_id
        JOIN products p2 ON od2.product_id = p2.product_id
        LEFT JOIN feedbacks f ON p.product_id = f.product_id
        WHERE p2.product_id = ?
        AND p.product_id != ?
        GROUP BY p.product_id
        ORDER BY co_occurrence DESC, avg_rating DESC
        LIMIT ?
    `;
    
    return await query(sql, [productId, productId, limit]);
};

// Get best deal products based on discount amount and rating
recommendation.getBestDealProducts = async (limit = 8) => {
    const sql = `
        SELECT p.*, 
            COALESCE(AVG(f.feedback_rate), 0) as avg_rating,
            COUNT(f.feedback_id) as feedback_count,
            pv.product_variant_is_bestseller,
            p.product_view_count,
            pv.discount_amount,
            pv.discount_description
        FROM products p
        JOIN product_variants pv ON p.product_id = pv.product_id
        LEFT JOIN feedbacks f ON p.product_id = f.product_id
        WHERE pv.discount_amount IS NOT NULL
        AND pv.discount_end_date > NOW()
        GROUP BY p.product_id
        ORDER BY 
            (pv.discount_amount * 0.5 + 
            COALESCE(AVG(f.feedback_rate), 0) * 0.3 + 
            (p.product_view_count / 1000) * 0.2) DESC
        LIMIT ?
    `;
    
    return await query(sql, [limit]);
};

module.exports = recommendation; 