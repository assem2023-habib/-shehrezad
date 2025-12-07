const pool = require("../config/dbconnect");
const jwt = require("jsonwebtoken");


// Middleware للتحقق من التوكن JWT وصلاحيته
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        status: 401,
        message: "التوكن مفقود. الرجاء تسجيل الدخول."
      });
    }

    // فك التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // التحقق من وجود البيانات الأساسية
    if (!decoded.user_id || !decoded.role) {
      return res.status(401).json({ 
        status: 401, 
        message: "توكن غير صالح." 
      });
    }

    // التحقق من أن التوكن ليس ملغيًا
    const rows = await pool.query(
      "SELECT id FROM invalid_tokens WHERE token = ? LIMIT 1",
      [token]
    );

    if (rows.length > 0) {
      return res.status(401).json({
        status: 401,
        message: "هذا التوكن ملغي، الرجاء تسجيل الدخول مرة أخرى."
      });
    }

    // حفظ بيانات المستخدم في req
    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
      phone: decoded.phone || null,
      email: decoded.email || null
    };

    // تمرير التوكن للاستخدام في Logout
    req.token = token;

    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(401).json({ 
      status: 401, 
      message: "توكن غير صالح أو منتهي الصلاحية." 
    });
  }
};

// Middleware للتحقق من الدور
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 401, message: "توكن غير موجود." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 403,
        message: "ليس لديك صلاحية للوصول لهذه الخدمة."
      });
    }

    next();
  };
};

module.exports = { verifyToken, checkRole };
