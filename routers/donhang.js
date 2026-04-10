var express = require('express');
var router = express.Router();
var DonHang = require('../models/donhang');
var Laptop = require('../models/laptop');

// GET: Danh sách đơn hàng
router.get('/', async (req, res) => {
    try {
        // Lấy danh sách đơn, nối với bảng Laptop để lấy tên máy, sắp xếp mới nhất lên đầu
        var dsDonHang = await DonHang.find().populate('Laptop').sort({ NgayDat: -1 });
        // Lấy danh sách laptop để đổ vào thanh chọn khi tạo đơn mới
        var dsLaptop = await Laptop.find({ SoLuong: { $gt: 0 } }); // Chỉ hiện máy còn hàng

        res.render('donhang', {
            title: 'Quản lý Đơn hàng',
            donhangs: dsDonHang,
            laptops: dsLaptop
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang đơn hàng!");
    }
});

// POST: Thêm đơn hàng mới
router.post('/them', async (req, res) => {
    try {
        // Lấy thông tin giá của chiếc laptop được chọn
        var laptop = await Laptop.findById(req.body.Laptop);
        var tongTien = laptop.GiaBan * req.body.SoLuong;

        await DonHang.create({
            TenKhachHang: req.body.TenKhachHang,
            SoDienThoai: req.body.SoDienThoai,
            DiaChi: req.body.DiaChi,
            Laptop: req.body.Laptop,
            SoLuong: req.body.SoLuong,
            TongTien: tongTien
        });
        
        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi thêm đơn hàng!");
    }
});

// GET: Giao diện sửa trạng thái đơn hàng
router.get('/sua/:id', async (req, res) => {
    try {
        var dh = await DonHang.findById(req.params.id).populate('Laptop');
        res.render('donhang_sua', {
            title: 'Cập nhật Đơn hàng',
            donhang: dh
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang sửa đơn hàng!");
    }
});

// POST: Cập nhật trạng thái
router.post('/sua/:id', async (req, res) => {
    try {
        await DonHang.findByIdAndUpdate(req.params.id, { TrangThai: req.body.TrangThai });
        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi cập nhật!");
    }
});

// GET: Xóa đơn hàng
router.get('/xoa/:id', async (req, res) => {
    try {
        await DonHang.findByIdAndDelete(req.params.id);
        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi xóa đơn hàng!");
    }
});

module.exports = router;