var express = require('express');
var router = express.Router();
var Laptop = require('../models/laptop');
var DonHang = require('../models/donhang');
var KhachHang = require('../models/khachhang');

router.get('/', async (req, res) => {
    try {
        // 1. Đếm tổng số lượng mẫu mã laptop
        var tongSoMauLaptop = await Laptop.countDocuments();

        // 2. Tính tổng số lượng máy tồn kho (Cộng dồn cột SoLuong)
        var calcTonKho = await Laptop.aggregate([
            { $group: { _id: null, total: { $sum: "$SoLuong" } } }
        ]);
        var tongTonKho = calcTonKho.length > 0 ? calcTonKho[0].total : 0;

        // 3. Đếm số lượng máy sắp hết (dưới 5 cái) và đã hết (0 cái)
        var sapHetHang = await Laptop.countDocuments({ SoLuong: { $lt: 5, $gt: 0 } });
        var hetHang = await Laptop.countDocuments({ SoLuong: 0 });

        // 4. Tính tổng doanh thu (Chỉ tính các đơn hàng có trạng thái 'Hoàn thành')
        var calcDoanhThu = await DonHang.aggregate([
            { $match: { TrangThai: 'Hoàn thành' } },
            { $group: { _id: null, total: { $sum: "$TongTien" } } }
        ]);
        var doanhThu = calcDoanhThu.length > 0 ? calcDoanhThu[0].total : 0;

        // 5. Đếm tổng số đơn hàng đã đặt
        var tongDonHang = await DonHang.countDocuments();
        var donChoXacNhan = await DonHang.countDocuments({ TrangThai: 'Chờ xác nhận' });

        // Gửi toàn bộ dữ liệu thống kê sang View
        res.render('thongke', {
            title: 'Thống kê Tổng quan',
            stats: {
                tongSoMauLaptop,
                tongTonKho,
                sapHetHang,
                hetHang,
                doanhThu,
                tongDonHang,
                donChoXacNhan
            }
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi tải dữ liệu thống kê!");
    }
});

module.exports = router;