var mongoose = require('mongoose');

var khachHangSchema = new mongoose.Schema({
    HoTen: { type: String, required: true },
    SoDienThoai: { type: String, required: true },
    Email: { type: String },
    DiaChi: { type: String },
    GhiChu: { type: String },
    NgayTao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KhachHang', khachHangSchema);