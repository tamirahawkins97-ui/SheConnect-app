function adminOnly(req, res, next) {
    if (req.user && req.user.role === "Veteran Mommy"){
        next();
    } else {
        res.status(403).json({message: "Access denied. Only Veteran Mommies can enter!"})
    }
}

module.exports = adminOnly;