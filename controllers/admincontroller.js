var adminhelper = require("../helpers/adminhelpers");
var cloudinary = require("../utils/cloudinary");
var cloudinary = require("cloudinary").v2;

let message = "";
let Error=null

module.exports = {
  adminlogin: async (req, res) => {
   
    const results = await adminhelper.adminlogin(req.query.sort);
    
    if (req.query.sort){
      let data = results.data
      let period = results.period
      res.json({data,period})
    }else{
      res.render("admin/admin-dash", { results: results.data,totalrevenue:results.total,totalorders:results.orders ,totalproducts:results.products});
    }
    
  },
  showAddproduct: (req, res) => {
    adminhelper.showAddproduct().then((cat) => {
      res.render("admin/add-product", { cat });
    });
  },
  postAddproduct: async (req, res) => {
    console.log(req.body);
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const { url } = await cloudinary.uploader.upload(req.files[i].path);
      images.push(url);
    }
    console.log(images);
    adminhelper.addProduct(req.body, images).then();
    res.redirect("/admin/add-product");
  },
  viewProducts: (req, res) => {
    adminhelper.getViewProducts().then((response) => {
      res.render("admin/view-product", { response });
    });
  },
  deleteProduct: (req, res) => {
    adminhelper.deleteProduct(req.params.id).then();
    res.redirect("/admin/view-product");
  },
  showAddcategory: (req, res) => {
    adminhelper.showAddcategory().then((cat) => {
      res.render("admin/addcategory", { cat,Error});
    });
  },
  postAddcategory: (req, res) => {
    adminhelper.postAddcategory(req.body).then((existing) => {
      if (existing) {
        let Error ="already existing"
        adminhelper.showAddcategory().then((cat) => {
          res.render("admin/addcategory", { cat ,Error});
        });
      } else {
        res.redirect("/admin/add-category");
      }
    });
  },
  showUsers: (req, res) => {
    adminhelper.showUsers().then((users) => {
      res.render("admin/view-user", { users });
    });
  },
  blockUser: (req, res) => {
    adminhelper.blockUser(req.params.id).then();
    res.redirect("/admin/view-users");
  },
  unblockUser: (req, res) => {
    adminhelper.unblockUser(req.params.id).then();
    res.redirect("/admin/view-users");
  },
  deleteCategory: (req, res) => {
    adminhelper.deleteCategory(req.params.id).then(() => {
      console.log(req.params.id);
      res.redirect("/admin/add-category");
    });
  },
  showeditProduct: (req, res) => {
    adminhelper.showeditProduct(req.params.id).then((prodata) => {
      var productdata = prodata;
      adminhelper.showcatData().then((catdata) => {
        res.render("admin/edit-viewproduct", { productdata, catdata });
      });
    });
  },
  posteditProduct: async (req, res) => {
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const { url } = await cloudinary.uploader.upload(req.files[i].path);
      images.push(url);
    }
    var Id = req.params.id;
    var editedData = req.body;
    adminhelper.posteditProduct(Id, editedData, images).then(() => {
      res.redirect("/admin/view-product");
    });
  },
  showLogin: (req, res) => {
    res.render("admin/login");
  },
  postLogin: (req, res) => {
    adminhelper.postLogin(req.body).then((response) => {
      if (response.status) {
        req.session.adminloggedIn = true;
        req.session.admin = response.admin;
        res.redirect("/admin");
      } else {
        res.redirect("/admin/login");
      }
    });
  },
  logOut: (req, res) => {
    req.session.destroy();
    res.redirect("/admin/login");
  },
  publishProduct: (req, res) => {
    adminhelper.publishProduct(req.params.id).then();
    res.redirect("/admin/view-product");
  },
  viewOrders: async (req, res) => {
    const orders = await adminhelper.viewOrders()
    console.log(orders);
    res.render("admin/orders", { orders });
  },
  cancelOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await adminhelper.cancelOrder(orderId);
    res.json({ status: true });
  },
  shipOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await adminhelper.shipOrder(orderId);
    res.json({ status: true });
  },
  deliverOrder: async (req, res) => {
    const orderId = req.body.orderId;
    await adminhelper.deliverOrder(orderId);
    res.json({ status: true });
  },
  approveReturn: async (req, res) => {
    const userId = req.body.userId;
    const total = req.body.amount;
    const orderId = req.body.orderId;
    await adminhelper.approveReturn(userId, total,orderId);
    res.json({ status: true });
  },
  viewCoupen: async (req, res) => {
    coupen = await adminhelper.viewCoupen();
    res.render("admin/coupen", { coupen });
  },
  addCoupen: async (req, res) => {
    await adminhelper.addcoupen(req.body);
    res.redirect("/admin/view-coupens");
  },
  orderDetails: async (req, res) => {
    let orderId = req.params.orderId;
    const { order, product } = await adminhelper.orderDetails(orderId);
    console.log(product);
    res.render("admin/order-details", { order, product: product });
  },
  viewSales: async (req, res) => {
    if (req.query.from) {
      const orders = await adminhelper.viewSales(req.query);
      res.json(orders);
    } else {
      const orders = await adminhelper.viewSales(req.query);
      res.render("admin/sales", { orders });
    }
  },
  viewEditcategory:async(req,res)=>{
    const catId = req.params.catId
    const category = await adminhelper.showEditcategory(catId)
    res.render("admin/edit-category", { category });
  },
  postEditcategory:async(req,res)=>{
    const catId = req.params.catId
    await adminhelper.postEditcategory(catId,req.body)
    const cat = await adminhelper.showAddcategory()
      res.render("admin/addcategory", { cat ,Error});
  },
  listCategory:async(req,res)=>{
    const catId = req.params.catId
    await adminhelper.listCategory(catId)
    const cat = await adminhelper.showAddcategory()
      res.render("admin/addcategory", { cat ,Error});
  },
  editCoupen:async(req,res)=>{
    let coupenId = req.params.coupenId;
    let coupen = await adminhelper.editCoupen(coupenId)
    res.render("admin/edit-coupen",{coupen})
  },
  posteditCoupen:async(req,res)=>{
    let coupenId = req.params.coupenId;
    await adminhelper.posteditCoupen(req.body,coupenId)
    res.redirect("/admin/view-coupens");
  },
  deleteCoupen:async(req,res)=>{
    let coupenId = req.params.coupenId;
    await adminhelper.deleteCoupen(coupenId)
    res.redirect("/admin/view-coupens");
  }
};
