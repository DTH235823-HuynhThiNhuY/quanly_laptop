var express = require('express');
var router = express.Router();
var Laptop = require('../models/laptop');
var DanhMuc = require('../models/danhmuc');

// --- MIDDLEWARE KIỂM TRA QUYỀN ---
const isAdmin = (req, res, next) => {
    // Ưu tiên check req.session.user vì đang dùng Session cho Google Login
    const user = req.session.user || req.user;
    if (user && user.QuyenHan === 'admin') {
        return next();
    }
    res.status(403).send("Lỗi: Bạn không có quyền thực hiện hành động này!");
};

// GET: Danh sách laptop (AI CŨNG XEM ĐƯỢC)
router.get('/', async (req, res) => {
    try {
        var keyword = req.query.q || '';
        var queryObj = {};
        if (keyword) {
            queryObj = {
                $or: [
                    { TenLaptop: { $regex: keyword, $options: 'i' } },
                    { CauHinh: { $regex: keyword, $options: 'i' } }
                ]
            };
        }

        var laptops = await Laptop.find(queryObj).populate('DanhMuc');
        var danhmucList = await DanhMuc.find();

        var tongLaptops = await Laptop.countDocuments(queryObj); 
        var dangBan = await Laptop.countDocuments({ ...queryObj, SoLuong: { $gt: 0 } }); 
        var sapHet = await Laptop.countDocuments({ ...queryObj, SoLuong: { $lt: 5, $gt: 0 } }); 
        var hetHang = await Laptop.countDocuments({ ...queryObj, SoLuong: 0 }); 

        res.render('laptop', {
            title: 'Quản lý Sản phẩm',
            laptops: laptops,
            danhmucList: danhmucList,
            stats: { tongLaptops, dangBan, sapHet, hetHang },
            keyword: keyword 
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang sản phẩm!");
    }
});

// POST: Thêm laptop mới (CHỈ ADMIN)
router.post('/them', isAdmin, async (req, res) => {
    try {
        var data = {
            TenLaptop: req.body.TenLaptop,
            DanhMuc: req.body.DanhMuc,
            GiaNhap: req.body.GiaNhap,
            GiaBan: req.body.GiaBan,
            SoLuong: req.body.SoLuong,
            CauHinh: req.body.CauHinh,
            HinhAnh: req.body.HinhAnh
        };
        await Laptop.create(data);
        res.redirect('/laptop');
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi thêm sản phẩm!");
    }
});

// GET: Xóa laptop (CHỈ ADMIN)
router.get('/xoa/:id', isAdmin, async (req, res) => {
    try {
        await Laptop.findByIdAndDelete(req.params.id);
        res.redirect('/laptop');
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi xóa!");
    }
});

// GET: Giao diện sửa (MỞ CHO CẢ 2 - Nhưng EJS sẽ khóa ô nhập của Staff)
router.get('/sua/:id', async (req, res) => {
    try {
        var lt = await Laptop.findById(req.params.id); 
        var dsDanhMuc = await DanhMuc.find(); 

        res.render('laptop_sua', {
            title: 'Sửa thông tin Laptop',
            laptop: lt,
            danhmucList: dsDanhMuc
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi tải trang sửa!");
    }
});

// POST: Cập nhật dữ liệu (PHÂN QUYỀN NỘI BỘ)
router.post('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var user = req.session.user || req.user;
        var oldLaptop = await Laptop.findById(id);

        var data;
        if (user && user.QuyenHan === 'admin') {
            // ADMIN: Cập nhật mọi thứ
            data = {
                TenLaptop: req.body.TenLaptop,
                DanhMuc: req.body.DanhMuc,
                GiaNhap: req.body.GiaNhap,
                GiaBan: req.body.GiaBan,
                SoLuong: req.body.SoLuong,
                CauHinh: req.body.CauHinh,
                HinhAnh: req.body.HinhAnh
            };
        } else {
            // STAFF: Chỉ cho phép cập nhật Số lượng, các trường khác giữ nguyên từ DB
            data = {
                TenLaptop: oldLaptop.TenLaptop,
                DanhMuc: oldLaptop.DanhMuc,
                GiaNhap: oldLaptop.GiaNhap,
                GiaBan: oldLaptop.GiaBan,
                SoLuong: req.body.SoLuong, // Trường duy nhất được phép đổi
                CauHinh: oldLaptop.CauHinh,
                HinhAnh: oldLaptop.HinhAnh
            };
        }
        
        await Laptop.findByIdAndUpdate(id, data); 
        res.redirect('/laptop'); 
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi cập nhật!");
    }
});

module.exports = router;