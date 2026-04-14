var express = require('express');
var router = express.Router();
var KhachHang = require('../models/khachhang');

// --- MIDDLEWARE KIỂM TRA QUYỀN ADMIN ---
const isAdmin = (req, res, next) => {
    // Ưu tiên check req.session.user vì đang dùng Session cho Google Login
    const user = req.session.user || req.user;
    if (user && user.QuyenHan === 'admin') {
        return next();
    }
    res.status(403).send("Lỗi: Bạn không có quyền thực hiện hành động này!");
};

// ==========================================
// GET: Danh sách khách hàng (AI CŨNG XEM ĐƯỢC)
// ==========================================
router.get('/', async (req, res) => {
    try {
        var dsKhachHang = await KhachHang.find().sort({ NgayTao: -1 });
        res.render('khachhang', {
            title: 'Quản lý Khách hàng',
            khachhangs: dsKhachHang
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang khách hàng!");
    }
});

// ==========================================
// POST: Thêm khách hàng mới (TẤT CẢ QUYỀN - Staff cần thêm khách khi lên đơn)
// ==========================================
router.post('/them', async (req, res) => {
    try {
        await KhachHang.create({
            HoTen: req.body.HoTen,
            SoDienThoai: req.body.SoDienThoai,
            Email: req.body.Email,
            DiaChi: req.body.DiaChi,
            GhiChu: req.body.GhiChu
        });
        res.redirect('/khachhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi thêm khách hàng!");
    }
});

// ==========================================
// GET: Giao diện sửa (MỞ CHO CẢ 2 - Nhưng Staff sẽ bị khóa ô nhập ở EJS)
// ==========================================
router.get('/sua/:id', async (req, res) => {
    try {
        var kh = await KhachHang.findById(req.params.id);
        res.render('khachhang_sua', {
            title: 'Cập nhật Khách hàng',
            khachhang: kh
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang sửa!");
    }
});

// ==========================================
// POST: Cập nhật thông tin (CHỈ ADMIN)
// ==========================================
router.post('/sua/:id', isAdmin, async (req, res) => {
    try {
        await KhachHang.findByIdAndUpdate(req.params.id, {
            HoTen: req.body.HoTen,
            SoDienThoai: req.body.SoDienThoai,
            Email: req.body.Email,
            DiaChi: req.body.DiaChi,
            GhiChu: req.body.GhiChu
        });
        res.redirect('/khachhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi cập nhật!");
    }
});

// ==========================================
// GET: Xóa khách hàng (CHỈ ADMIN)
// ==========================================
router.get('/xoa/:id', isAdmin, async (req, res) => {
    try {
        await KhachHang.findByIdAndDelete(req.params.id);
        res.redirect('/khachhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi xóa khách hàng!");
    }
});

module.exports = router;