var express = require('express');
var router = express.Router();
var DanhMuc = require('../models/danhmuc');

// ---  MIDDLEWARE KIỂM TRA QUYỀN ---
const isAdmin = (req, res, next) => {

    const user = req.user || req.session.user;
    
    if (user && user.QuyenHan === 'admin') {
        return next();
    }
    res.status(403).send("Lỗi: Bạn không có quyền thực hiện hành động này!");
};

// GET: Giao diện danh sách hãng (AI CŨNG XEM ĐƯỢC)
router.get('/', async (req, res) => {
    try {
        var dsDanhMuc = await DanhMuc.find();
        res.render('danhmuc', {
            title: 'Quản lý Hãng sản xuất',
            danhmuc: dsDanhMuc
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải danh sách hãng!");
    }
});

// POST: Thêm hãng mới (CHỈ ADMIN)
router.post('/them', isAdmin, async (req, res) => {
    try {
        await DanhMuc.create({ TenDanhMuc: req.body.TenDanhMuc });
        res.redirect('/danhmuc');
    } catch (error) {
        console.log(error);
        res.send("Lỗi thêm hãng! (Có thể tên hãng đã tồn tại)");
    }
});

// GET: Giao diện sửa hãng (MỞ CHO CẢ 2 - Nhưng bên EJS đã khóa ô nhập của Staff)
router.get('/sua/:id', async (req, res) => {
    try {
        var dm = await DanhMuc.findById(req.params.id);
        res.render('danhmuc_sua', {
            title: 'Sửa thông tin Hãng',
            danhmuc: dm
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang sửa!");
    }
});

// POST: Lưu thông tin sửa (CHỈ ADMIN)
router.post('/sua/:id', isAdmin, async (req, res) => {
    try {
        await DanhMuc.findByIdAndUpdate(req.params.id, { TenDanhMuc: req.body.TenDanhMuc });
        res.redirect('/danhmuc');
    } catch (error) {
        console.log(error);
        res.send("Lỗi cập nhật hãng!");
    }
});

// GET: Xóa hãng (CHỈ ADMIN)
router.get('/xoa/:id', isAdmin, async (req, res) => {
    try {
        // check xem hãng này có đang chứa Laptop nào không trước khi xóa
        await DanhMuc.findByIdAndDelete(req.params.id);
        res.redirect('/danhmuc');
    } catch (error) {
        console.log(error);
        res.send("Lỗi xóa hãng!");
    }
});

module.exports = router;