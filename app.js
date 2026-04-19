class RestaurantApp {
  constructor() {
    this.storageKey = "restaurantManagementFullV1";
    this.isLoggedIn = false;
    this.currentTable = null;
    this.currentQrData = null;

    this.data = {
      adminPassword: "admin123",
      restaurant: {
        name: "My Restaurant",
        logo: null,
        tableCount: 10,
        paymentMethods: ["Cash", "UPI", "Card", "Other"]
      },
      categories: ["Appetizers", "Main Course", "Desserts", "Beverages"],
      menuItems: [
        { id: this.generateId(), name: "Masala Dosa", category: "Appetizers", price: 120 },
        { id: this.generateId(), name: "Paneer Butter Masala", category: "Main Course", price: 220 },
        { id: this.generateId(), name: "Gulab Jamun", category: "Desserts", price: 80 },
        { id: this.generateId(), name: "Mango Lassi", category: "Beverages", price: 60 }
      ],
      tables: {},
      transactions: [],
      deliveryOrders: [],
      paymentQRCodes: {}
    };

    this.loadData();
    this.initializeTables();
    this.bindEvents();
    this.setTodayInExportFields();
    this.updateHeaderDate();
  }

  generateId() {
    return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  formatCurrency(value) {
    return "₹" + Number(value || 0).toFixed(2);
  }

  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  loadData() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      this.data = parsed;
    } catch (e) {
      console.error("Failed to load saved data", e);
    }
  }

  initializeTables() {
    for (let i = 1; i <= this.data.restaurant.tableCount; i++) {
      if (!this.data.tables[i]) {
        this.data.tables[i] = { items: [] };
      }
    }
  }

  bindEvents() {
    document.getElementById("loginBtn").addEventListener("click", () => this.login());
    document.getElementById("loginPassword").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.login();
    });

    document.querySelectorAll(".nav-link[data-page]").forEach(link => {
      link.addEventListener("click", () => this.navigateTo(link.dataset.page));
    });

    document.getElementById("logoutBtn").addEventListener("click", () => this.logout());

    document.getElementById("menuSearch").addEventListener("input", (e) => {
      this.renderMenu(e.target.value.trim().toLowerCase());
    });

    document.getElementById("tipCheckbox").addEventListener("change", (e) => {
      document.getElementById("tipInputGroup").classList.toggle("hidden", !e.target.checked);
    });

    document.getElementById("paymentMode").addEventListener("change", (e) => {
      const method = e.target.value;
      if (method && this.data.paymentQRCodes[method]) {
        this.showPaymentQr(method);
        this.renderInlinePaymentQr(method);
      } else {
        document.getElementById("paymentQrPreview").innerHTML = "";
      }
    });

    document.getElementById("closeOrderBtn").addEventListener("click", () => this.completeOrder());

    document.getElementById("restName").addEventListener("change", (e) => {
      this.data.restaurant.name = e.target.value.trim() || "My Restaurant";
      this.saveData();
      this.updateRestaurantDisplay();
    });

    document.getElementById("adminPassword").addEventListener("change", (e) => {
      const val = e.target.value.trim();
      if (val) {
        this.data.adminPassword = val;
        this.saveData();
        e.target.value = "";
        this.showAlert("Password updated", "success");
      }
    });

    document.getElementById("updateTablesBtn").addEventListener("click", () => this.updateTableCount());

    document.getElementById("logoUpload").addEventListener("change", (e) => {
      if (e.target.files[0]) this.handleLogoUpload(e.target.files[0]);
    });

    document.getElementById("qrUpload").addEventListener("change", (e) => {
      if (e.target.files[0]) this.handleQrUpload(e.target.files[0]);
    });

    document.getElementById("uploadQrBtn").addEventListener("click", () => this.uploadQrCode());

    document.getElementById("addCategoryBtn").addEventListener("click", () => this.addCategory());
    document.getElementById("addPaymentMethodBtn").addEventListener("click", () => this.addPaymentMethod());
    document.getElementById("addMenuItemBtn").addEventListener("click", () => this.addMenuItem());

    document.getElementById("addDeliveryBtn").addEventListener("click", () => {
      document.getElementById("deliveryModal").classList.add("active");
    });

    document.getElementById("cancelDeliveryBtn").addEventListener("click", () => {
      document.getElementById("deliveryModal").classList.remove("active");
    });

    document.getElementById("saveDeliveryBtn").addEventListener("click", () => this.saveDeliveryOrder());

    document.getElementById("closeQrBtn").addEventListener("click", () => {
      document.getElementById("paymentQrModal").classList.remove("active");
    });

    document.getElementById("exportTransactionsBtn").addEventListener("click", () => this.exportTransactionsExcel());
    document.getElementById("exportTransactionsCsvBtn").addEventListener("click", () => this.exportTransactionsCsv());
    document.getElementById("exportDeliveryBtn").addEventListener("click", () => this.exportDeliveryExcel());
    document.getElementById("exportDeliveryCsvBtn").addEventListener("click", () => this.exportDeliveryCsv());
    document.getElementById("exportMenuBtn").addEventListener("click", () => this.exportMenuExcel());
    document.getElementById("backupDataBtn").addEventListener("click", () => this.backupData());

    document.getElementById("restoreDataBtn").addEventListener("click", () => {
      document.getElementById("restoreFile").click();
    });

    document.getElementById("restoreFile").addEventListener("change", (e) => {
      if (e.target.files[0]) this.restoreData(e.target.files[0]);
    });

    document.getElementById("clearAllDataBtn").addEventListener("click", () => {
      if (confirm("Delete all data permanently?")) {
        this.clearAllData();
      }
    });
  }

  updateHeaderDate() {
    document.getElementById("topDate").textContent = new Date().toLocaleString();
  }

  setTodayInExportFields() {
    const today = this.getTodayString();
    document.getElementById("exportStartDate").value = today;
    document.getElementById("exportEndDate").value = today;
    document.getElementById("exportDeliveryStartDate").value = today;
    document.getElementById("exportDeliveryEndDate").value = today;
  }

  login() {
    const password = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("loginError");

    if (password === this.data.adminPassword) {
      this.isLoggedIn = true;
      document.getElementById("loginPage").classList.add("hidden");
      document.getElementById("mainApp").classList.remove("hidden");
      errorBox.classList.remove("show");
      errorBox.textContent = "";
      this.updateRestaurantDisplay();
      this.renderDashboard();
      this.renderTables();
      this.renderAdmin();
      this.renderDelivery();
    } else {
      errorBox.textContent = "Invalid password";
      errorBox.className = "alert error show";
    }
  }

  logout() {
    this.isLoggedIn = false;
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("mainApp").classList.add("hidden");
    document.getElementById("loginPassword").value = "";
  }

  navigateTo(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(page + "Page").classList.add("active");

    document.querySelectorAll(".nav-link[data-page]").forEach(l => l.classList.remove("active"));
    document.querySelector(`.nav-link[data-page="${page}"]`).classList.add("active");

    const titles = {
      dashboard: "Dashboard",
      tables: "Tables & Orders",
      delivery: "Delivery Orders",
      admin: "Admin Panel",
      data: "Data & Export"
    };
    document.getElementById("pageTitle").textContent = titles[page] || "Restaurant";

    if (page === "dashboard") this.renderDashboard();
    if (page === "tables") this.renderTables();
    if (page === "delivery") this.renderDelivery();
    if (page === "admin") this.renderAdmin();
  }

  updateRestaurantDisplay() {
    document.getElementById("restaurantNameDisplay").textContent = this.data.restaurant.name;
    document.getElementById("sidebarRestaurantName").textContent = this.data.restaurant.name;
    document.getElementById("restName").value = this.data.restaurant.name;
    document.getElementById("tableCount").value = this.data.restaurant.tableCount;

    if (this.data.restaurant.logo) {
      const headerLogo = document.getElementById("headerLogo");
      const logoPreview = document.getElementById("logoPreview");
      headerLogo.src = this.data.restaurant.logo;
      logoPreview.src = this.data.restaurant.logo;
      headerLogo.classList.remove("hidden");
      logoPreview.classList.remove("hidden");
    }
  }

  showAlert(message, type = "success") {
    const box = document.getElementById("globalAlert");
    box.textContent = message;
    box.className = `alert ${type} show`;
    setTimeout(() => {
      box.className = "alert";
      box.textContent = "";
    }, 3000);
  }

  renderDashboard() {
    const today = this.getTodayString();
    const todayTxns = this.data.transactions.filter(t => t.date === today);
    const todayRevenue = todayTxns.reduce((sum, t) => sum + t.total + (t.tip || 0), 0);
    const activeTables = Object.values(this.data.tables).filter(t => t.items.length > 0).length;
    const deliveryOrders = this.data.deliveryOrders.filter(d => d.date === today).length;

    document.getElementById("todayRevenue").textContent = this.formatCurrency(todayRevenue);
    document.getElementById("totalTransactions").textContent = todayTxns.length;
    document.getElementById("activeTables").textContent = activeTables;
    document.getElementById("deliveryOrdersCount").textContent = deliveryOrders;

    const paymentSummary = {};
    todayTxns.forEach(t => {
      paymentSummary[t.paymentMode] = (paymentSummary[t.paymentMode] || 0) + t.total + (t.tip || 0);
    });

    const paymentHtml = Object.keys(paymentSummary).length
      ? Object.entries(paymentSummary).map(([mode, amt]) => `
          <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
            <span>${mode}</span>
            <strong>${this.formatCurrency(amt)}</strong>
          </div>
        `).join("")
      : `<p class="muted">No transactions today</p>`;

    document.getElementById("paymentChart").innerHTML = paymentHtml;

    const recentHtml = todayTxns.slice(-5).reverse().map(t => `
      <div style="padding:10px 0; border-bottom:1px dashed #eee;">
        <div style="display:flex; justify-content:space-between;">
          <span>Table ${t.tableNumber}</span>
          <strong>${this.formatCurrency(t.total)}</strong>
        </div>
        <div class="muted" style="font-size:12px;">${t.paymentMode}${t.tip ? ` + Tip ${this.formatCurrency(t.tip)}` : ""}</div>
      </div>
    `).join("");

    document.getElementById("recentTxns").innerHTML = recentHtml || `<p class="muted">No recent transactions</p>`;
  }

  renderTables() {
    const tablesGrid = document.getElementById("tablesGrid");
    const sortedTables = Object.keys(this.data.tables).sort((a, b) => Number(a) - Number(b));

    tablesGrid.innerHTML = sortedTables.map(tableNum => {
      const table = this.data.tables[tableNum];
      const total = this.calculateTableTotal(tableNum);
      const isActive = Number(tableNum) === this.currentTable;

      return `
        <div class="table-card ${isActive ? "active" : ""}" onclick="app.selectTable(${tableNum})">
          <h4>Table ${tableNum}</h4>
          <div>${table.items.length ? `<span class="badge badge-warning">Running</span>` : `<span class="badge badge-success">Free</span>`}</div>
          <div class="muted" style="margin-top:8px;">${table.items.length} item(s)</div>
          <div style="margin-top:8px; font-weight:800; color:#0b7a75;">${total ? this.formatCurrency(total) : ""}</div>
        </div>
      `;
    }).join("");

    this.renderMenu();
    if (this.currentTable) this.renderBill();
  }

  selectTable(tableNum) {
    this.currentTable = tableNum;
    document.getElementById("billSection").classList.remove("hidden");
    document.getElementById("currentTableDisplay").textContent = "Table " + tableNum;
    this.renderTables();
    this.renderBill();
  }

  renderMenu(searchTerm = "") {
    const menuContainer = document.getElementById("menuContainer");

    const categoryHtml = this.data.categories.map(category => {
      const items = this.data.menuItems.filter(item =>
        item.category === category &&
        item.name.toLowerCase().includes(searchTerm)
      );

      if (!items.length) return "";

      return `
        <div class="menu-category">
          <div class="category-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <span>${category}</span>
            <span>${items.length}</span>
          </div>
          <div class="category-items">
            ${items.map(item => `
              <div class="menu-item">
                <div>
                  <div style="font-weight:700;">${item.name}</div>
                  <div class="muted">${this.formatCurrency(item.price)}</div>
                </div>
                <input type="number" id="qty_${item.id}" min="1" value="1">
                <button class="btn btn-primary" onclick="app.addToOrder('${item.id}')">Add</button>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }).join("");

    menuContainer.innerHTML = categoryHtml || `<p class="muted">No menu items found.</p>`;
  }

  addToOrder(itemId) {
    if (!this.currentTable) {
      this.showAlert("Please select a table first", "warning");
      return;
    }

    const item = this.data.menuItems.find(i => i.id === itemId);
    const qty = parseInt(document.getElementById("qty_" + itemId).value, 10) || 1;
    const table = this.data.tables[this.currentTable];
    const existing = table.items.find(i => i.id === itemId);

    if (existing) {
      existing.qty += qty;
    } else {
      table.items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty
      });
    }

    this.saveData();
    this.renderTables();
    this.renderBill();
  }

  removeFromOrder(index) {
    if (!this.currentTable) return;
    this.data.tables[this.currentTable].items.splice(index, 1);
    this.saveData();
    this.renderTables();
    this.renderBill();
  }

  calculateTableTotal(tableNum) {
    const table = this.data.tables[tableNum];
    if (!table) return 0;
    return table.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  renderBill() {
    if (!this.currentTable) return;

    const table = this.data.tables[this.currentTable];
    const subtotal = this.calculateTableTotal(this.currentTable);
    const sgst = subtotal * 0.05;
    const cgst = subtotal * 0.05;
    const total = subtotal + sgst + cgst;

    document.getElementById("billItems").innerHTML = table.items.length
      ? table.items.map((item, index) => `
          <div class="bill-item">
            <div><strong>${item.name}</strong></div>
            <div>x ${item.qty}</div>
            <div><strong>${this.formatCurrency(item.qty * item.price)}</strong></div>
            <button class="btn btn-danger" onclick="app.removeFromOrder(${index})">Remove</button>
          </div>
        `).join("")
      : `<p class="muted">No items in this bill yet.</p>`;

    document.getElementById("subtotal").textContent = this.formatCurrency(subtotal);
    document.getElementById("sgst").textContent = this.formatCurrency(sgst);
    document.getElementById("cgst").textContent = this.formatCurrency(cgst);
    document.getElementById("billTotal").textContent = this.formatCurrency(total);

    const paymentMode = document.getElementById("paymentMode");
    paymentMode.innerHTML = `<option value="">Select Payment Mode</option>` +
      this.data.restaurant.paymentMethods.map(method => `<option value="${method}">${method}</option>`).join("");
  }

  renderInlinePaymentQr(method) {
    const qr = this.data.paymentQRCodes[method];
    const box = document.getElementById("paymentQrPreview");
    if (!qr) {
      box.innerHTML = "";
      return;
    }

    box.innerHTML = `
      <div class="card" style="margin-top:16px; padding:16px;">
        <div style="font-weight:700; margin-bottom:8px;">Scan to pay via ${method}</div>
        <img src="${qr}" class="qr-image" alt="${method} QR">
      </div>
    `;
  }

  completeOrder() {
    if (!this.currentTable) {
      this.showAlert("Select a table first", "error");
      return;
    }

    const paymentMode = document.getElementById("paymentMode").value;
    if (!paymentMode) {
      this.showAlert("Please select a payment mode", "error");
      return;
    }

    const table = this.data.tables[this.currentTable];
    if (!table.items.length) {
      this.showAlert("No items in bill", "error");
      return;
    }

    const subtotal = this.calculateTableTotal(this.currentTable);
    const sgst = subtotal * 0.05;
    const cgst = subtotal * 0.05;
    const total = subtotal + sgst + cgst;
    const tip = document.getElementById("tipCheckbox").checked
      ? parseFloat(document.getElementById("tipAmount").value || 0)
      : 0;

    this.data.transactions.push({
      id: this.generateId(),
      date: this.getTodayString(),
      tableNumber: this.currentTable,
      items: JSON.parse(JSON.stringify(table.items)),
      subtotal,
      sgst,
      cgst,
      total,
      tip,
      paymentMode,
      timestamp: new Date().toLocaleTimeString()
    });

    this.data.tables[this.currentTable].items = [];
    this.currentTable = null;

    document.getElementById("billSection").classList.add("hidden");
    document.getElementById("tipCheckbox").checked = false;
    document.getElementById("tipAmount").value = "";
    document.getElementById("tipInputGroup").classList.add("hidden");
    document.getElementById("paymentMode").value = "";
    document.getElementById("paymentQrPreview").innerHTML = "";

    this.saveData();
    this.renderTables();
    this.renderDashboard();
    this.showAlert("Bill saved and table closed", "success");
  }

  showPaymentQr(method) {
    const qr = this.data.paymentQRCodes[method];
    if (!qr) return;

    document.getElementById("paymentMethodName").textContent = "Pay via " + method;
    document.getElementById("paymentQrContent").innerHTML = `<img src="${qr}" class="qr-image" alt="Payment QR">`;
    document.getElementById("paymentQrModal").classList.add("active");
  }

  renderAdmin() {
    this.updateRestaurantDisplay();

    document.getElementById("itemCategory").innerHTML =
      this.data.categories.map(c => `<option value="${c}">${c}</option>`).join("");

    document.getElementById("qrPaymentMethod").innerHTML =
      `<option value="">Select payment method</option>` +
      this.data.restaurant.paymentMethods.map(m => `<option value="${m}">${m}</option>`).join("");

    this.renderCategories();
    this.renderPaymentMethods();
    this.renderMenuItems();
    this.renderQRCodes();
  }

  renderCategories() {
    document.getElementById("categoriesList").innerHTML = this.data.categories.map((cat, idx) => `
      <div class="inline" style="margin-bottom:10px;">
        <input type="text" id="cat_${idx}" value="${cat}">
        <button class="btn btn-primary" onclick="app.updateCategory(${idx})">Update</button>
        <button class="btn btn-danger" onclick="app.deleteCategory(${idx})">Delete</button>
      </div>
    `).join("");
  }

  addCategory() {
    const input = document.getElementById("newCategory");
    const name = input.value.trim();
    if (!name) return this.showAlert("Category name required", "error");
    if (this.data.categories.includes(name)) return this.showAlert("Category already exists", "warning");

    this.data.categories.push(name);
    input.value = "";
    this.saveData();
    this.renderAdmin();
    this.renderTables();
    this.showAlert("Category added", "success");
  }

  updateCategory(idx) {
    const newName = document.getElementById("cat_" + idx).value.trim();
    if (!newName) return this.showAlert("Category cannot be empty", "error");

    const oldName = this.data.categories[idx];
    this.data.categories[idx] = newName;

    this.data.menuItems.forEach(item => {
      if (item.category === oldName) item.category = newName;
    });

    this.saveData();
    this.renderAdmin();
    this.renderTables();
    this.showAlert("Category updated", "success");
  }

  deleteCategory(idx) {
    if (!confirm("Delete category? Items in that category will remain but category may be reassigned manually later.")) return;
    this.data.categories.splice(idx, 1);
    this.saveData();
    this.renderAdmin();
    this.renderTables();
    this.showAlert("Category deleted", "success");
  }

  renderPaymentMethods() {
    document.getElementById("paymentMethodsList").innerHTML =
      this.data.restaurant.paymentMethods.map((method, idx) => `
        <div class="inline" style="margin-bottom:10px;">
          <div style="flex:1; padding:10px; background:#f7f7f7; border-radius:8px;">${method}</div>
          <button class="btn btn-danger" onclick="app.deletePaymentMethod(${idx})">Remove</button>
        </div>
      `).join("");
  }

  addPaymentMethod() {
    const input = document.getElementById("newPaymentMethod");
    const name = input.value.trim();
    if (!name) return this.showAlert("Payment method required", "error");
    if (this.data.restaurant.paymentMethods.includes(name)) return this.showAlert("Already exists", "warning");

    this.data.restaurant.paymentMethods.push(name);
    input.value = "";
    this.saveData();
    this.renderAdmin();
    this.showAlert("Payment method added", "success");
  }

  deletePaymentMethod(idx) {
    if (!confirm("Remove payment method?")) return;
    const removed = this.data.restaurant.paymentMethods[idx];
    this.data.restaurant.paymentMethods.splice(idx, 1);
    delete this.data.paymentQRCodes[removed];
    this.saveData();
    this.renderAdmin();
    this.showAlert("Payment method removed", "success");
  }

  renderMenuItems() {
    const box = document.getElementById("menuItemsList");
    if (!this.data.menuItems.length) {
      box.innerHTML = `<p class="muted">No menu items</p>`;
      return;
    }

    box.innerHTML = this.data.menuItems.map((item, idx) => `
      <div class="card" style="padding:14px;">
        <div class="form-row">
          <div>
            <label>Name</label>
            <input id="itemName_${idx}" type="text" value="${item.name}">
          </div>
          <div>
            <label>Category</label>
            <select id="itemCat_${idx}">
              ${this.data.categories.map(c => `<option value="${c}" ${c === item.category ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div>
            <label>Price</label>
            <input id="itemPrice_${idx}" type="number" value="${item.price}">
          </div>
        </div>
        <div class="inline">
          <button class="btn btn-primary" onclick="app.updateMenuItem(${idx})">Update</button>
          <button class="btn btn-danger" onclick="app.deleteMenuItem(${idx})">Delete</button>
        </div>
      </div>
    `).join("");
  }

  addMenuItem() {
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value;
    const price = parseFloat(document.getElementById("itemPrice").value);

    if (!name || !category || isNaN(price) || price < 0) {
      return this.showAlert("Fill all menu item fields correctly", "error");
    }

    this.data.menuItems.push({
      id: this.generateId(),
      name,
      category,
      price
    });

    document.getElementById("itemName").value = "";
    document.getElementById("itemPrice").value = "";

    this.saveData();
    this.renderAdmin();
    this.renderTables();
    this.showAlert("Menu item added", "success");
  }

  updateMenuItem(idx) {
    const name = document.getElementById("itemName_" + idx).value.trim();
    const category = document.getElementById("itemCat_" + idx).value;
    const price = parseFloat(document.getElementById("itemPrice_" + idx).value);

    if (!name || isNaN(price) || price < 0) return this.showAlert("Invalid menu item data", "error");

    this.data.menuItems[idx].name = name;
    this.data.menuItems[idx].category = category;
    this.data.menuItems[idx].price = price;

    this.saveData();
    this.renderAdmin();
    this.renderTables();
    this.showAlert("Menu item updated", "success");
  }

  deleteMenuItem(idx) {
    if (!confirm("Delete this menu item?")) return;
    this.data.menuItems.splice(idx, 1);
    this.saveData();
    this.renderAdmin();
    this.renderTables();
    this.showAlert("Menu item deleted", "success");
  }

  updateTableCount() {
    const count = parseInt(document.getElementById("tableCount").value, 10);
    if (isNaN(count) || count < 1 || count > 50) {
      return this.showAlert("Enter valid table count between 1 and 50", "error");
    }

    this.data.restaurant.tableCount = count;
    this.initializeTables();
    this.saveData();
    this.renderTables();
    this.updateRestaurantDisplay();
    this.showAlert("Table count updated", "success");
  }

  handleLogoUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.data.restaurant.logo = e.target.result;
      document.getElementById("logoPreview").src = e.target.result;
      document.getElementById("logoPreview").classList.remove("hidden");
      document.getElementById("headerLogo").src = e.target.result;
      document.getElementById("headerLogo").classList.remove("hidden");
      this.saveData();
      this.showAlert("Logo uploaded", "success");
    };
    reader.readAsDataURL(file);
  }

  handleQrUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentQrData = e.target.result;
      document.getElementById("qrPreview").src = e.target.result;
      document.getElementById("qrPreview").classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }

  uploadQrCode() {
    const method = document.getElementById("qrPaymentMethod").value;
    if (!method) return this.showAlert("Select payment method", "error");
    if (!this.currentQrData) return this.showAlert("Upload QR image first", "error");

    this.data.paymentQRCodes[method] = this.currentQrData;
    this.currentQrData = null;
    document.getElementById("qrPreview").classList.add("hidden");
    document.getElementById("qrUpload").value = "";
    document.getElementById("qrPaymentMethod").value = "";

    this.saveData();
    this.renderAdmin();
    this.showAlert("QR code saved", "success");
  }

  renderQRCodes() {
    const list = document.getElementById("qrCodesList");
    const entries = Object.entries(this.data.paymentQRCodes);

    if (!entries.length) {
      list.innerHTML = `<p class="muted">No QR codes uploaded</p>`;
      return;
    }

    list.innerHTML = entries.map(([method, src]) => `
      <div class="card" style="padding:14px;">
        <div class="inline" style="justify-content:space-between;">
          <strong>${method}</strong>
          <button class="btn btn-danger" onclick="app.deleteQRCode('${method.replace(/'/g, "\\'")}')">Delete</button>
        </div>
        <img src="${src}" class="preview-image" alt="${method} QR">
      </div>
    `).join("");
  }

  deleteQRCode(method) {
    if (!confirm("Delete QR code for " + method + "?")) return;
    delete this.data.paymentQRCodes[method];
    this.saveData();
    this.renderAdmin();
    this.showAlert("QR code deleted", "success");
  }

  saveDeliveryOrder() {
    const platform = document.getElementById("deliveryPlatform").value;
    const orderId = document.getElementById("deliveryOrderId").value.trim();
    const customerName = document.getElementById("deliveryCustomerName").value.trim();
    const items = document.getElementById("deliveryItems").value.trim();
    const amount = parseFloat(document.getElementById("deliveryAmount").value);
    const status = document.getElementById("deliveryStatus").value;

    if (!orderId || !customerName || !items || isNaN(amount) || amount < 0) {
      return this.showAlert("Fill all delivery order fields correctly", "error");
    }

    this.data.deliveryOrders.unshift({
      id: this.generateId(),
      date: this.getTodayString(),
      platform,
      orderId,
      customerName,
      items,
      amount,
      status
    });

    document.getElementById("deliveryOrderId").value = "";
    document.getElementById("deliveryCustomerName").value = "";
    document.getElementById("deliveryItems").value = "";
    document.getElementById("deliveryAmount").value = "";
    document.getElementById("deliveryStatus").value = "Pending";
    document.getElementById("deliveryPlatform").value = "Swiggy";
    document.getElementById("deliveryModal").classList.remove("active");

    this.saveData();
    this.renderDelivery();
    this.renderDashboard();
    this.showAlert("Delivery order saved", "success");
  }

  renderDelivery() {
    const box = document.getElementById("deliveryOrdersList");
    if (!this.data.deliveryOrders.length) {
      box.innerHTML = `<p class="muted">No delivery orders yet</p>`;
      return;
    }

    box.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Platform</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${this.data.deliveryOrders.map((order, idx) => `
            <tr>
              <td>${order.date}</td>
              <td>${order.platform}</td>
              <td>${order.orderId}</td>
              <td>${order.customerName}</td>
              <td>${order.items}</td>
              <td>${this.formatCurrency(order.amount)}</td>
              <td>
                <select onchange="app.updateDeliveryStatus(${idx}, this.value)">
                  <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                  <option value="Preparing" ${order.status === "Preparing" ? "selected" : ""}>Preparing</option>
                  <option value="Ready" ${order.status === "Ready" ? "selected" : ""}>Ready</option>
                  <option value="Completed" ${order.status === "Completed" ? "selected" : ""}>Completed</option>
                </select>
              </td>
              <td><button class="btn btn-danger" onclick="app.deleteDeliveryOrder(${idx})">Delete</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  updateDeliveryStatus(idx, status) {
    this.data.deliveryOrders[idx].status = status;
    this.saveData();
    this.renderDelivery();
    this.showAlert("Delivery status updated", "success");
  }

  deleteDeliveryOrder(idx) {
    if (!confirm("Delete this delivery order?")) return;
    this.data.deliveryOrders.splice(idx, 1);
    this.saveData();
    this.renderDelivery();
    this.renderDashboard();
    this.showAlert("Delivery order deleted", "success");
  }

  filterByDateRange(data, startDate, endDate) {
    return data.filter(item => item.date >= startDate && item.date <= endDate);
  }

  exportTransactionsExcel() {
    const start = document.getElementById("exportStartDate").value;
    const end = document.getElementById("exportEndDate").value;

    const rows = this.filterByDateRange(this.data.transactions, start, end).flatMap(txn =>
      txn.items.map(item => ({
        Date: txn.date,
        Time: txn.timestamp,
        Table: txn.tableNumber,
        PaymentMode: txn.paymentMode,
        Item: item.name,
        Qty: item.qty,
        Price: item.price,
        Subtotal: txn.subtotal,
        SGST: txn.sgst,
        CGST: txn.cgst,
        Total: txn.total,
        Tip: txn.tip || 0
      }))
    );

    if (!rows.length) return this.showAlert("No transaction data for selected date range", "warning");
    this.downloadExcel(rows, "transactions.xlsx", "Transactions");
  }

  exportTransactionsCsv() {
    const start = document.getElementById("exportStartDate").value;
    const end = document.getElementById("exportEndDate").value;

    const rows = this.filterByDateRange(this.data.transactions, start, end).flatMap(txn =>
      txn.items.map(item => ({
        Date: txn.date,
        Time: txn.timestamp,
        Table: txn.tableNumber,
        PaymentMode: txn.paymentMode,
        Item: item.name,
        Qty: item.qty,
        Price: item.price,
        Subtotal: txn.subtotal,
        SGST: txn.sgst,
        CGST: txn.cgst,
        Total: txn.total,
        Tip: txn.tip || 0
      }))
    );

    if (!rows.length) return this.showAlert("No transaction data for selected date range", "warning");
    this.downloadCSV(rows, "transactions.csv");
  }

  exportDeliveryExcel() {
    const start = document.getElementById("exportDeliveryStartDate").value;
    const end = document.getElementById("exportDeliveryEndDate").value;
    const rows = this.filterByDateRange(this.data.deliveryOrders, start, end);

    if (!rows.length) return this.showAlert("No delivery data for selected date range", "warning");
    this.downloadExcel(rows, "delivery-orders.xlsx", "Delivery");
  }

  exportDeliveryCsv() {
    const start = document.getElementById("exportDeliveryStartDate").value;
    const end = document.getElementById("exportDeliveryEndDate").value;
    const rows = this.filterByDateRange(this.data.deliveryOrders, start, end);

    if (!rows.length) return this.showAlert("No delivery data for selected date range", "warning");
    this.downloadCSV(rows, "delivery-orders.csv");
  }

  exportMenuExcel() {
    if (!this.data.menuItems.length) return this.showAlert("No menu items to export", "warning");
    this.downloadExcel(this.data.menuItems, "menu-items.xlsx", "Menu");
  }

  downloadExcel(rows, fileName, sheetName) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
    this.showAlert(fileName + " downloaded", "success");
  }

  downloadCSV(rows, fileName) {
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    this.showAlert(fileName + " downloaded", "success");
  }

  backupData() {
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "restaurant-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    this.showAlert("Backup downloaded", "success");
  }

  restoreData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this.data = JSON.parse(e.target.result);
        this.initializeTables();
        this.saveData();
        this.updateRestaurantDisplay();
        this.renderDashboard();
        this.renderTables();
        this.renderAdmin();
        this.renderDelivery();
        this.showAlert("Data restored successfully", "success");
      } catch (err) {
        this.showAlert("Invalid backup file", "error");
      }
    };
    reader.readAsText(file);
  }

  clearAllData() {
    localStorage.removeItem(this.storageKey);
    location.reload();
  }
}

const app = new RestaurantApp();
window.app = app;
