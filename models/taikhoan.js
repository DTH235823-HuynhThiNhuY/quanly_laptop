var mongoose = require('mongoose');

var taiKhoanSchema = new mongoose.Schema({
    HoVaTen: { type: String, required: true },
    Email: { type: String },
    HinhAnh: { type: String }, // Lưu ảnh đại diện từ Google
    TenDangNhap: { type: String, unique: true, required: true },
    MatKhau: { type: String }, 
    GoogleID: { type: String }, 
    QuyenHan: { type: String, default: 'admin' },
    KichHoat: { type: Number, default: 1 }
});

module.exports = mongoose.model('TaiKhoan', taiKhoanSchema);