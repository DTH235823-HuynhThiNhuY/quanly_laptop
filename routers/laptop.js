var express = require('express');
var router = express.Router();
var Laptop = require('../models/laptop');
var DanhMuc = require('../models/danhmuc');

// --- MIDDLEWARE KIỂM TRA QUYỀN ---
const isAdmin = (req, res, next) => {
    const user = req.session.user || req.user;
    // Kiểm tra user tồn tại TRƯỚC KHI kiểm tra QuyenHan
    if (user && user.QuyenHan === 'admin') {
        return next();
    }
    res.status(403).send("Lỗi: Bạn không có quyền thực hiện hành động này!");
};

// GET: Danh sách laptop
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

        // POPULATE AN TOÀN: Thêm lean() để tăng tốc độ tải dữ liệu
        var laptops = await Laptop.find(queryObj).populate('DanhMuc').lean();
        var danhmucList = await DanhMuc.find().lean();

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
        console.log("Lỗi tải trang laptop:", error);
        res.status(500).send("Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối Database!");
    }
});

// POST: Thêm laptop mới
router.post('/them', isAdmin, async (req, res) => {
    try {
        await Laptop.create(req.body);
        res.redirect('/laptop');
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi thêm sản phẩm!");
    }
});

// GET: Xóa laptop
router.get('/xoa/:id', isAdmin, async (req, res) => {
    try {
        await Laptop.findByIdAndDelete(req.params.id);
        res.redirect('/laptop');
    } catch (error) {
        res.send("Lỗi khi xóa!");
    }
});

// GET: Giao diện sửa
router.get('/sua/:id', async (req, res) => {
    try {
        var lt = await Laptop.findById(req.params.id).lean(); 
        var dsDanhMuc = await DanhMuc.find().lean(); 

        if (!lt) return res.send("Không tìm thấy laptop này!");

        res.render('laptop_sua', {
            title: 'Sửa thông tin Laptop',
            laptop: lt,
            danhmucList: dsDanhMuc
        });
    } catch (error) {
        res.send("Lỗi khi tải trang sửa!");
    }
});

// POST: Cập nhật dữ liệu (BẢO VỆ CHẶT CHẼ)
router.post('/sua/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.session.user || req.user;
        const oldLaptop = await Laptop.findById(id);

        if (!oldLaptop) return res.send("Sản phẩm không tồn tại!");

        let updateData;
        // Kiểm tra user và QuyenHan một cách an toàn
        if (user && user.QuyenHan === 'admin') {
            updateData = req.body;
        } else {
            // Staff CHỈ được đổi số lượng, các cái khác ép dùng dữ liệu cũ
            updateData = {
                ...oldLaptop.toObject(),
                SoLuong: req.body.SoLuong // Chỉ lấy cái này từ form
            };
        }
        
        await Laptop.findByIdAndUpdate(id, updateData); 
        res.redirect('/laptop'); 
    } catch (error) {
        console.log(error);
        res.send("Lỗi khi cập nhật!");
    }
});

module.exports = router;