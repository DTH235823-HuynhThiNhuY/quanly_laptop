var mongoose = require('mongoose');

var donHangSchema = new mongoose.Schema({
    TenKhachHang: { type: String, required: true },
    SoDienThoai: { type: String, required: true },
    DiaChi: { type: String, required: true },
    // Liên kết với bảng Laptop để biết khách mua máy nào
    Laptop: { type: mongoose.Schema.Types.ObjectId, ref: 'Laptop', required: true },
    SoLuong: { type: Number, required: true, min: 1 },
    TongTien: { type: Number, required: true },
    NgayDat: { type: Date, default: Date.now },
    TrangThai: { 
        type: String, 
        enum: ['Chờ xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'], 
        default: 'Chờ xác nhận' 
    }
});

module.exports = mongoose.model('DonHang', donHangSchema);