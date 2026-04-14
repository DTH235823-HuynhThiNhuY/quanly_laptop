var mongoose = require('mongoose');

var taiKhoanSchema = new mongoose.Schema({
    HoVaTen: { type: String, required: true },
    Email: { type: String },
    HinhAnh: { type: String }, 
    TenDangNhap: { type: String, unique: true, required: true },
    MatKhau: { type: String }, 
    GoogleID: { type: String }, 
    // Cập nhật phân quyền với enum để bảo mật hơn
    QuyenHan: { 
        type: String, 
        enum: ['admin', 'staff'], 
        default: 'staff' // Nên để mặc định là nhân viên để bảo mật
    },
    KichHoat: { type: Number, default: 1 }
});

module.exports = mongoose.model('TaiKhoan', taiKhoanSchema);