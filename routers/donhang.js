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
        var qty = parseInt(req.body.SoLuong);
        
        // Tạo đơn hàng
        await DonHang.create(req.body);

        // Trừ số lượng trong kho
        await Laptop.findByIdAndUpdate(req.body.Laptop, { 
            $inc: { SoLuong: -qty } 
        });

        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
    }
});

// GET: Giao diện sửa trạng thái đơn hàng
router.post('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var newQty = parseInt(req.body.SoLuong);

        // 1. Tìm đơn hàng cũ để lấy số lượng cũ và ID Laptop
        var oldOrder = await DonHang.findById(id);
        if (!oldOrder) return res.send("Không tìm thấy đơn hàng!");

        // 2. Tính toán chênh lệch
        // Nếu newQty > oldQty: diff dương (khách mua thêm) -> kho phải trừ đi
        // Nếu newQty < oldQty: diff âm (khách trả bớt) -> kho được cộng lại
        var diff = newQty - oldOrder.SoLuong;

        // 3. Cập nhật số lượng trong kho Laptop
        // Dùng $inc với giá trị âm của diff để tự động cộng/trừ
        await Laptop.findByIdAndUpdate(oldOrder.Laptop, { 
            $inc: { SoLuong: -diff } 
        });

        // 4. Cập nhật dữ liệu đơn hàng
        var data = {
            TenKhachHang: req.body.TenKhachHang,
            SoDienThoai: req.body.SoDienThoai,
            DiaChi: req.body.DiaChi,
            SoLuong: newQty,
            TongTien: req.body.TongTien, // Nhớ tính lại tổng tiền ở frontend hoặc tại đây
            TrangThai: req.body.TrangThai
        };
        await DonHang.findByIdAndUpdate(id, data);

        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi cập nhật đơn hàng!");
    }
});



// GET: Xóa đơn hàng
router.get('/xoa/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var order = await DonHang.findById(id);

        if (order) {
            // Cộng lại số lượng vào kho trước khi xóa đơn
            await Laptop.findByIdAndUpdate(order.Laptop, { 
                $inc: { SoLuong: order.SoLuong } 
            });
            await DonHang.findByIdAndDelete(id);
        }

        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;