const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  // Formatted in headers as: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Please log in first.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains _id and role from when you signed the token
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { verifyToken };