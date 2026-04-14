var express = require('express');
var router = express.Router();
var TaiKhoan = require('../models/taikhoan');

// Middleware chỉ cho phép Admin vào trang này
const isAdmin = (req, res, next) => {
    const user = req.session.user || req.user;
    if (user && user.QuyenHan === 'admin') return next();
    res.status(403).send("Bạn không có quyền quản lý nhân sự!");
};

// GET: Trang danh sách nhân viên
router.get('/', isAdmin, async (req, res) => {
    try {
        var dsTaiKhoan = await TaiKhoan.find().sort({ QuyenHan: 1 });
        res.render('taikhoan', {
            title: 'Quản lý Nhân sự',
            users: dsTaiKhoan
        });
    } catch (error) {
        res.send("Lỗi tải danh sách!");
    }
});

// POST: Xử lý nâng/hạ quyền
router.post('/doi-quyen/:id', isAdmin, async (req, res) => {
    try {
        var userToUpdate = await TaiKhoan.findById(req.params.id);
        if (!userToUpdate) return res.send("Không tìm thấy người dùng!");

        // Đổi qua lại giữa admin và staff
        userToUpdate.QuyenHan = (userToUpdate.QuyenHan === 'admin') ? 'staff' : 'admin';
        await userToUpdate.save();

        res.redirect('/taikhoan');
    } catch (error) {
        res.send("Lỗi cập nhật quyền!");
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