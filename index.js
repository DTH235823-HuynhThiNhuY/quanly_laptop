var express = require('express');
var app = express();
var mongoose = require('mongoose');
var session = require('express-session');
var DanhMuc = require('./models/danhmuc');
// Bổ sung khai báo các Router
var indexRouter = require('./routers/index');
var danhmucRouter = require('./routers/danhmuc');
var laptopRouter = require('./routers/laptop');
var taiKhoanRouter = require('./routers/taikhoan');


//  chuỗi kết nối MongoDB Atlas 
var uri = 'mongodb://NhuY:NhuY123@ac-f3kp8uj-shard-00-01.pcyfm5u.mongodb.net:27017/quanly_laptop?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(async () => {
        console.log('Đã kết nối thành công tới MongoDB.');
        
        // Tự động thêm dữ liệu Danh mục nếu DB đang trống
        var count = await DanhMuc.countDocuments();
        if (count === 0) {
            await DanhMuc.insertMany([
                { TenDanhMuc: 'ASus' },
                { TenDanhMuc: 'Dell' },
                { TenDanhMuc: 'HP' },
                { TenDanhMuc: 'Lenovo' }
            ]);
            console.log('Đã tạo dữ liệu Danh mục mẫu!');
        }
    })
    .catch(err => console.log(err));

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/AnhLapTop', express.static('AnhLapTop'));
// BỔ SUNG CẤU HÌNH SESSION
app.use(session({
    secret: 'chuoi_bao_mat_cua_laptop_pro',
    resave: false,
    saveUninitialized: true
}));

// BỔ SUNG MIDDLEWARE: Truyền thông tin user ra tất cả các trang EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});
// Sử dụng Router
app.use('/', indexRouter);
app.use('/danhmuc', danhmucRouter);
app.use('/laptop', laptopRouter);
app.use('/donhang', require('./routers/donhang'));
app.use('/khachhang', require('./routers/khachhang'));
app.use('/thongke', require('./routers/thongke'));
app.use('/taikhoan', taiKhoanRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server đang chạy thành công trên cổng ${PORT}`);
});