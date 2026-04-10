var express = require('express');
var router = express.Router();
var TaiKhoan = require('../models/taikhoan');
var bcrypt = require('bcryptjs');

// 1. GỌI THƯ VIỆN GOOGLE VÀ KHAI BÁO CLIENT ID
const { OAuth2Client } = require('google-auth-library');
// THAY CHUỖI BÊN DƯỚI BẰNG CLIENT ID BẠN COPY Ở BƯỚC 1
const CLIENT_ID = '796125695190-1l4p5jcb38se4270dcvmfve1gvhonhf6.apps.googleusercontent.com'; 
const client = new OAuth2Client(CLIENT_ID);
// GET: Trang chủ tự động chuyển hướng
router.get('/', (req, res) => {
    res.redirect('/laptop');
});
// ================= XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE =================
router.post('/auth/google', async (req, res) => {
    try {
        // Google gửi một đoạn mã token mã hóa qua biến req.body.credential
        var token = req.body.credential; 
        
        // Nhờ thư viện Google giải mã token này để lấy thông tin user
        var ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        var payload = ticket.getPayload(); // Chứa Email, Tên, Ảnh avatar của user
        
        // Kiểm tra xem user này đã từng đăng nhập vào hệ thống chưa (dựa vào Email)
        var tk = await TaiKhoan.findOne({ TenDangNhap: payload.email });
        
        if (tk) {
            // Nếu tài khoản đã tồn tại, cập nhật thêm GoogleID và Ảnh
            if (!tk.GoogleID) {
                tk.GoogleID = payload.sub;
                tk.HinhAnh = payload.picture;
                await tk.save();
            }
        } else {
            // Nếu là người mới hoàn toàn -> Tự động tạo tài khoản mới
            tk = await TaiKhoan.create({
                HoVaTen: payload.name,
                Email: payload.email,
                HinhAnh: payload.picture,
                TenDangNhap: payload.email, // Lấy email làm tên đăng nhập
                GoogleID: payload.sub,
                QuyenHan: 'admin' 
            });
        }

        // Lưu thông tin vào phiên làm việc (Session)
        req.session.user = tk;
        res.redirect('/laptop'); // Chuyển thẳng vào trang quản lý

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
        // Kiểm tra xem tên đăng nhập đã tồn tại chưa
        var checkUser = await TaiKhoan.findOne({ TenDangNhap: req.body.TenDangNhap });
        if (checkUser) {
            return res.render('dangky', { title: 'Đăng ký', error: 'Tên đăng nhập đã tồn tại!' });
        }

        // Mã hóa mật khẩu
        var salt = bcrypt.genSaltSync(10);
        var hashPassword = bcrypt.hashSync(req.body.MatKhau, salt);

        // Lưu vào Database
        await TaiKhoan.create({
            HoVaTen: req.body.HoVaTen,
            TenDangNhap: req.body.TenDangNhap,
            MatKhau: hashPassword,
            QuyenHan: 'admin'
        });

        res.redirect('/dangnhap');
    } catch (error) {
        console.log(error);
        res.render('dangky', { title: 'Đăng ký', error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
});

// ================= XỬ LÝ ĐĂNG NHẬP =================
router.get('/dangnhap', (req, res) => {
    res.render('dangnhap', { title: 'Đăng nhập', error: null });
});

router.post('/dangnhap', async (req, res) => {
    try {
        // Tìm tài khoản theo Tên đăng nhập
        var tk = await TaiKhoan.findOne({ TenDangNhap: req.body.TenDangNhap });
        
        // Kiểm tra mật khẩu mã hóa
        if (tk && bcrypt.compareSync(req.body.MatKhau, tk.MatKhau)) {
            // Đăng nhập thành công -> Lưu vào Session
            req.session.user = tk;
            res.redirect('/laptop');
        } else {
            // Đăng nhập thất bại
            res.render('dangnhap', { title: 'Đăng nhập', error: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
    } catch (error) {
        console.log(error);
    }
});

// ================= XỬ LÝ ĐĂNG XUẤT =================
router.get('/dangxuat', (req, res) => {
    req.session.destroy(); // Xóa phiên làm việc
    res.redirect('/dangnhap');
});

module.exports = router;