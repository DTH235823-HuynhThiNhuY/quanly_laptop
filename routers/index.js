var express = require('express');
var router = express.Router();
var TaiKhoan = require('../models/taikhoan');
var bcrypt = require('bcryptjs');

const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '796125695190-1l4p5jcb38se4270dcvmfve1gvhonhf6.apps.googleusercontent.com'; 
const client = new OAuth2Client(CLIENT_ID);



// ========================================================
// Hàm này giúp kiểm tra xem user đã đăng nhập chưa và có phải admin không
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.QuyenHan === 'admin') {
        return next();
    }
    // Nếu không phải admin, có thể cho họ quay về trang chủ hoặc báo lỗi
    res.status(403).send("Bạn không có quyền truy cập khu vực dành cho Quản lý!");
};


router.isAdmin = isAdmin; 

// ========================================================

router.get('/', (req, res) => {
    res.redirect('/laptop');
});

// ================= XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE =================
router.post('/auth/google', async (req, res) => {
    try {
        var token = req.body.credential; 
        var ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        var payload = ticket.getPayload(); 
        
        var tk = await TaiKhoan.findOne({ TenDangNhap: payload.email });
        
        if (tk) {
            if (tk.KichHoat === 0) {
                return res.render('dangnhap', { title: 'Đăng nhập', error: 'Tài khoản Google này đã bị khóa truy cập!' });
            }
            if (!tk.GoogleID) {
                tk.GoogleID = payload.sub;
                tk.HinhAnh = payload.picture;
                await tk.save();
            }
        } else {
            // QUAN TRỌNG: Người mới từ Google vào mặc định là 'staff'
            tk = await TaiKhoan.create({
                HoVaTen: payload.name,
                Email: payload.email,
                HinhAnh: payload.picture,
                TenDangNhap: payload.email,
                GoogleID: payload.sub,
                QuyenHan: 'staff' 
            });
        }

        req.session.user = tk;
        res.redirect('/laptop');

    } catch (error) {
        console.log("Lỗi Google Login:", error);
        res.render('dangnhap', { title: 'Đăng nhập', error: 'Đăng nhập bằng Google thất bại!' });
    }
});

// ================= XỬ LÝ ĐĂNG KÝ =================
router.get('/dangky', (req, res) => {
    res.render('dangky', { title: 'Đăng ký Tài khoản', error: null });
});

router.post('/dangky', async (req, res) => {
    try {
        // 1. Kiểm tra user tồn tại
        var checkUser = await TaiKhoan.findOne({ TenDangNhap: req.body.TenDangNhap });
        if (checkUser) {
            return res.render('dangky', { title: 'Đăng ký', error: 'Tên đăng nhập đã tồn tại!' });
        }

        // 2. Mã hóa mật khẩu
        var salt = bcrypt.genSaltSync(10);
        var hashPassword = bcrypt.hashSync(req.body.MatKhau, salt);

        // 3. Lưu vào Database (Lấy thêm QuyenHan từ form)
        await TaiKhoan.create({
            HoVaTen: req.body.HoVaTen,
            TenDangNhap: req.body.TenDangNhap,
            MatKhau: hashPassword,
            QuyenHan: req.body.QuyenHan || 'staff' // Lấy từ form, mặc định là staff nếu trống
        });

        res.redirect('/dangnhap');
    } catch (error) {
        console.log(error);
        res.render('dangky', { title: 'Đăng ký', error: 'Có lỗi xảy ra!' });
    }
});

// ================= XỬ LÝ ĐĂNG NHẬP =================
router.get('/dangnhap', (req, res) => {
    res.render('dangnhap', { title: 'Đăng nhập', error: null });
});

router.post('/dangnhap', async (req, res) => {
    try {
        var tk = await TaiKhoan.findOne({ TenDangNhap: req.body.TenDangNhap });
        if (tk && tk.KichHoat === 0) {
            return res.render('dangnhap', { title: 'Đăng nhập', error: 'Tài khoản của bạn hiện đang bị khóa!' });
        }
        if (tk && bcrypt.compareSync(req.body.MatKhau, tk.MatKhau)) {
            req.session.user = tk;
            res.redirect('/laptop');
        } else {
            res.render('dangnhap', { title: 'Đăng nhập', error: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
    } catch (error) {
        console.log(error);
    }
});

router.get('/dangxuat', (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            console.log(err);
        }
        // Xóa sạch cookie của session trên trình duyệt
        res.clearCookie('connect.sid'); 
        res.redirect('/dangnhap');
    });
});

module.exports = router;