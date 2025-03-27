require('dotenv').config();
const express = require('express');
const path = require('path');
const adminRoutes = require('./routes/admin');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Verify env variables before starting
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
  console.error('Environment variables missing. Please check your .env file');
  process.exit(1);
}

// Đường dẫn file lưu contact form
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Đảm bảo thư mục data tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Khởi tạo file contacts nếu chưa tồn tại
if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify([]));
}

// Thiết lập lưu trữ cho multer (để xử lý tải lên tệp)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function(req, file, cb) {
    // Tạo tên tệp độc đáo bằng thời gian và phần mở rộng gốc
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Giới hạn loại tệp là hình ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận tải lên hình ảnh!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // giới hạn 5MB
  },
  fileFilter: fileFilter
});

// Middleware để phân tích các yêu cầu JSON
app.use(express.json());

// Phục vụ các tệp tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Cài đặt các header bảo mật cơ bản
app.use((req, res, next) => {
  // Ngăn chặn clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Ngăn chặn MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Bật XSS Protection trên các trình duyệt cũ
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Phục vụ trang đăng nhập admin
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API để lấy thông tin hồ sơ
app.get('/api/profile', (req, res) => {
  try {
    if (fs.existsSync(PROFILE_PATH)) {
      const profileData = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
      res.json(profileData);
    } else {
      res.json({
        name: 'John Doe',
        about: 'I am a passionate developer with experience in web development and a strong interest in creating user-friendly applications.',
        skills: ['HTML', 'CSS', 'JavaScript', 'Node.js']
      });
    }
  } catch (error) {
    console.error('Lỗi khi đọc thông tin hồ sơ:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể đọc thông tin hồ sơ' 
    });
  }
});

// API để lấy thông tin dự án
app.get('/api/projects', (req, res) => {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
      res.json({ projects: projectsData });
    } else {
      res.json({
        projects: [
          { title: 'Project 1', description: 'Description of project 1' },
          { title: 'Project 2', description: 'Description of project 2' },
          { title: 'Project 3', description: 'Description of project 3' }
        ]
      });
    }
  } catch (error) {
    console.error('Lỗi khi đọc thông tin dự án:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể đọc thông tin dự án' 
    });
  }
});

// Sử dụng các route admin
app.use('/api/admin', adminRoutes);

// Điểm cuối API để xử lý gửi form liên hệ
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên, email và tin nhắn là bắt buộc' 
    });
  }
  
  try {
    // Đọc danh sách liên hệ hiện có
    let contacts = [];
    if (fs.existsSync(CONTACTS_FILE)) {
      contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    }
    
    // Thêm liên hệ mới
    contacts.push({
      id: Date.now(),
      name,
      email,
      message,
      date: new Date()
    });
    
    // Lưu lại danh sách liên hệ
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts));
    
    console.log('Đã nhận liên hệ mới:', { name, email });
    res.json({ success: true, message: 'Đã gửi liên hệ thành công!' });
  } catch (error) {
    console.error('Lỗi khi lưu liên hệ:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi lưu liên hệ' 
    });
  }
});

// Middleware để xác thực token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    
    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
      }
      req.user = authData;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Không được phép truy cập' });
  }
}

// API endpoint để tải lên ảnh hồ sơ
app.post('/api/admin/upload-profile-image', verifyToken, upload.single('profileImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
    }

    // Tạo URL cho tệp đã tải lên
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Cập nhật hồ sơ với đường dẫn ảnh mới
    try {
      let profileData = {};
      
      if (fs.existsSync(PROFILE_PATH)) {
        const profileContent = fs.readFileSync(PROFILE_PATH, 'utf8');
        profileData = JSON.parse(profileContent);
      } else {
        profileData = {
          name: 'Tên của bạn',
          about: 'Thông tin về bạn',
          skills: ['Kỹ năng 1', 'Kỹ năng 2', 'Kỹ năng 3']
        };
      }
      
      // Cập nhật URL hình ảnh
      profileData.imageUrl = imageUrl;
      
      // Lưu dữ liệu hồ sơ đã cập nhật
      fs.writeFileSync(PROFILE_PATH, JSON.stringify(profileData, null, 2));
      
      return res.json({ 
        success: true, 
        message: 'Tải lên ảnh thành công', 
        imageUrl: imageUrl 
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ với ảnh mới:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Có lỗi xảy ra khi cập nhật ảnh hồ sơ',
        imageUrl: imageUrl // Vẫn trả về URL hình ảnh đã tải lên
      });
    }
  } catch (error) {
    console.error('Lỗi khi tải lên ảnh:', error);
    return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải lên ảnh' });
  }
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
});

// Route xử lý các route không tìm thấy
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy trang' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});