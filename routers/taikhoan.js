var express = require('express');
var router = express.Router();
var TaiKhoan = require('../models/taikhoan');

// Middleware chặn Staff - Chỉ Admin mới được vào trang quản lý nhân sự
const isAdmin = (req, res, next) => {
    const user = req.session.user || req.user;
    if (user && user.QuyenHan === 'admin') {
        return next();
    }
    res.status(403).send("Bạn không có quyền quản lý nhân sự!");
};

// GET: Danh sách nhân viên
router.get('/', isAdmin, async (req, res) => {
    try {
        var dsTaiKhoan = await TaiKhoan.find().sort({ QuyenHan: 1 });
        res.render('taikhoan', {
            title: 'Quản lý Nhân sự',
            users: dsTaiKhoan
        });
    } catch (error) {
        res.send("Lỗi tải danh sách nhân viên");
    }
});

// POST: Đổi quyền hạn (Admin <-> Staff)
router.post('/doi-quyen/:id', isAdmin, async (req, res) => {
    try {
        var user = await TaiKhoan.findById(req.params.id);
        // Đảo ngược quyền: nếu là admin thì thành staff và ngược lại
        user.QuyenHan = (user.QuyenHan === 'admin') ? 'staff' : 'admin';
        await user.save();
        res.redirect('/taikhoan');
    } catch (error) {
        res.send("Lỗi cập nhật quyền");
    }
});

// POST: Khóa/Mở khóa tài khoản
router.post('/doi-trang-thai/:id', isAdmin, async (req, res) => {
    try {
        var user = await TaiKhoan.findById(req.params.id);
        user.KichHoat = (user.KichHoat === 1) ? 0 : 1;
        await user.save();
        res.redirect('/taikhoan');
    } catch (error) {
        res.send("Lỗi cập nhật trạng thái");
    }
});

module.exports = router;