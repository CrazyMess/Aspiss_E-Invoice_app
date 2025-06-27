const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET; 

const authMiddleware = (req, res, next) => {
    // Check if the request has an authorization header
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(" ")[1]; // Extract the token from the header
    }

    if (!token) {
        return res.status(401).json({ message: 'Non autorisé : jeton non valide' });
    }

    try {
        // verify the token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user information to the request object
        req.user = decoded;
        // Assuming the decoded token contains a userId field
        req.userId = decoded.userId;

        next(); // Call the next middleware or route handler

    } catch (error) {
        console.error('Token verification error:', error);
        // Handle different types of JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Non autorisé : le jeton a expiré, veuillez vous reconnecter' });
        }
        // Generic error for invalid token
        return res.status(401).json({ message: 'Non autorisé : jeton non valide' });
        
    }

}

module.exports = authMiddleware;