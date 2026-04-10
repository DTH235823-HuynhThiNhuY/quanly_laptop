var express = require('express');
var router = express.Router();
var KhachHang = require('../models/khachhang');

// GET: Danh sách khách hàng
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

// POST: Thêm khách hàng mới
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

// GET: Giao diện sửa thông tin khách hàng
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

// POST: Cập nhật thông tin
router.post('/sua/:id', async (req, res) => {
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

// GET: Xóa khách hàng
router.get('/xoa/:id', async (req, res) => {
    try {
        await KhachHang.findByIdAndDelete(req.params.id);
        res.redirect('/khachhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi xóa khách hàng!");
    }
});

module.exports = router;