var mongoose = require('mongoose');

var laptopSchema = new mongoose.Schema({
    TenLaptop: { type: String, required: true },
    // Liên kết với bảng DanhMuc
    DanhMuc: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
    GiaNhap: { type: Number, required: true },
    GiaBan: { type: Number, required: true },
    SoLuong: { type: Number, required: true, default: 0 },
    CauHinh: { type: String, required: true },
    HinhAnh: { type: String, default: '' },
    NgayNhap: { type: Date, default: Date.now }
});

var laptopModel = mongoose.model('Laptop', laptopSchema);
module.exports = laptopModel;