// إعداد الاتصال السحابي بقاعدة بيانات Supabase
const SUPABASE_URL = 'https://ylmljqchckhgynysrenx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KeRQQdony6N8aio-FWGNWQ_NJ_V3O0w';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/**
 * Modern Engineering Dimension - Admin Management Script
 */

function getMasterPassword() {
  return localStorage.getItem("med_master_password") || "admin2026";
}

// فحص الجلسة وتسجيل الدخول
function handleAdminLogin(e) {
  e.preventDefault();
  const pass = document.getElementById("adminPassword").value;
  if (pass === getMasterPassword()) {
    sessionStorage.setItem("med_admin_logged", "true");
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
    loadAllData();
  } else {
    alert("❌ كلمة المرور غير صحيحة!");
  }
}

function handleLogout() {
  sessionStorage.removeItem("med_admin_logged");
  location.reload();
}

window.onload = function() {
  if (sessionStorage.getItem("med_admin_logged") === "true") {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
    loadAllData();
  }
};

// التبديل بين التبويبات الخمسة
function showTab(tabId) {
  document.querySelectorAll(".tab-pane").forEach(el => el.style.display = "none");
  document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
  
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.style.display = "block";
  
  if (event && event.target) {
    const btn = event.target.closest("button");
    if (btn) btn.classList.add("active");
  }
  
  const titles = {
    info: "بيانات الشركة والتراخيص الرسمية (CBL)",
    projects: "إدارة سابقة الأعمال والمشاريع",
    fleet: "إدارة أسطول الآليات والمعدات الثقيلة",
    messages: "صندوق رسائل واستفسارات العملاء الواردة",
    admins: "إدارة المسؤولين وكلمة المرور"
  };
  if (titles[tabId]) {
    document.getElementById("tabTitle").textContent = titles[tabId];
  }

  // إذا تم فتح تبويب الرسائل، نقوم بجلبها فوراً من السحابة
  if (tabId === "messages") {
    loadMessagesTable();
  }
}

// 1. حفظ بيانات الشركة
function saveCompanyInfo(e) {
  e.preventDefault();
  const info = {
    cr: document.getElementById("crNumber").value,
    chamber: document.getElementById("chamberNumber").value,
    tax: document.getElementById("taxNumber").value,
    grade: document.getElementById("classGrade").value,
    email: document.getElementById("officialEmail").value,
    phone: document.getElementById("officialPhone").value,
    address: document.getElementById("officialAddress").value
  };
  localStorage.setItem("med_company_info", JSON.stringify(info));
  alert("✅ تم حفظ وتحديث بيانات الشركة بنجاح! تم تحديث واجهة الموقع.");
}

// 2. إدارة المشاريع (ربط سحابي مع Supabase)
async function handleAddProject(e) {
  e.preventDefault();
  const newP = {
    name: document.getElementById("pName").value,
    category: document.getElementById("pCategory").value,
    status: document.getElementById("pStatus").value,
    client: document.getElementById("pClient").value,
    value: document.getElementById("pValue").value,
    meta: document.getElementById("pMeta").value,
    image: document.getElementById("pImage").value
  };

  // رفع إلى Supabase سحابياً
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('projects').insert([newP]);
    if (error) {
      console.error("Supabase error:", error);
    }
  }

  // حفظ نسخة محلية احتياطية
  const projects = JSON.parse(localStorage.getItem("med_projects") || "[]");
  newP.id = Date.now();
  projects.push(newP);
  localStorage.setItem("med_projects", JSON.stringify(projects));

  e.target.reset();
  renderProjectsTable();
  alert("✅ تمت إضافة المشروع ونشره سحابياً بنجاح!");
}

async function deleteProject(id) {
  if (!confirm("هل أنت متأكد من حذف هذا المشروع؟")) return;

  // الحذف من Supabase
  if (supabaseClient) {
    await supabaseClient.from('projects').delete().eq('id', id);
  }

  // الحذف من التخزين المحلي
  let projects = JSON.parse(localStorage.getItem("med_projects") || "[]");
  projects = projects.filter(p => p.id !== id);
  localStorage.setItem("med_projects", JSON.stringify(projects));

  renderProjectsTable();
}

async function renderProjectsTable() {
  const tbody = document.getElementById("projectsTableBody");
  if (!tbody) return;

  let projects = [];

  // جلب المشاريع من Supabase
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('projects').select('*').order('id', { ascending: false });
    if (!error && data && data.length > 0) {
      projects = data;
    }
  }

  // إذا لم يتوفر اتصال بالسحابة، استخدم المحلي
  if (projects.length === 0) {
    projects = JSON.parse(localStorage.getItem("med_projects") || "[]");
  }

  if (projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94A3B8;">لا توجد مشاريع مضافة حتى الآن</td></tr>`;
    return;
  }

  tbody.innerHTML = projects.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td>${p.client}</td>
      <td>${p.value}</td>
      <td><span style="color: green; font-weight:bold;">${p.status === 'completed' ? 'منجز' : 'قيد التنفيذ'}</span></td>
      <td><button class="btn-del" onclick="deleteProject(${p.id})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join("");
}

// 3. إدارة الآليات (ربط سحابي مع Supabase)
async function handleAddFleet(e) {
  e.preventDefault();
  const newF = {
    name: document.getElementById("fName").value,
    count: document.getElementById("fCount").value
  };

  if (supabaseClient) {
    await supabaseClient.from('fleet').insert([newF]);
  }

  const fleet = JSON.parse(localStorage.getItem("med_fleet") || "[]");
  newF.id = Date.now();
  fleet.push(newF);
  localStorage.setItem("med_fleet", JSON.stringify(fleet));

  e.target.reset();
  renderFleetTable();
  alert("✅ تمت إضافة الآلية للأسطول ونشرها سحابياً!");
}

async function deleteFleet(id) {
  if (!confirm("هل أنت متأكد من الحذف؟")) return;

  if (supabaseClient) {
    await supabaseClient.from('fleet').delete().eq('id', id);
  }

  let fleet = JSON.parse(localStorage.getItem("med_fleet") || "[]");
  fleet = fleet.filter(f => f.id !== id);
  localStorage.setItem("med_fleet", JSON.stringify(fleet));

  renderFleetTable();
}

async function renderFleetTable() {
  const tbody = document.getElementById("fleetTableBody");
  if (!tbody) return;

  let fleet = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('fleet').select('*').order('id', { ascending: false });
    if (!error && data && data.length > 0) {
      fleet = data;
    }
  }

  if (fleet.length === 0) {
    fleet = JSON.parse(localStorage.getItem("med_fleet") || "[]");
  }

  if (fleet.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94A3B8;">لا توجد آليات مضافة حتى الآن</td></tr>`;
    return;
  }

  tbody.innerHTML = fleet.map(f => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td>${f.count}</td>
      <td><button class="btn-del" onclick="deleteFleet(${f.id})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join("");
}

// 4. إدارة صندوق الرسائل والاستفسارات الواردة
async function loadMessagesTable() {
  const tbody = document.getElementById("messagesTableBody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">جاري جلب الرسائل من السحابة...</td></tr>';

  if (!supabaseClient) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">تعذر الاتصال بقاعدة البيانات</td></tr>';
    return;
  }

  const { data, error } = await supabaseClient
    .from('contact_messages')
    .select('*')
    .order('id', { ascending: false });

  if (error || !data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94A3B8;">لا توجد رسائل جديدة حتى الآن</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(m => {
    const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString('ar-LY') : '-';
    const cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';
    return `
      <tr>
        <td style="color:#64748B; font-size:0.8rem;">${dateStr}</td>
        <td><strong>${m.name || 'عميل'}</strong></td>
        <td dir="ltr">${m.phone || '-'}</td>
        <td dir="ltr">${m.email || '-'}</td>
        <td style="max-width: 250px; line-height:1.4;">${m.message || '-'}</td>
        <td>
          ${cleanPhone ? `<a href="https://wa.me/${cleanPhone}" target="_blank" style="display:inline-flex; align-items:center; gap:5px; background:rgba(13,148,136,0.12); color:#0D9488; padding:5px 12px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:0.8rem;"><i class="fa-brands fa-whatsapp"></i> واتساب</a>` : '-'}
        </td>
      </tr>
    `;
  }).join("");
}

// 5. تغيير كلمة المرور وإدارة المسؤولين
function handleChangeMasterPass(e) {
  e.preventDefault();
  const p1 = document.getElementById("newMasterPass").value;
  const p2 = document.getElementById("confirmMasterPass").value;
  if (p1 !== p2) {
    alert("❌ كلمتا المرور غير متطابقتين!");
    return;
  }
  localStorage.setItem("med_master_password", p1);
  alert("✅ تم تغيير كلمة المرور بنجاح! احفظها جيداً.");
  e.target.reset();
}

function handleAddSubAdmin(e) {
  e.preventDefault();
  const admins = JSON.parse(localStorage.getItem("med_admins_list") || "[]");
  const newAdm = {
    id: Date.now(),
    name: document.getElementById("admName").value,
    email: document.getElementById("admEmail").value,
    role: document.getElementById("admRole").value
  };
  admins.push(newAdm);
  localStorage.setItem("med_admins_list", JSON.stringify(admins));
  e.target.reset();
  renderAdminsTable();
  alert("✅ تمت إضافة المسؤول بنجاح!");
}

function deleteAdmin(id) {
  if (!confirm("هل أنت متأكد من سحب صلاحيات هذا المسؤول؟")) return;
  let admins = JSON.parse(localStorage.getItem("med_admins_list") || "[]");
  admins = admins.filter(a => a.id !== id);
  localStorage.setItem("med_admins_list", JSON.stringify(admins));
  renderAdminsTable();
}

function renderAdminsTable() {
  const admins = JSON.parse(localStorage.getItem("med_admins_list") || "[]");
  const tbody = document.getElementById("adminsTableBody");
  if (!tbody) return;
  const roleNames = {
    owner: "👑 مالك شريك",
    project_mgr: "👷 مدير مشاريع",
    finance: "💼 مسؤول مالي"
  };
  
  let html = `
    <tr>
      <td><strong>مالك المنصة الرئيسي (أنت)</strong></td>
      <td>info@modernengineeringdimension.ly</td>
      <td><span style="color:#C5A059; font-weight:bold;">👑 المالك الرئيسي (Super Admin)</span></td>
      <td><span style="color:green; font-weight:bold;">نشط دائم</span></td>
      <td>-</td>
    </tr>
  `;

  html += admins.map(a => `
    <tr>
      <td><strong>${a.name}</strong></td>
      <td dir="ltr">${a.email}</td>
      <td>${roleNames[a.role] || a.role}</td>
      <td><span style="color:green;">نشط</span></td>
      <td><button class="btn-del" onclick="deleteAdmin(${a.id})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join("");

  tbody.innerHTML = html;
}

function loadAllData() {
  const info = JSON.parse(localStorage.getItem("med_company_info") || "{}");
  if (info.cr && document.getElementById("crNumber")) document.getElementById("crNumber").value = info.cr;
  if (info.chamber && document.getElementById("chamberNumber")) document.getElementById("chamberNumber").value = info.chamber;
  if (info.tax && document.getElementById("taxNumber")) document.getElementById("taxNumber").value = info.tax;
  if (info.grade && document.getElementById("classGrade")) document.getElementById("classGrade").value = info.grade;
  if (info.email && document.getElementById("officialEmail")) document.getElementById("officialEmail").value = info.email;
  if (info.phone && document.getElementById("officialPhone")) document.getElementById("officialPhone").value = info.phone;
  if (info.address && document.getElementById("officialAddress")) document.getElementById("officialAddress").value = info.address;

  renderProjectsTable();
  renderFleetTable();
  renderAdminsTable();
  updateMessagesCountBadge();
}
// معالجة قراءة ورفع صورة المشروع من الجهاز
function handleProjectImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById('pImage').value = dataUrl;
    document.getElementById('pImagePreview').src = dataUrl;
    document.getElementById('pImagePreviewBox').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// تحديث عداد الرسائل في القائمة الجانبية
async function updateMessagesCountBadge() {
  const badge = document.getElementById("messagesCountBadge");
  if (!badge || !supabaseClient) return;

  const { count, error } = await supabaseClient
    .from('contact_messages')
    .select('*', { count: 'exact', head: true });

  if (!error && count !== null) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}