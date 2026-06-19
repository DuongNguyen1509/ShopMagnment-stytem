const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mock API Server",
      version: "1.0.0",
      description: "Mock API với json-server, login, register, orders",
    },
    tags: [
      { name: "Auth", description: "Đăng nhập & Đăng ký" },
      { name: "Users", description: "Quản lý người dùng" },
      { name: "Categories", description: "Danh mục sản phẩm" },
      { name: "Products", description: "Sản phẩm" },
      { name: "Orders", description: "Đơn hàng" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Base64",
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name:     { type: "string", example: "Nguyễn Văn A" },
            email:    { type: "string", format: "email", example: "user@example.com" },
            password: { type: "string", minLength: 6, example: "secret123" },
            phone:    { type: "string", example: "0901234567" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Đăng nhập thành công!" },
            token:   { type: "string", example: "eyJpZCI6MSwicm9sZSI6ImFkbWluIn0=" },
            user:    { $ref: "#/components/schemas/UserPublic" },
          },
        },
        // ── User ──────────────────────────────────────────────
        UserPublic: {
          type: "object",
          properties: {
            id:        { type: "integer", example: 1 },
            name:      { type: "string",  example: "Nguyễn Văn A" },
            email:     { type: "string",  example: "user@example.com" },
            phone:     { type: "string",  example: "0901234567" },
            avatar:    { type: "string",  example: "https://i.pravatar.cc/150?img=11" },
            role:      { type: "string",  enum: ["admin", "customer"], example: "customer" },
            address: {
              type: "object",
              properties: {
                street:   { type: "string" },
                district: { type: "string" },
                city:     { type: "string" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Category ──────────────────────────────────────────
        Category: {
          type: "object",
          properties: {
            id:   { type: "integer", example: 1 },
            name: { type: "string",  example: "Điện thoại" },
            slug: { type: "string",  example: "dien-thoai" },
          },
        },
        // ── Product ───────────────────────────────────────────
        Product: {
          type: "object",
          properties: {
            id:          { type: "integer", example: 1 },
            name:        { type: "string",  example: "iPhone 15" },
            categoryId:  { type: "integer", example: 1 },
            price:       { type: "number",  example: 25000000 },
            stock:       { type: "integer", example: 50 },
            description: { type: "string" },
            image:       { type: "string",  example: "https://example.com/img.jpg" },
          },
        },
        // ── Order ─────────────────────────────────────────────
        OrderItem: {
          type: "object",
          properties: {
            productId: { type: "integer", example: 2 },
            name:      { type: "string",  example: "iPhone 15" },
            quantity:  { type: "integer", example: 1 },
            price:     { type: "number",  example: 25000000 },
          },
        },
        OrderRequest: {
          type: "object",
          required: ["userId", "items", "total", "paymentMethod"],
          properties: {
            userId:        { type: "integer", example: 2 },
            items:         { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
            total:         { type: "number",  example: 25000000 },
            paymentMethod: { type: "string", enum: ["cod", "bank_transfer", "momo"], example: "cod" },
            shippingAddress: {
              type: "object",
              properties: {
                street:   { type: "string" },
                district: { type: "string" },
                city:     { type: "string" },
              },
            },
            note: { type: "string", example: "Giao giờ hành chính" },
          },
        },
        Order: {
          allOf: [
            { $ref: "#/components/schemas/OrderRequest" },
            {
              type: "object",
              properties: {
                id:            { type: "integer", example: 1 },
                status:        { type: "string", enum: ["pending", "processing", "shipped", "delivered", "cancelled"], example: "pending" },
                paymentStatus: { type: "string", enum: ["unpaid", "paid"], example: "unpaid" },
                createdAt:     { type: "string", format: "date-time" },
                updatedAt:     { type: "string", format: "date-time" },
              },
            },
          ],
        },
        OrderStatusUpdate: {
          type: "object",
          properties: {
            status:        { type: "string", enum: ["pending", "processing", "shipped", "delivered", "cancelled"] },
            paymentStatus: { type: "string", enum: ["unpaid", "paid"] },
          },
        },
        // ── Errors ────────────────────────────────────────────
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Đã xảy ra lỗi." },
          },
        },
      },
    },
  },
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ─── Helper ───────────────────────────────────────────────────────────────────
function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k))
  );
}

function generateToken(user) {
  return Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString("base64");
}

// =============================================================================
// AUTH
// =============================================================================

/**
 * @openapi
 * /login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập
 *     description: Xác thực người dùng bằng email & mật khẩu, trả về JWT-like token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Thiếu email hoặc mật khẩu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Mật khẩu không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Email không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
server.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu." });
  }

  const db = router.db;
  const user = db.get("users").find({ email: email.trim().toLowerCase() }).value();

  if (!user) {
    return res.status(404).json({ message: "Email không tồn tại." });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Mật khẩu không đúng." });
  }

  const token = generateToken(user);
  return res.status(200).json({
    message: "Đăng nhập thành công!",
    token,
    user: omit(user, ["password"]),
  });
});

// =============================================================================

/**
 * @openapi
 * /register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản mới
 *     description: Tạo tài khoản người dùng mới với vai trò `customer`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Thiếu thông tin bắt buộc hoặc mật khẩu quá ngắn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email đã được đăng ký
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
server.post("/register", (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ họ tên, email và mật khẩu." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
  }

  const db = router.db;
  const existing = db.get("users").find({ email: email.trim().toLowerCase() }).value();

  if (existing) {
    return res.status(409).json({ message: "Email này đã được đăng ký." });
  }

  const users = db.get("users").value();
  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  const newUser = {
    id: newId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone || "",
    avatar: `https://i.pravatar.cc/150?img=${newId + 10}`,
    role: "customer",
    address: { street: "", district: "", city: "" },
    createdAt: new Date().toISOString(),
  };

  db.get("users").push(newUser).write();

  const token = generateToken(newUser);
  return res.status(201).json({
    message: "Đăng ký thành công!",
    token,
    user: omit(newUser, ["password"]),
  });
});

// =============================================================================
// USERS
// =============================================================================

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lấy danh sách tất cả users
 *     description: Trả về toàn bộ danh sách người dùng (bao gồm cả password — chỉ dùng nội bộ/dev).
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, customer]
 *         description: Lọc theo vai trò
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *         description: Số trang (phân trang json-server)
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserPublic'
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Lấy thông tin một user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *       404:
 *         description: Không tìm thấy user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật toàn bộ thông tin user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPublic'
 *     responses:
 *       200:
 *         description: User đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *   patch:
 *     tags: [Users]
 *     summary: Cập nhật một phần thông tin user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPublic'
 *     responses:
 *       200:
 *         description: User đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *   delete:
 *     tags: [Users]
 *     summary: Xóa user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

// =============================================================================
// CATEGORIES
// =============================================================================

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Lấy danh sách danh mục
 *     parameters:
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *   post:
 *     tags: [Categories]
 *     summary: Tạo danh mục mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Danh mục đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Lấy thông tin một danh mục
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin danh mục
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *   put:
 *     tags: [Categories]
 *     summary: Cập nhật toàn bộ danh mục
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Danh mục đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *   patch:
 *     tags: [Categories]
 *     summary: Cập nhật một phần danh mục
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Danh mục đã được cập nhật
 *   delete:
 *     tags: [Categories]
 *     summary: Xóa danh mục
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

// =============================================================================
// PRODUCTS
// =============================================================================

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Lấy danh sách sản phẩm
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Lọc sản phẩm theo danh mục
 *       - in: query
 *         name: name_like
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên (json-server full-text)
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _sort
 *         schema:
 *           type: string
 *           example: price
 *         description: Trường cần sắp xếp
 *       - in: query
 *         name: _order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *   post:
 *     tags: [Products]
 *     summary: Tạo sản phẩm mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Sản phẩm đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Lấy thông tin một sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy sản phẩm
 *   put:
 *     tags: [Products]
 *     summary: Cập nhật toàn bộ sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Sản phẩm đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   patch:
 *     tags: [Products]
 *     summary: Cập nhật một phần sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Sản phẩm đã được cập nhật
 *   delete:
 *     tags: [Products]
 *     summary: Xóa sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */

// =============================================================================
// ORDERS
// =============================================================================

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy danh sách đơn hàng
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Lọc đơn hàng theo user
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [unpaid, paid]
 *         description: Lọc theo trạng thái thanh toán
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _sort
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: _order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *   post:
 *     tags: [Orders]
 *     summary: Tạo đơn hàng mới
 *     description: >
 *       Tạo đơn hàng mới. `status` tự động là `pending`.
 *       `paymentStatus` là `unpaid` nếu `paymentMethod` là `cod`, ngược lại là `paid`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderRequest'
 *     responses:
 *       201:
 *         description: Đơn hàng đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy thông tin một đơn hàng
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *   patch:
 *     tags: [Orders]
 *     summary: Cập nhật trạng thái đơn hàng
 *     description: Dùng để cập nhật `status` và/hoặc `paymentStatus`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatusUpdate'
 *     responses:
 *       200:
 *         description: Đơn hàng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *   put:
 *     tags: [Orders]
 *     summary: Cập nhật toàn bộ đơn hàng
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderRequest'
 *     responses:
 *       200:
 *         description: Đơn hàng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *   delete:
 *     tags: [Orders]
 *     summary: Xóa đơn hàng
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
server.post("/orders", (req, res) => {
  const db = router.db;
  const orders = db.get("orders").value();
  const newId = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1;

  const newOrder = {
    id: newId,
    ...req.body,
    status: "pending",
    paymentStatus: req.body.paymentMethod === "cod" ? "unpaid" : "paid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.get("orders").push(newOrder).write();

  return res.status(201).json(newOrder);
});

// ─── json-server routes ───────────────────────────────────────────────────────
server.use(router);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`\n📋 Các endpoints có sẵn:`);
  console.log(`   POST   /login              → Đăng nhập`);
  console.log(`   POST   /register           → Đăng ký`);
  console.log(`   GET    /users              → Danh sách users`);
  console.log(`   GET    /categories         → Danh sách categories`);
  console.log(`   GET    /products           → Danh sách sản phẩm`);
  console.log(`   GET    /products?categoryId=1  → Lọc theo danh mục`);
  console.log(`   GET    /orders             → Danh sách đơn hàng`);
  console.log(`   GET    /orders?userId=2    → Đơn hàng theo user`);
  console.log(`   POST   /orders             → Tạo đơn hàng mới`);
  console.log(`   PATCH  /orders/:id         → Cập nhật trạng thái đơn`);
  console.log(`\n📖 Swagger UI: http://localhost:${PORT}/api-docs\n`);
});