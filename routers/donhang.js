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
        
        // Tìm đơn hàng theo ID và lấy kèm thông tin Laptop để hiển thị tên máy
        var dh = await DonHang.findById(id).populate('Laptop');

        if (!dh) {
            return res.send("Không tìm thấy đơn hàng!");
        }

        // Gọi file giao diện donhang_sua.ejs và truyền dữ liệu ra
        res.render('donhang_sua', {
            title: 'Cập nhật Đơn hàng',
            donhang: dh
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi tải trang sửa đơn hàng!");
    }
});
// POST: Bản Debug Tối Thượng (Tìm lỗi trong 1 nốt nhạc)
router.post('/sua/:id', async (req, res) => {
    try {
        console.log("\n========== BẮT ĐẦU SỬA ĐƠN HÀNG ==========");
        console.log("1. Dữ liệu từ Form gửi lên (req.body):", req.body);

        var id = req.params.id;
        var oldOrder = await DonHang.findById(id);

        if (!oldOrder) {
            console.log("❌ LỖI: Không tìm thấy đơn hàng trong DB!");
            return res.send("Không tìm thấy đơn hàng!");
        }

        // Đảm bảo lấy đúng ID Laptop (phòng trường hợp nó là Object)
        var laptopId = oldOrder.Laptop._id || oldOrder.Laptop;
        console.log("2. ID Laptop cần cập nhật kho:", laptopId);

        // Lấy dữ liệu (Nếu form không gửi lên thì lấy dữ liệu cũ)
        var newQty = req.body.SoLuong ? parseInt(req.body.SoLuong) : oldOrder.SoLuong;
        var newStatus = req.body.TrangThai ? req.body.TrangThai : oldOrder.TrangThai;

        console.log(`3. Trạng thái: Cũ [${oldOrder.TrangThai}] -> Mới [${newStatus}]`);
        console.log(`4. Số lượng: Cũ [${oldOrder.SoLuong}] -> Mới [${newQty}]`);

        // TÍNH TOÁN LOGIC
        var oldStatusStr = oldOrder.TrangThai.toLowerCase();
        var newStatusStr = newStatus.toLowerCase();

        var isOldCancelled = oldStatusStr.includes('hủy') || oldStatusStr.includes('huỷ');
        var isNewCancelled = newStatusStr.includes('hủy') || newStatusStr.includes('huỷ');

        var oldEffectiveQty = isOldCancelled ? 0 : oldOrder.SoLuong;
        var newEffectiveQty = isNewCancelled ? 0 : newQty;

        var diff = newEffectiveQty - oldEffectiveQty;
        console.log("5. Mức chênh lệch (diff):", diff, diff > 0 ? "(Cần TRỪ kho)" : diff < 0 ? "(Cần CỘNG kho)" : "(KHÔNG ĐỔI)");

        // TIẾN HÀNH TRỪ/CỘNG KHO
        if (diff !== 0) {
            var updateResult = await Laptop.findByIdAndUpdate(laptopId, { 
                $inc: { SoLuong: -diff } 
            }, { new: true }); // {new: true} để lấy kết quả kho MỚI NHẤT
            
            console.log("6. KHO MỚI CỦA LAPTOP NÀY LÀ:", updateResult ? updateResult.SoLuong : "LỖI: Không tìm thấy Laptop!");
        } else {
            console.log("6. KHÔNG CẦN CẬP NHẬT KHO.");
        }

        // LƯU ĐƠN HÀNG
        var data = {
            TenKhachHang: req.body.TenKhachHang || oldOrder.TenKhachHang,
            SoDienThoai: req.body.SoDienThoai || oldOrder.SoDienThoai,
            DiaChi: req.body.DiaChi || oldOrder.DiaChi,
            SoLuong: newQty,
            TongTien: req.body.TongTien || oldOrder.TongTien,
            TrangThai: newStatus
        };
        await DonHang.findByIdAndUpdate(id, data);
        
        console.log("========== HOÀN THÀNH SỬA ĐƠN HÀNG ==========\n");
        res.redirect('/donhang');
    } catch (error) {
        console.log("❌ LỖI CRASH HỆ THỐNG:", error);
        res.send("Lỗi khi cập nhật đơn hàng!");
    }
});

// GET: Xóa đơn hàng
router.get('/xoa/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var order = await DonHang.findById(id);

        if (order) {
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