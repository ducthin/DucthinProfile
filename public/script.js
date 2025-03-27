// Handle contact form submission
document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value
  };

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    if (data.success) {
      alert('Tin nhắn đã được gửi thành công!');
      e.target.reset();
    } else {
      alert('Lỗi khi gửi tin nhắn. Vui lòng thử lại.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi khi gửi tin nhắn. Vui lòng thử lại.');
  }
});

// Admin login functionality
const adminLogin = async (username, password) => {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (response.status !== 200) {
      console.error('Login failed:', data.message);
      return { success: false, message: data.message || 'Đăng nhập thất bại' };
    }
    
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      return { success: true };
    }
    
    return { success: false, message: 'Không nhận được token' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
};

// Admin logout functionality
const adminLogout = () => {
  localStorage.removeItem('adminToken');
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('dashboard-section').style.display = 'none';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  showStatusMessage('login-status', 'Đã đăng xuất thành công', 'success');
};

// Function to update profile information
const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.message || 'Lỗi cập nhật hồ sơ'
      };
    }

    const data = await response.json();
    return { 
      success: data.message === 'Profile updated successfully',
      message: 'Hồ sơ đã được cập nhật thành công'
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      message: 'Lỗi kết nối khi cập nhật hồ sơ'
    };
  }
};

// Function to update projects
const updateProjects = async (projectsData) => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/projects', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ projects: projectsData })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.message || 'Lỗi cập nhật dự án'
      };
    }

    const data = await response.json();
    return { 
      success: data.message === 'Projects updated successfully',
      message: 'Dự án đã được cập nhật thành công'
    };
  } catch (error) {
    console.error('Error updating projects:', error);
    return { 
      success: false, 
      message: 'Lỗi kết nối khi cập nhật dự án'
    };
  }
};

// Function to fetch contact submissions
const getContactSubmissions = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/contact-submissions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      showStatusMessage('submissions-status', 'Không thể tải các liên hệ', 'error');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching submissions:', error);
    showStatusMessage('submissions-status', 'Lỗi kết nối khi tải liên hệ', 'error');
    return null;
  }
};

// Function to display status messages
const showStatusMessage = (elementId, message, type) => {
  const statusElement = document.getElementById(elementId);
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';
    
    // Hide message after 3 seconds
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 3000);
  }
};

// Hàm xử lý xem trước ảnh khi chọn tệp
function setupImagePreview() {
  const fileInput = document.getElementById('profile-image-upload');
  const imagePreview = document.getElementById('image-preview');
  
  if (!fileInput || !imagePreview) return;
  
  fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      
      reader.readAsDataURL(this.files[0]);
    }
  });
}

// Hàm tải lên ảnh
const uploadProfileImage = async (file) => {
  if (!file) return null;
  
  const formData = new FormData();
  formData.append('profileImage', file);
  
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/upload-profile-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Không thể tải lên ảnh');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Load profile data
const loadProfileData = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      showStatusMessage('profile-status', 'Không thể tải dữ liệu hồ sơ', 'error');
      return;
    }

    const profileData = await response.json();
    
    // Populate form fields
    document.getElementById('profile-name').value = profileData.name || '';
    document.getElementById('profile-about').value = profileData.about || '';
    document.getElementById('profile-skills').value = Array.isArray(profileData.skills) 
      ? profileData.skills.join(', ') 
      : '';
    
    // Cập nhật ảnh hiện tại
    const currentImage = document.getElementById('current-profile-image');
    if (currentImage && profileData.imageUrl) {
      currentImage.src = profileData.imageUrl;
    }
      
    showStatusMessage('profile-status', 'Đã tải dữ liệu hồ sơ thành công', 'success');
  } catch (error) {
    console.error('Error loading profile:', error);
    showStatusMessage('profile-status', 'Lỗi khi tải dữ liệu hồ sơ', 'error');
  }
};

// Load projects data
const loadProjects = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      showStatusMessage('projects-status', 'Không thể tải dữ liệu dự án', 'error');
      return;
    }

    const data = await response.json();
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = '';
    
    if (Array.isArray(data.projects)) {
      data.projects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.innerHTML = `
          <input type="text" placeholder="Tên dự án" class="project-title" value="${project.title || ''}">
          <textarea placeholder="Mô tả dự án" class="project-description">${project.description || ''}</textarea>
          <input type="url" placeholder="Link dự án" class="project-link" value="${project.link || ''}">
          <button type="button" onclick="this.parentElement.remove()">Xóa</button>
        `;
        projectsContainer.appendChild(projectDiv);
      });
    }
    
    showStatusMessage('projects-status', 'Đã tải dữ liệu dự án thành công', 'success');
  } catch (error) {
    console.error('Error loading projects:', error);
    showStatusMessage('projects-status', 'Lỗi khi tải dữ liệu dự án', 'error');
  }
};

// Load dashboard data
async function loadDashboardData() {
  // Show loading messages
  showStatusMessage('profile-status', 'Đang tải dữ liệu...', 'success');
  showStatusMessage('projects-status', 'Đang tải dữ liệu...', 'success');
  showStatusMessage('submissions-status', 'Đang tải dữ liệu...', 'success');
  
  // Load all data concurrently
  await Promise.all([
    loadProfileData(),
    loadProjects(),
    loadContactSubmissions()
  ]);
}

// Function to load contact submissions
async function loadContactSubmissions() {
  const submissions = await getContactSubmissions();
  if (submissions) {
    const submissionsList = document.getElementById('submissions-list');
    if (submissionsList) {
      if (!submissions.submissions || submissions.submissions.length === 0) {
        submissionsList.innerHTML = '<p>Chưa có liên hệ nào.</p>';
      } else {
        submissionsList.innerHTML = submissions.submissions.map(sub => `
          <div class="submission-item">
            <p><strong>Tên:</strong> ${sub.name}</p>
            <p><strong>Email:</strong> ${sub.email}</p>
            <p><strong>Tin nhắn:</strong> ${sub.message}</p>
            <p><strong>Ngày:</strong> ${new Date(sub.date).toLocaleString()}</p>
          </div>
        `).join('');
      }
      showStatusMessage('submissions-status', 'Đã tải dữ liệu liên hệ thành công', 'success');
    }
  }
}

// Initialize all admin panel functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Thiết lập xem trước ảnh
  setupImagePreview();
  
  // Login form handling
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      showStatusMessage('login-status', 'Đang đăng nhập...', 'success');
      const result = await adminLogin(username, password);
      if (result.success) {
        showStatusMessage('login-status', 'Đăng nhập thành công!', 'success');
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        loadDashboardData();
      } else {
        showStatusMessage('login-status', result.message || 'Đăng nhập thất bại', 'error');
      }
    });
  }

  // Logout button handling
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', adminLogout);
  }

  // Profile form handling
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      showStatusMessage('profile-status', 'Đang xử lý...', 'success');
      
      // Tải lên ảnh (nếu có)
      let imageUrl = null;
      const fileInput = document.getElementById('profile-image-upload');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        showStatusMessage('profile-status', 'Đang tải lên ảnh...', 'success');
        imageUrl = await uploadProfileImage(fileInput.files[0]);
        if (!imageUrl) {
          showStatusMessage('profile-status', 'Lỗi khi tải lên ảnh', 'error');
          return;
        }
      }
      
      // Lấy và chuẩn bị dữ liệu hồ sơ
      const currentImage = document.getElementById('current-profile-image');
      const profileData = {
        name: document.getElementById('profile-name').value,
        about: document.getElementById('profile-about').value,
        skills: document.getElementById('profile-skills').value.split(',').map(skill => skill.trim()),
        imageUrl: imageUrl || (currentImage ? currentImage.src : '')
      };

      showStatusMessage('profile-status', 'Đang cập nhật hồ sơ...', 'success');
      const result = await updateProfile(profileData);
      
      if (result.success) {
        // Nếu cập nhật thành công, cập nhật ảnh hiển thị
        if (imageUrl && currentImage) {
          currentImage.src = imageUrl;
        }
        
        // Xóa xem trước ảnh và đặt lại input file
        const imagePreview = document.getElementById('image-preview');
        if (imagePreview) {
          imagePreview.style.display = 'none';
        }
        if (fileInput) {
          fileInput.value = '';
        }
      }
      
      showStatusMessage('profile-status', result.message, result.success ? 'success' : 'error');
    });
  }

  // Projects management
  const addProjectBtn = document.getElementById('add-project-btn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
      const projectsContainer = document.getElementById('projects-container');
      const projectDiv = document.createElement('div');
      projectDiv.className = 'project-item';
      projectDiv.innerHTML = `
        <input type="text" placeholder="Tên dự án" class="project-title">
        <textarea placeholder="Mô tả dự án" class="project-description"></textarea>
        <input type="url" placeholder="Link dự án" class="project-link">
        <button type="button" onclick="this.parentElement.remove()">Xóa</button>
      `;
      projectsContainer.appendChild(projectDiv);
    });
  }

  const projectsForm = document.getElementById('projects-form');
  if (projectsForm) {
    projectsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projectItems = document.querySelectorAll('.project-item');
      const projects = Array.from(projectItems).map(item => ({
        title: item.querySelector('.project-title').value,
        description: item.querySelector('.project-description').value,
        link: item.querySelector('.project-link').value
      }));

      showStatusMessage('projects-status', 'Đang cập nhật dự án...', 'success');
      const result = await updateProjects(projects);
      showStatusMessage('projects-status', result.message, result.success ? 'success' : 'error');
    });
  }

  // Check if already logged in
  const token = localStorage.getItem('adminToken');
  if (token && document.getElementById('login-section') && document.getElementById('dashboard-section')) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    loadDashboardData();
  }
});