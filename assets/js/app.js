// MiniTienda - Frontend demo con Bootstrap + jQuery + localStorage
// Es un objeto constante que guarda en un solo lugar las claves que vamos a usar en localStorage.
// Así evitamos “strings mágicos” repetidos en el código, que si los escribes mal no fallan con error, simplemente no funcionan y cuesta depurar.
// Qué significa cada clave:
// mt.products → donde se guardan los productos (JSON con lista).
// mt.cart → donde se guarda el carrito (JSON con productos + cantidades).
// mt.session → el usuario que está logueado (objeto con email, nombre y rol).
// mt.users → lista de usuarios registrados (JSON con cuentas).
(function (window, $) {
  const LS_KEYS = {
    PRODUCTS: "mt.products",
    CART: "mt.cart",
    SESSION: "mt.session",
    USERS: "mt.users"
  };

// const App = { ... }
// App es un objeto literal que agrupa toda la lógica de la tienda.
// Dentro tiene funciones como init(), seed(), pageIndex(), pageCatalogo(), etc.
// Se usa así para organizar el código: en vez de tener funciones sueltas, están todas dentro de un “namespace” llamado App.
// init() { ... }
// Es la primera función que se ejecuta cuando se carga la página ($(document).ready(() => App.init()); al final del archivo).
// Paso a paso:
// Llama a seed(), que se encarga de sembrar datos de demo en localStorage (productos y usuarios) solo si no existen.
// Actualiza el <span id="year"> del footer con el año actual.
// Es un detalle de usabilidad.
// Refresca el contador del carrito (el badge rojo en el navbar) leyendo lo que haya en localStorage.
// Ajusta el menú de usuario en el navbar:
// Si hay sesión → muestra nombre/rol y botón “Cerrar sesión”.
// Si no → muestra “Cuenta” y “Iniciar sesión”.
  const App = {
    init() {
      this.seed();
      this.updateYear();
      this.updateCartBadge();
      this.updateUserMenu();

      // Cada <body> en tus HTML tiene un id distinto (page-index, page-catalogo, etc.).
      // Aquí se detecta en qué página estás y se llama a la función específica:
      // pageIndex() → carga productos destacados en index.html.
      // pageCatalogo() → pinta todo el catálogo con filtros.
      // pageCarrito() → genera la tabla de carrito.
      // pageAdminProducts() → activa el CRUD de productos (solo para admin)
      const pageId = document.body.id;
      if (pageId === "page-index") this.pageIndex();
      if (pageId === "page-catalogo") this.pageCatalogo();
      if (pageId === "page-carrito") this.pageCarrito();
      if (pageId === "page-productos") this.pageAdminProducts();
    },

    // ----- Data helpers -----
    // Lee la clave mt.products desde localStorage.
    // localStorage.getItem(...) devuelve un string JSON → se convierte a objeto con JSON.parse.
    // Si no existe nada, devuelve un arreglo vacío [].
    // Si ocurre algún error al parsear, también devuelve [].
    // Devuelve la lista de productos (o lista vacía).
    getProducts() {
      try { return JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS)) || []; }
      catch { return []; }
    },

    // Convierte el array list en string (JSON.stringify).
    // Lo guarda bajo la clave mt.products.
    // Persistencia de productos
    saveProducts(list) {
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(list));
    },

    // Idéntico a getProducts, pero con la clave mt.cart.
    // Devuelve los productos en el carrito.
    getCart() {
      try { return JSON.parse(localStorage.getItem(LS_KEYS.CART)) || []; }
      catch { return []; }
    },

    // Guarda el carrito en localStorage.
    // Llama a updateCartBadge() para refrescar el contador del carrito en el navbar.
    // Así el usuario ve inmediatamente cuántos productos lleva.
    saveCart(cart) {
      localStorage.setItem(LS_KEYS.CART, JSON.stringify(cart));
      this.updateCartBadge();
    },

    // Lee mt.session.
    // Devuelve el objeto del usuario logueado (ej: {email, name, role}) o null si no hay sesión.
    getSession() {
      try { return JSON.parse(localStorage.getItem(LS_KEYS.SESSION)); }
      catch { return null; }
    },
    // Guarda la sesión actual (ej: cuando alguien hace login).
    // Llama a updateUserMenu() para actualizar el navbar (mostrar nombre y botón de logout).
    setSession(obj) { localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(obj)); this.updateUserMenu(); },

    // Elimina la sesión del usuario.
    // Refresca el navbar para volver a “Cuenta / Iniciar sesión”.
    clearSession() { localStorage.removeItem(LS_KEYS.SESSION); this.updateUserMenu(); },

// ----- Seed initial data -----
// Inicializa datos de DEMO (solo si aún no existen en localStorage).
seed() {
  // Crea usuarios demo si no existe la clave mt.users
  if (!localStorage.getItem(LS_KEYS.USERS)) {
    const users = [
      { email: "admin@correo.cl", pass: "123456", name: "Admin", role: "admin" },
      { email: "user@correo.cl", pass: "123456", name: "Usuario", role: "user" },
    ];
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
  }

  // Crea productos demo si no existe la clave mt.products
  if (!localStorage.getItem(LS_KEYS.PRODUCTS)) {
    const products = [
      { id: 1, name: "Café de grano", format: "500g", desc: "Tostado medio, origen Colombia.", price: 7990, stock: 12, img: "https://picsum.photos/seed/cafe/600/400" },
      { id: 2, name: "Té verde", format: "200g", desc: "Hojas premium, sabor herbal.", price: 4990, stock: 20, img: "https://picsum.photos/seed/te/600/400" },
      { id: 3, name: "Chocolate amargo", format: "80% cacao", desc: "Barra 100g, intenso.", price: 2990, stock: 8, img: "https://picsum.photos/seed/choco/600/400" },
      { id: 4, name: "Avena integral", format: "1kg", desc: "Ideal para desayuno.", price: 3590, stock: 30, img: "https://picsum.photos/seed/avena/600/400" },
      { id: 5, name: "Mermelada frutilla", format: "400g", desc: "Sin azúcar añadida.", price: 4290, stock: 15, img: "https://picsum.photos/seed/merme/600/400" },
      { id: 6, name: "Aceite de oliva", format: "500ml", desc: "Extra virgen.", price: 9490, stock: 10, img: "https://picsum.photos/seed/oliva/600/400" },
    ];
    this.saveProducts(products); // persiste con el helper
  }
},

// ----- UI helpers -----
// Da formato CLP (miles y símbolo de peso chileno) a un número.
formatCLP(v) {
  return v.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
},

// Pone el año actual en el footer (id="year").
updateYear() { 
  const y = new Date().getFullYear(); 
  $("#year").text(y); 
},

// Actualiza el badge del carrito en el navbar (cantidad total de ítems).
updateCartBadge() {
  const count = this.getCart().reduce((a, it) => a + it.qty, 0);
  $("#cartCount").text(count);
},

// Muestra en el navbar el estado de sesión (nombre + rol) o el menú por defecto.
updateUserMenu() {
  const s = this.getSession();
  if (s) {
    $("#userMenu").text(s.name + " (" + s.role + ")");
    $("#logoutBtn").removeClass("d-none");
  } else {
    $("#userMenu").text("Cuenta");
    $("#logoutBtn").addClass("d-none");
  }
},

// Cierra sesión y redirige al inicio.
logout() {
  this.clearSession();
  window.location.href = "index.html";
},

// Captura el submit del buscador del navbar y redirige a catálogo con ?q=...
searchRedirect(e) {
  e.preventDefault();
  const q = $("#navbarSearch").val().trim();
  const url = new URL("catalogo.html", window.location.href);
  if (q) url.searchParams.set("q", q);
  window.location.href = url.toString();
},

// ----- Index -----
// Renderiza productos destacados en la home (primeros 4).
pageIndex() {
  const prods = this.getProducts().slice(0, 4);
  const $grid = $("#destacados");
  prods.forEach(p => $grid.append(this.productCard(p)));
},

// ----- Catálogo -----
// Vista de catálogo: aplica búsqueda y orden y genera tarjetas.
pageCatalogo() {
  // Lee query ?q de la URL y la pone en el input
  const urlQ = new URLSearchParams(window.location.search).get("q") || "";
  $("#catalogSearch").val(urlQ);

  // Función que filtra/ordena y vuelve a pintar
  const render = () => {
    const sort = $("#catalogSort").val();
    const q = $("#catalogSearch").val().toLowerCase().trim();

    // Filtra por nombre o descripción
    let items = this.getProducts().filter(p =>
      p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );

    // Ordenamientos disponibles
    if (sort === "precio_asc") items.sort((a,b)=>a.price-b.price);
    if (sort === "precio_desc") items.sort((a,b)=>b.price-a.price);
    if (sort === "stock") items.sort((a,b)=>b.stock-a.stock);

    // Pinta grid
    const $grid = $("#catalogGrid").empty();
    if (!items.length) {
      $grid.append(`<div class="col-12 text-center text-muted py-5">Sin resultados</div>`);
      return;
    }
    items.forEach(p => $grid.append(this.productCard(p)));
  };

  // Re-render cuando cambie buscador u orden
  $("#catalogSort, #catalogSearch").on("input change", render);
  render(); // primer render
},

// Construye una card Bootstrap para un producto (con botón Agregar).
productCard(p) {
  const disabled = p.stock <= 0 ? "disabled" : "";
  const stockBadge = `<span class="badge rounded-pill ${p.stock>0 ? 'text-bg-success' : 'text-bg-secondary'} stock-badge">${p.stock>0? 'Stock: '+p.stock : 'Sin stock'}</span>`;
  return $(`
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm card-product">
        <img src="${(p.img && p.img.trim()) ? p.img : 'assets/img/no-image.jpg'}" class="card-img-top" alt="${p.name}" onerror="this.onerror=null;this.src='assets/img/no-image.jpg';">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title mb-1">${p.name} <small class="text-muted">${p.format||''}</small></h5>
          <p class="card-text small flex-grow-1">${p.desc||''}</p>
          <div class="d-flex align-items-center justify-content-between">
            <div class="price">${this.formatCLP(p.price)}</div>
            ${stockBadge}
          </div>
          <button class="btn btn-primary w-100 mt-2" ${disabled} onclick="App.addToCart(${p.id})">Agregar</button>
        </div>
      </div>
    </div>
  `);
},

// ----- Carrito -----
// Vista del carrito: tabla con líneas, cálculo de totales y botón pagar.
pageCarrito() {
  const cart = this.getCart();
  const $container = $("#carritoContainer").empty();

  // Si está vacío, muestra mensaje y deshabilita pagar
  if (!cart.length) {
    $container.append(`<div class="col-12 text-center text-muted py-5">Tu carrito está vacío.</div>`);
    $("#btnPagar").prop("disabled", true);
    $("#cartTotal").text(this.formatCLP(0));
    return;
  }

  // Crea la tabla
  const prods = this.getProducts();
  let total = 0;
  const table = $(`
    <div class="col-12">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Producto</th><th style="width:140px">Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
          <tbody id="cartTableBody"></tbody>
        </table>
      </div>
    </div>
  `);
  $container.append(table);
  const $tbody = $("#cartTableBody");

  // Render de cada línea
  cart.forEach(item => {
    const p = prods.find(x => x.id === item.pid);
    if (!p) return;
    const subtotal = p.price * item.qty;
    total += subtotal;
    $tbody.append($(`
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${(p.img && p.img.trim()) ? p.img : 'assets/img/no-image.jpg'}" onerror="this.onerror=null;this.src='assets/img/no-image.jpg';" style="width:64px;height:48px;object-fit:cover" class="rounded">
            <div>
              <div class="fw-semibold">${p.name}</div>
              <div class="small text-muted">${p.format||''}</div>
            </div>
          </div>
        </td>
        <td>
          <input type="number" min="1" max="${p.stock}" value="${item.qty}" class="form-control form-control-sm" 
                 onchange="App.updateQty(${p.id}, this.value)">
          <div class="small text-muted">Stock: ${p.stock}</div>
        </td>
        <td>${App.formatCLP(p.price)}</td>
        <td>${App.formatCLP(subtotal)}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="App.removeFromCart(${p.id})">Eliminar</button></td>
      </tr>
    `));
  });

  // Total y habilita pagar
  $("#cartTotal").text(this.formatCLP(total));
  $("#btnPagar").prop("disabled", false).off("click").on("click", () => this.checkout());
},

// Agrega un producto al carrito (valida stock y suma 1 unidad).
addToCart(pid) {
  const prods = this.getProducts();
  const p = prods.find(x => x.id === pid);
  if (!p) return;

  const cart = this.getCart();
  const existing = cart.find(i => i.pid === pid);

  // Si ya existe en carrito, incrementa; si no, lo agrega
  if (existing) {
    if (existing.qty + 1 > p.stock) { alert("No hay suficiente stock."); return; }
    existing.qty += 1;
  } else {
    if (p.stock < 1) { alert("Sin stock."); return; }
    cart.push({ pid, qty: 1 });
  }

  // Persiste y actualiza badge
  this.saveCart(cart);
  this.updateCartBadge();
},

/* Cambia la cantidad de una línea del carrito con validación de stock.
   Si excede el stock, ajusta a máximo disponible. Luego re-renderiza la vista. */
updateQty(pid, value) {
  const qty = Math.max(1, parseInt(value||1,10));
  const prods = this.getProducts();
  const p = prods.find(x => x.id === pid);
  const cart = this.getCart();
  const it = cart.find(i=>i.pid===pid);
  if (!it || !p) return;

  if (qty > p.stock) { 
    alert("No hay suficiente stock."); 
    it.qty = p.stock; 
  } else { 
    it.qty = qty; 
  }

  this.saveCart(cart);
  this.pageCarrito(); // refresca la tabla completa
},

// Elimina una línea del carrito y vuelve a pintar la vista.
removeFromCart(pid) {
  const cart = this.getCart().filter(i=>i.pid!==pid);
  this.saveCart(cart);
  this.pageCarrito();
},

// "Checkout" de demo: descuenta stock de productos, limpia carrito y redirige a gracias.
checkout() {
  const cart = this.getCart();
  const prods = this.getProducts();

  // Descuenta del stock la cantidad comprada
  cart.forEach(it => {
    const p = prods.find(x=>x.id===it.pid);
    if (p) p.stock = Math.max(0, p.stock - it.qty);
  });

  // Persiste cambios y vacía carrito
  this.saveProducts(prods);
  this.saveCart([]);

  // Redirección a página de agradecimiento
  window.location.href = "pedido.html";
},

// ----- Admin -----
// Página de administración: restringe por rol y arma el listado con búsqueda.
pageAdminProducts() {
  const s = this.getSession();

  // Si no hay sesión o no es admin, bloquea
  if (!s || s.role !== "admin") {
    alert("Acceso restringido a administradores.");
    window.location.href = "index.html";
    return;
  }

  // Carga listado y habilita filtro en vivo
  AdminProducts.refreshTable();
  $("#adminSearch").on("input", AdminProducts.refreshTable);
}
};

// ------- Módulo AdminProducts (CRUD de productos) -------
const AdminProducts = {
  // Limpia el formulario y prepara modo "Agregar"
  reset() {
    $("#prodId").val("");
    $("#formTitle").text("Agregar producto");
    $("#productForm")[0].reset();
  },

  // Crea o actualiza un producto a partir del formulario.
  submit(e) {
    e.preventDefault();

    // Lee valores del form
    const id = parseInt($("#prodId").val()||"", 10);
    const name = $("#prodName").val().trim();
    const format = $("#prodFormat").val().trim();
    const desc = $("#prodDesc").val().trim();
    const price = parseInt($("#prodPrice").val(), 10);
    const stock = parseInt($("#prodStock").val(), 10);

    // Imagen: URL o archivo local (assets/img/xxx)
    let img = "";
    const imgSource = $("input[name='imgSource']:checked").val();
    const urlVal = $("#prodImgUrl").val().trim();
    const localVal = $("#prodImgLocal").val().trim();
    if (imgSource === "local" && localVal) {
      img = "assets/img/" + localVal;
    } else if (urlVal) {
      img = urlVal;
    } else {
      // Placeholder si no se definió nada
      img = "https://picsum.photos/seed/" + encodeURIComponent(name) + "/600/400";
    }

    // Validación mínima
    if (!name || isNaN(price) || isNaN(stock)) {
      alert("Complete nombre, precio y stock.");
      return;
    }

    // Inserta o actualiza en la lista y persiste
    const list = App.getProducts();
    if (id) {
      const p = list.find(x=>x.id===id);
      if (p) Object.assign(p, { name, format, desc, price, stock, img });
    } else {
      const newId = list.length ? Math.max(...list.map(x=>x.id))+1 : 1;
      list.push({ id:newId, name, format, desc, price, stock, img });
    }
    App.saveProducts(list);

    // Limpia y refresca tabla
    this.reset();
    this.refreshTable();
  },

  // Vuelve a pintar la tabla del admin aplicando filtro por texto.
  refreshTable() {
    const q = $("#adminSearch").val()?.toLowerCase() || "";
    const list = App.getProducts().filter(p => (p.name+" "+(p.desc||"")).toLowerCase().includes(q));
    const $tbody = $("#adminTableBody").empty();

    list.forEach(p => {
      $tbody.append($(`
        <tr>
          <td>${p.name}</td>
          <td>${p.format||""}</td>
          <td>${App.formatCLP(p.price)}</td>
          <td>${p.stock}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" onclick="AdminProducts.edit(${p.id})">Editar</button>
              <button class="btn btn-outline-danger" onclick="AdminProducts.remove(${p.id})">Eliminar</button>
            </div>
          </td>
        </tr>
      `));
    });
  },

  // Carga un producto en el formulario para edición.
  edit(id) {
    const p = App.getProducts().find(x=>x.id===id); 
    if (!p) return;

    $("#prodId").val(p.id);
    $("#prodName").val(p.name);
    $("#prodFormat").val(p.format||"");
    $("#prodDesc").val(p.desc||"");
    $("#prodPrice").val(p.price);
    $("#prodStock").val(p.stock);

    /* NOTA: Si estás usando el nuevo selector de imagen (URL / assets/img),
       rellena los campos correctos así (en vez de $("#prodImg")):

       if ((p.img||"").startsWith("assets/img/")) {
         $("#imgSrcLocal").prop("checked", true);
         $("#prodImgLocal").val(p.img.replace("assets/img/", ""));
         $("#prodImgUrl").val("");
       } else {
         $("#imgSrcUrl").prop("checked", true);
         $("#prodImgUrl").val(p.img||"");
         $("#prodImgLocal").val("");
       }
    */
    $("#formTitle").text("Editar producto");
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  // Elimina un producto por id (previa confirmación) y refresca la tabla.
  remove(id) {
    if (!confirm("¿Eliminar producto?")) return;
    const list = App.getProducts().filter(x=>x.id!==id);
    App.saveProducts(list);
    this.refreshTable();
  }
};

// ------- Autenticación (demo) -------
const Auth = {
  // Login: valida correo/clave contra mt.users, guarda sesión y redirige a home.
  login(e) {
    e.preventDefault();
    const email = $("#loginEmail").val().trim().toLowerCase();
    const pass = $("#loginPass").val().trim();
    const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS)) || [];

    const u = users.find(x => x.email.toLowerCase() === email && x.pass === pass);
    if (!u) { alert("Credenciales inválidas."); return; }

    App.setSession({ email: u.email, name: u.name, role: u.role });
    window.location.href = "index.html";
  },

  // Registro: crea un usuario rol "user" (si el correo no existe) y redirige a login.
  signup(e) {
    e.preventDefault();
    const user = {
      name: $("#suNombre").val().trim(),
      last: $("#suApellido").val().trim(),
      email: $("#suEmail").val().trim(),
      pass: $("#suPass").val().trim(),
      address: $("#suDireccion").val().trim(),
      role: "user"
    };

    // Validación básica
    if (!user.name || !user.email || user.pass.length < 6) {
      alert("Complete los campos y una contraseña (>=6).");
      return;
    }

    // Evita correos duplicados
    const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS)) || [];
    if (users.some(x=>x.email.toLowerCase()===user.email.toLowerCase())) {
      alert("Ese correo ya existe.");
      return;
    }

    // Guarda y listo
    users.push({ email: user.email, pass: user.pass, name: user.name, role: user.role });
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
    alert("Cuenta creada. Ahora puedes iniciar sesión.");
    window.location.href = "login.html";
  }
};

// Exponer módulos al ámbito global para handlers inline (onclick=...).
window.App = App;
window.AdminProducts = AdminProducts;
window.Auth = Auth;

// Inicializa todo cuando el DOM esté listo.
$(document).ready(() => App.init());
})(window, jQuery);