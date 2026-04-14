var express = require('express');
var router = express.Router();
var Laptop = require('../models/laptop');
var DanhMuc = require('../models/danhmuc');

// --- MIDDLEWARE KIỂM TRA QUYỀN ---
const isAdmin = (req, res, next) => {
    // Kiểm tra an toàn: session tồn tại -> user tồn tại -> quyền là admin
    if (req.session && req.session.user && req.session.user.QuyenHan === 'admin') {
        return next();
    }
    // Nếu không phải admin, không nên đứng im mà nên redirect hoặc báo lỗi nhẹ
    res.redirect('/dangnhap'); 
};

// GET: Danh sách laptop
router.get('/', async (req, res) => {
    try {
        // 1. Lấy từ khóa tìm kiếm
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

        // 2. Truy vấn dữ liệu (Sử dụng .lean() để chuyển thành Object thuần giúp EJS đọc nhanh hơn)
        // Cực kỳ quan trọng: Phải đảm bảo tên biến truyền sang res.render khớp với file EJS
        var dsLaptops = await Laptop.find(queryObj).populate('DanhMuc').lean();
        var dsDanhMuc = await DanhMuc.find().lean();

        // 3. Tính toán thống kê
        const [tongLaptops, dangBan, sapHet, hetHang] = await Promise.all([
            Laptop.countDocuments(queryObj),
            Laptop.countDocuments({ ...queryObj, SoLuong: { $gt: 0 } }),
            Laptop.countDocuments({ ...queryObj, SoLuong: { $lt: 5, $gt: 0 } }),
            Laptop.countDocuments({ ...queryObj, SoLuong: 0 })
        ]);

        // 4. Render dữ liệu
        res.render('laptop', {
            title: 'Quản lý Sản phẩm',
            laptops: dsLaptops, // Biến này dùng cho vòng lặp trong table
            danhmucList: dsDanhMuc,
            stats: { tongLaptops, dangBan, sapHet, hetHang },
            keyword: keyword,
            // Truyền trực tiếp user từ session sang để chắc chắn View có dữ liệu check quyền
            user: req.session.user || null 
        });

    } catch (error) {
        console.error("Lỗi chi tiết tại Route Laptop:", error);
        res.status(500).render('error', { 
            message: "Hệ thống không thể tải danh sách sản phẩm. Vui lòng kiểm tra lại Database!" 
        });
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