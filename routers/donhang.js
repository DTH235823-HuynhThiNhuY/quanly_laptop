var express = require('express');
var router = express.Router();
var DonHang = require('../models/donhang');
var Laptop = require('../models/laptop');

// --- MIDDLEWARE KIỂM TRA QUYỀN ADMIN ---
const isAdmin = (req, res, next) => {
    const user = req.user || req.session.user;
    if (user && user.QuyenHan === 'admin') {
        return next();
    }
    res.status(403).send("Lỗi: Bạn không có quyền thực hiện hành động này!");
};

// =======================
// GET: Danh sách đơn hàng (TẤT CẢ QUYỀN)
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
// POST: Thêm đơn hàng (TẤT CẢ QUYỀN - Staff được quyền lên đơn)
// =======================
router.post('/them', async (req, res) => {
    try {
        var laptop = await Laptop.findById(req.body.Laptop);
        if (!laptop) return res.send("Không tìm thấy sản phẩm!");

        var qty = parseInt(req.body.SoLuong);
        if (!qty || qty <= 0) return res.send("Số lượng không hợp lệ!");

        if (laptop.SoLuong < qty) {
            return res.send("Không đủ hàng trong kho!");
        }

        var tongTien = qty * laptop.GiaBan;

        await DonHang.create({
            TenKhachHang: req.body.TenKhachHang,
            SoDienThoai: req.body.SoDienThoai,
            DiaChi: req.body.DiaChi,
            Laptop: laptop._id,
            SoLuong: qty,
            TongTien: tongTien,
            TrangThai: req.body.TrangThai || "Chờ xác nhận"
        });

        laptop.SoLuong -= qty;
        await laptop.save();

        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi thêm đơn!");
    }
});

// =======================
// GET: Form sửa (TẤT CẢ QUYỀN - Vào để xem hoặc đổi trạng thái)
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
// POST: Sửa đơn hàng (PHÂN QUYỀN NỘI BỘ)
// =======================
router.post('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var user = req.user || req.session.user;

        var oldOrder = await DonHang.findById(id);
        if (!oldOrder) return res.send("Không tìm thấy đơn!");

        var laptop = await Laptop.findById(oldOrder.Laptop);
        if (!laptop) return res.send("Không tìm thấy sản phẩm!");

        // --- LOGIC PHÂN QUYỀN SỬA SỐ LƯỢNG ---
        var newQty;
        if (user && user.QuyenHan === 'admin') {
            // Admin: Được lấy số lượng từ form
            newQty = req.body.SoLuong ? parseInt(req.body.SoLuong) : oldOrder.SoLuong;
        } else {
            // Staff: Ép buộc dùng lại số lượng cũ, phớt lờ input từ form
            newQty = oldOrder.SoLuong;
        }

        if (!newQty || newQty <= 0) return res.send("Số lượng không hợp lệ!");

        var newStatus = req.body.TrangThai || oldOrder.TrangThai;

        // Xử lý logic hoàn kho/trừ kho dựa trên trạng thái 
        var oldStatus = oldOrder.TrangThai.toLowerCase();
        var newStatusStr = newStatus.toLowerCase();
        var isOldCancel = oldStatus.includes('đã hủy') || oldStatus.includes('đã huỷ');
        var isNewCancel = newStatusStr.includes('đã hủy') || newStatusStr.includes('đã huỷ');

        var oldQtyEffect = isOldCancel ? 0 : oldOrder.SoLuong;
        var newQtyEffect = isNewCancel ? 0 : newQty;
        var diff = newQtyEffect - oldQtyEffect;

        if (diff > 0 && laptop.SoLuong < diff) {
            return res.send("Không đủ hàng trong kho!");
        }

        if (diff !== 0) {
            laptop.SoLuong -= diff;
            await laptop.save();
        }

        var tongTien = newQty * laptop.GiaBan;

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
// GET: Xóa đơn hàng (CHỈ ADMIN)
// =======================
router.get('/xoa/:id', isAdmin, async (req, res) => {
    try {
        var order = await DonHang.findById(req.params.id);
        if (!order) return res.redirect('/donhang');

        var laptop = await Laptop.findById(order.Laptop);
        var status = order.TrangThai.toLowerCase();
        var isCancel = status.includes('đã hủy') || status.includes('đã huỷ');

        if (!isCancel && laptop) {
            laptop.SoLuong += order.SoLuong;
            await laptop.save();
        }

        await DonHang.findByIdAndDelete(order._id);
        res.redirect('/donhang');
    } catch (error) {
        console.log(error);
        res.send("Lỗi xóa!");
    }
});

module.exports = router;