var express = require('express');
var router = express.Router();
var Laptop = require('../models/laptop');
var DanhMuc = require('../models/danhmuc');

// GET: Danh sách laptop (Có tích hợp Tìm kiếm)
router.get('/', async (req, res) => {
    try {
        // 1. Nhận từ khóa từ thanh tìm kiếm (nếu có)
        var keyword = req.query.q || '';
        
        // 2. Xây dựng điều kiện tìm kiếm
        var queryObj = {};
        if (keyword) {
            queryObj = {
                $or: [
                    { TenLaptop: { $regex: keyword, $options: 'i' } }, // 'i' là không phân biệt hoa thường
                    { CauHinh: { $regex: keyword, $options: 'i' } }
                ]
            };
        }

        // 3. Truy vấn dữ liệu theo điều kiện
        var laptops = await Laptop.find(queryObj).populate('DanhMuc');
        var danhmucList = await DanhMuc.find();

        // 4. Các con số thống kê (Giữ nguyên như cũ)
        var tongLaptops = await Laptop.countDocuments(queryObj); 
        var dangBan = await Laptop.countDocuments({ ...queryObj, SoLuong: { $gt: 0 } }); 
        var sapHet = await Laptop.countDocuments({ ...queryObj, SoLuong: { $lt: 5, $gt: 0 } }); 
        var hetHang = await Laptop.countDocuments({ ...queryObj, SoLuong: 0 }); 

        res.render('laptop', {
            title: 'Quản lý Sản phẩm',
            laptops: laptops,
            danhmucList: danhmucList,
            stats: { tongLaptops, dangBan, sapHet, hetHang },
            keyword: keyword // Truyền từ khóa ngược lại View để giữ chữ trên ô tìm kiếm
        });
    } catch (error) {
        console.log(error);
        res.send("Lỗi tải trang sản phẩm!");
    }
});

// POST: Thêm laptop mới
router.post('/them', async (req, res) => {
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
    }
});

// GET: Xóa laptop
router.get('/xoa/:id', async (req, res) => {
    try {
        var id = req.params.id;
        await Laptop.findByIdAndDelete(id);
        res.redirect('/laptop');
    } catch (error) {
        console.log(error);
    }
});
// GET: Lấy thông tin laptop cũ và hiển thị Form Sửa
router.get('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        // Lấy thông tin laptop cần sửa
        var lt = await Laptop.findById(id); 
        // Lấy danh sách danh mục để đổ vào thẻ <select>
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

// POST: Nhận dữ liệu từ Form và cập nhật vào Database
router.post('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var data = {
            TenLaptop: req.body.TenLaptop,
            DanhMuc: req.body.DanhMuc,
            GiaNhap: req.body.GiaNhap,
            GiaBan: req.body.GiaBan,
            SoLuong: req.body.SoLuong,
            CauHinh: req.body.CauHinh,
            HinhAnh: req.body.HinhAnh
        };
        
        // Cập nhật dữ liệu mới vào DB
        await Laptop.findByIdAndUpdate(id, data); 
        
        // Cập nhật xong thì quay về trang danh sách
        res.redirect('/laptop'); 
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi cập nhật!");
    }
});
module.exports = router;