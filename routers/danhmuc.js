var express = require('express');
var router = express.Router();
var DanhMuc = require('../models/danhmuc');

// GET: Giao diện danh sách hãng
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

// POST: Thêm hãng mới (từ Modal)
router.post('/them', async (req, res) => {
    try {
        await DanhMuc.create({ TenDanhMuc: req.body.TenDanhMuc });
        res.redirect('/danhmuc');
    } catch (error) {
        console.log(error);
        res.send("Lỗi thêm hãng! (Có thể tên hãng đã tồn tại)");
    }
});

// GET: Giao diện sửa hãng
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

// POST: Lưu thông tin sửa
router.post('/sua/:id', async (req, res) => {
    try {
        await DanhMuc.findByIdAndUpdate(req.params.id, { TenDanhMuc: req.body.TenDanhMuc });
        res.redirect('/danhmuc');
    } catch (error) {
        console.log(error);
        res.send("Lỗi cập nhật hãng!");
    }
});

// GET: Xóa hãng
router.get('/xoa/:id', async (req, res) => {
    try {
        await DanhMuc.findByIdAndDelete(req.params.id);
        res.redirect('/danhmuc');
    } catch (error) {
        console.log(error);
        res.send("Lỗi xóa hãng!");
    }
});

module.exports = router;