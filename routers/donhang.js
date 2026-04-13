var express = require('express');
var router = express.Router();
var DonHang = require('../models/donhang');
var Laptop = require('../models/laptop');


// =======================
// GET: Danh sách đơn hàng
// =======================
router.get('/', async (req, res) => {
    try {
        var dsDonHang = await DonHang.find()
            .populate('Laptop')
            .sort({ NgayDat: -1 });

        var dsLaptop = await Laptop.find({ SoLuong: { $gt: 0 } });

        res.render('donhang', {
            title: 'Quản lý Đơn hàng',
            donhangs: dsDonHang,
            laptops: dsLaptop
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang!");
    }
});


// =======================
// POST: Thêm đơn hàng
// =======================
router.post('/them', async (req, res) => {
    try {
        var laptop = await Laptop.findById(req.body.Laptop);
        if (!laptop) return res.send("Không tìm thấy sản phẩm!");

        var qty = parseInt(req.body.SoLuong);
        if (qty <= 0) return res.send("Số lượng không hợp lệ!");

        //  Không cho âm kho
        if (laptop.SoLuong < qty) {
            return res.send("Không đủ hàng trong kho!");
        }

        var tongTien = qty * laptop.Gia;

        // Tạo đơn
        await DonHang.create({
            TenKhachHang: req.body.TenKhachHang,
            SoDienThoai: req.body.SoDienThoai,
            DiaChi: req.body.DiaChi,
            Laptop: laptop._id,
            SoLuong: qty,
            TongTien: tongTien,
            TrangThai: req.body.TrangThai || "Đang xử lý"
        });

        // Trừ kho
        await Laptop.findByIdAndUpdate(laptop._id, {
            $inc: { SoLuong: -qty }
        });

        res.redirect('/donhang');

    } catch (error) {
        console.log(error);
        res.send("Lỗi thêm đơn hàng!");
    }
});


// =======================
// GET: Form sửa
// =======================
router.get('/sua/:id', async (req, res) => {
    try {
        var dh = await DonHang.findById(req.params.id).populate('Laptop');
        if (!dh) return res.send("Không tìm thấy đơn!");

        res.render('donhang_sua', {
            title: 'Cập nhật đơn hàng',
            donhang: dh
        });

    } catch (error) {
        console.log(error);
        res.send("Lỗi!");
    }
});


// =======================
// POST: Sửa đơn hàng
// =======================
router.post('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;

        var oldOrder = await DonHang.findById(id);
        if (!oldOrder) return res.send("Không tìm thấy đơn!");

        var laptop = await Laptop.findById(oldOrder.Laptop);
        if (!laptop) return res.send("Không tìm thấy sản phẩm!");

        var newQty = parseInt(req.body.SoLuong) || oldOrder.SoLuong;
        if (newQty <= 0) return res.send("Số lượng không hợp lệ!");

        var newStatus = req.body.TrangThai || oldOrder.TrangThai;

        // Chuẩn hóa trạng thái
        var oldStatus = oldOrder.TrangThai.toLowerCase();
        var newStatusStr = newStatus.toLowerCase();

        var isOldCancel = oldStatus.includes('đã hủy') || oldStatus.includes('đã huỷ');
        var isNewCancel = newStatusStr.includes('đã hủy') || newStatusStr.includes('đã huỷ');

        // Số lượng thực tế ảnh hưởng kho
        var oldQtyEffect = isOldCancel ? 0 : oldOrder.SoLuong;
        var newQtyEffect = isNewCancel ? 0 : newQty;

        var diff = newQtyEffect - oldQtyEffect;

        //  Check kho trước khi update
        if (diff > 0 && laptop.SoLuong < diff) {
            return res.send("Không đủ hàng trong kho để cập nhật!");
        }

        // Cập nhật kho
        if (diff !== 0) {
            await Laptop.findByIdAndUpdate(laptop._id, {
                $inc: { SoLuong: -diff }
            });
        }

        // Tính lại tiền
        var tongTien = newQty * laptop.Gia;

        // Update đơn
        await DonHang.findByIdAndUpdate(id, {
            TenKhachHang: req.body.TenKhachHang || oldOrder.TenKhachHang,
            SoDienThoai: req.body.SoDienThoai || oldOrder.SoDienThoai,
            DiaChi: req.body.DiaChi || oldOrder.DiaChi,
            SoLuong: newQty,
            TongTien: tongTien,
            TrangThai: newStatus
        });

        res.redirect('/donhang');

    } catch (error) {
        console.log(error);
        res.send("Lỗi cập nhật!");
    }
});


// =======================
// GET: Xóa đơn
// =======================
router.get('/xoa/:id', async (req, res) => {
    try {
        var order = await DonHang.findById(req.params.id);
        if (!order) return res.redirect('/donhang');

        var status = order.TrangThai.toLowerCase();
        var isCancel = status.includes('đã hủy') || status.includes('đã huỷ');

        // Chỉ hoàn kho nếu đơn KHÔNG bị hủy
        if (!isCancel) {
            await Laptop.findByIdAndUpdate(order.Laptop, {
                $inc: { SoLuong: order.SoLuong }
            });
        }

        await DonHang.findByIdAndDelete(order._id);

        res.redirect('/donhang');

    } catch (error) {
        console.log(error);
        res.send("Lỗi xóa!");
    }
});


module.exports = router;