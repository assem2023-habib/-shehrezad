// التحقق من الإيميل
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Middleware للتحقق من مدخلات login
const validateLoginInput = (req, res, next) => {
  let { email, password } = req.body;

  // إزالة الفراغات الزائدة
  email = email?.trim();
  password = password?.trim();

  if (!email || !password) {
    return res.status(400).json({
      status: 400,
      message: "الرجاء إدخال البريد الإلكتروني وكلمة المرور."
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      status: 400,
      message: "صيغة البريد الإلكتروني غير صحيحة."
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      status: 400,
      message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
    });
  }

  // إذا كل شيء صحيح
  req.body.email = email;
  req.body.password = password;

  next();
};

module.exports = { validateLoginInput };
