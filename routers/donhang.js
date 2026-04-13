var express = require('express');
var router = express.Router();
var DonHang = require('../models/donhang');
var Laptop = require('../models/laptop');

// GET: Danh sách đơn hàng
router.get('/', async (req, res) => {
    try {
        var dsDonHang = await DonHang.find().populate('Laptop').sort({ NgayDat: -1 });
        var dsLaptop = await Laptop.find({ SoLuong: { $gt: 0 } }); 

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
        
        await DonHang.create(req.body);

        // Tự động trừ kho khi có đơn mới
        await Laptop.findByIdAndUpdate(req.body.Laptop, { 
            $inc: { SoLuong: -qty } 
        });

        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
    }
});

// GET: Hiển thị giao diện Form sửa đơn hàng
router.get('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var dh = await DonHang.findById(id).populate('Laptop');

        if (!dh) {
            return res.send("Không tìm thấy đơn hàng!");
        }

        res.render('donhang_sua', {
            title: 'Cập nhật Đơn hàng',
            donhang: dh
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi tải trang sửa đơn hàng!");
    }
});

// POST: Cập nhật đơn hàng (Tối ưu logic kho & Trạng thái Hủy)
router.post('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var oldOrder = await DonHang.findById(id);

        if (!oldOrder) {
            return res.send("Không tìm thấy đơn hàng!");
        }

        var laptopId = oldOrder.Laptop._id || oldOrder.Laptop;

        var newQty = req.body.SoLuong ? parseInt(req.body.SoLuong) : oldOrder.SoLuong;
        var newStatus = req.body.TrangThai ? req.body.TrangThai : oldOrder.TrangThai;

        // Xử lý logic trạng thái "Hủy" (bao quát lỗi gõ dấu)
        var oldStatusStr = oldOrder.TrangThai.toLowerCase();
        var newStatusStr = newStatus.toLowerCase();

        var isOldCancelled = oldStatusStr.includes('Đã hủy') || oldStatusStr.includes('Đã huỷ');
        var isNewCancelled = newStatusStr.includes('Đã hủy') || newStatusStr.includes('Đã huỷ');

        // Tính toán độ chênh lệch thực tế
        var oldEffectiveQty = isOldCancelled ? 0 : oldOrder.SoLuong;
        var newEffectiveQty = isNewCancelled ? 0 : newQty;
        var diff = newEffectiveQty - oldEffectiveQty;

        // Tự động bù/trừ kho nếu có sự thay đổi
        if (diff !== 0) {
            await Laptop.findByIdAndUpdate(laptopId, { 
                $inc: { SoLuong: -diff } 
            });
        }

        // Cập nhật thông tin đơn hàng
        var data = {
            TenKhachHang: req.body.TenKhachHang || oldOrder.TenKhachHang,
            SoDienThoai: req.body.SoDienThoai || oldOrder.SoDienThoai,
            DiaChi: req.body.DiaChi || oldOrder.DiaChi,
            SoLuong: newQty,
            TongTien: req.body.TongTien || oldOrder.TongTien,
            TrangThai: newStatus
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
            // Tự động hoàn kho trước khi xóa hẳn đơn hàng
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