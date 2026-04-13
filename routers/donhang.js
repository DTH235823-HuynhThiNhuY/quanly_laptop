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
// POST: Giao diện sửa trạng thái / số lượng đơn hàng
router.post('/sua/:id', async (req, res) => {
    try {
        console.log("DỮ LIỆU TỪ FORM SỬA GỬI LÊN:", req.body);
        // -------------------------

        var id = req.params.id;

        // 1. Tìm đơn hàng cũ
        var oldOrder = await DonHang.findById(id);
        if (!oldOrder) return res.send("Không tìm thấy đơn hàng!");

        // 2. Lấy dữ liệu mới (Nếu form không có SoLuong thì lấy lại số lượng cũ để không bị lỗi)
        var newQty = req.body.SoLuong ? parseInt(req.body.SoLuong) : oldOrder.SoLuong;
        var newStatus = req.body.TrangThai || oldOrder.TrangThai;

        // 3. TÍNH TOÁN LOGIC KHO (CẬP NHẬT CHỐNG LỖI TIẾNG VIỆT)
        // Chuyển trạng thái về chữ thường để dễ so sánh
        var oldStatusStr = oldOrder.TrangThai.toLowerCase();
        var newStatusStr = newStatus.toLowerCase();

        // Kiểm tra xem trạng thái có chứa từ "hủy" hoặc "huỷ" không
        var isOldCancelled = oldStatusStr.includes('hủy') || oldStatusStr.includes('huỷ');
        var isNewCancelled = newStatusStr.includes('hủy') || newStatusStr.includes('huỷ');

        // Nếu đơn cũ đã hủy -> Số lượng thực tế đã lấy khỏi kho là 0
        var oldEffectiveQty = isOldCancelled ? 0 : oldOrder.SoLuong;
        
        // Nếu đơn mới là hủy -> Số lượng thực tế cần lấy khỏi kho là 0
        var newEffectiveQty = isNewCancelled ? 0 : newQty;

        // Tính độ chênh lệch
        var diff = newEffectiveQty - oldEffectiveQty;

        // --- BỘ QUÉT LỖI (BẠN HÃY XEM Ở TERMINAL) ---
        console.log("Trạng thái cũ:", oldOrder.TrangThai, "-> Tính ra số lượng:", oldEffectiveQty);
        console.log("Trạng thái mới:", newStatus, "-> Tính ra số lượng:", newEffectiveQty);
        console.log("Mức chênh lệch (Cần trừ kho):", diff);
        // --------------------------------------------

        // Cập nhật kho nếu có sự chênh lệch
        if (diff !== 0) {
            await Laptop.findByIdAndUpdate(oldOrder.Laptop, { 
                $inc: { SoLuong: -diff } 
            });
        }

        // 4. Cập nhật dữ liệu vào database đơn hàng
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